import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterColors1744705080131 implements MigrationInterface {
  name = 'AlterColors1744705080131';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."layer_schemas_colors_type_enum" AS ENUM('text', 'fill', 'line')`,
    );
    await queryRunner.query(
      `ALTER TABLE "layer_schemas_colors" ADD "type" "public"."layer_schemas_colors_type_enum" DEFAULT 'fill'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas_colors" DROP COLUMN "type"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."layer_schemas_colors_type_enum"`,
    );
  }
}
