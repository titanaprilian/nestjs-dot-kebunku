import { Injectable } from "@nestjs/common";

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

  categoryList(): Category[] {
    return this.categories;
  }

  treeList(): Tree[] {
    return this.trees;
  }
}