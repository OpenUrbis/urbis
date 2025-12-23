import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeIsActiveDefault1766525848812 implements MigrationInterface {
    name = 'ChangeIsActiveDefault1766525848812'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "layer_schemas" ALTER COLUMN "isActive" SET DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "layer_schemas" ALTER COLUMN "isActive" SET DEFAULT true`);
    }

}
