import { Controller, Get, Res } from "@nestjs/common";
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
        categoryName:
          categories.find((category) => category.id === tree.categoryId)
            ?.name ?? "Unknown",
      })),
    });
  }
}
