import { Module } from '@nestjs/common';
import { DatabaseModule } from './shared/database.module';
import { SharedModule } from './shared/shared.module';
import { GeospatialIntersectionModule } from './geospatial-intersection/geospatial-intersection.module';
import { GeocodingModule } from './geocoding/geocoding.module';

@Module({
  imports: [SharedModule, DatabaseModule.forRoot([]), GeospatialIntersectionModule, GeocodingModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
