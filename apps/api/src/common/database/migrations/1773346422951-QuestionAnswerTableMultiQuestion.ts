import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuestionAnswerTableMultiQuestion1773346422951 implements MigrationInterface {
  name = 'QuestionAnswerTableMultiQuestion1773346422951';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "question_answers" DROP CONSTRAINT "FK_1001d44ca8a142f0083bdbd5dce"`,
    );
    await queryRunner.query(
      `CREATE TABLE "question_tabs_answers" ("question_tab_id" uuid NOT NULL, "question_answer_id" uuid NOT NULL, CONSTRAINT "PK_8ce57300ce104364ed2e3b9dd0f" PRIMARY KEY ("question_tab_id", "question_answer_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_14e2ecd5a83929b72035538f01" ON "question_tabs_answers" ("question_tab_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_816779763f4c3044b100e0ddb1" ON "question_tabs_answers" ("question_answer_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "question_answers" DROP COLUMN "tab_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_tabs_answers" ADD CONSTRAINT "FK_14e2ecd5a83929b72035538f01f" FOREIGN KEY ("question_tab_id") REFERENCES "question_tabs"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_tabs_answers" ADD CONSTRAINT "FK_816779763f4c3044b100e0ddb17" FOREIGN KEY ("question_answer_id") REFERENCES "question_answers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "question_tabs_answers" DROP CONSTRAINT "FK_816779763f4c3044b100e0ddb17"`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_tabs_answers" DROP CONSTRAINT "FK_14e2ecd5a83929b72035538f01f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_answers" ADD "tab_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_816779763f4c3044b100e0ddb1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_14e2ecd5a83929b72035538f01"`,
    );
    await queryRunner.query(`DROP TABLE "question_tabs_answers"`);
    await queryRunner.query(
      `ALTER TABLE "question_answers" ADD CONSTRAINT "FK_1001d44ca8a142f0083bdbd5dce" FOREIGN KEY ("tab_id") REFERENCES "question_tabs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
