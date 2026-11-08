import { Injectable, NotFoundException } from "@nestjs/common";

export interface Category {
  id: number;
  name: string;
  code: string;
}

export interface Tree {
  id: number;
  treeId: string;
  categoryId: number;
}

@Injectable()
export class CatalogService {
  private readonly categories: Category[] = [
    { id: 1, name: "Mango", code: "MNG" },
    { id: 2, name: "Avocado", code: "AVO" },
  ];

  private readonly trees: Tree[] = [
    { id: 1, treeId: "MNG-001", categoryId: 1 },
    { id: 2, treeId: "AVO-001", categoryId: 2 },
  ];

  categoryList(search = ""): Category[] {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return this.categories;

    return this.categories.filter(
      ({ name, code }) =>
        name.toLocaleLowerCase().includes(query) ||
        code.toLocaleLowerCase().includes(query),
    );
  }

  category(id: number): Category {
    const category = this.categories.find((item) => item.id === id);
    if (!category) throw new NotFoundException("Category not found.");
    return category;
  }

  treeList(search = ""): Tree[] {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return this.trees;

    return this.trees.filter(({ treeId }) =>
      treeId.toLocaleLowerCase().includes(query),
    );
  }
}