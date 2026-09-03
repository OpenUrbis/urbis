import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SendGridModule } from '@ntegral/nestjs-sendgrid';
import { EmailClient } from '@azure/communication-email';
import mailConfig from './../config/mail.config';
import { MailService } from './mail.service';

@Module({
  imports: [
    ConfigModule.forFeature(mailConfig),
    SendGridModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        apiKey: cfg.get('mail.sendGridApiKey') || '_none_',
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    MailService,
    {
      provide: 'AZURE_EMAIL_CLIENT',
      useFactory: (cfg: ConfigService) => {
        const connectionString = cfg.get<string>('mail.azureConnectionString');
        if (
          connectionString &&
          connectionString !== 'mock' &&
          connectionString !== ''
        ) {
          try {
            return new EmailClient(connectionString);
          } catch (err) {
            console.error(
              'Failed to initialize real Azure EmailClient, falling back to mock.',
              err,
            );
          }
        }

        // Return a mocked EmailClient for development/testing/mock mode
        return {
          beginSend: (message: any) => {
            console.log('\n--- [MOCK AZURE EMAIL CLIENT] ---');
            console.log(`To: ${JSON.stringify(message.recipients.to)}`);
            if (message.recipients.cc) {
              console.log(`CC: ${JSON.stringify(message.recipients.cc)}`);
            }
            console.log(`Subject: ${message.content.subject}`);
            console.log(`Sender: ${message.senderAddress}`);
            console.log('---------------------------------\n');
            return Promise.resolve({
              pollUntilDone: () => {
                return Promise.resolve({
                  status: 'Succeeded',
                  messageId: 'mock-message-id',
                });
              },
            });
          },
        } as unknown as EmailClient;
      },
      inject: [ConfigService],
    },
  ],
  exports: [MailService],
})
export class MailModule {}
