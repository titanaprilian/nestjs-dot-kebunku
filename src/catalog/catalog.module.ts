import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  CategoriesApiController,
  TreesApiController,
} from "./catalog-api.controller";
import { Category } from "./category.entity";
import { CatalogService } from "./catalog.service";
import { Tree } from "./tree.entity";
import { SeedService } from "../seed.service";

@Module({
  imports: [TypeOrmModule.forFeature([Category, Tree])],
  controllers: [CategoriesApiController, TreesApiController],
  providers: [CatalogService, SeedService],
  exports: [CatalogService],
})
export class CatalogModule {}