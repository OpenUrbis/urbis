import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveRequiredFromUserPhone1764216203479 implements MigrationInterface {
  name = 'RemoveRequiredFromUserPhone1764216203479';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL`,
    );
  }
}
