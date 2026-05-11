import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPublicToSharedMap1768927564446 implements MigrationInterface {
    name = 'AddPublicToSharedMap1768927564446'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shared_maps" ADD "isPublic" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "support_tickets" ALTER COLUMN "id" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "support_tickets" ALTER COLUMN "id" SET DEFAULT generate_support_ticket_id()`);
        await queryRunner.query(`ALTER TABLE "shared_maps" DROP COLUMN "isPublic"`);
    }

}
