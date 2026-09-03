import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorSolicitationToRepresentation1773780980065 implements MigrationInterface {
  name = 'RefactorSolicitationToRepresentation1773780980065';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "representation_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "representationId" uuid NOT NULL, "authorId" uuid NOT NULL, "text" text NOT NULL, "attachments" text array, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_cdac7e4f15964007b9695fa2d74" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."representation_history_previousstatus_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'INFO_REQUESTED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."representation_history_newstatus_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'INFO_REQUESTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "representation_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "representationId" uuid NOT NULL, "actorId" uuid, "action" character varying NOT NULL, "previousStatus" "public"."representation_history_previousstatus_enum", "newStatus" "public"."representation_history_newstatus_enum", "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_031ac769c17af4dd78f8ee3a3c1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."representations_type_enum" AS ENUM('DIRECT', 'MANUAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."representations_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'INFO_REQUESTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "representations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."representations_type_enum" NOT NULL, "status" "public"."representations_status_enum" NOT NULL DEFAULT 'PENDING', "requesterId" uuid, "organizationId" uuid, "representationType" text, "authorId" uuid, "representedId" uuid, "representativeId" uuid, "assignedToId" uuid, "justification" text, "documents" text array, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_9a8e4e112785fff11e9f5973ef8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "representation_comments" ADD CONSTRAINT "FK_571211a8b7be06845ed99e2c6b7" FOREIGN KEY ("representationId") REFERENCES "representations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "representation_comments" ADD CONSTRAINT "FK_d3d1d6509483903e205d66a6387" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "representation_history" ADD CONSTRAINT "FK_2d4134cc988e882ddd984821f9d" FOREIGN KEY ("representationId") REFERENCES "representations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "representation_history" ADD CONSTRAINT "FK_79b38b29ae12826aa9cbbb79a38" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "representations" ADD CONSTRAINT "FK_31ec8173b9d296f9fbce27aaa27" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "representations" ADD CONSTRAINT "FK_66a52c4c8a397c5ea372505076e" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "representations" ADD CONSTRAINT "FK_5ce64e1fb2e5d6509cecda5cc20" FOREIGN KEY ("authorId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "representations" ADD CONSTRAINT "FK_9294a95daffb1ab967f7ce17271" FOREIGN KEY ("representedId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "representations" ADD CONSTRAINT "FK_43dab5deb7d1ecfe4e0c53cf910" FOREIGN KEY ("representativeId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "representations" ADD CONSTRAINT "FK_1a7d073955c743c087f5c720aa6" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "representations" DROP CONSTRAINT "FK_1a7d073955c743c087f5c720aa6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "representations" DROP CONSTRAINT "FK_43dab5deb7d1ecfe4e0c53cf910"`,
    );
    await queryRunner.query(
      `ALTER TABLE "representations" DROP CONSTRAINT "FK_9294a95daffb1ab967f7ce17271"`,
    );
    await queryRunner.query(
      `ALTER TABLE "representations" DROP CONSTRAINT "FK_5ce64e1fb2e5d6509cecda5cc20"`,
    );
    await queryRunner.query(
      `ALTER TABLE "representations" DROP CONSTRAINT "FK_66a52c4c8a397c5ea372505076e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "representations" DROP CONSTRAINT "FK_31ec8173b9d296f9fbce27aaa27"`,
    );
    await queryRunner.query(
      `ALTER TABLE "representation_history" DROP CONSTRAINT "FK_79b38b29ae12826aa9cbbb79a38"`,
    );
    await queryRunner.query(
      `ALTER TABLE "representation_history" DROP CONSTRAINT "FK_2d4134cc988e882ddd984821f9d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "representation_comments" DROP CONSTRAINT "FK_d3d1d6509483903e205d66a6387"`,
    );
    await queryRunner.query(
      `ALTER TABLE "representation_comments" DROP CONSTRAINT "FK_571211a8b7be06845ed99e2c6b7"`,
    );
    await queryRunner.query(`DROP TABLE "representations"`);
    await queryRunner.query(`DROP TYPE "public"."representations_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."representations_type_enum"`);
    await queryRunner.query(`DROP TABLE "representation_history"`);
    await queryRunner.query(
      `DROP TYPE "public"."representation_history_newstatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."representation_history_previousstatus_enum"`,
    );
    await queryRunner.query(`DROP TABLE "representation_comments"`);
  }
}
