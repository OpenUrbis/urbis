import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPublicAndRolesFieldsToLayerSchema1775151500000 implements MigrationInterface {
  name = 'AddPublicAndRolesFieldsToLayerSchema1775151500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" ADD "isPublic" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" ADD "allowedRoles" jsonb NOT NULL DEFAULT '[]'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" DROP COLUMN "allowedRoles"`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" DROP COLUMN "isPublic"`,
    );
  }
}
