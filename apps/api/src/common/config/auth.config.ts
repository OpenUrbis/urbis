import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  sessionsTable: process.env.AUTH_SESSION_TABLE,
  secret: process.env.AUTH_SECRET,
  expires: process.env.AUTH_JWT_TOKEN_EXPIRES_IN,
}));
