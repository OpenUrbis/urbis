import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPatternConfig1769434585765 implements MigrationInterface {
  name = 'AddPatternConfig1769434585765';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas_colors" ADD "patternConfig" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas_colors" DROP COLUMN "patternConfig"`,
    );
  }
}
