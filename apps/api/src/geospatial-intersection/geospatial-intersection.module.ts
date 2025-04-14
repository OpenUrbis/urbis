import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GeospatialIntersectionService } from './geospatial-intersection.service';
import { GeospatialIntersectionController } from './geospatial-intersection.controller';

@Module({
  imports: [HttpModule],
  controllers: [GeospatialIntersectionController],
  providers: [GeospatialIntersectionService],
})
export class GeospatialIntersectionModule {}
