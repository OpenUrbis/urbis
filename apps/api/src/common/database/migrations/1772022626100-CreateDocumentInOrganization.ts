import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentInOrganization1772022626100 implements MigrationInterface {
  name = 'CreateDocumentInOrganization1772022626100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "document" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD CONSTRAINT "UQ_d5a43897adc353d0ef759bad14b" UNIQUE ("document")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_230b925048540454c8b4c481e1" ON "users" ("cpf") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d5a43897adc353d0ef759bad14" ON "organizations" ("document") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d5a43897adc353d0ef759bad14"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_230b925048540454c8b4c481e1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP CONSTRAINT "UQ_d5a43897adc353d0ef759bad14b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN "document"`,
    );
  }
}
