import { Global, Module } from '@nestjs/common';
import { MapUsageService } from './map-usage.service';

@Global()
@Module({
  providers: [MapUsageService],
  exports: [MapUsageService],
})
export class MapUsageModule {}
