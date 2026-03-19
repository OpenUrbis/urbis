import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppSettingsModuleEntities } from '../../../app-settings/index.entity';
import { AuthModuleEntities } from '../../../auth/index.entity';
import { MapsModuleEntities } from '../../../maps/index.entity';
import { OrganizationModuleEntities } from '../../../organization/index.entity';
import { RoleModuleEntities } from '../../../role/index.entity';
import { QuestionAnswer } from '../../../support/entities/question-answer.entity';
import { QuestionTab } from '../../../support/entities/question-tab.entity';
import { UserModuleEntities } from '../../../user/index.entity';
import { WhitelabelModuleEntities } from '../../../whitelabel/index.entity';
import { DatabaseModule } from './../../../shared/database.module';
import adminConfig from './../../config/admin.config';
import appConfig from './../../config/app.config';
import databaseConfig from './../../config/database.config';
import { LayerSeedService } from './layer-seed.service';
import { MapConfigSeedService } from './map-config-seed.service';
import { QuestionSeedService } from './question-seed.service';
import { SearchConfigSeedService } from './search-config-seed.service';
import { systemSeedProviders } from './system';
import { UserSeedService } from './user-seed/user-seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig, adminConfig],
      envFilePath: ['.env'],
    }),
    DatabaseModule.forRoot([
      ...AuthModuleEntities,
      ...UserModuleEntities,
      ...OrganizationModuleEntities,
      ...RoleModuleEntities,
      ...WhitelabelModuleEntities,
      ...AppSettingsModuleEntities,
      ...MapsModuleEntities,
      QuestionTab,
      QuestionAnswer,
    ]),
    TypeOrmModule.forFeature([
      ...AuthModuleEntities,
      ...UserModuleEntities,
      ...OrganizationModuleEntities,
      ...RoleModuleEntities,
      ...WhitelabelModuleEntities,
      ...AppSettingsModuleEntities,
      ...MapsModuleEntities,
      QuestionTab,
      QuestionAnswer,
    ]),
  ],
  providers: [
    ...systemSeedProviders,
    LayerSeedService,
    MapConfigSeedService,
    SearchConfigSeedService,
    UserSeedService,
    QuestionSeedService,
  ],
})
export class SeedModule {}
