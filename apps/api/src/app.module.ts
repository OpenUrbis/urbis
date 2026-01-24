import { Module } from '@nestjs/common';
import { GeocodingModule } from './geocoding/geocoding.module';
import { GeospatialIntersectionModule } from './geospatial-intersection/geospatial-intersection.module';
import { LayerGroup } from './layer-groups/entities/layer-group.entity';
import { LayerGroupsModule } from './layer-groups/layer-groups.module';
import { LayerSchemaColors } from './layer-schemas/entities/layer-schema-color.entity';
import { LayerSchema } from './layer-schemas/entities/layer-schema.entity';
import { LayerSchemasModule } from './layer-schemas/layer-schemas.module';
import { MapConfigModule } from './map-config/map-config.module';
import { SearchConfig } from './search-config/entities/search-config.entity';
import { SearchConfigModule } from './search-config/search-config.module';
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
    ]),
    MapConfigModule,
    LayerSchemasModule,
    LayerGroupsModule,
    GeospatialIntersectionModule,
    GeocodingModule,
    SearchConfigModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
