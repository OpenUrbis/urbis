import { MigrationInterface, QueryRunner } from 'typeorm';

export class RepresentationAdministrationCorrections1780963200000 implements MigrationInterface {
  name = 'RepresentationAdministrationCorrections1780963200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."representations_status_enum" ADD VALUE IF NOT EXISTS 'INACTIVE'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."representation_history_previousstatus_enum" ADD VALUE IF NOT EXISTS 'INACTIVE'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."representation_history_newstatus_enum" ADD VALUE IF NOT EXISTS 'INACTIVE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "representations" ADD "validationProcedure" character varying NOT NULL DEFAULT 'CONFERENCE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "representations" ADD "coRepresentatives" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "representations" ADD "requiresJointAgreement" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "representations" ALTER COLUMN "documents" TYPE jsonb USING CASE WHEN "documents" IS NULL THEN NULL ELSE jsonb_build_array(jsonb_build_object('category', 'legacy', 'files', to_jsonb("documents"))) END`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "representations" ALTER COLUMN "documents" TYPE text[] USING ARRAY(SELECT jsonb_array_elements_text(COALESCE("documents"->0->'files', '[]'::jsonb)))`,
    );
    await queryRunner.query(
      `ALTER TABLE "representations" DROP COLUMN "requiresJointAgreement"`,
    );
    await queryRunner.query(
      `ALTER TABLE "representations" DROP COLUMN "coRepresentatives"`,
    );
    await queryRunner.query(
      `ALTER TABLE "representations" DROP COLUMN "validationProcedure"`,
    );
  }
}
