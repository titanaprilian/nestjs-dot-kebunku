import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Render,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { CatalogService } from "../catalog/catalog.service";

@Controller()
export class PagesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("login")
  loginPage(@Res() res: Response) {
    return res.render("login", {
      title: "Sign in",
      adminName: null,
    });
  }

  @Get()
  getOverview(@Res() res: Response) {
    const categories = this.catalog.categoryList();
    const trees = this.catalog.treeList();

    return res.render("dashboard", {
      title: "Overview",
      adminName: "Titan Apriliyan",
      categoryCount: categories.length,
      treeCount: trees.length,
      recentTrees: trees.slice(0, 5).map((tree) => ({
        ...tree,
        categoryName: tree.category.name,
      })),
    });
  }

  @Get("categories")
  @Render("categories")
  categoriesPage(@Query("search") search = "") {
    return {
      title: "Categories",
      adminName: "Titan Apriliyan",
      categories: this.catalog.categoryList(search),
      search,
    };
  }

  @Get("categories/new")
  @Render("category-form")
  newCategoryPage() {
    return {
      title: "New category",
      adminName: "Titan Apriliyan",
      category: null,
    };
  }

  @Get("categories/:id/edit")
  @Render("category-form")
  editCategoryPage(@Param("id", ParseIntPipe) id: number) {
    return {
      title: "Edit category",
      adminName: "Titan Apriliyan",
      category: this.catalog.category(id),
    };
  }

  @Get("categories/:id")
  @Render("category-detail")
  categoryPage(@Param("id", ParseIntPipe) id: number) {
    return {
      title: "Category details",
      adminName: "Titan Apriliyan",
      category: this.catalog.category(id),
    };
  }

  @Get("trees")
  @Render("trees")
  treesPage(
    @Query("search") search = "",
    @Query("categoryId") categoryId?: string,
  ) {
    const parsedCategoryId = Number(categoryId) || null;
    return {
      title: "Trees",
      adminName: "Titan Apriliyan",
      trees: this.catalog.treeList(search, parsedCategoryId ?? undefined),
      categories: this.catalog.categoryList(),
      search,
      categoryId: parsedCategoryId,
    };
  }

  @Get("trees/new")
  @Render("tree-form")
  newTreePage(@Query("categoryId") categoryId?: string) {
    return {
      title: "New tree",
      adminName: "Titan Apriliyan",
      tree: null,
      categories: this.catalog.categoryList(),
      selectedCategoryId: Number(categoryId) || null,
    };
  }

  @Get("trees/:id/edit")
  @Render("tree-form")
  editTreePage(@Param("id", ParseIntPipe) id: number) {
    return {
      title: "Edit tree",
      adminName: "Titan Apriliyan",
      tree: this.catalog.tree(id),
      categories: this.catalog.categoryList(),
      selectedCategoryId: null,
    };
  }

  @Get("trees/:id")
  @Render("tree-detail")
  treePage(@Param("id", ParseIntPipe) id: number) {
    return {
      title: "Tree details",
      adminName: "Titan Apriliyan",
      tree: this.catalog.tree(id),
    };
  }
}
