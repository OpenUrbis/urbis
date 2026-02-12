import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { AuthModuleEntities } from 'auth/index.entity';
import { OidcModule } from 'auth/oidc/oidc.module';
import { OrganizationModule } from 'organization/organization.module';
import { SupportTicket } from 'support/entities/support-ticket.entity';
import { AppSettingsModule } from './app-settings/app-settings.module';
import { AppSettingsModuleEntities } from './app-settings/index.entity';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './common/redis/redis.module';
import { FilesModule } from './files/files.module';
import { MapsModuleEntities } from './maps/index.entity';
import { MapsModule } from './maps/maps.module';
import { OrganizationModuleEntities } from './organization/index.entity';
import { RoleModuleEntities } from './role/index.entity';
import { RoleModule } from './role/role.module';
import { DatabaseModule } from './shared/database.module';
import { SharedModule } from './shared/shared.module';
import { SupportModule } from './support/support.module';
import { UserModuleEntities, UserModuleSubscribers } from './user/index.entity';
import { UserModule } from './user/user.module';
import { WhitelabelModuleEntities } from './whitelabel/index.entity';
import { WhitelabelModule } from './whitelabel/whitelabel.module';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-behind-proxy.guard';

@Module({
  imports: [
    SharedModule,
    OidcModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: config.get('throttler.short.ttl'),
            limit: config.get('throttler.short.limit'),
          },
          {
            name: 'medium',
            ttl: config.get('throttler.medium.ttl'),
            limit: config.get('throttler.medium.limit'),
          },
          {
            name: 'daily',
            ttl: config.get('throttler.daily.ttl'),
            limit: config.get('throttler.daily.limit'),
          },
        ],
        storage: new ThrottlerStorageRedisService({
          host: config.get('database.redis.host', 'localhost'),
          port: parseInt(config.get('database.redis.port', '6379'), 10),
          password: config.get('database.redis.password'),
          db: parseInt(config.get('database.redis.db', '0'), 10),
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          reconnectOnError: (err) => {
            const targetError = 'READONLY';
            if (err.message.includes(targetError)) {
              return true;
            }
            return false;
          },
        }),
      }),
    }),
    DatabaseModule.forRoot(
      [
        ...MapsModuleEntities,
        ...AuthModuleEntities,
        ...UserModuleEntities,
        ...OrganizationModuleEntities,
        ...RoleModuleEntities,
        ...WhitelabelModuleEntities,
        ...AppSettingsModuleEntities,
        SupportTicket,
      ],
      [...UserModuleSubscribers],
    ),
    FilesModule,
    MapsModule,
    UserModule,
    AuthModule,
    OrganizationModule,
    RoleModule,
    RedisModule,
    WhitelabelModule,
    AppSettingsModule,
    SupportModule,
  ],
  controllers: [],
  providers: [
    Reflector,
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
  ],
})
export class AppModule {}
