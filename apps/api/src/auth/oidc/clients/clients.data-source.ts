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
        'https://accounts.mapa.urbis.prefeitura.sp.gov.br',
        'https://accounts.mapa.urbis.prefeitura.sp.gov.br/callback',
        'http://conta.urbis.prefeitura.sp.gov.br/callback',
        'https://conta.urbis.prefeitura.sp.gov.br/callback',
        'http://mapa.urbis.prefeitura.sp.gov.br/callback',
        'https://mapa.urbis.prefeitura.sp.gov.br',
        'http://mapa.urbis.prefeitura.sp.gov.br/callback',
        'https://mapa.urbis.prefeitura.sp.gov.br',
        'http://urbis.prefeitura.sp.gov.br/callback',
        'http://mapa.urbis.prefeitura.sp.gov.br/callback',
      ],
      response_types: ['code'],
      grant_types: ['refresh_token', 'authorization_code'],
      post_logout_redirect_uris: [
        'http://localhost:4200',
        'http://localhost:4200/callback',
        'https://accounts.mapa.urbis.prefeitura.sp.gov.br',
        'https://accounts.mapa.urbis.prefeitura.sp.gov.br/callback',
        'https://conta.urbis.prefeitura.sp.gov.br',
        'https://conta.urbis.prefeitura.sp.gov.br/callback',
        'http://mapa.urbis.prefeitura.sp.gov.br/callback',
        'https://mapa.urbis.prefeitura.sp.gov.br',
        'http://mapa.urbis.prefeitura.sp.gov.br/callback',
        'https://mapa.urbis.prefeitura.sp.gov.br',
        'http://urbis.prefeitura.sp.gov.br/callback',
        'http://mapa.urbis.prefeitura.sp.gov.br/callback',
      ],
      token_endpoint_auth_method: 'none',
    },
    {
      application_type: 'web',
      client_id: '94a86322-269e-44df-803a-534c0382215d',
      client_secret: secret,
      redirect_uris: [
        'http://localhost:5173',
        'http://localhost:5173/callback',
        'https://app.atlascli.io',
        'https://app.atlascli.io/callback',
        'https://mapa.urbis.prefeitura.sp.gov.br',
        'https://mapa.urbis.prefeitura.sp.gov.br/callback',
        'http://mapa.urbis.prefeitura.sp.gov.br/callback',
        'https://mapa.urbis.prefeitura.sp.gov.br',
        'http://mapa.urbis.prefeitura.sp.gov.br/callback',
        'https://mapa.urbis.prefeitura.sp.gov.br',
      ],
      response_types: ['code'],
      grant_types: ['refresh_token', 'authorization_code'],
      post_logout_redirect_uris: [
        'http://localhost:5173',
        'http://localhost:5173/callback',
        'https://app.atlascli.io',
        'https://app.atlascli.io/callback',
        'https://mapa.urbis.prefeitura.sp.gov.br',
        'https://mapa.urbis.prefeitura.sp.gov.br/callback',
        'http://mapa.urbis.prefeitura.sp.gov.br/callback',
        'https://mapa.urbis.prefeitura.sp.gov.br',
        'http://mapa.urbis.prefeitura.sp.gov.br/callback',
        'https://mapa.urbis.prefeitura.sp.gov.br',
      ],
      token_endpoint_auth_method: 'none',
    },
  ];
};
