import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimestapsInSchemas1767922711647 implements MigrationInterface {
  name = 'AddTimestapsInSchemas1767922711647';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" ADD "deletedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_groups" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_groups" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_groups" ADD "deletedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "search_config" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "search_config" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "search_config" ADD "deletedAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "search_config" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "search_config" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "search_config" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_groups" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_groups" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_groups" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" DROP COLUMN "createdAt"`,
    );
  }
}
