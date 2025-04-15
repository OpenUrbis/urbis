import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterProperties1744706450654 implements MigrationInterface {
  name = 'AlterProperties1744706450654';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" ADD "properties" jsonb DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" DROP COLUMN "properties"`,
    );
  }
}
