import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuestionAnswerTable1773345304229 implements MigrationInterface {
  name = 'QuestionAnswerTable1773345304229';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "question_answers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "question" character varying NOT NULL, "answer" character varying NOT NULL, "index" integer, "tab_id" uuid NOT NULL, CONSTRAINT "PK_5257525a7773e5159714a3eb13c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "question_tabs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "icon" character varying, "index" integer, CONSTRAINT "PK_a40430e77cca0f1bddd0bb2062d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_answers" ADD CONSTRAINT "FK_1001d44ca8a142f0083bdbd5dce" FOREIGN KEY ("tab_id") REFERENCES "question_tabs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "question_answers" DROP CONSTRAINT "FK_1001d44ca8a142f0083bdbd5dce"`,
    );
    await queryRunner.query(`DROP TABLE "question_tabs"`);
    await queryRunner.query(`DROP TABLE "question_answers"`);
  }
}
