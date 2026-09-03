import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GeospatialIntersectionService } from './geospatial-intersection.service';
import { GeospatialIntersectionController } from './geospatial-intersection.controller';
import { LayerSchemasModule } from '../layer-schemas/layer-schemas.module';

@Module({
  imports: [HttpModule, LayerSchemasModule],
  controllers: [GeospatialIntersectionController],
  providers: [GeospatialIntersectionService],
})
export class GeospatialIntersectionModule {}
