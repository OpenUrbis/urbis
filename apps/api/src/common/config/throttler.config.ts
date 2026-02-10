import { registerAs } from '@nestjs/config';

export default registerAs('throttler', () => ({
  short: {
    ttl: parseInt(process.env.THROTTLER_SHORT_TTL, 10) || 1000,
    limit: parseInt(process.env.THROTTLER_SHORT_LIMIT, 10) || 5,
  },
  medium: {
    ttl: parseInt(process.env.THROTTLER_MEDIUM_TTL, 10) || 60000,
    limit: parseInt(process.env.THROTTLER_MEDIUM_LIMIT, 10) || 60,
  },
  daily: {
    ttl: parseInt(process.env.THROTTLER_DAILY_TTL, 10) || 86400000,
    limit: parseInt(process.env.THROTTLER_DAILY_LIMIT, 10) || 1000,
  },
}));
