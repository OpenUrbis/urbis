import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  apiKey: process.env.AUTH_API_KEY,
}));
