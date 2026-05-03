import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGovBrFields1768431813266 implements MigrationInterface {
    name = 'AddGovBrFields1768431813266'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "cpf" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_230b925048540454c8b4c481e1c" UNIQUE ("cpf")`);
        await queryRunner.query(`ALTER TABLE "users" ADD "govBrData" jsonb`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastGovBrLoginAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "govBrFirstLoginAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TYPE "public"."application_whitelabels_theme_enum" RENAME TO "application_whitelabels_theme_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."application_whitelabels_theme_enum" AS ENUM('dark', 'light', 'system')`);
        await queryRunner.query(`ALTER TABLE "application_whitelabels" ALTER COLUMN "theme" TYPE "public"."application_whitelabels_theme_enum" USING "theme"::"text"::"public"."application_whitelabels_theme_enum"`);
        await queryRunner.query(`DROP TYPE "public"."application_whitelabels_theme_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."organization_application_whitelabels_theme_enum" RENAME TO "organization_application_whitelabels_theme_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."organization_application_whitelabels_theme_enum" AS ENUM('dark', 'light', 'system')`);
        await queryRunner.query(`ALTER TABLE "organization_application_whitelabels" ALTER COLUMN "theme" TYPE "public"."organization_application_whitelabels_theme_enum" USING "theme"::"text"::"public"."organization_application_whitelabels_theme_enum"`);
        await queryRunner.query(`DROP TYPE "public"."organization_application_whitelabels_theme_enum_old"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7b045357674127ddccbf917e9e" ON "layer_schemas" ("id") WHERE "deletedAt" IS NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7c9d3473a28e4a40c9fa42840f" ON "layer_groups" ("id") WHERE "deletedAt" IS NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2d1798ea45c9e20b756cb0828c" ON "search_config" ("layerSchemaId") WHERE "deletedAt" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_2d1798ea45c9e20b756cb0828c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7c9d3473a28e4a40c9fa42840f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7b045357674127ddccbf917e9e"`);
        await queryRunner.query(`CREATE TYPE "public"."organization_application_whitelabels_theme_enum_old" AS ENUM('dark', 'light')`);
        await queryRunner.query(`ALTER TABLE "organization_application_whitelabels" ALTER COLUMN "theme" TYPE "public"."organization_application_whitelabels_theme_enum_old" USING "theme"::"text"::"public"."organization_application_whitelabels_theme_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."organization_application_whitelabels_theme_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."organization_application_whitelabels_theme_enum_old" RENAME TO "organization_application_whitelabels_theme_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."application_whitelabels_theme_enum_old" AS ENUM('dark', 'light')`);
        await queryRunner.query(`ALTER TABLE "application_whitelabels" ALTER COLUMN "theme" TYPE "public"."application_whitelabels_theme_enum_old" USING "theme"::"text"::"public"."application_whitelabels_theme_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."application_whitelabels_theme_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."application_whitelabels_theme_enum_old" RENAME TO "application_whitelabels_theme_enum"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "govBrFirstLoginAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastGovBrLoginAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "govBrData"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_230b925048540454c8b4c481e1c"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "cpf"`);
    }

}
