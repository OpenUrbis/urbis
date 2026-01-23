import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserFields1769106621571 implements MigrationInterface {
    name = 'UpdateUserFields1769106621571'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "socialName" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "address" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "digitalAddress" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "termsAccepted" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "termsAccepted"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "digitalAddress"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "socialName"`);
    }

}
