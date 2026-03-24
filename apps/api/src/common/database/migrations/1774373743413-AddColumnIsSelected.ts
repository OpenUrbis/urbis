import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumnIsSelected1774373743413 implements MigrationInterface {
  name = 'AddColumnIsSelected1774373743413';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" ADD "isSelected" boolean`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" DROP COLUMN "isSelected"`,
    );
  }
}
