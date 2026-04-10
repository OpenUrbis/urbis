import { Module } from '@nestjs/common';
import { AuthModuleEntities } from 'auth/index.entity';
import { OidcModule } from 'auth/oidc/oidc.module';
import { OrganizationModule } from 'organization/organization.module';
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
import { UserModuleEntities, UserModuleSubscribers } from './user/index.entity';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    SharedModule,
    OidcModule,
    DatabaseModule.forRoot(
      [
        ...MapsModuleEntities,
        ...AuthModuleEntities,
        ...UserModuleEntities,
        ...OrganizationModuleEntities,
        ...RoleModuleEntities,
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
