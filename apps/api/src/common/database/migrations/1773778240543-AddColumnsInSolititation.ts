import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumnsInSolititation1773778240543 implements MigrationInterface {
  name = 'AddColumnsInSolititation1773778240543';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "solicitations" ADD "representationType" text`,
    );
    await queryRunner.query(`ALTER TABLE "solicitations" ADD "authorId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "solicitations" ADD "representedId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" ADD "representativeId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" ADD CONSTRAINT "FK_42092c75173b53eaf35f6dcfcd8" FOREIGN KEY ("authorId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" ADD CONSTRAINT "FK_939cc124f2250eba76fcdc2b3bf" FOREIGN KEY ("representedId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" ADD CONSTRAINT "FK_c83120eb528768de9898892e4e7" FOREIGN KEY ("representativeId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "solicitations" DROP CONSTRAINT "FK_c83120eb528768de9898892e4e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" DROP CONSTRAINT "FK_939cc124f2250eba76fcdc2b3bf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" DROP CONSTRAINT "FK_42092c75173b53eaf35f6dcfcd8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" DROP COLUMN "representativeId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" DROP COLUMN "representedId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" DROP COLUMN "authorId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitations" DROP COLUMN "representationType"`,
    );
  }
}
