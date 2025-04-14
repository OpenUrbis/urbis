import { Module } from '@nestjs/common';
import { DatabaseModule } from './shared/database.module';
import { SharedModule } from './shared/shared.module';
import { GeospatialIntersectionModule } from './geospatial-intersection/geospatial-intersection.module';
import { GeocodingModule } from './geocoding/geocoding.module';
import { LayerSchema } from 'layer-schemas/entities/layer-schema.entity';
import { LayerSchemasModule } from 'layer-schemas/layer-schemas.module';
import { LayerGroupsModule } from 'layer-groups/layer-groups.module';
import { LayerGroup } from 'layer-groups/entities/layer-group.entity';

@Module({
  imports: [
    SharedModule,
    DatabaseModule.forRoot([
      LayerSchema,
      LayerGroup,
    ]),
    LayerSchemasModule,
    LayerGroupsModule,
    GeospatialIntersectionModule,
    GeocodingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
