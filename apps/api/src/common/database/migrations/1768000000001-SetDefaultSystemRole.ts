import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetDefaultSystemRole1768000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE roles SET is_default = true WHERE id = 'f5fe5a01-b8e8-4f45-8701-45a6b24ba2d4'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE roles SET is_default = false WHERE id = 'f5fe5a01-b8e8-4f45-8701-45a6b24ba2d4'`,
    );
  }
}
