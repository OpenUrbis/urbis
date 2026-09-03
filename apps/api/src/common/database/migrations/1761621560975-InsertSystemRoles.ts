import { MigrationInterface, QueryRunner } from 'typeorm';
import { SYSTEM_ROLES } from '../../constants/system-roles.const';

export class InsertSystemRoles1761621560975 implements MigrationInterface {
  roles = [
    {
      id: SYSTEM_ROLES.admin,
      name: 'Administrador',
      description:
        'Permite ao usuário gerenciar grupos de permissões, usuários, e organizações',
      permissions: [
        'role:list',
        'role:create',
        'role:update',
        'role:assign',
        'role:unassign',
        'user:create',
        'user:update',
        'user:delete',
        'auth:reset-2fa',
        'auth:reset-password',
        'organization:create',
        'organization:update',
      ],
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    let query = '';

    this.roles.forEach((role) => {
      query += `
  
              INSERT INTO roles (id, name, description, type) 
              VALUES ('${role.id}', '${role.name}', '${role.description}', 'system');  
  
          `;

      role.permissions.forEach((permission) => {
        query += `
  
        INSERT INTO public.role_permissions ("roleId", "permissionId", "scope")
        VALUES ('${role.id}', '${permission}', 'global');  
  
    `;
      });
    });

    await queryRunner.query(query);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    let query = '';

    this.roles.forEach(
      (role) =>
        (query += `
    
            DELETE FROM public.role_permissions
            WHERE "roleId" = '${role.id}';
    
            DELETE FROM roles
            WHERE id = '${role.id}';
            
        `),
    );

    await queryRunner.query(query);
  }
}
