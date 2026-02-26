import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeTypeFilesInSolicitation1772049250545 implements MigrationInterface {
  name = 'ChangeTypeFilesInSolicitation1772049250545';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "solicitation_comments" DROP COLUMN "attachments"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitation_comments" ADD "attachments" text array`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."solicitation_history_previousstatus_enum" RENAME TO "solicitation_history_previousstatus_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."solicitation_history_previousstatus_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'INFO_REQUESTED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitation_history" ALTER COLUMN "previousStatus" TYPE "public"."solicitation_history_previousstatus_enum" USING "previousStatus"::"text"::"public"."solicitation_history_previousstatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."solicitation_history_previousstatus_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."solicitation_history_newstatus_enum" RENAME TO "solicitation_history_newstatus_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."solicitation_history_newstatus_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'INFO_REQUESTED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitation_history" ALTER COLUMN "newStatus" TYPE "public"."solicitation_history_newstatus_enum" USING "newStatus"::"text"::"public"."solicitation_history_newstatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."solicitation_history_newstatus_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."solicitations_status_enum" RENAME TO "solicitations_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."solicitations_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'INFO_REQUESTED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" ALTER COLUMN "status" TYPE "public"."solicitations_status_enum" USING "status"::"text"::"public"."solicitations_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."solicitations_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" DROP COLUMN "documents"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" ADD "documents" text array`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "solicitations" DROP COLUMN "documents"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" ADD "documents" jsonb`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."solicitations_status_enum_old" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" ALTER COLUMN "status" TYPE "public"."solicitations_status_enum_old" USING "status"::"text"::"public"."solicitations_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
    );
    await queryRunner.query(`DROP TYPE "public"."solicitations_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."solicitations_status_enum_old" RENAME TO "solicitations_status_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."solicitation_history_newstatus_enum_old" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitation_history" ALTER COLUMN "newStatus" TYPE "public"."solicitation_history_newstatus_enum_old" USING "newStatus"::"text"::"public"."solicitation_history_newstatus_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."solicitation_history_newstatus_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."solicitation_history_newstatus_enum_old" RENAME TO "solicitation_history_newstatus_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."solicitation_history_previousstatus_enum_old" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitation_history" ALTER COLUMN "previousStatus" TYPE "public"."solicitation_history_previousstatus_enum_old" USING "previousStatus"::"text"::"public"."solicitation_history_previousstatus_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."solicitation_history_previousstatus_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."solicitation_history_previousstatus_enum_old" RENAME TO "solicitation_history_previousstatus_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitation_comments" DROP COLUMN "attachments"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitation_comments" ADD "attachments" jsonb`,
    );
  }
}
