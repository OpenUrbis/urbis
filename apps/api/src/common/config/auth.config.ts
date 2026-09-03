import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  sessionsTable: process.env.AUTH_SESSION_TABLE,
  secret: process.env.AUTH_SECRET,
  apiKey: process.env.AUTH_API_KEY,
  expires: process.env.AUTH_JWT_TOKEN_EXPIRES_IN,

  twoFactorAppName: process.env.TWO_FACTORY_APP_NAME ?? 'AppName',
  twoFactorSecret: process.env.TWO_FACTORY_SECRET ?? '2FAsecret',

  externalOidc: {
    authority: process.env.EXTERNAL_OIDC_AUTHORITY,
    clientId: process.env.EXTERNAL_OIDC_CLIENT_ID,
    clientSecret: process.env.EXTERNAL_OIDC_CLIENT_SECRET,
  },
}));
