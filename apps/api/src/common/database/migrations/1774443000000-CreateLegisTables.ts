import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLegisTables1774443000000 implements MigrationInterface {
  name = 'CreateLegisTables1774443000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "legis_categories" ("id" character varying(191) NOT NULL, "name" character varying(120) NOT NULL, "color" character varying(30), "createdBy" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_legis_categories_name" UNIQUE ("name"), CONSTRAINT "PK_legis_categories_id" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "legis_pages" ("id" character varying(191) NOT NULL, "title" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "type" character varying(80) NOT NULL DEFAULT 'page', "author" character varying(255) NOT NULL DEFAULT 'Desconhecido', "tags" jsonb NOT NULL DEFAULT '[]'::jsonb, "categoryId" character varying(191), "isPublic" boolean NOT NULL DEFAULT false, "content" text NOT NULL, "source" jsonb, "entityType" character varying(80), "entityData" jsonb, "createdBy" uuid, "updatedBy" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_legis_pages_slug" UNIQUE ("slug"), CONSTRAINT "PK_legis_pages_id" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_legis_pages_title" ON "legis_pages" ("title")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_legis_pages_type" ON "legis_pages" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_legis_pages_categoryId" ON "legis_pages" ("categoryId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_legis_pages_isPublic" ON "legis_pages" ("isPublic")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_legis_pages_createdAt" ON "legis_pages" ("createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_legis_pages_createdAt"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_legis_pages_isPublic"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_legis_pages_categoryId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_legis_pages_type"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_legis_pages_title"`);
    await queryRunner.query(`DROP TABLE "legis_pages"`);
    await queryRunner.query(`DROP TABLE "legis_categories"`);
  }
}