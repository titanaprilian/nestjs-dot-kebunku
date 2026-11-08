import { Module } from "@nestjs/common";
import { CatalogModule } from "../catalog/catalog.module";
import { PagesController } from "./pages.controller";

@Module({
  imports: [CatalogModule],
  controllers: [PagesController],
})
export class PagesModule {}
