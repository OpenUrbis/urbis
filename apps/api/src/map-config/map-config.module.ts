import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchModule } from 'search/search.module';
import { LayerGroup } from './../layer-groups/entities/layer-group.entity';
import { LayerSchemaColors } from './../layer-schemas/entities/layer-schema-color.entity';
import { LayerSchema } from './../layer-schemas/entities/layer-schema.entity';
import { MapConfig } from './entities/map-config.entity';
import { MapConfigController } from './map-config.controller';
import { MapConfigService } from './map-config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LayerSchema,
      LayerSchemaColors,
      LayerGroup,
      MapConfig,
    ]),
    SearchModule,
    HttpModule,
  ],
  controllers: [MapConfigController],
  providers: [MapConfigService],
})
export class MapConfigModule {}
