import { MigrationInterface, QueryRunner } from 'typeorm';
import { SYSTEM_ROLES } from '../../constants/system-roles.const';

export class InsertMapsPermissions1768575004243 implements MigrationInterface {
  permissions = [
    // Layer Schema Permissions
    {
      action: 'delete',
      name: 'Excluir Camadas do mapa',
      description: 'Permite ao usuário visualize Camadas do mapa',
      resource: 'layer-schema',
    },
    {
      action: 'create',
      name: 'Criar Camadas do mapa',
      description: 'Permite ao usuário crie Camadas do mapa',
      resource: 'layer-schema',
    },
    {
      action: 'update',
      name: 'Atualizar Camadas do mapa',
      description: 'Permite ao usuário atualize Camadas do mapa',
      resource: 'layer-schema',
    },

    // Layer Group Permissions
    {
      action: 'delete',
      name: 'Excluir Grupos de Camadas do mapa',
      description: 'Permite ao usuário visualize Grupos de Camadas do mapa',
      resource: 'layer-group',
    },
    {
      action: 'create',
      name: 'Criar Grupos de Camadas do mapa',
      description: 'Permite ao usuário crie Grupos de Camadas do mapa',
      resource: 'layer-group',
    },
    {
      action: 'update',
      name: 'Atualizar Grupos de Camadas do mapa',
      description: 'Permite ao usuário atualize Grupos de Camadas do mapa',
      resource: 'layer-group',
    },

    // Search config Permissions
    {
      action: 'delete',
      name: 'Excluir Configurações de pesquisas do mapa',
      description: 'Permite ao usuário visualize Grupos de Camadas do mapa',
      resource: 'search-config',
    },
    {
      action: 'create',
      name: 'Criar Configurações de pesquisas do mapa',
      description: 'Permite ao usuário crie Configurações de pesquisas do mapa',
      resource: 'search-config',
    },
    {
      action: 'update',
      name: 'Atualizar Configurações de pesquisas do mapa',
      description:
        'Permite ao usuário atualize Configurações de pesquisas do mapa',
      resource: 'search-config',
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    let insertPermissionsQuery = '';
    let insertRolePermissionsQuery = '';

    this.permissions.forEach((permission) => {
      insertPermissionsQuery += `
  
          INSERT INTO permissions (id, action, name, description, resource) 
          VALUES ('${permission.resource}:${permission.action}', '${permission.action}', '${permission.name}', '${permission.description}', '${permission.resource}');  
          
      `;

      insertRolePermissionsQuery += `

          INSERT INTO public.role_permissions ("roleId", "permissionId", "scope")
          VALUES ('${SYSTEM_ROLES.admin}', '${permission.resource}:${permission.action}', 'global');

      `;
    });

    await queryRunner.query(insertPermissionsQuery);
    await queryRunner.query(insertRolePermissionsQuery);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    let query = `
    
      DELETE FROM public.role_permissions
      WHERE "permissionId" IN (${this.permissions
        .map((permission) => `'${permission.resource}:${permission.action}'`)
        .join(', ')});

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
