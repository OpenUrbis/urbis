import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLegisAuthorities1775151497800 implements MigrationInterface {
  name = 'CreateLegisAuthorities1775151497800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "legis_authorities" ("id" character varying(191) NOT NULL, "complementFull" character varying(255), "complementAbbr" character varying(120), "commonRefFull" character varying(255) NOT NULL, "commonRefAbbr" character varying(120) NOT NULL, "startDate" character varying(10) NOT NULL, "endDate" character varying(10), "pageId" character varying(191), "createdBy" uuid, "updatedBy" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_legis_authorities_id" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_legis_authorities_commonRefAbbr" ON "legis_authorities" ("commonRefAbbr")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_legis_authorities_complementAbbr" ON "legis_authorities" ("complementAbbr")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_legis_authorities_startDate" ON "legis_authorities" ("startDate")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_legis_authorities_startDate"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_legis_authorities_complementAbbr"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_legis_authorities_commonRefAbbr"`,
    );
    await queryRunner.query(`DROP TABLE "legis_authorities"`);
  }
}
