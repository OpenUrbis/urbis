import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDescriptionToMapConfig1774443000001 implements MigrationInterface {
  name = 'AddDescriptionToMapConfig1774443000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "map_config" ADD "description" text NOT NULL DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "map_config" DROP COLUMN "description"`,
    );
  }
}
