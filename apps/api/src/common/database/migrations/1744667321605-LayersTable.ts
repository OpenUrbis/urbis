import { MigrationInterface, QueryRunner } from 'typeorm';

export class LayersTable1744667321605 implements MigrationInterface {
  name = 'LayersTable1744667321605';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "layer_groups" ("id" character varying NOT NULL, "name" character varying NOT NULL, "ownerGroup" character varying, CONSTRAINT "PK_2c27349d11a020df9711a0daa07" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "layer_schemas_colors" ("id" SERIAL NOT NULL, "color" jsonb NOT NULL, "pattern" character varying NOT NULL DEFAULT 'full', "label" character varying NOT NULL, "value" character varying, "layerSchemaId" character varying NOT NULL, CONSTRAINT "PK_facc0039f7ad96f142333c27230" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."layer_schemas_type_enum" AS ENUM('Custom', 'CustomWMSLayer', 'GeoJsonLayer')`,
    );
    await queryRunner.query(
      `CREATE TABLE "layer_schemas" ("id" character varying NOT NULL, "name" character varying NOT NULL, "origin" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "type" "public"."layer_schemas_type_enum" NOT NULL DEFAULT 'GeoJsonLayer', "isVisible" boolean, "canEditFeature" boolean, "minZoom" integer, "getTextColorPropName" character varying, "getFillColorPropName" character varying, "getLineColorPropName" character varying, "clickAction" jsonb, "viewTemplate" jsonb, "groupId" character varying, CONSTRAINT "PK_899628df9b11575bf527b829f1e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_groups" ADD CONSTRAINT "FK_603fa7d8d7b3cf630bccaf6766f" FOREIGN KEY ("ownerGroup") REFERENCES "layer_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_schemas_colors" ADD CONSTRAINT "FK_5d2f55213a7c55b6dec327a7865" FOREIGN KEY ("layerSchemaId") REFERENCES "layer_schemas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" ADD CONSTRAINT "FK_965de329f8e3b52e47645d59d29" FOREIGN KEY ("groupId") REFERENCES "layer_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" DROP CONSTRAINT "FK_965de329f8e3b52e47645d59d29"`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_schemas_colors" DROP CONSTRAINT "FK_5d2f55213a7c55b6dec327a7865"`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_groups" DROP CONSTRAINT "FK_603fa7d8d7b3cf630bccaf6766f"`,
    );
    await queryRunner.query(`DROP TABLE "layer_schemas"`);
    await queryRunner.query(`DROP TYPE "public"."layer_schemas_type_enum"`);
    await queryRunner.query(`DROP TABLE "layer_schemas_colors"`);
    await queryRunner.query(`DROP TABLE "layer_groups"`);
  }
}
