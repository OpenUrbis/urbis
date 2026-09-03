import { SYSTEM_ROLES } from '../../constants/system-roles.const';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AssignRepresentationPermissions1775151497806 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Permissões de representação para o papel de Usuário (escopo 'own' - apenas as dele)
    const userPermissions = [
      'representation:list',
      'representation:view',
      'representation:comment',
    ];

    for (const permissionId of userPermissions) {
      await queryRunner.query(`
        INSERT INTO role_permissions ("roleId", "permissionId", "scope")
        SELECT '${SYSTEM_ROLES.user}', '${permissionId}', 'own'
        WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions 
          WHERE "roleId" = '${SYSTEM_ROLES.user}' 
          AND "permissionId" = '${permissionId}'
        );
      `);
    }

    // 2. Permissões de representação para o papel de Administrador de Organização (escopo 'any' - locais)
    const adminPermissions = [
      'representation:list',
      'representation:view',
      'representation:approve',
      'representation:reject',
      'representation:comment',
    ];

    for (const permissionId of adminPermissions) {
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
    // 1. Remove as permissões de Usuário
    await queryRunner.query(`
      DELETE FROM role_permissions 
      WHERE "roleId" = '${SYSTEM_ROLES.user}' 
        AND "permissionId" IN ('representation:list', 'representation:view', 'representation:comment');
    `);

    // 2. Remove as permissões de Administrador de Organização
    await queryRunner.query(`
      DELETE FROM role_permissions 
      WHERE "roleId" = '${SYSTEM_ROLES.organizationAdmin}' 
        AND "permissionId" IN ('representation:list', 'representation:view', 'representation:approve', 'representation:reject', 'representation:comment');
    `);
  }
}
