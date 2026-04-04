import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTimestampsUnique1767923872987 implements MigrationInterface {
  name = 'FixTimestampsUnique1767923872987';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "search_config" DROP CONSTRAINT "FK_fd70e449ce72776ddc13cbaaa22"`,
    );
    await queryRunner.query(
      `ALTER TABLE "search_config" DROP CONSTRAINT "REL_fd70e449ce72776ddc13cbaaa2"`,
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
      `ALTER TABLE "search_config" ADD CONSTRAINT "REL_fd70e449ce72776ddc13cbaaa2" UNIQUE ("layerSchemaId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "search_config" ADD CONSTRAINT "FK_fd70e449ce72776ddc13cbaaa22" FOREIGN KEY ("layerSchemaId") REFERENCES "layer_schemas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
