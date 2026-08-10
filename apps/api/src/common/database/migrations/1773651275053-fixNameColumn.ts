import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixNameColumn1773651275053 implements MigrationInterface {
  name = 'FixNameColumn1773651275053';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "account_type" TO "accountType"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "accountType" TO "account_type"`,
    );
  }
}
