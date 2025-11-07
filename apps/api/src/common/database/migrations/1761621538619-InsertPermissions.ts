import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertPermissions1761621538619 implements MigrationInterface {
  permissions = [
    // Manager Roles
    {
      action: 'list',
      name: 'Listar grupos de permissões',
      description: 'Permite ao usuário listar grupos de permissões no sistema',
      resource: 'role',
    },
    {
      action: 'create',
      name: 'Criar grupos de permissões',
      description: 'Permite ao usuário criar grupos de permissões no sistema',
      resource: 'role',
    },
    {
      action: 'update',
      name: 'Atualizar grupos de permissões',
      description:
        'Permite ao usuário atualizar grupos de permissões no sistema',
      resource: 'role',
    },
    {
      action: 'assign',
      name: 'Inserir grupos de permissões para usuários',
      description:
        'Permite ao usuário adicionar grupos de permissões ao usuário',
      resource: 'role',
    },
    {
      action: 'unassign',
      name: 'Remover grupos de permissões do usuários',
      description: 'Permite ao usuário remover grupos de permissões do usuário',
      resource: 'role',
    },

    // Manager users
    {
      action: 'create',
      name: 'Criar usuários',
      description: 'Permite ao usuário criar novos usuários no sistema',
      resource: 'user',
    },
    {
      action: 'update',
      name: 'Editar usuários',
      description: 'Permite ao usuário editar usuários no sistema',
      resource: 'user',
    },
    {
      action: 'delete',
      name: 'Excluir usuários',
      description: 'Permite ao usuário excluir usuários no sistema',
      resource: 'user',
    },

    // Manager Auth
    {
      action: 'reset-2fa',
      name: 'Resetar autenticação de dois fatores dos usuários',
      description:
        'Permite ao usuário a realizar o reset da autenticação de dois fatores dos usuários no sistema',
      resource: 'auth',
    },
    {
      action: 'reset-password',
      name: 'Resetar senha dos usuários',
      description:
        'Permite ao usuário a realizar o reset da senha dos usuários no sistema',
      resource: 'auth',
    },

    // Manager Organization
    {
      action: 'create',
      name: 'Criar organizações no sistema',
      description: 'Permite ao usuário crie organizações no sistema',
      resource: 'organization',
    },
    {
      action: 'update',
      name: 'Atualizar organizações no sistema',
      description: 'Permite ao usuário atualize organizações no sistema',
      resource: 'organization',
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    let query = '';

    this.permissions.forEach(
      (permission) =>
        (query += `
  
          INSERT INTO permissions (id, action, name, description, resource) 
          VALUES ('${permission.resource}:${permission.action}', '${permission.action}', '${permission.name}', '${permission.description}', '${permission.resource}');  
          
      `),
    );

    await queryRunner.query(query);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    let query = `
    
      DELETE FROM public.role_permissions;

    `;

    this.permissions.forEach(
      (permission) =>
        (query += `
  
          DELETE FROM permissions
          WHERE id = '${permission.resource}:${permission.action}';
          
      `),
    );

    await queryRunner.query(query);
  }
}
