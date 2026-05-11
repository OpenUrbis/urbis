import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTypeToSharedMap1768929143767 implements MigrationInterface {
    name = 'AddTypeToSharedMap1768929143767'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shared_maps" ADD "type" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shared_maps" DROP COLUMN "type"`);
    }

}
