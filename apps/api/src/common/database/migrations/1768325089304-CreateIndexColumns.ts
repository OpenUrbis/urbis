import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIndexColumns1768325089304 implements MigrationInterface {
  name = 'CreateIndexColumns1768325089304';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "layer_schemas" ADD "index" integer`);
    await queryRunner.query(`ALTER TABLE "layer_groups" ADD "index" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "layer_groups" DROP COLUMN "index"`);
    await queryRunner.query(`ALTER TABLE "layer_schemas" DROP COLUMN "index"`);
  }
}
