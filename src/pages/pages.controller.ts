import { Controller, Get } from "@nestjs/common";
import { CatalogService } from "../catalog/catalog.service";

@Controller()
export class PagesController {
  constructor(private readonly catalog: CatalogService) {}

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
