import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Links the Legis page author to a system user. Until now `author` was only a
 * free-text label captured at creation time, so the page could not be traced
 * back to an account nor kept in sync when the person renamed their profile.
 */
export class AddAuthorIdToLegisPages1775151497801 implements MigrationInterface {
  name = 'AddAuthorIdToLegisPages1775151497801';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "legis_pages" ADD "authorId" uuid`);

    /*
     * Existing rows already record who wrote the page in `createdBy`, so the
     * backfill preserves authorship instead of leaving history unattributed.
     */
    await queryRunner.query(
      `UPDATE "legis_pages" SET "authorId" = "createdBy" WHERE "createdBy" IS NOT NULL`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_legis_pages_authorId" ON "legis_pages" ("authorId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_legis_pages_authorId"`);
    await queryRunner.query(`ALTER TABLE "legis_pages" DROP COLUMN "authorId"`);
  }
}
