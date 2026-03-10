import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import axios from 'axios';

@ApiTags('Maps Proxy')
@Controller('maps/proxy')
export class ProxyController {
  @Get()
  @ApiOperation({
    summary: 'Proxy GET requests to external services to avoid CORS',
  })
  @ApiQuery({ name: 'url', required: true, description: 'Target URL' })
  async proxyGet(
    @Query('url') url: string,
    @Res() res: Response,
    @Query() allQuery: Record<string, string>,
  ) {
    return this.handleProxy(url, allQuery, res, 'GET');
  }

  @Post()
  @ApiOperation({
    summary: 'Proxy POST requests (e.g. WMS with SLD_BODY)',
  })
  @ApiQuery({ name: 'url', required: true, description: 'Target URL' })
  async proxyPost(
    @Query('url') url: string,
    @Body() body: Record<string, any>,
    @Res() res: Response,
  ) {
    // If URL is in body, use it
    const targetUrl = url || body.url;
    // Remove url from body if present to clean up params
    const { url: _, ...params } = body;

    return this.handleProxy(targetUrl, params, res, 'POST');
  }

  private async handleProxy(
    url: string,
    params: Record<string, any>,
    res: Response,
    method: 'GET' | 'POST',
  ) {
    if (!url) {
      throw new BadRequestException('URL is required');
    }

    try {
      console.log(`[Proxy ${method}] Requesting: ${url}`);

      // We will perform a POST request to the target if method is POST, passing params as form-url-encoded
      // GeoServer accepts form-url-encoded for WMS GetMap.
      // If method is GET, we construct URL.

      let response;

      if (method === 'POST') {
        // Convert params to URLSearchParams to ensure correct x-www-form-urlencoded serialization
        const paramsSerializer = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            paramsSerializer.append(key, String(value));
          }
        });

        response = await axios.post(url, paramsSerializer, {
          responseType: 'stream',
          timeout: 30000, // 30s timeout for heavier requests
          headers: {
            'User-Agent': 'UrbisMap-Proxy/1.0',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
      } else {
        const urlObj = new URL(url);
        Object.entries(params).forEach(([key, value]) => {
          if (key !== 'url' && typeof value === 'string') {
            urlObj.searchParams.set(key, value);
          }
        });

        response = await axios.get(urlObj.toString(), {
          responseType: 'stream',
          timeout: 10000,
          headers: {
            'User-Agent': 'UrbisMap-Proxy/1.0',
          },
        });
      }

      // Filter headers to avoid issues with target's security headers
      const safeHeaders: Record<string, any> = {};
      const allowedHeaders = [
        'content-type',
        'content-length',
        'last-modified',
        'etag',
      ];
      allowedHeaders.forEach((h) => {
        if (response.headers[h]) safeHeaders[h] = response.headers[h];
      });

      res.set(safeHeaders);
      response.data.pipe(res);
    } catch (error: any) {
      console.error(`[Proxy] Error requesting ${url}:`, error.message);
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        const data = error.response?.data;

        if (data && typeof data.pipe === 'function') {
          // If error response is also a stream
          res.status(status);
          data.pipe(res);
        } else {
          res.status(status).send(data || error.message);
        }
      } else {
        res
          .status(500)
          .send('Internal Server Error: ' + (error.message || String(error)));
      }
    }
  }
}
