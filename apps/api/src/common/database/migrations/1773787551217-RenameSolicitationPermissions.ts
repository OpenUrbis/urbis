import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameSolicitationPermissions1773787551217 implements MigrationInterface {
  name = 'RenameSolicitationPermissions1773787551217';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Temporarily dropping foreign key from role_permissions to allow updating permissions.id
    // Assuming there is a standard constraint. We can do an UPDATE with CASCADE if the FK was created with ON UPDATE CASCADE
    // However, if we don't know the exact FK name, we can just insert the new permissions, update role_permissions to point to the new ones, and delete the old ones.

    await queryRunner.query(`
            -- Insert the new representation permissions based on existing solicitation permissions
            INSERT INTO permissions (id, action, name, description, resource)
            SELECT 
                replace(id, 'solicitation:', 'representation:'),
                action,
                replace(name, 'solicitação', 'representação'),
                replace(replace(description, 'solicitação', 'representação'), 'solicitações', 'representações'),
                'representation'
            FROM permissions
            WHERE resource = 'solicitation';
        `);

    await queryRunner.query(`
            -- Update existing role assignments to point to the new permissions
            UPDATE role_permissions
            SET "permissionId" = replace("permissionId", 'solicitation:', 'representation:')
            WHERE "permissionId" LIKE 'solicitation:%';
        `);

    await queryRunner.query(`
            -- Delete the old solicitation permissions
            DELETE FROM permissions WHERE resource = 'solicitation';
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            -- Revert back to solicitation
            INSERT INTO permissions (id, action, name, description, resource)
            SELECT 
                replace(id, 'representation:', 'solicitation:'),
                action,
                replace(name, 'representação', 'solicitação'),
                replace(replace(description, 'representação', 'solicitação'), 'representações', 'solicitações'),
                'solicitation'
            FROM permissions
            WHERE resource = 'representation';
        `);

    await queryRunner.query(`
            -- Revert existing role assignments to point to the old permissions
            UPDATE role_permissions
            SET "permissionId" = replace("permissionId", 'representation:', 'solicitation:')
            WHERE "permissionId" LIKE 'representation:%';
        `);

    await queryRunner.query(`
            -- Delete the new representation permissions
            DELETE FROM permissions WHERE resource = 'representation';
        `);
  }
}
