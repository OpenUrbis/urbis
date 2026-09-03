import { SYSTEM_ROLES } from '../../constants/system-roles.const';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizationAdminRole1775151497804 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Insere o novo cargo Administrador de Organização se não existir
    await queryRunner.query(`
      INSERT INTO roles (id, name, description, type, is_default)
      VALUES (
        '${SYSTEM_ROLES.organizationAdmin}',
        'Administrador de Organização',
        'Permite gerenciar usuários, cargos e dados da própria organização',
        'system',
        false
      )
      ON CONFLICT (id) DO NOTHING;
    `);

    // 2. Define as permissões locais (escopo 'any') para o Administrador de Organização
    const permissions = [
      'role:list',
      'role:create',
      'role:update',
      'role:assign',
      'role:unassign',
      'user:create',
      'user:update',
      'user:delete',
      'user:list',
      'user:view',
      'organization:update',
    ];

    for (const permissionId of permissions) {
      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId", "scope")
        SELECT '${SYSTEM_ROLES.organizationAdmin}', '${permissionId}', 'any'
        WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions 
          WHERE "roleId" = '${SYSTEM_ROLES.organizationAdmin}' 
          AND "permissionId" = '${permissionId}'
        );
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM role_permissions WHERE "roleId" = '${SYSTEM_ROLES.organizationAdmin}';
    `);
    await queryRunner.query(`
      DELETE FROM roles WHERE id = '${SYSTEM_ROLES.organizationAdmin}';
    `);
  }
}
