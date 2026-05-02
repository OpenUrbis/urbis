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
      const response = await axios.get(url, {
        responseType: 'stream',
      });

      res.set(response.headers);
      response.data.pipe(res);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        res
          .status(error.response?.status || 500)
          .send(error.response?.data || error.message);
      } else {
        res.status(500).send('Internal Server Error');
      }
    }
  }
}
