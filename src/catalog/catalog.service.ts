import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Category } from "./category.entity";

interface Tree {
  id: number;
  treeId: string;
  categoryId: number;
  plantingDate: string;
  location: string;
  imageUrl: string;
}

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
  ) {}

  private nextTreeId = 1;
  private readonly trees: Tree[] = [];

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
        treeCount:
          trees.length +
          this.trees.filter((tree) => tree.categoryId === category.id).length,
      }));
  }

  async category(id: number) {
    const category = await this.categories.findOne({
      where: { id },
      relations: { trees: true },
    });
    if (!category) throw new NotFoundException("Category not found.");
    const trees = [
      ...category.trees,
      ...this.trees
        .filter((tree) => tree.categoryId === category.id)
        .map((tree) => ({ ...tree, category })),
    ];
    return {
      ...category,
      trees: trees.map((tree) => this.withAge({ ...tree, category })),
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
    if (
      code !== category.code &&
      (category.trees.length ||
        this.trees.some((tree) => tree.categoryId === id))
    ) {
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
    if (
      category.trees.length ||
      this.trees.some((tree) => tree.categoryId === id)
    ) {
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
    const query = search.trim().toLocaleLowerCase();
    const categories = await this.categories.find();
    return this.trees
      .filter((tree) => {
        const matchesSearch =
          !query ||
          tree.treeId.toLocaleLowerCase().includes(query) ||
          tree.location.toLocaleLowerCase().includes(query);
        return matchesSearch && (!categoryId || tree.categoryId === categoryId);
      })
      .flatMap((tree) => {
        const category = categories.find((item) => item.id === tree.categoryId);
        return category ? [this.withAge({ ...tree, category })] : [];
      });
  }

  async tree(id: number) {
    const tree = this.trees.find((item) => item.id === id);
    if (!tree) throw new NotFoundException("Tree not found.");
    const category = await this.categories.findOne({
      where: { id: tree.categoryId },
    });
    if (!category) throw new NotFoundException("Tree category not found.");
    return this.withAge({ ...tree, category });
  }

  async createTree(input: Record<string, unknown>) {
    const fields = await this.treeFields(input);
    const tree: Tree = { id: this.nextTreeId++, ...fields };
    this.trees.push(tree);
    return this.tree(tree.id);
  }

  async updateTree(id: number, input: Record<string, unknown>) {
    const tree = this.trees.find((item) => item.id === id);
    if (!tree) throw new NotFoundException("Tree not found.");

    const fields = await this.treeFields(input, id);
    Object.assign(tree, fields);
    return this.tree(id);
  }

  deleteTree(id: number): void {
    const index = this.trees.findIndex((item) => item.id === id);
    if (index === -1) throw new NotFoundException("Tree not found.");
    this.trees.splice(index, 1);
  }

  private async treeFields(input: Record<string, unknown>, excludeId?: number) {
    const treeId = this.requiredText(input.treeId, "treeId").toUpperCase();
    const plantingDate = this.plantingDate(input.plantingDate);
    const location = this.requiredText(input.location, "location");
    const imageUrl = this.imageUrl(input.imageUrl);
    const categoryId = this.categoryId(input.categoryId);

    if (!(await this.categories.exist({ where: { id: categoryId } }))) {
      throw new BadRequestException(
        "categoryId must reference an existing category.",
      );
    }
    if (
      this.trees.some(
        (tree) => tree.id !== excludeId && tree.treeId === treeId,
      )
    ) {
      throw new BadRequestException("treeId must be unique.");
    }
    return { treeId, plantingDate, location, imageUrl, categoryId };
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
    if (/foreign key constraint|SQLITE_CONSTRAINT_FOREIGNKEY/i.test(description)) {
      throw new BadRequestException(
        "Move or delete this category’s trees before deleting the category.",
      );
    }
  }

  private withAge<T extends Tree & { category?: Category }>(tree: T) {
    return { ...tree, age: getTreeAge(tree.plantingDate) };
  }
}
