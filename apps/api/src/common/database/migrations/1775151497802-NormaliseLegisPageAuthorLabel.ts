import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Normalises the Legis page author label.
 *
 * Before `authorId` existed, imported/seeded pages stored the *authority* id in
 * `author` (e.g. `pref-sp`), so the UI rendered an authority code where a person
 * was expected. The authority itself lives in `entityData.authorityId`, so the
 * label is only rewritten when it is a verbatim copy of it — nothing is lost.
 */
export class NormaliseLegisPageAuthorLabel1775151497802 implements MigrationInterface {
  name = 'NormaliseLegisPageAuthorLabel1775151497802';

  private static readonly INSTITUTIONAL_AUTHOR = 'Equipe Legis';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "legis_pages"
          SET "author" = $1
        WHERE "authorId" IS NULL
          AND "entityData" ->> 'authorityId' IS NOT NULL
          AND "author" = "entityData" ->> 'authorityId'`,
      [NormaliseLegisPageAuthorLabel1775151497802.INSTITUTIONAL_AUTHOR],
    );
  }

  /**
   * Restores the previous label from `entityData.authorityId`, which is exactly
   * the value `up` replaced.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "legis_pages"
          SET "author" = "entityData" ->> 'authorityId'
        WHERE "authorId" IS NULL
          AND "entityData" ->> 'authorityId' IS NOT NULL
          AND "author" = $1`,
      [NormaliseLegisPageAuthorLabel1775151497802.INSTITUTIONAL_AUTHOR],
    );
  }
}
