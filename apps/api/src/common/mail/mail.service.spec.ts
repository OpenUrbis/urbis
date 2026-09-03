import { MailService } from './mail.service';

describe('MailService representation analysis notifications', () => {
  let service: MailService;
  let sendGridService: { send: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(() => {
    sendGridService = { send: jest.fn().mockResolvedValue(undefined) };
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'mail.provider') return 'sendgrid';
        if (key === 'mail.from') return 'no-reply@urbis.test';
        return undefined;
      }),
    };
    service = new MailService(
      {} as any,
      sendGridService as any,
      configService as any,
    );
  });

  it.each(['Comentário', 'Aprovação', 'Rejeição'] as const)(
    'sends the %s notification with the representation link and automatic-email disclaimer',
    async (event) => {
      const url =
        'https://conta.urbis.prefeitura.sp.gov.br/representations/detail/representation-1';

      await service.representationAnalysis(
        'ana@example.test',
        'Ana',
        event,
        url,
      );

      expect(sendGridService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'ana@example.test',
          from: 'no-reply@urbis.test',
          fromname: undefined,
          subject: `Urbis - Representações - Análise - ${event}`,
          html: expect.stringContaining(`<p>Olá, Ana!</p>`),
        }),
      );
      const email = sendGridService.send.mock.calls[0][0];
      expect(email.html).toContain(`teve um ${event}.`);
      expect(email.html).toContain(`<a href="${url}">Representação</a>`);
      expect(email.html).toContain(url);
      expect(email.html).toContain(
        'Este é um e-mail automático. Não é necessário respondê-lo.',
      );
    },
  );

  it('does not leak recipient data into the representation link', async () => {
    const url =
      'https://conta.urbis.prefeitura.sp.gov.br/representations/detail/representation-42';

    await service.representationAnalysis(
      'ana@example.test',
      'Ana',
      'Aprovação',
      url,
    );

    const email = sendGridService.send.mock.calls[0][0];
    expect(email.html).not.toContain('ana@example.test');
    expect(email.html).toContain(url);
  });
});
