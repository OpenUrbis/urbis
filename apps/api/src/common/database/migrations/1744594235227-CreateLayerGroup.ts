import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLayerGroup1744594235227 implements MigrationInterface {
  name = 'CreateLayerGroup1744594235227';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "layer_groups" ("id" character varying NOT NULL, "name" character varying NOT NULL, "subGroups" jsonb, CONSTRAINT "PK_2c27349d11a020df9711a0daa07" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "layer_groups"`);
  }
}
