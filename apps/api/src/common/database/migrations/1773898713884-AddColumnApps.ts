import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnApps1773898713884 implements MigrationInterface {
    name = 'AddColumnApps1773898713884'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question_answers" ADD "apps" text array`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question_answers" DROP COLUMN "apps"`);
    }

}
