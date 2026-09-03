import { registerAs } from '@nestjs/config';

export default registerAs('throttler', () => ({
  enabled: process.env.THROTTLER_ENABLED === 'true',
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
  proxy: {
    anonymous: {
      short: {
        limit:
          parseInt(process.env.THROTTLER_PROXY_ANONYMOUS_SHORT_LIMIT, 10) ||
          parseInt(process.env.THROTTLER_SHORT_LIMIT, 10) ||
          5,
      },
      medium: {
        limit:
          parseInt(process.env.THROTTLER_PROXY_ANONYMOUS_MEDIUM_LIMIT, 10) ||
          parseInt(process.env.THROTTLER_MEDIUM_LIMIT, 10) ||
          60,
      },
      daily: {
        limit:
          parseInt(process.env.THROTTLER_PROXY_ANONYMOUS_DAILY_LIMIT, 10) ||
          parseInt(process.env.THROTTLER_DAILY_LIMIT, 10) ||
          500,
      },
    },
    authenticated: {
      short: {
        limit:
          parseInt(process.env.THROTTLER_PROXY_AUTHENTICATED_SHORT_LIMIT, 10) ||
          20,
      },
      medium: {
        limit:
          parseInt(
            process.env.THROTTLER_PROXY_AUTHENTICATED_MEDIUM_LIMIT,
            10,
          ) || 300,
      },
      daily: {
        limit:
          parseInt(process.env.THROTTLER_PROXY_AUTHENTICATED_DAILY_LIMIT, 10) ||
          1000,
      },
    },
  },
}));
