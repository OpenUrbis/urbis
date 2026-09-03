import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTypeToMapConfig1775051953035 implements MigrationInterface {
  name = 'AddTypeToMapConfig1775051953035';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."map_config_type_enum" AS ENUM('literal-number', 'literal-string', 'array', 'object', 'view-template')`,
    );

    await queryRunner.query(
      `ALTER TABLE "map_config" ADD "type" "public"."map_config_type_enum" NOT NULL DEFAULT 'object'`,
    );

    await queryRunner.query(`
      UPDATE "map_config"
      SET "type" = CASE
        WHEN "id" IN ('latitude', 'longitude', 'zoom', 'bearing', 'pitch') THEN 'literal-number'::"public"."map_config_type_enum"
        WHEN "id" IN ('layerWithRootEditTemplate') THEN 'literal-string'::"public"."map_config_type_enum"
        WHEN "id" IN ('boundingBox') THEN 'array'::"public"."map_config_type_enum"
        WHEN "id" IN ('padding') THEN 'object'::"public"."map_config_type_enum"
        WHEN "id" IN ('editFeatureTemplate') THEN 'view-template'::"public"."map_config_type_enum"
        ELSE 'object'::"public"."map_config_type_enum"
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "map_config" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."map_config_type_enum"`);
  }
}
