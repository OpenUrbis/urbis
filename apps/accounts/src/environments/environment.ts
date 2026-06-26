export const environment = {
  api: 'http://localhost:3000',

  appClientId: '0375600b-cd37-4b89-82e1-68fd374b83e8',

  externalOidcClientId: 'h-urbis.prefeitura.sp.gov.br',
  externalOidcSecureRoutes: ['https://sso.staging.acesso.gov.br'],
  externalOidcAuthority: 'https://sso.staging.acesso.gov.br',

  terms: [
    {
      id: 'termos-de-uso',
      label: 'Termos de Uso',
      url: 'http://localhost:3010/docs/termos-de-uso',
    },
    {
      id: 'politica-de-privacidade',
      label: 'Política de Privacidade',
      url: 'http://localhost:3010/docs/politica-de-privacidade',
    },
  ],

  googleRecaptchaSiteKey: '6LfwDx4sAAAAABrm5sINZvaY9Fq3pFttsX-wikjG',

  s3EndpointPublic: 'http://localhost:9000/public',
  docsEndpoint: 'http://localhost:3010',
};
