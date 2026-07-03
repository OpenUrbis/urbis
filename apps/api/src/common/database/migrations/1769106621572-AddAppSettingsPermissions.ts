import { MigrationInterface, QueryRunner } from 'typeorm';
import { SYSTEM_ROLES } from '../../constants/system-roles.const';

export class AddAppSettingsPermissions1769106621572 implements MigrationInterface {
  permissions = [
    {
      id: 'app-settings:list',
      action: 'list',
      name: 'Listar configurações do sistema',
      description:
        'Permite ao usuário listar as configurações globais do sistema',
      resource: 'app-settings',
    },
    {
      id: 'app-settings:update',
      action: 'update',
      name: 'Atualizar configurações do sistema',
      description:
        'Permite ao usuário atualizar as configurações globais do sistema',
      resource: 'app-settings',
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    let insertPermissionsQuery = '';
    let insertRolePermissionsQuery = '';

    const adminRoleId = SYSTEM_ROLES.admin;

    this.permissions.forEach((permission) => {
      insertPermissionsQuery += `
          INSERT INTO permissions (id, action, name, description, resource)
          VALUES ('${permission.id}', '${permission.action}', '${permission.name}', '${permission.description}', '${permission.resource}')
          ON CONFLICT (id) DO NOTHING;
      `;

      insertRolePermissionsQuery += `
          INSERT INTO role_permissions ("roleId", "permissionId", "scope")
          SELECT '${adminRoleId}', '${permission.id}', 'global'
          WHERE NOT EXISTS (
            SELECT 1 FROM role_permissions 
            WHERE "roleId" = '${adminRoleId}' 
            AND "permissionId" = '${permission.id}'
          );
      `;
    });

    await queryRunner.query(insertPermissionsQuery);
    await queryRunner.query(insertRolePermissionsQuery);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    let query = '';

    this.permissions.forEach((permission) => {
      query += `
          DELETE FROM public.role_permissions
          WHERE "permissionId" = '${permission.id}';

          DELETE FROM permissions
          WHERE id = '${permission.id}';
      `;
    });

    await queryRunner.query(query);
  }
}
