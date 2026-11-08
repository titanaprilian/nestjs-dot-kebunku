import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Category } from "./category.entity";
import { Tree } from "./tree.entity";

export function getTreeAge(
  plantingDate: string,
  today = new Date(),
): { years: number; months: number } {
  const [plantingYear, plantingMonth, plantingDay] = plantingDate
    .split("-")
    .map(Number);
  let completedMonths =
    (today.getUTCFullYear() - plantingYear) * 12 +
    (today.getUTCMonth() + 1 - plantingMonth);
  if (today.getUTCDate() < plantingDay) completedMonths--;
  completedMonths = Math.max(0, completedMonths);
  return {
    years: Math.floor(completedMonths / 12),
    months: completedMonths % 12,
  };
}

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
    @InjectRepository(Tree)
    private readonly trees: Repository<Tree>,
  ) {}

  async categoryList(search = "") {
    const query = search.trim().toLocaleLowerCase();
    const categories = await this.categories.find({
      relations: { trees: true },
      order: { name: "ASC" },
    });
    return categories
      .filter(
        ({ name, code }) =>
          !query ||
          name.toLocaleLowerCase().includes(query) ||
          code.toLocaleLowerCase().includes(query),
      )
      .map(({ trees, ...category }) => ({
        ...category,
        treeCount: trees.length,
      }));
  }

  async category(id: number) {
    const category = await this.categories.findOne({
      where: { id },
      relations: { trees: true },
    });
    if (!category) throw new NotFoundException("Category not found.");
    return {
      ...category,
      trees: category.trees.map((tree) => this.withAge(tree)),
    };
  }

  async createCategory(input: Record<string, unknown>): Promise<Category> {
    const name = this.requiredText(input.name, "name", 80);
    const code = this.categoryCode(input.code);
    if (await this.categories.findOne({ where: { code } })) {
      throw new BadRequestException("code must be unique.");
    }

    const category = this.categories.create({ name, code });
    try {
      return await this.categories.save(category);
    } catch (error) {
      this.throwUnique(error, "code must be unique.");
      throw error;
    }
  }

  async updateCategory(
    id: number,
    input: Record<string, unknown>,
  ): Promise<Category> {
    const category = await this.categories.findOne({
      where: { id },
      relations: { trees: true },
    });
    if (!category) throw new NotFoundException("Category not found.");

    const name = this.requiredText(input.name, "name", 80);
    const code = this.categoryCode(input.code);
    if (
      code !== category.code &&
      (await this.categories.findOne({ where: { code } }))
    ) {
      throw new BadRequestException("code must be unique.");
    }
    if (code !== category.code && category.trees.length) {
      throw new BadRequestException(
        "A category code cannot change while trees reference the category.",
      );
    }

    category.name = name;
    category.code = code;
    try {
      return await this.categories.save(category);
    } catch (error) {
      this.throwUnique(error, "code must be unique.");
      throw error;
    }
  }

  async deleteCategory(id: number): Promise<void> {
    const category = await this.categories.findOne({
      where: { id },
      relations: { trees: true },
    });
    if (!category) throw new NotFoundException("Category not found.");
    if (category.trees.length) {
      throw new BadRequestException(
        "Move or delete this category’s trees before deleting the category.",
      );
    }
    try {
      await this.categories.remove(category);
    } catch (error) {
      this.throwForeignKey(error);
      throw error;
    }
  }

  async treeList(search = "", categoryId?: number) {
    const query = search.trim();
    // FindOptions cannot express the escaped OR search across both columns.
    const trees = this.trees
      .createQueryBuilder("tree")
      .leftJoinAndSelect("tree.category", "category")
      .orderBy("tree.id", "DESC");
    if (query) {
      trees.andWhere(
        "(tree.treeId LIKE :query ESCAPE '\\' OR tree.location LIKE :query ESCAPE '\\')",
        { query: `%${this.escapeLike(query)}%` },
      );
    }
    if (categoryId !== undefined) {
      trees.andWhere("tree.categoryId = :categoryId", { categoryId });
    }
    return (await trees.getMany()).map((tree) => this.withAge(tree));
  }

  async tree(id: number) {
    const tree = await this.trees.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!tree) throw new NotFoundException("Tree not found.");
    return this.withAge(tree);
  }

  async createTree(input: Record<string, unknown>) {
    const fields = await this.treeFields(input);
    try {
      const tree = await this.trees.save(this.trees.create(fields));
      return this.tree(tree.id);
    } catch (error) {
      this.throwUnique(error, "treeId must be unique.");
      throw error;
    }
  }

  async updateTree(id: number, input: Record<string, unknown>) {
    const tree = await this.trees.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!tree) throw new NotFoundException("Tree not found.");

    Object.assign(tree, await this.treeFields(input, id));
    try {
      await this.trees.save(tree);
      return this.tree(id);
    } catch (error) {
      this.throwUnique(error, "treeId must be unique.");
      throw error;
    }
  }

  async deleteTree(id: number): Promise<void> {
    const tree = await this.trees.findOne({ where: { id } });
    if (!tree) throw new NotFoundException("Tree not found.");
    await this.trees.remove(tree);
  }

  private async treeFields(input: Record<string, unknown>, excludeId?: number) {
    const treeId = this.requiredText(input.treeId, "treeId").toUpperCase();
    const plantingDate = this.plantingDate(input.plantingDate);
    const location = this.requiredText(input.location, "location");
    const imageUrl = this.imageUrl(input.imageUrl);
    const categoryId = this.categoryId(input.categoryId);

    const category = await this.categories.findOne({ where: { id: categoryId } });
    if (!category) {
      throw new BadRequestException(
        "categoryId must reference an existing category.",
      );
    }
    const existingTree = await this.trees.findOne({ where: { treeId } });
    if (existingTree && existingTree.id !== excludeId) {
      throw new BadRequestException("treeId must be unique.");
    }
    return { treeId, plantingDate, location, imageUrl, categoryId, category };
  }

  private requiredText(value: unknown, field: string, max?: number): string {
    if (
      typeof value !== "string" ||
      !value.trim() ||
      (max !== undefined && value.trim().length > max)
    ) {
      throw new BadRequestException(
        max === undefined
          ? `${field} is required.`
          : `${field} is required and must be at most ${max} characters.`,
      );
    }
    return value.trim();
  }

  private categoryCode(value: unknown): string {
    const code = this.requiredText(value, "code").toUpperCase();
    if (!/^[A-Z0-9]+$/.test(code)) {
      throw new BadRequestException(
        "code must contain only letters and numbers.",
      );
    }
    return code;
  }

  private plantingDate(value: unknown): string {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(
        "plantingDate must be a valid YYYY-MM-DD date.",
      );
    }
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException(
        "plantingDate must be a valid YYYY-MM-DD date.",
      );
    }
    if (value > new Date().toISOString().slice(0, 10)) {
      throw new BadRequestException("plantingDate cannot be in the future.");
    }
    return value;
  }

  private imageUrl(value: unknown): string {
    if (value === undefined || value === null || value === "") return "";
    if (typeof value !== "string") {
      throw new BadRequestException(
        "imageUrl must be an absolute HTTP(S) URL.",
      );
    }
    const trimmed = value.trim();
    if (!trimmed) return "";
    try {
      const url = new URL(trimmed);
      if (
        (url.protocol !== "http:" && url.protocol !== "https:") ||
        !url.hostname
      ) {
        throw new Error("invalid URL");
      }
    } catch {
      throw new BadRequestException(
        "imageUrl must be an absolute HTTP(S) URL.",
      );
    }
    return trimmed;
  }

  private categoryId(value: unknown): number {
    const categoryId = typeof value === "number" ? value : Number(value);
    if (!Number.isInteger(categoryId) || categoryId < 1) {
      throw new BadRequestException(
        "categoryId must reference an existing category.",
      );
    }
    return categoryId;
  }

  private throwUnique(error: unknown, message: string): void {
    const details = error as {
      code?: string;
      message?: string;
      driverError?: { code?: string; message?: string };
    };
    const description = `${details?.code || ""} ${details?.message || ""} ${details?.driverError?.code || ""} ${details?.driverError?.message || ""}`;
    if (
      /unique constraint|SQLITE_CONSTRAINT_UNIQUE|SQLITE_CONSTRAINT_PRIMARYKEY/i.test(
        description,
      )
    ) {
      throw new BadRequestException(message);
    }
  }

  private throwForeignKey(error: unknown): void {
    const details = error as {
      code?: string;
      message?: string;
      driverError?: { code?: string; message?: string };
    };
    const description = `${details?.code || ""} ${details?.message || ""} ${details?.driverError?.code || ""} ${details?.driverError?.message || ""}`;
    if (
      /foreign key constraint|SQLITE_CONSTRAINT_FOREIGNKEY/i.test(description)
    ) {
      throw new BadRequestException(
        "Move or delete this category’s trees before deleting the category.",
      );
    }
  }

  private escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, "\\$&");
  }

  private withAge<T extends Tree & { category?: Category }>(tree: T) {
    return { ...tree, age: getTreeAge(tree.plantingDate) };
  }
}
