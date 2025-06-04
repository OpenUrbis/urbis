import { Module } from '@nestjs/common';
import { MapConfig } from 'map-config/entities/map-config.entity';
import { FilesModule } from './files/files.module';
import { GeocodingModule } from './geocoding/geocoding.module';
import { GeospatialIntersectionModule } from './geospatial-intersection/geospatial-intersection.module';
import { LayerGroup } from './layer-groups/entities/layer-group.entity';
import { LayerGroupsModule } from './layer-groups/layer-groups.module';
import { LayerSchemaColors } from './layer-schemas/entities/layer-schema-color.entity';
import { LayerSchema } from './layer-schemas/entities/layer-schema.entity';
import { LayerSchemasModule } from './layer-schemas/layer-schemas.module';
import { MapConfigModule } from './map-config/map-config.module';
import { SearchConfig } from './search/entities/search-config.entity';
import { SearchModule } from './search/search.module';
import { DatabaseModule } from './shared/database.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    SharedModule,
    DatabaseModule.forRoot([
      LayerSchema,
      LayerGroup,
      LayerSchemaColors,
      SearchConfig,
      MapConfig,
    ]),
    MapConfigModule,
    LayerSchemasModule,
    LayerGroupsModule,
    GeospatialIntersectionModule,
    GeocodingModule,
    SearchModule,
    FilesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
