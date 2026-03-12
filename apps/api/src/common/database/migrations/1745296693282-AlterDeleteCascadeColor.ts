import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterDeleteCascadeColor1745296693282 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public.layer_schemas_colors ALTER COLUMN "layerSchemaId" SET NOT NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public.layer_schemas_colors ALTER COLUMN "layerSchemaId" DROP NOT NULL;`,
    );
  }
}
