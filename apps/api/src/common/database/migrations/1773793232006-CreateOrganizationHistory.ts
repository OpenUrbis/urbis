import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrganizationHistory1773793232006 implements MigrationInterface {
    name = 'CreateOrganizationHistory1773793232006'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."organization_history_action_enum" AS ENUM('CREATED', 'UPDATED', 'DELETED')`);
        await queryRunner.query(`CREATE TABLE "organization_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organizationId" uuid NOT NULL, "actorId" uuid, "action" "public"."organization_history_action_enum" NOT NULL, "changes" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fba3160e68c7ea5f28a8d71ad60" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "organization_history" ADD CONSTRAINT "FK_dc2da0330111cc6b8ed9dab02d5" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_history" ADD CONSTRAINT "FK_89bdf7b96e3466cd9382ddb7f82" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_history" DROP CONSTRAINT "FK_89bdf7b96e3466cd9382ddb7f82"`);
        await queryRunner.query(`ALTER TABLE "organization_history" DROP CONSTRAINT "FK_dc2da0330111cc6b8ed9dab02d5"`);
        await queryRunner.query(`DROP TABLE "organization_history"`);
        await queryRunner.query(`DROP TYPE "public"."organization_history_action_enum"`);
    }

}
