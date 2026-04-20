import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncPermissions1767807173873 implements MigrationInterface {
  name = 'SyncPermissions1767807173873';

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
    {
      action: 'generate-download-url',
      name: 'Gerar URL de download de arquivos',
      description:
        'Permite ao usuario gerar URLs assinadas de download de arquivos',
      resource: 'file',
    },
    {
      action: 'generate-upload-url',
      name: 'Gerar URL de upload de arquivos',
      description:
        'Permite ao usuario gerar URLs assinadas de upload de arquivos',
      resource: 'file',
    },
    {
      action: 'list',
      name: 'Listar organizacoes',
      description: 'Permite ao usuario listar organizacoes no sistema',
      resource: 'organization',
    },
    {
      action: 'view',
      name: 'Visualizar organizacoes',
      description: 'Permite ao usuario visualizar qualquer organizacao',
      resource: 'organization',
    },
    {
      action: 'list',
      name: 'Listar permissoes',
      description: 'Permite ao usuario listar todas as permissoes do sistema',
      resource: 'permission',
    },
    {
      action: 'list',
      name: 'Listar todos os usuarios',
      description: 'Permite ao usuario listar todos os usuarios',
      resource: 'user',
    },
    {
      action: 'view',
      name: 'Visualizar usuarios',
      description: 'Permite ao usuario visualizar os dados de qualquer usuario',
      resource: 'user',
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    let query = '';
    let query1 = '';

    this.permissions.forEach((permission) => {
      query += `

          INSERT INTO permissions (id, action, name, description, resource)
          VALUES ('${permission.resource}:${permission.action}', '${permission.action}', '${permission.name}', '${permission.description}', '${permission.resource}')
          ON CONFLICT (id) DO NOTHING;


      `;
      query1 += `
          INSERT INTO role_permissions ("roleId", "permissionId", "scope")
          values ('${permission.resource}:${permission.action}', 'global');

      `;
    });

    await queryRunner.query(query);
    await queryRunner.query(query1);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
}
