import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetLayerVisibilityDefaultToPrivate1788998400000 implements MigrationInterface {
  name = 'SetLayerVisibilityDefaultToPrivate1788998400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" ALTER COLUMN "isPublic" SET DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" ALTER COLUMN "allowedRoles" SET DEFAULT '["f5fe5a01-b8e8-4f45-8701-45a6b24ba2d4"]'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" ALTER COLUMN "allowedRoles" SET DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" ALTER COLUMN "isPublic" SET DEFAULT true`,
    );
  }
}
