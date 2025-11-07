import { Module } from '@nestjs/common';
import { GeocodingModule } from './geocoding/geocoding.module';
import { GeospatialIntersectionModule } from './geospatial-intersection/geospatial-intersection.module';
import { LayerGroupsModule } from './layer-groups/layer-groups.module';
import { LayerSchemasModule } from './layer-schemas/layer-schemas.module';
import { MapConfigModule } from './map-config/map-config.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    MapConfigModule,
    LayerSchemasModule,
    LayerGroupsModule,
    GeospatialIntersectionModule,
    GeocodingModule,
    SearchModule,
  ],
})
export class MapsModule {}
