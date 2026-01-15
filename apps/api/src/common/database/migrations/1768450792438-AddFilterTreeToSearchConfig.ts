import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFilterTreeToSearchConfig1768450792438 implements MigrationInterface {
    name = 'AddFilterTreeToSearchConfig1768450792438'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "search_config" ADD "filterTree" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "search_config" DROP COLUMN "filterTree"`);
    }

}
