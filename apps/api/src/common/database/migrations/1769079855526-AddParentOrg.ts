import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParentOrg1769079855526 implements MigrationInterface {
  name = 'AddParentOrg1769079855526';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "organizations" ADD "parentId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD CONSTRAINT "FK_b9e8b8e8d88eed668c3e6e69d3c" FOREIGN KEY ("parentId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP CONSTRAINT "FK_b9e8b8e8d88eed668c3e6e69d3c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN "parentId"`,
    );
  }
}
