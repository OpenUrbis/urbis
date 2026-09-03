import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBoardTemplateOnLayerSchema1775151497799 implements MigrationInterface {
  name = 'AddBoardTemplateOnLayerSchema1775151497799';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" ADD "boardTemplate" jsonb`,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
      `ALTER TABLE "layer_schemas" DROP COLUMN "boardTemplate"`,
    );
  }
}
