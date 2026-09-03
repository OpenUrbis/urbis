import { Module } from '@nestjs/common';
import { GeoserverProxyController } from './geoserver-proxy.controller';
import { GeoserverProxyService } from './geoserver-proxy.service';
import { ConfigModule } from '@nestjs/config';
import { OptionalProxyAuthGuard } from 'common/guards/optional-proxy-auth.guard';
import { ProxyThrottlerGuard } from 'common/guards/proxy-throttler.guard';

@Module({
  imports: [ConfigModule],
  controllers: [GeoserverProxyController],
  providers: [
    GeoserverProxyService,
    OptionalProxyAuthGuard,
    ProxyThrottlerGuard,
  ],
  exports: [GeoserverProxyService],
})
export class GeoserverProxyModule {}
