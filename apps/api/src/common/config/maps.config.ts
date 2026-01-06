import { registerAs } from '@nestjs/config';

export default registerAs('maps', () => ({
  maxarApiKey: process.env.MAXAR_API_KEY,
}));
