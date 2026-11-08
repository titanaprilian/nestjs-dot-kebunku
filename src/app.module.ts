import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Category } from "./catalog/category.entity";
import { Tree } from "./catalog/tree.entity";
import { PagesModule } from "./pages/pages.module";

const databaseFile = process.env.DATABASE_PATH || "data/admin.sqlite";
mkdirSync(dirname(resolve(databaseFile)), { recursive: true });

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "sqlite",
      database: databaseFile,
      entities: [Category, Tree],
      synchronize: true,
    }),
    PagesModule,
  ],
})
export class AppModule {}
