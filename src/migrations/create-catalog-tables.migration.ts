import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableUnique,
} from "typeorm";

export class CreateCatalogTables1794000000000 implements MigrationInterface {
  name = "CreateCatalogTables1794000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "categories",
        columns: [
          {
            name: "id",
            type: "integer",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          { name: "name", type: "varchar", length: "80", isNullable: false },
          { name: "code", type: "varchar", isNullable: false },
        ],
        uniques: [new TableUnique({ columnNames: ["code"] })],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: "trees",
        columns: [
          {
            name: "id",
            type: "integer",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          { name: "tree_id", type: "varchar", isNullable: false },
          { name: "planting_date", type: "date", isNullable: false },
          { name: "location", type: "text", isNullable: false },
          {
            name: "image_url",
            type: "text",
            isNullable: false,
            default: "''",
          },
          { name: "category_id", type: "integer", isNullable: false },
        ],
        uniques: [new TableUnique({ columnNames: ["tree_id"] })],
      }),
    );

    await queryRunner.createForeignKey(
      "trees",
      new TableForeignKey({
        name: "FK_trees_category_id_categories_id",
        columnNames: ["category_id"],
        referencedTableName: "categories",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("trees");
    await queryRunner.dropTable("categories");
  }
}
