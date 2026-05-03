import { ConfigService } from '@nestjs/config';
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
) => {
  const TTL = () => {
    return 60 * 60 * 24;
  };
  const configuration = {
    clients: ClientsService.getClients(),
    clientBasedCORS: () => true,
    claims: {
      openid: ['sub'],
      email: ['email', 'email_verified'],
      profile: ['name', 'given_name', 'family_name', 'nickname', 'preferred_username', 'profile', 'picture', 'website', 'gender', 'birthdate', 'zoneinfo', 'locale', 'updated_at'],
    },
    findAccount: (ctx, id) => AccountProvider.findAccount(ctx, id, authService),
    loadExistingGrant: AccountProvider.loadExistingGrant,
    jwks: jwks,
    ttl: {
      AccessToken: TTL,
      AuthorizationCode: 60, // 1 minute
      ClientCredentials: 10 * 60, // 10 minutes
      DeviceCode: 10 * 60, // 10 minutes
      IdToken: TTL,
      RefreshToken: 30 * 24 * 60 * 60, // 30 days
    },
    features: {
      rpInitiatedLogout: {
        logoutSource,
        postLogoutSuccessSource: () => { },
      },
    },
  };
  // run in memory for localhost
  /*   if (configService.get('auth.sessionsTable') === undefined) {
    configuration.adapter = undefined;
  } */

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Provider = require('oidc-provider').Provider;

  const provider = new Provider(
    `${configService.get('app.backendDomain')}/auth/oidc`,
    configuration,
  );
  provider.proxy = true;
  return accessTokenProvider(provider, authService);
};
