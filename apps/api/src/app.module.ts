import { Module } from '@nestjs/common';
import { AuthModuleEntities } from 'auth/index.entity';
import { OidcModule } from 'auth/oidc/oidc.module';
import { OrganizationModule } from 'organization/organization.module';
import { SupportModuleEntities } from 'support/index.entity';
import { AppSettingsModule } from './app-settings/app-settings.module';
import { AppSettingsModuleEntities } from './app-settings/index.entity';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './common/redis/redis.module';
import { DynamicSystemDataModule } from './dynamic-system-data/dynamic-system-data.module';
import { DynamicSystemDataEntities } from './dynamic-system-data/index.entity';
import { FilesModule } from './files/files.module';
import { MapsModuleEntities } from './maps/index.entity';
import { MapsModule } from './maps/maps.module';
import { OrganizationModuleEntities } from './organization/index.entity';
import { RoleModuleEntities } from './role/index.entity';
import { RoleModule } from './role/role.module';
import { DatabaseModule } from './shared/database.module';
import { SharedModule } from './shared/shared.module';
import { SolicitationEntities } from './solicitation/entities';
import { SolicitationModule } from './solicitation/solicitation.module';
import { SupportModule } from './support';
import { QuestionAnswerModule } from './support/question-answer/question-answer.module';
import { QuestionTabModule } from './support/question-tab/question-tab.module';
import { UserModuleEntities, UserModuleSubscribers } from './user/index.entity';
import { UserModule } from './user/user.module';
import { WhitelabelModuleEntities } from './whitelabel/index.entity';
import { WhitelabelModule } from './whitelabel/whitelabel.module';

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
        ...WhitelabelModuleEntities,
        ...AppSettingsModuleEntities,
        ...DynamicSystemDataEntities,
        ...SupportModuleEntities,
        ...SolicitationEntities,
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
    SolicitationModule,
    DynamicSystemDataModule,
    QuestionAnswerModule,
    QuestionTabModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}