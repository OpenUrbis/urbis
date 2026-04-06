import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModuleEntities } from '../../../auth/index.entity';
import { MapsModuleEntities } from '../../../maps/index.entity';
import { LayerGroup } from '../../../maps/layer-groups/entities/layer-group.entity';
import { SearchConfig } from '../../../maps/search/entities/search-config.entity';
import { OrganizationModuleEntities } from '../../../organization/index.entity';
import { RoleModuleEntities } from '../../../role/index.entity';
import { UserModuleEntities } from '../../../user/index.entity';
import { LayerSchemaColors } from './../../../maps/layer-schemas/entities/layer-schema-color.entity';
import { LayerSchema } from './../../../maps/layer-schemas/entities/layer-schema.entity';
import { MapConfig } from './../../../maps/map-config/entities/map-config.entity';
import { DatabaseModule } from './../../../shared/database.module';
import appConfig from './../../config/app.config';
import databaseConfig from './../../config/database.config';
import { LayerSeedService } from './layer-seed.service';
import { MapConfigSeedService } from './map-config-seed.service';
import { SearchConfigSeedService } from './search-config-seed.service';
import { UserSeedService } from './user-seed/user-seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig],
      envFilePath: ['.env'],
    }),
    DatabaseModule.forRoot([
      ...MapsModuleEntities,
      ...AuthModuleEntities,
      ...UserModuleEntities,
      ...OrganizationModuleEntities,
      ...RoleModuleEntities,
    ]),
    TypeOrmModule.forFeature([
      ...MapsModuleEntities,
      ...AuthModuleEntities,
      ...UserModuleEntities,
      ...OrganizationModuleEntities,
      ...RoleModuleEntities,
    ]),
  ],
  providers: [
    LayerSeedService,
    SearchConfigSeedService,
    MapConfigSeedService,
    UserSeedService,
  ],
})
export class SeedModule {}
