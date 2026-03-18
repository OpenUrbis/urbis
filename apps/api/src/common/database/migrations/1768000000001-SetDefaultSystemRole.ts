import { SYSTEM_ROLES } from '../../constants/system-roles.const';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetDefaultSystemRole1768000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE roles SET is_default = true WHERE id = '${SYSTEM_ROLES.admin}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE roles SET is_default = false WHERE id = '${SYSTEM_ROLES.admin}'`,
    );
  }
}
