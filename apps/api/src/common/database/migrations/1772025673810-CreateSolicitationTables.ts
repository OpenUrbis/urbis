import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSolicitationTables1772025673810 implements MigrationInterface {
  name = 'CreateSolicitationTables1772025673810';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "solicitation_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "solicitationId" uuid NOT NULL, "authorId" uuid NOT NULL, "text" text NOT NULL, "attachments" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_39db755c81adb98f2aef5ac1167" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."solicitations_type_enum" AS ENUM('DIRECT', 'MANUAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."solicitations_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "solicitations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."solicitations_type_enum" NOT NULL, "status" "public"."solicitations_status_enum" NOT NULL DEFAULT 'PENDING', "requesterId" uuid, "organizationId" uuid, "assignedToId" uuid, "justification" text, "documents" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_53503efa9bcfa87b80700677e88" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."solicitation_history_previousstatus_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."solicitation_history_newstatus_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "solicitation_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "solicitationId" uuid NOT NULL, "actorId" uuid, "action" character varying NOT NULL, "previousStatus" "public"."solicitation_history_previousstatus_enum", "newStatus" "public"."solicitation_history_newstatus_enum", "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_20f45dd2bdb4e53b30589d95cc0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitation_comments" ADD CONSTRAINT "FK_0085ab5b55bbac875bf64c4435c" FOREIGN KEY ("solicitationId") REFERENCES "solicitations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitation_comments" ADD CONSTRAINT "FK_d30f295f4fd61714dea3788aa7a" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" ADD CONSTRAINT "FK_c8140da1287e028b92736f40d5e" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" ADD CONSTRAINT "FK_d76d391ec8d90886da9724c6189" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" ADD CONSTRAINT "FK_926368619af7db09b0d8c137945" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitation_history" ADD CONSTRAINT "FK_4db0ebc18de9b8069d2b91b7ee1" FOREIGN KEY ("solicitationId") REFERENCES "solicitations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitation_history" ADD CONSTRAINT "FK_95cb29d3064175b7400e4409a4d" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "solicitation_history" DROP CONSTRAINT "FK_95cb29d3064175b7400e4409a4d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitation_history" DROP CONSTRAINT "FK_4db0ebc18de9b8069d2b91b7ee1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" DROP CONSTRAINT "FK_926368619af7db09b0d8c137945"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" DROP CONSTRAINT "FK_d76d391ec8d90886da9724c6189"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" DROP CONSTRAINT "FK_c8140da1287e028b92736f40d5e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitation_comments" DROP CONSTRAINT "FK_d30f295f4fd61714dea3788aa7a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitation_comments" DROP CONSTRAINT "FK_0085ab5b55bbac875bf64c4435c"`,
    );
    await queryRunner.query(`DROP TABLE "solicitation_history"`);
    await queryRunner.query(
      `DROP TYPE "public"."solicitation_history_newstatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."solicitation_history_previousstatus_enum"`,
    );
    await queryRunner.query(`DROP TABLE "solicitations"`);
    await queryRunner.query(`DROP TYPE "public"."solicitations_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."solicitations_type_enum"`);
    await queryRunner.query(`DROP TABLE "solicitation_comments"`);
  }
}
