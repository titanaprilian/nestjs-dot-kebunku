import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  CategoriesApiController,
  TreesApiController,
} from "./catalog-api.controller";
import { Admin } from "../auth/admin.entity";
import { SeedService } from "../seed.service";
import { SessionAuthGuard } from "../common/session-auth.guard";
import { Category } from "./category.entity";
import { CatalogService } from "./catalog.service";
import { Tree } from "./tree.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Admin, Category, Tree])],
  controllers: [CategoriesApiController, TreesApiController],
  providers: [CatalogService, SeedService, SessionAuthGuard],
  exports: [CatalogService, SessionAuthGuard],
})
export class CatalogModule {}