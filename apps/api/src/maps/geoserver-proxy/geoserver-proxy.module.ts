import { Module } from '@nestjs/common';
import { GeoserverProxyController } from './geoserver-proxy.controller';
import { GeoserverProxyService } from './geoserver-proxy.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [GeoserverProxyController],
  providers: [GeoserverProxyService],
  exports: [GeoserverProxyService],
})
export class GeoserverProxyModule {}
