import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisAdapter } from '../../auth/oidc/adapters/redis.adapter';
import { ClientsService } from '../../auth/oidc/clients/clients.service';
import { accessTokenProvider } from '../../auth/oidc/providers/access-token.provider';
import { AccountProvider } from '../../auth/oidc/providers/account.provider';
import { logoutSource } from '../../auth/oidc/sources/logout.source';
import { jwks } from '../config/certs/jwks';
import { AuthService } from './../../auth/auth.service';

export const oidcProviderFactory = (
  configService: ConfigService,
  ClientsService: ClientsService,
  authService: AuthService,
  redisClient?: Redis,
) => {
  const TTL = () => {
    return 60 * 60 * 24;
  };

  const configuration: any = {
    clients: ClientsService.getClients(),
    clientBasedCORS: () => true,
    cookies: {
      keys: [
        configService.get('auth.secret') ||
          'urbis-oidc-secret-default-signing-key',
      ],
    },
    claims: {
      openid: ['sub'],
      email: ['email', 'email_verified'],
      profile: [
        'name',
        'given_name',
        'family_name',
        'nickname',
        'preferred_username',
        'profile',
        'picture',
        'website',
        'gender',
        'birthdate',
        'zoneinfo',
        'locale',
        'updated_at',
      ],
    },
    findAccount: (ctx, id) => AccountProvider.findAccount(ctx, id, authService),
    loadExistingGrant: AccountProvider.loadExistingGrant,
    jwks: configService.get('auth.jwks') || jwks,
    ttl: {
      AccessToken: TTL,
      AuthorizationCode: 60, // 1 minute
      ClientCredentials: 10 * 60, // 10 minutes
      DeviceCode: 10 * 60, // 10 minutes
      IdToken: TTL,
      RefreshToken: 30 * 24 * 60 * 60, // 30 days
      Interaction: 60 * 60, // 1 hour
      Session: 60 * 60 * 24 * 30, // 30 days
      Grant: 60 * 60 * 24 * 30, // 30 days
    },
    renderError: (ctx: any, out: any, error: any) => {
      console.error('OIDC renderError:', {
        error: error?.message || error,
        stack: error?.stack,
        out,
        url: ctx?.url,
        params: ctx?.oidc?.params,
      });

      // If error happened during end_session / end_session_confirm, complete logout gracefully
      if (
        ctx?.path?.includes('/session/end') ||
        ctx?.url?.includes('/session/end')
      ) {
        const clientUrl =
          configService.get('app.accountsUrl') ||
          configService.get('app.backendDomain') ||
          '';
        const postLogoutRedirectUri =
          ctx.oidc?.params?.post_logout_redirect_uri ||
          ctx.oidc?.session?.state?.postLogoutRedirectUri;

        if (postLogoutRedirectUri) {
          ctx.redirect(postLogoutRedirectUri);
          return;
        }

        const backendDomain = configService.get('app.backendDomain');
        if (backendDomain) {
          ctx.redirect(
            `${backendDomain.replace(/\/$/, '')}/auth/global-logout`,
          );
          return;
        }

        if (clientUrl) {
          ctx.redirect(`${clientUrl.replace(/\/$/, '')}/sign-in`);
          return;
        }
      }

      ctx.type = 'html';
      ctx.body = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Erro de Autenticação</title>
        <style>body{font-family:sans-serif;padding:24px;max-width:600px;margin:40px auto;}</style>
      </head>
      <body>
        <h2>Ops! Algo deu errado</h2>
        <p><strong>error:</strong> ${out.error || 'server_error'}</p>
        <p><strong>error_description:</strong> ${out.error_description || error?.message || 'Erro inesperado'}</p>
        ${error?.stack ? `<pre style="font-size:12px;overflow:auto;background:#f5f5f5;padding:12px;">${error.stack}</pre>` : ''}
      </body>
      </html>`;
    },
    features: {
      rpInitiatedLogout: {
        logoutSource: logoutSource,
        postLogoutSuccessSource: (ctx: any) => {
          const clientUrl =
            configService.get('app.accountsUrl') ||
            configService.get('app.backendDomain') ||
            '';
          const postLogoutRedirectUri =
            ctx.oidc?.params?.post_logout_redirect_uri ||
            ctx.oidc?.session?.state?.postLogoutRedirectUri;

          if (postLogoutRedirectUri) {
            ctx.redirect(postLogoutRedirectUri);
          } else {
            const backendDomain = configService.get('app.backendDomain');
            if (backendDomain) {
              ctx.redirect(
                `${backendDomain.replace(/\/$/, '')}/auth/global-logout`,
              );
            } else if (clientUrl) {
              ctx.redirect(`${clientUrl.replace(/\/$/, '')}/sign-in`);
            } else {
              ctx.type = 'html';
              ctx.body =
                '<html><body><h1>Logout realizado com sucesso</h1></body></html>';
            }
          }
        },
      },
    },
  };

  if (redisClient) {
    configuration.adapter = class extends RedisAdapter {
      constructor(name: string) {
        super(name, redisClient);
      }
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Provider = require('oidc-provider').Provider;

  const provider = new Provider(
    `${configService.get('app.backendDomain')}/auth/oidc`,
    configuration,
  );
  provider.proxy = true;

  provider.on('server_error', (ctx, error) => {
    console.error('OIDC server_error event:', {
      url: ctx?.url,
      method: ctx?.method,
      error: error?.message || error,
      stack: error?.stack,
    });
  });
  provider.on('authorization.error', (_ctx, error) => {
    console.error('OIDC authorization.error event:', error);
  });
  provider.on('grant.error', (_ctx, error) => {
    console.error('OIDC grant.error event:', error);
  });
  provider.on('end_session.error', (_ctx, error) => {
    console.error('OIDC end_session.error event:', error);
  });
  provider.on('end_session_confirm.error', (_ctx, error) => {
    console.error('OIDC end_session_confirm.error event:', error);
  });

  return accessTokenProvider(provider, authService);
};
