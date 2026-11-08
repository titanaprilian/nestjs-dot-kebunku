import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Admin } from "./auth/admin.entity";
import { Category } from "./catalog/category.entity";
import { AuthModule } from "./auth/auth.module";
import { Tree } from "./catalog/tree.entity";
import { CreateAdmins1794000000001 } from "./migrations/create-admins.migration";
import { CreateCatalogTables1794000000000 } from "./migrations/create-catalog-tables.migration";
import { PagesModule } from "./pages/pages.module";

const databaseFile = process.env.DATABASE_PATH || "data/admin.sqlite";
mkdirSync(dirname(resolve(databaseFile)), { recursive: true });

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "sqlite",
      database: databaseFile,
      entities: [Admin, Category, Tree],
      migrations: [
        CreateCatalogTables1794000000000,
        CreateAdmins1794000000001,
      ],
      migrationsRun: true,
      synchronize: false,
    }),
    AuthModule,
    PagesModule,
  ],
})
export class AppModule {}
