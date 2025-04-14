import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLayerSchema1744593788104 implements MigrationInterface {
    name = 'CreateLayerSchema1744593788104';
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "layer_schemas" (
                "id" character varying NOT NULL,
                "@@type" character varying NOT NULL,
                "name" character varying NOT NULL,
                "visible" boolean NOT NULL,
                "getFillColor" jsonb,
                "minZoom" integer,
                "data" character varying,
                "groupId" character varying,
                "getText" character varying,
                "getTextColor" jsonb,
                "getLineColor" jsonb,
                "getTextSize" integer,
                "autoHighlight" boolean,
                "highlightColor" jsonb,
                "labelColor" jsonb,
                "mapLegend" jsonb,
                "urlTemplate" character varying,
                CONSTRAINT "PK_899628df9b11575bf527b829f1e" PRIMARY KEY ("id")
            )
        `);
    }
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "layer_schemas"
        `);
    }
}