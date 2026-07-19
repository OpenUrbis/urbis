import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDynamicSystemDataTable1772463389106 implements MigrationInterface {
  name = 'CreateDynamicSystemDataTable1772463389106';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "dynamic_system_data" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "module_name" character varying(255) NOT NULL, "version" character varying(50) NOT NULL DEFAULT '1.0', "data" jsonb NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1c9a4352a9fc399304f3702e5c7" UNIQUE ("module_name", "version"), CONSTRAINT "PK_891b13d27eefc791bdee3eb1b12" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "dynamic_system_data"`);
  }
}
