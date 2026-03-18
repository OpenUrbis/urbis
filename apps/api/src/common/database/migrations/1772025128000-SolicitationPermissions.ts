import { SYSTEM_ROLES } from 'common/constants/system-roles.const';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SolicitationPermissions1772025128000 implements MigrationInterface {
  name = 'SolicitationPermissions1772025128000';

  permissions = [
    {
      action: 'list',
      name: 'Listar solicitações',
      description: 'Permite ao usuário listar solicitações de representação',
      resource: 'solicitation',
    },
    {
      action: 'view',
      name: 'Visualizar solicitação',
      description: 'Permite ao usuário visualizar detalhes de uma solicitação',
      resource: 'solicitation',
    },
    {
      action: 'approve',
      name: 'Aprovar solicitação',
      description:
        'Permite ao usuário aprovar uma solicitação de representação',
      resource: 'solicitation',
    },
    {
      action: 'reject',
      name: 'Rejeitar solicitação',
      description:
        'Permite ao usuário rejeitar uma solicitação de representação',
      resource: 'solicitation',
    },
    {
      action: 'comment',
      name: 'Comentar solicitação',
      description: 'Permite ao usuário adicionar comentários a uma solicitação',
      resource: 'solicitation',
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    let query = '';
    let query1 = '';

    const adminRoleId = SYSTEM_ROLES.admin;

    this.permissions.forEach((permission) => {
      const permissionId = `${permission.resource}:${permission.action}`;
      query += `
          INSERT INTO permissions (id, action, name, description, resource)
          VALUES ('${permissionId}', '${permission.action}', '${permission.name}', '${permission.description}', '${permission.resource}')
          ON CONFLICT (id) DO NOTHING;
      `;

      // Assign global permission to System Admin
      query1 += `
          INSERT INTO role_permissions ("roleId", "permissionId", "scope")
          SELECT '${adminRoleId}', '${permissionId}', 'global'
          WHERE NOT EXISTS (
            SELECT 1 FROM role_permissions 
            WHERE "roleId" = '${adminRoleId}' 
            AND "permissionId" = '${permissionId}'
          );
      `;
    });

    if (query) await queryRunner.query(query);
    if (query1) await queryRunner.query(query1);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    let query = '';

    this.permissions.forEach((permission) => {
      const permissionId = `${permission.resource}:${permission.action}`;
      query += `
          DELETE FROM public.role_permissions
          WHERE "permissionId" = '${permissionId}';

          DELETE FROM permissions
          WHERE id = '${permissionId}';
      `;
    });

    if (query) await queryRunner.query(query);
  }
}
