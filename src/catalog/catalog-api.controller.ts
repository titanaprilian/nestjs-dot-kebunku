import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SessionAuthGuard } from "../common/session-auth.guard";
import { CatalogService } from "./catalog.service";

@UseGuards(SessionAuthGuard)
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

@UseGuards(SessionAuthGuard)
@Controller("api/trees")
export class TreesApiController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list(@Query("search") search = "") {
    return this.catalog.treeList(search);
  }
}
