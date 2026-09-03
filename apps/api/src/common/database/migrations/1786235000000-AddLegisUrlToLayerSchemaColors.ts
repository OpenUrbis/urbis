import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLegisUrlToLayerSchemaColors1786235000000 implements MigrationInterface {
  name = 'AddLegisUrlToLayerSchemaColors1786235000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas_colors" ADD COLUMN IF NOT EXISTS "legisUrl" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas_colors" DROP COLUMN IF EXISTS "legisUrl"`,
    );
  }
}
