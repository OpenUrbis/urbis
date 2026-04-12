import { MigrationInterface, QueryRunner } from 'typeorm';

export class Whitelabel1765815857270 implements MigrationInterface {
  name = 'Whitelabel1765815857270';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."application_whitelabels_application_enum" AS ENUM('accounts', 'docs')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."application_whitelabels_theme_enum" AS ENUM('dark', 'light')`,
    );
    await queryRunner.query(
      `CREATE TABLE "application_whitelabels" ("organizationId" uuid NOT NULL, "application" "public"."application_whitelabels_application_enum" NOT NULL, "theme" "public"."application_whitelabels_theme_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_d18542c24815caea011781f8308" PRIMARY KEY ("organizationId", "application"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "shared_whitelabels" ("organizationId" uuid NOT NULL, "primaryColor" character varying(9), "layout" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_ad661d1069106f3e1b7aa307011" PRIMARY KEY ("organizationId"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_whitelabels" ADD CONSTRAINT "FK_4e7b460a1f09cf8f0734ab2d59a" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shared_whitelabels" ADD CONSTRAINT "FK_ad661d1069106f3e1b7aa307011" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "shared_whitelabels" DROP CONSTRAINT "FK_ad661d1069106f3e1b7aa307011"`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_whitelabels" DROP CONSTRAINT "FK_4e7b460a1f09cf8f0734ab2d59a"`,
    );
    await queryRunner.query(`DROP TABLE "shared_whitelabels"`);
    await queryRunner.query(`DROP TABLE "application_whitelabels"`);
    await queryRunner.query(
      `DROP TYPE "public"."application_whitelabels_theme_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."application_whitelabels_application_enum"`,
    );
  }
}
