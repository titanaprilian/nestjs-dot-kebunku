import { Module } from "@nestjs/common";
import {
  CategoriesApiController,
  TreesApiController,
} from "./catalog-api.controller";
import { CatalogService } from "./catalog.service";
@Module({
  controllers: [CategoriesApiController, TreesApiController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}