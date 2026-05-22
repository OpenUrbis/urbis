export const environment = {
  api: 'https://api.atlascli.io',

  appClientId: '0375600b-cd37-4b89-82e1-68fd374b83e8',

  externalOidcClientId: '0375600b-cd37-4b89-82e1-68fd374b83e8',
  externalOidcSecureRoutes: ['https://api.atlascli.io'],
  externalOidcAuthority: 'https://api.atlascli.io',

  terms: [
    {
      id: 'termos-de-uso',
      label: 'Termos de Uso',
      url: 'https://docs.atlascli.io/docs/termos-de-uso',
    },
    {
      id: 'politica-de-privacidade',
      label: 'Política de Privacidade',
      url: 'https://docs.atlascli.io/docs/politica-de-privacidade',
    },
  ],

  googleRecaptchaSiteKey: '6LfwDx4sAAAAABrm5sINZvaY9Fq3pFttsX-wikjG',

  s3EndpointPublic: 'https://files.atlascli.io',
  docsEndpoint: 'https://docs.atlascli.io',
};
