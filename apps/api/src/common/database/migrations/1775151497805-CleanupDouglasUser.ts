import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanupDouglasUser1775151497805 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const userId = '00000000-0000-0000-0000-000000000001';
    const email = 'cleanup-user@example.test';
    const orgId = '00000000-0000-0000-0000-000000000002';
    const cpf = '00000000000';

    // 1. Remove qualquer solicitação de representação vinculada ao usuário ou organização
    await queryRunner.query(`
      DELETE FROM representations WHERE "organizationId" = '${orgId}' OR "requesterId" = '${userId}';
    `);

    // 2. Remove todas as atribuições de cargo do usuário
    await queryRunner.query(`
      DELETE FROM user_role_assignments WHERE "userId" = '${userId}';
    `);

    // 3. Remove todas as atribuições de cargo vinculadas à organização pessoal
    await queryRunner.query(`
      DELETE FROM user_role_assignments WHERE "organizationId" = '${orgId}';
    `);

    // 4. Remove a organização pessoal
    await queryRunner.query(`
      DELETE FROM organizations 
      WHERE "id" = '${orgId}' 
         OR ("name" = 'DOUGLAS' AND "document" = '${cpf}');
    `);

    // 5. Remove o usuário por ID ou por Email
    await queryRunner.query(`
      DELETE FROM users 
      WHERE "id" = '${userId}' 
         OR "email" = '${email}';
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Não é necessário restaurar um registro que foi limpo para reteste
  }
}
