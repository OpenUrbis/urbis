import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModuleEntities } from '../../../auth/index.entity';
import { OrganizationModuleEntities } from '../../../organization/index.entity';
import { RoleModuleEntities } from '../../../role/index.entity';
import { UserModuleEntities } from '../../../user/index.entity';
import { DatabaseModule } from './../../../shared/database.module';
import appConfig from './../../config/app.config';
import databaseConfig from './../../config/database.config';
import adminConfig from './../../config/admin.config';
import { WhitelabelModuleEntities } from '../../../whitelabel/index.entity';
import { systemSeedProviders } from './system';
import { AppSettingsModuleEntities } from '../../../app-settings/index.entity';
import { LayerSeedService } from './layer-seed.service';
import { MapConfigSeedService } from './map-config-seed.service';
import { SearchConfigSeedService } from './search-config-seed.service';
import { UserSeedService } from './user-seed/user-seed.service';
import { MapsModuleEntities } from '../../../maps/index.entity';

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
    ]),
    TypeOrmModule.forFeature([
      ...AuthModuleEntities,
      ...UserModuleEntities,
      ...OrganizationModuleEntities,
      ...RoleModuleEntities,
      ...WhitelabelModuleEntities,
      ...AppSettingsModuleEntities,
      ...MapsModuleEntities,
    ]),
  ],
  providers: [
    ...systemSeedProviders,
    LayerSeedService,
    MapConfigSeedService,
    SearchConfigSeedService,
    UserSeedService,
  ],
})
export class SeedModule {}
