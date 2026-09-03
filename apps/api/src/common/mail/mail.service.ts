import { Injectable, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectSendGrid, SendGridService } from '@ntegral/nestjs-sendgrid';
import { EmailClient } from '@azure/communication-email';
import { readFileSync } from 'fs';
import Handlebars from 'handlebars';
import { I18n, I18nService } from 'nestjs-i18n';
import { join } from 'path';
import { MailData } from './interfaces/mail-data.interface';

@Injectable()
export class MailService {
  constructor(
    @I18n() private i18n: I18nService,
    @InjectSendGrid() private readonly sendGridService: SendGridService,
    private configService: ConfigService,
    @Inject('AZURE_EMAIL_CLIENT')
    @Optional()
    private readonly azureEmailClient?: EmailClient,
  ) {}

  /**
   * Helper method to send emails via either SendGrid or Azure Communication Services.
   */
  private async sendMail(params: {
    to: string | string[];
    cc?: string | string[];
    from?: string;
    fromname?: string;
    subject: string;
    html: string;
    replyTo?: string | string[];
  }): Promise<void> {
    const provider =
      this.configService.get<string>('mail.provider') || 'sendgrid';

    if (provider === 'azure') {
      if (!this.azureEmailClient) {
        throw new Error(
          'Azure Email Client is not initialized. Please check your AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING.',
        );
      }

      const senderAddress = params.from || this.configService.get('mail.from');

      const toAddresses = Array.isArray(params.to)
        ? params.to.map((address) => ({ address }))
        : [{ address: params.to }];

      const ccAddresses = params.cc
        ? Array.isArray(params.cc)
          ? params.cc.map((address) => ({ address }))
          : [{ address: params.cc }]
        : undefined;

      const emailMessage = {
        senderAddress: senderAddress,
        content: {
          subject: params.subject,
          html: params.html,
        },
        recipients: {
          to: toAddresses,
          cc: ccAddresses,
        },
        replyTo: params.replyTo
          ? Array.isArray(params.replyTo)
            ? params.replyTo.map((address) => ({ address }))
            : [{ address: params.replyTo }]
          : undefined,
      };

      const poller = await this.azureEmailClient.beginSend(emailMessage);
      await poller.pollUntilDone();
    } else {
      // Fallback to SendGrid
      await this.sendGridService.send({
        to: params.to,
        cc: params.cc,
        from: params.from,
        fromname: params.fromname,
        subject: params.subject,
        html: params.html,
        replyTo: params.replyTo,
      } as any);
    }
  }

  /**
   * Builds the email template using Handlebars.
   * @param template - The template type ('reset-password' or 'confirm-account').
   * @param data - The data to populate the template.
   * @returns The compiled email template.
   */
  private buildTemplate(
    template: 'reset-password' | 'confirm-account' | 'invite',
    data,
  ): string {
    try {
      const filePath = join(
        './',
        this.configService.get('mail.templatesPath'),
        `${template}.hbs`,
      );
      const templateContent = readFileSync(filePath, 'utf8');
      return Handlebars.compile(templateContent)(data);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Sends a user sign-up email.
   * @param mailData - The email data.
   * @param language - The language for the email content (default: 'en').
   * @returns A Promise that resolves when the email is sent.
   */
  async userSignUp(
    mailData: MailData<{
      firstName: string;
      hash: string;
    }>,
    language = 'en',
  ): Promise<void> {
    try {
      // Create subject title in the correct language
      const subject = 'Confirmar e-mail - Urbis';

      // Create email content
      const html = this.buildTemplate('confirm-account', {
        ...mailData.data,
        accountsUrl: this.configService.get('app.accountsUrl'),
        i18n: (key, options) =>
          this.i18n.translate(key, { lang: language, ...options }),
      });

      const emailParams = {
        to: mailData.to,
        from: this.configService.get('mail.from'),
        fromname: 'Urbis',
        subject,
        html,
      };

      await this.sendMail(emailParams);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Sends a forgot password email.
   * @param mailData - The email data.
   * @param language - The language for the email content (default: 'en').
   * @returns A Promise that resolves when the email is sent.
   */
  async forgotPassword(
    mailData: MailData<{
      firstName: string;
      hash: string;
    }>,
    language = 'en',
  ): Promise<void> {
    try {
      // Create subject title in the correct language
      const subject = 'Redefinir senha - Urbis';

      // Create email content
      const html = this.buildTemplate('reset-password', {
        ...mailData.data,
        accountsUrl: this.configService.get('app.accountsUrl'),
        i18n: (key, options) =>
          this.i18n.translate(key, { lang: language, ...options }),
      });

      const emailParams = {
        to: mailData.to,
        from: this.configService.get('mail.from'),
        subject,
        fromname: 'Urbis',
        html,
      };
      await this.sendMail(emailParams);
    } catch (err) {
      console.error(err);
    }
  }

  async invite(
    mailData: MailData<{
      organizationId?: string;
      organizationName: string;
      organizationPlanTitle: string;
      roleName: string;
      inviteText: string;
    }>,
    language = 'en',
  ): Promise<void> {
    try {
      // Create subject title in the correct language
      const subject = `${this.i18n.translate('common.invite', {
        lang: language,
      })} - Urbis`;

      // Create email content
      const html = this.buildTemplate('invite', {
        ...mailData.data,
        accountsUrl: this.configService.get('app.accountsUrl'),
        i18n: (key, options) =>
          this.i18n.translate(key, { lang: language, ...options }),
      });

      const emailParams = {
        to: mailData.to,
        from: this.configService.get('mail.from'),
        fromname: 'Urbis',
        subject,
        html,
      };
      await this.sendMail(emailParams);
    } catch (err) {
      console.error(err);
    }
  }

  async supportEmail(mailData: {
    email: string;
    subject: string;
    description: string;
  }): Promise<void> {
    try {
      const html = Object.values(mailData).join('<br>');
      const emailParams = {
        to: mailData.email,
        cc: 'codataurbis@prefeitura.sp.gov.br',
        from: 'suporte@urbis.prefeitura.sp.gov.br',
        fromname: 'Suporte Urbis',
        replyTo: 'codataurbis@prefeitura.sp.gov.br',
        subject: mailData.subject,
        html,
      };
      await this.sendMail(emailParams);
    } catch (err) {
      console.error(err);
    }
  }

  async sendScheduledNotification(
    mailData: { message; to; subject },
    language = 'en',
  ): Promise<void> {
    try {
      // Título do assunto em múltiplos idiomas
      const alternataiveSubject = `${this.i18n.translate(
        'common.scheduledNotification',
        {
          lang: language,
        },
      )} - Urbis`;

      const subject: string = mailData.subject ?? alternataiveSubject;

      // Criar o conteúdo do e-mail
      const html = mailData.message;

      const emailParams = {
        to: mailData.to,
        from: this.configService.get('mail.from'),
        subject,
        fromname: 'Urbis',
        html,
      };

      await this.sendMail(emailParams);
    } catch (err) {
      console.error(err);
    }
  }

  async sendOtpCode(code: string, to: string) {
    await this.sendMail({
      to,
      from: this.configService.get('mail.from'),
      subject: 'Código de verificação de dois fatores',
      html: `Seu código de verificação é: ${code}`,
    });
  }

  async accountApproved(email: string, name: string): Promise<void> {
    try {
      const subject = `Sua conta foi aprovada - Urbis`;
      const html = `<p>Olá ${name},</p><p>Sua conta foi aprovada! Agora você pode acessar o sistema Urbis.</p><br><p>Atenciosamente,<br>Equipe Urbis</p>`;
      const emailParams = {
        to: email,
        from: this.configService.get('mail.from'),
        subject,
        html,
      };

      await this.sendMail(emailParams);
    } catch (err) {
      console.error('Error sending approval email:', err);
    }
  }

  async representationAnalysis(
    email: string,
    name: string,
    event: 'Comentário' | 'Aprovação' | 'Rejeição',
    url: string,
  ): Promise<void> {
    const subject = `Urbis - Representações - Análise - ${event}`;
    const html = `
      <p><strong>Urbis</strong></p>
      <p>Olá, ${name}!</p>
      <p>O cadastro de Representação solicitado teve um ${event}.</p>
      <p><a href="${url}">Representação</a></p>
      <p>Caso o botão não funcione, copie e cole o link abaixo no seu navegador:</p>
      <p>${url}</p>
      <br>
      <p>Atenciosamente,<br>Equipe Urbis</p>
      <br>
      <p>Este é um e-mail automático. Não é necessário respondê-lo.</p>
    `;
    try {
      await this.sendMail({
        to: email,
        from: this.configService.get('mail.from'),
        subject,
        html,
      });
    } catch (error) {
      console.error('Error sending representation analysis email:', error);
    }
  }

  async sendSupportTicket(ticket: {
    id: string;
    name: string;
    email: string;
    message: string;
    type: string;
    files?: string[];
  }): Promise<void> {
    try {
      let subjectPrefix = 'Reporte de problemas no';
      switch (ticket.type) {
        case 'inquiry':
          subjectPrefix = 'Dúvida sobre';
          break;
        case 'suggestion':
          subjectPrefix = 'Sugestão ao';
          break;
        case 'bug-report':
          subjectPrefix = 'Reporte de problemas no';
          break;
      }
      const subject = `[${ticket.id}] ${subjectPrefix} sistema Urbis`;

      const fileList =
        ticket.files && ticket.files.length > 0
          ? ticket.files.map((file) => file).join('\n')
          : 'Nenhum arquivo anexado.';

      const html = `
        <p><strong>Nome:</strong> ${ticket.name}</p>
        <p><strong>Email:</strong> ${ticket.email}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${ticket.message.replace(/\n/g, '<br>')}</p>
        <p><strong>Arquivos:</strong></p>
        <pre>${fileList}</pre>
      `;

      const emailParams = {
        to: ticket.email,
        cc: 'codataurbis@prefeitura.sp.gov.br',
        from: 'suporte@urbis.prefeitura.sp.gov.br',
        fromname: 'Suporte Urbis',
        replyTo: 'codataurbis@prefeitura.sp.gov.br',
        subject,
        html,
      };

      await this.sendMail(emailParams);
    } catch (err) {
      console.error('Error sending support ticket email:', err);
    }
  }
}
