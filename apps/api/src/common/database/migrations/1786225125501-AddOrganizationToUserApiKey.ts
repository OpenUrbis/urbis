import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationToUserApiKey1786225125501 implements MigrationInterface {
  name = 'AddOrganizationToUserApiKey1786225125501';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_api_keys" ADD "organizationId" uuid NOT NULL`,
    );
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
      `CREATE INDEX "IDX_66b2e5854a87d3b159d1e4c8df" ON "user_api_keys" ("organizationId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_api_keys" ADD CONSTRAINT "FK_66b2e5854a87d3b159d1e4c8df6" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_api_keys" DROP CONSTRAINT "FK_66b2e5854a87d3b159d1e4c8df6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_66b2e5854a87d3b159d1e4c8df"`,
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
      `ALTER TABLE "user_api_keys" DROP COLUMN "organizationId"`,
    );
  }
}
