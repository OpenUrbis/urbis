import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  provider: process.env.MAIL_PROVIDER || 'sendgrid',
  sendGridApiKey: process.env.MAIL_SENDGRID_API_KEY,
  azureConnectionString:
    process.env.AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING,
  templatesPath: process.env.MAIL_TEMPLATES_PATH,
  from: process.env.MAIL_FROM,
}));
