import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import { CatalogService } from "./catalog.service";

@Controller("api/categories")
export class CategoriesApiController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list(@Query("search") search = "") {
    return this.catalog.categoryList(search);
  }

  @Get(":id")
  get(@Param("id", ParseIntPipe) id: number) {
    return this.catalog.category(id);
  }
}

@Controller("api/trees")
export class TreesApiController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list(@Query("search") search = "") {
    return this.catalog.treeList(search);
  }
}
