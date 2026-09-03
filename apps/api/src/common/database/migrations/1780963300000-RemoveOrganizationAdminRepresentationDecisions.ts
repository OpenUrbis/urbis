import { SYSTEM_ROLES } from '../../constants/system-roles.const';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveOrganizationAdminRepresentationDecisions1780963300000 implements MigrationInterface {
  name = 'RemoveOrganizationAdminRepresentationDecisions1780963300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM role_permissions
      WHERE "roleId" = '${SYSTEM_ROLES.organizationAdmin}'
        AND "permissionId" IN ('representation:approve', 'representation:reject');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO role_permissions ("roleId", "permissionId", "scope")
      SELECT '${SYSTEM_ROLES.organizationAdmin}', permission_id, 'any'
      FROM unnest(ARRAY['representation:approve', 'representation:reject']) AS permission_id
      WHERE NOT EXISTS (
        SELECT 1
        FROM role_permissions
        WHERE "roleId" = '${SYSTEM_ROLES.organizationAdmin}'
          AND "permissionId" = permission_id
      );
    `);
  }
}
