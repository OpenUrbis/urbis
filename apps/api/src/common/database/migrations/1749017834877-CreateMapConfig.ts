import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMapConfig1749017834877 implements MigrationInterface {
  name = 'CreateMapConfig1749017834877';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "map_config" ("id" character varying NOT NULL, "value" jsonb NOT NULL, CONSTRAINT "PK_bdd86a3130c36562849306539f6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "search_config" ALTER COLUMN "clickAction" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "search_config" ALTER COLUMN "clickAction" SET DEFAULT '{}'`,
    );
    await queryRunner.query(`DROP TABLE "map_config"`);
  }
}
