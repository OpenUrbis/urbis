import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectSendGrid, SendGridService } from '@ntegral/nestjs-sendgrid';
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
  ) {}

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
      const subject = `${this.i18n.translate('common.confirmEmail', {
        lang: language,
      })}`;

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
        fromname: 'Monorepo',
        subject,
        html,
      };

      await this.sendGridService.send(emailParams);
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
      const subject = `${this.i18n.translate('common.resetPassword', {
        lang: language,
      })} - Monorepo`;

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
        fromname: 'Monorepo',
        html,
      };
      await this.sendGridService.send(emailParams);
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
      })} - Monorepo`;

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
        fromname: 'Monorepo',
        subject,
        html,
      };
      await this.sendGridService.send(emailParams);
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
        to: this.configService.get('mail.from'),
        from: this.configService.get('mail.from'),
        subject: mailData.subject,
        html,
      };
      await this.sendGridService.send(emailParams);
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
      )} - Monorepo`;

      const subject: string = mailData.subject ?? alternataiveSubject;

      // Criar o conteúdo do e-mail
      const html = mailData.message;

      const emailParams = {
        to: mailData.to,
        from: this.configService.get('mail.from'),
        subject,
        fromname: 'Monorepo',
        html,
      };

      // Enviar o e-mail usando o SendGrid
      await this.sendGridService.send(emailParams);
    } catch (err) {
      console.error(err);
    }
  }

  async sendOtpCode(code: string, to: string) {
    await this.sendGridService.send({
      to,
      from: this.configService.get('mail.from'),
      subject: 'Código de verificação de dois fatores',
      html: `Seu código de verificação é: ${code}`,
    });
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
        to: 'contas@urbis.prefeitura.sp.gov.br',
        cc: ticket.email,
        from: this.configService.get('mail.from'),
        subject,
        html,
      };

      await this.sendGridService.send(emailParams);
    } catch (err) {
      console.error('Error sending support ticket email:', err);
    }
  }
}
