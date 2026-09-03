import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { SharedModule } from 'shared/shared.module';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [SharedModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      // eslint-disable-next-line @typescript-eslint/require-await
      useFactory: async (configService: ConfigService) => {
        const port = parseInt(
          configService.get('database.redis.port', '6379'),
          10,
        );
        const client = new Redis({
          host: configService.get('database.redis.host', 'localhost'),
          port: port,
          password: configService.get('database.redis.password'),
          db: parseInt(configService.get('database.redis.db', '0'), 10),
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          ...(port === 6380 ||
          port === 10000 ||
          process.env.REDIS_TLS === 'true'
            ? { tls: {} }
            : {}),
        });

        client.on('connect', () => console.info('✅ Redis conected!'));
        client.on('error', (err) =>
          console.error('❌ Error on connect Redis:', err),
        );

        return client;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [RedisService, 'REDIS_CLIENT'],
})
export class RedisModule {}
