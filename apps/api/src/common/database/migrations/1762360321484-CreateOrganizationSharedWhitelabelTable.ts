import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizationSharedWhitelabelTable1762360321484 implements MigrationInterface {
  name = 'CreateOrganizationSharedWhitelabelTable1762360321484';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."organization_application_whitelabels_application_enum" AS ENUM('accounts')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organization_application_whitelabels_theme_enum" AS ENUM('dark', 'light')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organization_application_whitelabels" ("organizationId" uuid NOT NULL, "application" "public"."organization_application_whitelabels_application_enum" NOT NULL, "theme" "public"."organization_application_whitelabels_theme_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_aa07ead8553c37be172bb4c8871" PRIMARY KEY ("organizationId", "application"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "organization_global_whitelabels" ("organizationId" uuid NOT NULL, "icons" jsonb, "logos" jsonb, "primaryColor" character varying(9), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_c512a509ab1d08661abb3341376" PRIMARY KEY ("organizationId"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_application_whitelabels" ADD CONSTRAINT "FK_a7e3c0dd8f7e9b7c957d49fd8de" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_global_whitelabels" ADD CONSTRAINT "FK_c512a509ab1d08661abb3341376" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization_global_whitelabels" DROP CONSTRAINT "FK_c512a509ab1d08661abb3341376"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_application_whitelabels" DROP CONSTRAINT "FK_a7e3c0dd8f7e9b7c957d49fd8de"`,
    );
    await queryRunner.query(`DROP TABLE "organization_global_whitelabels"`);
    await queryRunner.query(
      `DROP TABLE "organization_application_whitelabels"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."organization_application_whitelabels_theme_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."organization_application_whitelabels_application_enum"`,
    );
  }
}
