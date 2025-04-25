import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LayerGroup } from './../../../layer-groups/entities/layer-group.entity';
import { LayerSchemaColors } from './../../../layer-schemas/entities/layer-schema-color.entity';
import { LayerSchema } from './../../../layer-schemas/entities/layer-schema.entity';
import { SearchConfig } from './../../../search-config/entities/search-config.entity';
import { DatabaseModule } from './../../../shared/database.module';
import appConfig from './../../config/app.config';
import databaseConfig from './../../config/database.config';
import { LayerSeedService } from './layer-seed.service';
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
    ]),
    TypeOrmModule.forFeature([
      LayerGroup,
      LayerSchema,
      LayerSchemaColors,
      SearchConfig,
    ]),
  ],
  providers: [LayerSeedService, SearchConfigSeedService],
})
export class SeedModule {}
