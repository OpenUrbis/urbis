import { MigrationInterface, QueryRunner } from 'typeorm';
import { SYSTEM_ROLES } from '../../constants/system-roles.const';

export class AddMapConfigUpdatePermission1775051953034 implements MigrationInterface {
  name = 'AddMapConfigUpdatePermission1775051953034';

  permissions = [
    {
      action: 'update',
      name: 'Atualizar parâmetros do mapa',
      description:
        'Permite ao usuário atualizar os parâmetros de configuração do mapa',
      resource: 'map-config',
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    let query = '';
    let query1 = '';

    const adminRoleId = SYSTEM_ROLES.admin;

    this.permissions.forEach((permission) => {
      query += `
          INSERT INTO permissions (id, action, name, description, resource)
          VALUES ('${permission.resource}:${permission.action}', '${permission.action}', '${permission.name}', '${permission.description}', '${permission.resource}')
          ON CONFLICT (id) DO NOTHING;
      `;
      query1 += `
          INSERT INTO role_permissions ("roleId", "permissionId", "scope")
          SELECT '${adminRoleId}', '${permission.resource}:${permission.action}', 'global'
          WHERE NOT EXISTS (
            SELECT 1 FROM role_permissions 
            WHERE "roleId" = '${adminRoleId}' 
            AND "permissionId" = '${permission.resource}:${permission.action}'
          );
      `;
    });

    await queryRunner.query(query);
    await queryRunner.query(query1);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    let query = '';

    this.permissions.forEach((permission) => {
      query += `
          DELETE FROM public.role_permissions
          WHERE "permissionId" = '${permission.resource}:${permission.action}';

          DELETE FROM permissions
          WHERE id = '${permission.resource}:${permission.action}';
      `;
    });

    await queryRunner.query(query);
  }
}
