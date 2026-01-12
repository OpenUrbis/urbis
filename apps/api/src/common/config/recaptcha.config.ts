import { registerAs } from '@nestjs/config';

export default registerAs('reacaptcha', () => ({
  secretKey: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
}));
