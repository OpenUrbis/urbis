import { ConfigService } from '@nestjs/config';
import { ClientMetadata } from 'oidc-provider';

export const buildClientsDataSource = (
  configService: ConfigService,
): ClientMetadata[] => {
  const secret = configService.get('auth.secret');
  return [
    {
      application_type: 'web',
      client_id: '0375600b-cd37-4b89-82e1-68fd374b83e8',
      client_secret: secret,
      redirect_uris: [
        'http://localhost:4200',
        'http://localhost:4200/callback',
      ],
      response_types: ['code'],
      grant_types: ['refresh_token', 'authorization_code'],
      post_logout_redirect_uris: [
        'http://localhost:4200',
        'http://localhost:4200/callback',
      ],
      token_endpoint_auth_method: 'none',
    },
  ];
};
