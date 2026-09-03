import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIncludeInAnalysisAndFiuToLayerSchema1786240000000 implements MigrationInterface {
  name = 'AddIncludeInAnalysisAndFiuToLayerSchema1786240000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" ADD COLUMN IF NOT EXISTS "includeInAnalysis" boolean DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" ADD COLUMN IF NOT EXISTS "includeInFiu" boolean DEFAULT true`,
    );
    await queryRunner.query(
      `UPDATE "layer_schemas" SET "includeInAnalysis" = true WHERE "includeInAnalysis" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "layer_schemas" SET "includeInFiu" = true WHERE "includeInFiu" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" DROP COLUMN IF EXISTS "includeInFiu"`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" DROP COLUMN IF EXISTS "includeInAnalysis"`,
    );
  }
}
