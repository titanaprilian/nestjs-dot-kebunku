import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

export interface Category {
  id: number;
  name: string;
  code: string;
}

export interface Tree {
  id: number;
  treeId: string;
  categoryId: number;
  plantingDate: string;
  location: string;
  imageUrl: string;
}

@Injectable()
export class CatalogService {
  private nextCategoryId = 3;
  private nextTreeId = 3;
  private readonly categories: Category[] = [
    { id: 1, name: "Mango", code: "MNG" },
    { id: 2, name: "Avocado", code: "AVO" },
  ];

  private readonly trees: Tree[] = [
    {
      id: 1,
      treeId: "MNG-001",
      categoryId: 1,
      plantingDate: "2022-03-15",
      location: "North garden",
      imageUrl: "",
    },
    {
      id: 2,
      treeId: "AVO-001",
      categoryId: 2,
      plantingDate: "2023-06-20",
      location: "East garden",
      imageUrl: "",
    },
  ];

  categoryList(search = "") {
    const query = search.trim().toLocaleLowerCase();
    return this.categories
      .filter(
        ({ name, code }) =>
          !query ||
          name.toLocaleLowerCase().includes(query) ||
          code.toLocaleLowerCase().includes(query),
      )
      .map((category) => ({
        ...category,
        treeCount: this.trees.filter((tree) => tree.categoryId === category.id)
          .length,
      }));
  }

  category(id: number) {
    const category = this.categories.find((item) => item.id === id);
    if (!category) throw new NotFoundException("Category not found.");
    return {
      ...category,
      trees: this.trees
        .filter((tree) => tree.categoryId === category.id)
        .map((tree) => ({ ...tree, category })),
    };
  }

  createCategory(input: Record<string, unknown>): Category {
    const name = this.requiredText(input.name, "name", 80);
    const code = this.categoryCode(input.code);
    if (this.categories.some((category) => category.code === code)) {
      throw new BadRequestException("code must be unique.");
    }

    const category = {
      id: this.nextCategoryId++,
      name,
      code,
    };
    this.categories.push(category);
    return category;
  }

  updateCategory(id: number, input: Record<string, unknown>): Category {
    const category = this.categories.find((item) => item.id === id);
    if (!category) throw new NotFoundException("Category not found.");

    const name = this.requiredText(input.name, "name", 80);
    const code = this.categoryCode(input.code);
    if (
      code !== category.code &&
      this.categories.some((item) => item.id !== id && item.code === code)
    ) {
      throw new BadRequestException("code must be unique.");
    }
    if (
      code !== category.code &&
      this.trees.some((tree) => tree.categoryId === id)
    ) {
      throw new BadRequestException(
        "A category code cannot change while trees reference the category.",
      );
    }

    category.name = name;
    category.code = code;
    return category;
  }

  deleteCategory(id: number): void {
    const index = this.categories.findIndex((item) => item.id === id);
    if (index === -1) throw new NotFoundException("Category not found.");
    if (this.trees.some((tree) => tree.categoryId === id)) {
      throw new BadRequestException(
        "Move or delete this category’s trees before deleting the category.",
      );
    }
    this.categories.splice(index, 1);
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


  treeList(search = "", categoryId?: number) {
    const query = search.trim().toLocaleLowerCase();
    return this.trees
      .filter((tree) => {
        const matchesSearch =
          !query ||
          tree.treeId.toLocaleLowerCase().includes(query) ||
          tree.location.toLocaleLowerCase().includes(query);
        return matchesSearch && (!categoryId || tree.categoryId === categoryId);
      })
      .map((tree) => ({
        ...tree,
        category: this.categories.find(
          (category) => category.id === tree.categoryId,
        )!,
      }));
  }

  tree(id: number) {
    const tree = this.trees.find((item) => item.id === id);
    if (!tree) throw new NotFoundException("Tree not found.");
    return {
      ...tree,
      category: this.categories.find(
        (category) => category.id === tree.categoryId,
      )!,
    };
  }
  createTree(input: Record<string, unknown>) {
    const fields = this.treeFields(input);
    const tree: Tree = { id: this.nextTreeId++, ...fields };
    this.trees.push(tree);
    return this.tree(tree.id);
  }

  updateTree(id: number, input: Record<string, unknown>) {
    const tree = this.trees.find((item) => item.id === id);
    if (!tree) throw new NotFoundException("Tree not found.");

    const fields = this.treeFields(input, id);
    Object.assign(tree, fields);
    return this.tree(id);
  }

  deleteTree(id: number): void {
    const index = this.trees.findIndex((item) => item.id === id);
    if (index === -1) throw new NotFoundException("Tree not found.");
    this.trees.splice(index, 1);
  }

  private treeFields(input: Record<string, unknown>, excludeId?: number) {
    const treeId = this.requiredText(input.treeId, "treeId").toUpperCase();
    const plantingDate = this.plantingDate(input.plantingDate);
    const location = this.requiredText(input.location, "location");
    const imageUrl = this.imageUrl(input.imageUrl);
    const categoryId = this.categoryId(input.categoryId);

    if (!this.categories.some((category) => category.id === categoryId)) {
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

}

