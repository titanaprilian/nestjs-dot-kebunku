import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.catalog.createCategory(body);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
  ) {
    return this.catalog.updateCategory(id, body);
  }

  @Delete(":id")
  delete(@Param("id", ParseIntPipe) id: number) {
    return this.catalog.deleteCategory(id);
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
  async list(
    @Query("search") search = "",
    @Query("categoryId") categoryId?: string,
  ) {
    const parsedCategoryId =
      categoryId === undefined
        ? undefined
        : await new ParseIntPipe().transform(categoryId, {
            type: "query",
            metatype: String,
            data: "categoryId",
          });
    return this.catalog.treeList(search, parsedCategoryId);
  }

  @Get(":id")
  get(@Param("id", ParseIntPipe) id: number) {
    return this.catalog.tree(id);
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.catalog.createTree(body);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
  ) {
    return this.catalog.updateTree(id, body);
  }

  @Delete(":id")
  delete(@Param("id", ParseIntPipe) id: number) {
    return this.catalog.deleteTree(id);
  }
}
