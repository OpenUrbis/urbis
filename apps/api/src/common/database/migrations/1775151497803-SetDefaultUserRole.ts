import { SYSTEM_ROLES } from '../../constants/system-roles.const';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetDefaultUserRole1775151497803 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Garante que o cargo 'user' (Usuário) exista e seja o padrão
    await queryRunner.query(`
      INSERT INTO roles (id, name, description, type, is_default)
      VALUES ('${SYSTEM_ROLES.user}', 'Usuário', 'Cargo padrão para novos usuários', 'system', true)
      ON CONFLICT (id) DO UPDATE SET is_default = true;
    `);

    // 2. Remove o is_default de todos os outros cargos, garantindo que 'admin' não seja padrão
    await queryRunner.query(`
      UPDATE roles SET is_default = false WHERE id != '${SYSTEM_ROLES.user}';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE roles SET is_default = true WHERE id = '${SYSTEM_ROLES.admin}';
    `);
    await queryRunner.query(`
      UPDATE roles SET is_default = false WHERE id = '${SYSTEM_ROLES.user}';
    `);
  }
}
