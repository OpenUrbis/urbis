import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertPermissions1761621538619 implements MigrationInterface {
  permissions = [
    // Manager Roles
    {
      permission: 'role:create',
      name: 'Criar grupos de permissões',
      description: 'Permite ao usuário criar grupos de permissões no sistema',
    },
    {
      permission: 'role:update',
      name: 'Atualizar grupos de permissões',
      description:
        'Permite ao usuário atualizar grupos de permissões no sistema',
    },
    {
      permission: 'role:assign',
      name: 'Inserir grupos de permissões para usuários',
      description:
        'Permite ao usuário adicionar grupos de permissões ao usuário',
    },
    {
      permission: 'role:unassign',
      name: 'Remover grupos de permissões do usuários',
      description: 'Permite ao usuário remover grupos de permissões do usuário',
    },

    // Manager users
    {
      permission: 'user:create',
      name: 'Criar usuários',
      description: 'Permite ao usuário criar novos usuários no sistema',
    },
    {
      permission: 'user:update',
      name: 'Editar usuários',
      description: 'Permite ao usuário editar usuários no sistema',
    },
    {
      permission: 'user:delete',
      name: 'Excluir usuários',
      description: 'Permite ao usuário excluir usuários no sistema',
    },

    // Manager Auth
    {
      permission: 'auth:reset-2fa',
      name: 'Resetar autenticação de dois fatores dos usuários',
      description:
        'Permite ao usuário a realizar o reset da autenticação de dois fatores dos usuários no sistema',
    },
    {
      permission: 'auth:reset-password',
      name: 'Resetar senha dos usuários',
      description:
        'Permite ao usuário a realizar o reset da senha dos usuários no sistema',
    },

    // Manager Organization
    {
      permission: 'organization:create',
      name: 'Criar organizações no sistema',
      description: 'Permite ao usuário crie organizações no sistema',
    },
    {
      permission: 'organization:update',
      name: 'Atualizar organizações no sistema',
      description: 'Permite ao usuário atualize organizações no sistema',
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    let query = '';

    this.permissions.forEach(
      (permission) =>
        (query += `
  
          INSERT INTO permissions (permission, name, description) 
          VALUES ('${permission.permission}', '${permission.name}', '${permission.description}');  
          
      `),
    );

    await queryRunner.query(query);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    let query = '';

    this.permissions.forEach(
      (permission) =>
        (query += `
  
          DELETE FROM permissions
          WHERE permission = '${permission.permission}';
          
      `),
    );

    await queryRunner.query(query);
  }
}
