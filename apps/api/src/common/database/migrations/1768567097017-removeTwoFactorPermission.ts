import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveTwoFactorPermission1768567097017 implements MigrationInterface {
  permissions = [
    {
      action: 'disable-2fa',
      name: 'Desativar autenticacao de dois fatores',
      description:
        'Permite ao usuario desativar a autenticacao de dois fatores da propria conta',
      resource: 'auth',
    },
    {
      action: 'resend-email-otp',
      name: 'Reenviar codigo OTP por email',
      description: 'Permite ao usuario reenviar o codigo OTP por email',
      resource: 'auth',
    },
    {
      action: 'setup-2fa',
      name: 'Configurar autentificacao de dois fatores',
      description:
        'Permite ao usuario configurar a autentificacao de dois fatores',
      resource: 'auth',
    },
    {
      action: 'verify-2fa',
      name: 'Verificar codigo de dois fatores',
      description: 'Permite ao usuario verificar o codigo de dois fatores',
      resource: 'auth',
    },
  ];
  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    let query = '';
    let query1 = '';

    const adminRoleId = 'f5fe5a01-b8e8-4f45-8701-45a6b24ba2d4';

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
}
