import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  sendGridApiKey: process.env.MAIL_SENDGRID_API_KEY,
  templatesPath: process.env.MAIL_TEMPLATES_PATH,
  from: process.env.MAIL_FROM,
}));
