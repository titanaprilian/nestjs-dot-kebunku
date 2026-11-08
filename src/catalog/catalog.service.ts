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
  plantingDate: string;
  location: string;
  imageUrl: string;
}

@Injectable()
export class CatalogService {
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
}