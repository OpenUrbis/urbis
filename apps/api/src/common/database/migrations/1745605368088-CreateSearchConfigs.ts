import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSearchConfigs1745605368088 implements MigrationInterface {
  name = 'CreateSearchConfigs1745605368088';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas_colors" DROP CONSTRAINT "FK_5d2f55213a7c55b6dec327a7865"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."search_config_method_enum" AS ENUM('GET', 'DELETE', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'PURGE', 'LINK', 'UNLINK')`,
    );
    await queryRunner.query(
      `CREATE TABLE "search_config" ("id" character varying NOT NULL, "name" character varying NOT NULL, "origin" character varying NOT NULL, "method" "public"."search_config_method_enum" DEFAULT 'GET', "index" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "transformParams" character varying, "transformRequest" character varying, "transformResponse" character varying, "clickAction" jsonb DEFAULT '{}', "layerSchemaId" character varying, CONSTRAINT "REL_fd70e449ce72776ddc13cbaaa2" UNIQUE ("layerSchemaId"), CONSTRAINT "PK_c239efbe17e4f25ba16a94373e3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_schemas_colors" ADD CONSTRAINT "FK_5d2f55213a7c55b6dec327a7865" FOREIGN KEY ("layerSchemaId") REFERENCES "layer_schemas"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "search_config" ADD CONSTRAINT "FK_fd70e449ce72776ddc13cbaaa22" FOREIGN KEY ("layerSchemaId") REFERENCES "layer_schemas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "search_config" DROP CONSTRAINT "FK_fd70e449ce72776ddc13cbaaa22"`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_schemas_colors" DROP CONSTRAINT "FK_5d2f55213a7c55b6dec327a7865"`,
    );
    await queryRunner.query(`DROP TABLE "search_config"`);
    await queryRunner.query(`DROP TYPE "public"."search_config_method_enum"`);
    await queryRunner.query(
      `ALTER TABLE "layer_schemas_colors" ADD CONSTRAINT "FK_5d2f55213a7c55b6dec327a7865" FOREIGN KEY ("layerSchemaId") REFERENCES "layer_schemas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
