import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { GeoserverProxyService } from './geoserver-proxy.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Geoserver Proxy')
@Controller('maps/geoserver-proxy')
export class GeoserverProxyController {
  constructor(private service: GeoserverProxyService) {}

  @Get('layers/:workspace/:layerName/attributes')
  @ApiOperation({ summary: 'Get layer attributes from GeoServer' })
  async getAttributes(
    @Param('workspace') workspace: string,
    @Param('layerName') layerName: string,
  ) {
    return this.service.getLayerAttributes(workspace, layerName);
  }

  @Get('maxar')
  @ApiOperation({ summary: 'Proxy Maxar WMS requests' })
  async proxyMaxar(@Query() query: any, @Res() res: Response) {
    return this.service.proxyMaxarWms(query, res);
  }
}
