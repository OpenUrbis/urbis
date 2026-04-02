import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormaliseGenerate1775151054719 implements MigrationInterface {
  name = 'NormaliseGenerate1775151054719';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_legis_pages_title"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_legis_pages_type"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_legis_pages_categoryId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_legis_pages_isPublic"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_legis_pages_createdAt"`);
    await queryRunner.query(
      `ALTER TYPE "public"."map_config_type_enum" RENAME TO "map_config_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."map_config_type_enum" AS ENUM('literal-number', 'literal-string', 'array', 'object', 'view-template')`,
    );
    await queryRunner.query(
      `ALTER TABLE "map_config" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "map_config" ALTER COLUMN "type" TYPE "public"."map_config_type_enum" USING "type"::"text"::"public"."map_config_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "map_config" ALTER COLUMN "type" SET DEFAULT 'object'`,
    );
    await queryRunner.query(`DROP TYPE "public"."map_config_type_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "legis_pages" ALTER COLUMN "tags" SET DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e4247c3c34392b712740a6968b" ON "legis_pages" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a609f32083f5cad683ddc49888" ON "legis_pages" ("isPublic") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_25ceb1052643ad50cfc9af3ed0" ON "legis_pages" ("categoryId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a27ebed6de0bb4acc161a9e74e" ON "legis_pages" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9989fd0d1afbfd1a5cdab0bf98" ON "legis_pages" ("title") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9989fd0d1afbfd1a5cdab0bf98"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a27ebed6de0bb4acc161a9e74e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_25ceb1052643ad50cfc9af3ed0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a609f32083f5cad683ddc49888"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e4247c3c34392b712740a6968b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "legis_pages" ALTER COLUMN "tags" SET DEFAULT '[]'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."map_config_type_enum_old" AS ENUM('literal-number', 'literal-string', 'array', 'object', 'view-template')`,
    );
    await queryRunner.query(
      `ALTER TABLE "map_config" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "map_config" ALTER COLUMN "type" TYPE "public"."map_config_type_enum_old" USING "type"::"text"::"public"."map_config_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "map_config" ALTER COLUMN "type" SET DEFAULT 'object'`,
    );
    await queryRunner.query(`DROP TYPE "public"."map_config_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."map_config_type_enum_old" RENAME TO "map_config_type_enum"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_legis_pages_createdAt" ON "legis_pages" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_legis_pages_isPublic" ON "legis_pages" ("isPublic") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_legis_pages_categoryId" ON "legis_pages" ("categoryId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_legis_pages_type" ON "legis_pages" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_legis_pages_title" ON "legis_pages" ("title") `,
    );
  }
}
