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
    const filePath = join(
      './',
      this.configService.get('mail.templatesPath'),
      `${template}.hbs`,
    );
    const templateContent = readFileSync(filePath, 'utf8');
    return Handlebars.compile(templateContent)(data);
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
    // Create subject title in the correct language
    const subject = `${this.i18n.translate('common.confirmEmail', {
      lang: language,
    })} - Slingui`;

    // Create email content
    const html = this.buildTemplate('confirm-account', {
      ...mailData.data,
      frontendDomain: this.configService.get('app.frontendDomain'),
      i18n: (key, options) =>
        this.i18n.translate(key, { lang: language, ...options }),
    });

    const emailParams = {
      to: mailData.to,
      from: this.configService.get('mail.from'),
      fromname: 'Slingui',
      subject,
      html,
    };

    await this.sendGridService.send(emailParams);
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
    // Create subject title in the correct language
    const subject = `${await this.i18n.translate('common.resetPassword', {
      lang: language,
    })} - Slingui`;

    // Create email content
    const html = this.buildTemplate('reset-password', {
      ...mailData.data,
      frontendDomain: this.configService.get('app.frontendDomain'),
      i18n: (key, options) =>
        this.i18n.translate(key, { lang: language, ...options }),
    });

    const emailParams = {
      to: mailData.to,
      from: this.configService.get('mail.from'),
      subject,
      fromname: 'Slingui',
      html,
    };
    await this.sendGridService.send(emailParams);
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
    // Create subject title in the correct language
    const subject = `${await this.i18n.translate('common.invite', {
      lang: language,
    })} - Slingui`;

    // Create email content
    const html = this.buildTemplate('invite', {
      ...mailData.data,
      frontendDomain: this.configService.get('app.frontendDomain'),
      i18n: (key, options) =>
        this.i18n.translate(key, { lang: language, ...options }),
    });

    const emailParams = {
      to: mailData.to,
      from: this.configService.get('mail.from'),
      fromname: 'Slingui',
      subject,
      html,
    };
    await this.sendGridService.send(emailParams);
  }

  async supportEmail(mailData: {
    email: string;
    subject: string;
    description: string;
  }): Promise<void> {
    const html = Object.values(mailData).join('<br>');
    const emailParams = {
      to: this.configService.get('mail.from'),
      from: this.configService.get('mail.from'),
      subject: mailData.subject,
      html,
    };
    await this.sendGridService.send(emailParams);
  }

  async sendScheduledNotification(
    mailData: { message; to; subject },
    language = 'en',
  ): Promise<void> {
    // Título do assunto em múltiplos idiomas
    const alternataiveSubject = `${await this.i18n.translate(
      'common.scheduledNotification',
      {
        lang: language,
      },
    )} - Slingui`;

    const subject: string = mailData.subject ?? alternataiveSubject;

    // Criar o conteúdo do e-mail
    const html = mailData.message;

    const emailParams = {
      to: mailData.to,
      from: this.configService.get('mail.from'),
      subject,
      fromname: 'Slingui',
      html,
    };

    // Enviar o e-mail usando o SendGrid
    await this.sendGridService.send(emailParams);
  }

  async sendOtpCode(code: string, to: string) {
    await this.sendGridService.send({
      to,
      from: this.configService.get('mail.from'),
      subject: 'Código de verificação de dois fatores',
      html: `Seu código de verificação é: ${code}`,
    });
  }
}
