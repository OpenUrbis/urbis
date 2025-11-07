import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixDefaultMetadataInOrganization1762307783710
  implements MigrationInterface
{
  name = 'FixDefaultMetadataInOrganization1762307783710';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "metadata" SET DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "metadata" DROP DEFAULT`,
    );
  }
}
