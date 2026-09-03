import { MigrationInterface, QueryRunner } from 'typeorm';

export class RestrictExistingLayersToAdmins1775151500001 implements MigrationInterface {
  name = 'RestrictExistingLayersToAdmins1775151500001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "layer_schema_visibility_backup_1775151500001" (
        "id" character varying NOT NULL,
        "isPublic" boolean,
        "allowedRoles" jsonb,
        CONSTRAINT "PK_layer_schema_visibility_backup_1775151500001" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `INSERT INTO "layer_schema_visibility_backup_1775151500001" ("id", "isPublic", "allowedRoles")
       SELECT "id", "isPublic", "allowedRoles"
       FROM "layer_schemas"
       WHERE "deletedAt" IS NULL`,
    );

    await queryRunner.query(
      `UPDATE "layer_schemas"
       SET
         "isPublic" = false,
         "allowedRoles" = '["f5fe5a01-b8e8-4f45-8701-45a6b24ba2d4"]'::jsonb
       WHERE "deletedAt" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "layer_schemas" AS layer
       SET
         "isPublic" = backup."isPublic",
         "allowedRoles" = backup."allowedRoles"
       FROM "layer_schema_visibility_backup_1775151500001" AS backup
       WHERE layer."id" = backup."id"`,
    );

    await queryRunner.query(
      `DROP TABLE "layer_schema_visibility_backup_1775151500001"`,
    );
  }
}
