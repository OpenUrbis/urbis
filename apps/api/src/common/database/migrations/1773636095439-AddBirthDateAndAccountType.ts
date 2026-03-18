import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBirthDateAndAccountType1773636095439 implements MigrationInterface {
  name = 'AddBirthDateAndAccountType1773636095439';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "birthDate" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "account_type" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "account_type"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "birthDate"`);
  }
}
