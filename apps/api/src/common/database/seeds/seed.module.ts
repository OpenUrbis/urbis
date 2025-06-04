import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapConfig } from 'map-config/entities/map-config.entity';
import { SearchConfig } from '../../../search/entities/search-config.entity';
import { LayerGroup } from './../../../layer-groups/entities/layer-group.entity';
import { LayerSchemaColors } from './../../../layer-schemas/entities/layer-schema-color.entity';
import { LayerSchema } from './../../../layer-schemas/entities/layer-schema.entity';
import { DatabaseModule } from './../../../shared/database.module';
import appConfig from './../../config/app.config';
import databaseConfig from './../../config/database.config';
import { LayerSeedService } from './layer-seed.service';
import { MapConfigSeedService } from './map-config-seed.service';
import { SearchConfigSeedService } from './search-config-seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig],
      envFilePath: ['.env'],
    }),
    DatabaseModule.forRoot([
      LayerGroup,
      LayerSchema,
      LayerSchemaColors,
      SearchConfig,
      MapConfig,
    ]),
    TypeOrmModule.forFeature([
      LayerGroup,
      LayerSchema,
      LayerSchemaColors,
      SearchConfig,
      MapConfig,
    ]),
  ],
  providers: [LayerSeedService, SearchConfigSeedService, MapConfigSeedService],
})
export class SeedModule {}
