import { SYSTEM_ROLES } from '../../constants/system-roles.const';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncHelpPermissions1768508210254 implements MigrationInterface {
  name = 'SyncHelpPermissions1768508210254';

  permissions = [
    {
      action: 'list',
      name: 'Listar abas de ajuda',
      description: 'Permite ao usuário listar abas de ajuda no sistema',
      resource: 'question-tab',
    },
    {
      action: 'create',
      name: 'Criar aba de ajuda',
      description: 'Permite ao usuário criar novas abas de ajuda',
      resource: 'question-tab',
    },
    {
      action: 'update',
      name: 'Atualizar aba de ajuda',
      description: 'Permite ao usuário atualizar abas de ajuda',
      resource: 'question-tab',
    },
    {
      action: 'delete',
      name: 'Excluir aba de ajuda',
      description: 'Permite ao usuário excluir abas de ajuda',
      resource: 'question-tab',
    },
    {
      action: 'list',
      name: 'Listar perguntas de ajuda',
      description: 'Permite ao usuário listar perguntas de ajuda no sistema',
      resource: 'question-answer',
    },
    {
      action: 'create',
      name: 'Criar pergunta de ajuda',
      description: 'Permite ao usuário criar novas perguntas de ajuda',
      resource: 'question-answer',
    },
    {
      action: 'update',
      name: 'Atualizar pergunta de ajuda',
      description: 'Permite ao usuário atualizar perguntas de ajuda',
      resource: 'question-answer',
    },
    {
      action: 'delete',
      name: 'Excluir pergunta de ajuda',
      description: 'Permite ao usuário excluir perguntas de ajuda',
      resource: 'question-answer',
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
