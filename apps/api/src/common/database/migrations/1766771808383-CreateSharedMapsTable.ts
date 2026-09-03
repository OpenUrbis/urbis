import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSharedMapsTable1766771808383 implements MigrationInterface {
  name = 'CreateSharedMapsTable1766771808383';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "shared_maps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "userId" character varying NOT NULL, "state" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_shared_maps_id" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "shared_maps"`);
  }
}
