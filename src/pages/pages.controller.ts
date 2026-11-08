import { Controller, Get, Res } from "@nestjs/common";
import { Response } from "express";
import { CatalogService } from "../catalog/catalog.service";

@Controller()
export class PagesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("login")
  loginPage(@Res() res: Response) {
    return res.render("login", { title: "Sign in" });
  }
  @Get()
  getOverview() {
    const categories = this.catalog.categoryList();
    const trees = this.catalog.treeList();

    return {
      categories,
      trees,
      categoryCount: categories.length,
      treeCount: trees.length,
    };
  }
}
