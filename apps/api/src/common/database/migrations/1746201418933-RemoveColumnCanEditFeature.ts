import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveColumnCanEditFeature1746201418933
  implements MigrationInterface
{
  name = 'RemoveColumnCanEditFeature1746201418933';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" DROP COLUMN "canEditFeature"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "layer_schemas" ADD "canEditFeature" boolean`,
    );
  }
}
