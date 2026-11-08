import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  CategoriesApiController,
  TreesApiController,
} from "./catalog-api.controller";
import { Category } from "./category.entity";
import { CatalogService } from "./catalog.service";

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesApiController, TreesApiController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}