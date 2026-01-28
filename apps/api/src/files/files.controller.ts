import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Recaptcha } from '@nestlab/google-recaptcha';
import { DownloadUrlDto } from './dto/download-url.dto';
import { UploadUrlDto } from './dto/upload-url.dto';
import { FilesService } from './files.service';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('public/upload-url')
  @Recaptcha({
    response: (req) => req.body.recaptcha,
    action: 'upload_file',
    score: 0.5,
  })
  @ApiOperation({ summary: 'Generate S3 upload URL with Recaptcha' })
  @ApiBody({ type: UploadUrlDto })
  @ApiResponse({
    status: 201,
    description: 'URL generated',
    schema: {
      example: { url: 'https://s3.amazonaws.com/...', key: 'uploads/file.jpg' },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid content type' })
  async getPublicUploadUrl(@Body() body: UploadUrlDto) {
    return this.filesService.getUploadUrl(body.contentType, body.folderPath);
  }

  @Post('upload-url')
  @UseGuards(AuthGuard('api-key'))
  @ApiSecurity('api_key')
  @ApiOperation({ summary: 'Generate S3 upload URL' })
  @ApiBody({ type: UploadUrlDto })
  @ApiResponse({
    status: 201,
    description: 'URL generated',
    schema: {
      example: { url: 'https://s3.amazonaws.com/...', key: 'uploads/file.jpg' },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid content type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUploadUrl(@Body() body: UploadUrlDto) {
    return this.filesService.getUploadUrl(body.contentType, body.folderPath);
  }

  @Get('download-url')
  @ApiOperation({ summary: 'Generate S3 download URL' })
  @ApiQuery({
    name: 'key',
    type: String,
    required: true,
    example: 'uploads/file.jpg',
  })
  @ApiResponse({
    status: 200,
    description: 'URL generated',
    schema: { example: { url: 'https://s3.amazonaws.com/...' } },
  })
  @ApiResponse({ status: 400, description: 'Invalid key' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDownloadUrl(@Query() query: DownloadUrlDto) {
    return this.filesService.getDownloadUrl(query.key);
  }

  @Get('public/download-url')
  @Recaptcha({
    response: (req) => req.headers.recaptcha,
    action: 'download_url',
    score: 0.5,
  })
  @ApiOperation({ summary: 'Generate S3 download URL with Recaptcha' })
  @ApiQuery({
    name: 'key',
    type: String,
    required: true,
    example: 'uploads/file.jpg',
  })
  @ApiResponse({
    status: 200,
    description: 'URL generated',
    schema: { example: { url: 'https://s3.amazonaws.com/...' } },
  })
  async getPublicDownloadUrl(@Query() query: DownloadUrlDto) {
    return this.filesService.getDownloadUrl(query.key);
  }
}
