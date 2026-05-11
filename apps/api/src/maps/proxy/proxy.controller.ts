import {
  Controller,
  Get,
  Query,
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
    summary: 'Proxy requests to external services to avoid CORS',
  })
  @ApiQuery({ name: 'url', required: true, description: 'Target URL' })
  async proxy(@Query('url') url: string, @Res() res: Response) {
    if (!url) {
      throw new BadRequestException('URL is required');
    }

    try {
      console.log(`[Proxy] Requesting: ${url}`);
      const response = await axios.get(url, {
        responseType: 'stream',
        timeout: 10000, // 10s timeout
        headers: {
          'User-Agent': 'UrbisMap-Proxy/1.0',
        },
      });

      // Filter headers to avoid issues with target's security headers
      const safeHeaders = {};
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
    } catch (error) {
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
        res.status(500).send('Internal Server Error: ' + error.message);
      }
    }
  }
}
