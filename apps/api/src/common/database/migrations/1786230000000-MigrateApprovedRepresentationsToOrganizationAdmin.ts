import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateApprovedRepresentationsToOrganizationAdmin1786230000000 implements MigrationInterface {
  name = 'MigrateApprovedRepresentationsToOrganizationAdmin1786230000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "user_role_assignments" ("id", "userId", "roleId", "organizationId", "assignAt")
      SELECT 
        gen_random_uuid(),
        r."requesterId",
        '8f3e5b12-9c24-4067-a00d-58bfa79d00c3',
        r."organizationId",
        NOW()
      FROM "representations" r
      WHERE r."status" = 'APPROVED'
        AND r."organizationId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 
          FROM "user_role_assignments" ura 
          WHERE ura."userId" = r."requesterId" 
            AND ura."organizationId" = r."organizationId" 
            AND ura."roleId" = '8f3e5b12-9c24-4067-a00d-58bfa79d00c3'
        );
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op to prevent accidentally revoking active admin accesses on rollback
  }
}
