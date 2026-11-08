import { MigrationInterface, QueryRunner, Table, TableUnique } from "typeorm";

export class CreateAdmins1794000000001 implements MigrationInterface {
  name = "CreateAdmins1794000000001";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "admins",
        columns: [
          {
            name: "id",
            type: "integer",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "email",
            type: "varchar",
            length: "254",
            collation: "NOCASE",
            isNullable: false,
          },
          { name: "password_hash", type: "varchar", isNullable: false },
          { name: "name", type: "varchar", length: "100", isNullable: false },
        ],
        uniques: [new TableUnique({ columnNames: ["email"] })],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("admins");
  }
}
