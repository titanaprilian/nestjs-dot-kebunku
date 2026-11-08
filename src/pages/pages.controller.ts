import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
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
  async getOverview(@Res() res: Response) {
    const [categories, trees] = await Promise.all([
      this.catalog.categoryList(),
      this.catalog.treeList(),
    ]);

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
  async categoriesPage(@Query("search") search = "") {
    return {
      title: "Categories",
      adminName: "Titan Apriliyan",
      categories: await this.catalog.categoryList(search),
      search,
    };
  }

  @Get("categories/new")
  @Render("category-form")
  newCategoryPage() {
    return {
      title: "New category",
      adminName: "Titan Apriliyan",
      categoryId: null,
      category: null,
      error: null,
    };
  }

  @Post("categories")
  async createCategory(
    @Body() body: Record<string, unknown>,
    @Res() res: Response,
  ) {
    try {
      await this.catalog.createCategory(body);
      return res.redirect("/categories");
    } catch (error) {
      if (!(error instanceof BadRequestException)) throw error;
      return res.status(400).render("category-form", {
        title: "New category",
        adminName: "Titan Apriliyan",
        categoryId: null,
        category: {
          name: typeof body.name === "string" ? body.name : "",
          code: typeof body.code === "string" ? body.code : "",
          trees: [],
        },
        error: error.message,
      });
    }
  }

  @Get("categories/:id/edit")
  @Render("category-form")
  async editCategoryPage(@Param("id", ParseIntPipe) id: number) {
    return {
      title: "Edit category",
      adminName: "Titan Apriliyan",
      categoryId: id,
      category: await this.catalog.category(id),
      error: null,
    };
  }

  @Post("categories/:id")
  async updateCategory(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @Res() res: Response,
  ) {
    const existingCategory = await this.catalog.category(id);
    try {
      await this.catalog.updateCategory(id, body);
      return res.redirect(`/categories/${id}`);
    } catch (error) {
      if (!(error instanceof BadRequestException)) throw error;
      return res.status(400).render("category-form", {
        title: "Edit category",
        adminName: "Titan Apriliyan",
        category: {
          ...existingCategory,
          name: typeof body.name === "string" ? body.name : "",
          code: typeof body.code === "string" ? body.code : "",
        },
        categoryId: id,
        error: error.message,
      });
    }
  }

  @Post("categories/:id/delete")
  async deleteCategory(
    @Param("id", ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      await this.catalog.deleteCategory(id);
      return res.redirect("/categories");
    } catch (error) {
      if (!(error instanceof BadRequestException)) throw error;
      return res.status(400).render("category-detail", {
        title: "Category details",
        adminName: "Titan Apriliyan",
        category: await this.catalog.category(id),
        error: error.message,
      });
    }
  }

  @Get("categories/:id")
  @Render("category-detail")
  async categoryPage(@Param("id", ParseIntPipe) id: number) {
    return {
      title: "Category details",
      adminName: "Titan Apriliyan",
      category: await this.catalog.category(id),
      error: null,
    };
  }

  @Get("trees")
  @Render("trees")
  async treesPage(
    @Query("search") search = "",
    @Query("categoryId") categoryId?: string,
  ) {
    const parsedCategoryId = Number(categoryId) || null;
    const [trees, categories] = await Promise.all([
      this.catalog.treeList(search, parsedCategoryId ?? undefined),
      this.catalog.categoryList(),
    ]);
    return {
      title: "Trees",
      adminName: "Titan Apriliyan",
      trees,
      categories,
      search,
      categoryId: parsedCategoryId,
    };
  }

  @Post("trees")
  async createTree(@Body() body: Record<string, unknown>, @Res() res: Response) {
    try {
      const tree = await this.catalog.createTree(body);
      return res.redirect(`/trees/${tree.id}`);
    } catch (error) {
      if (!(error instanceof BadRequestException)) throw error;
      return res.status(400).render("tree-form", {
        title: "New tree",
        adminName: "Titan Apriliyan",
        tree: {
          id: null,
          treeId: typeof body.treeId === "string" ? body.treeId : "",
          plantingDate:
            typeof body.plantingDate === "string" ? body.plantingDate : "",
          location: typeof body.location === "string" ? body.location : "",
          imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : "",
          categoryId: Number(body.categoryId) || null,
        },
        categories: await this.catalog.categoryList(),
        selectedCategoryId: Number(body.categoryId) || null,
        error: error.message,
      });
    }
  }

  @Post("trees/:id")
  async updateTree(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @Res() res: Response,
  ) {
    const existingTree = await this.catalog.tree(id);
    try {
      const updatedTree = await this.catalog.updateTree(id, body);
      return res.redirect(`/trees/${updatedTree.id}`);
    } catch (error) {
      if (!(error instanceof BadRequestException)) throw error;
      return res.status(400).render("tree-form", {
        title: "Edit tree",
        adminName: "Titan Apriliyan",
        tree: {
          ...existingTree,
          treeId: typeof body.treeId === "string" ? body.treeId : "",
          plantingDate:
            typeof body.plantingDate === "string" ? body.plantingDate : "",
          location: typeof body.location === "string" ? body.location : "",
          imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : "",
          categoryId: Number(body.categoryId) || null,
        },
        categories: await this.catalog.categoryList(),
        selectedCategoryId: Number(body.categoryId) || null,
        error: error.message,
      });
    }
  }

  @Post("trees/:id/delete")
  async deleteTree(
    @Param("id", ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    await this.catalog.deleteTree(id);
    return res.redirect("/trees");
  }

  @Get("trees/new")
  @Render("tree-form")
  async newTreePage(@Query("categoryId") categoryId?: string) {
    return {
      title: "New tree",
      adminName: "Titan Apriliyan",
      tree: null,
      categories: await this.catalog.categoryList(),
      selectedCategoryId: Number(categoryId) || null,
      error: null,
    };
  }

  @Get("trees/:id/edit")
  @Render("tree-form")
  async editTreePage(@Param("id", ParseIntPipe) id: number) {
    return {
      title: "Edit tree",
      adminName: "Titan Apriliyan",
      tree: await this.catalog.tree(id),
      categories: await this.catalog.categoryList(),
      selectedCategoryId: null,
      error: null,
    };
  }

  @Get("trees/:id")
  @Render("tree-detail")
  async treePage(@Param("id", ParseIntPipe) id: number) {
    return {
      title: "Tree details",
      adminName: "Titan Apriliyan",
      tree: await this.catalog.tree(id),
      error: null,
    };
  }
}
