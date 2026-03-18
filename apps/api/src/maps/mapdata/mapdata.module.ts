import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MapDataController } from './mapdata.controller';
import { MapDataService } from './mapdata.service';

@Module({
  imports: [HttpModule],
  controllers: [MapDataController],
  providers: [MapDataService],
  exports: [MapDataService],
})
export class MapDataModule {}
