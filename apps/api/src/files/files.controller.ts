import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { UploadUrlDto } from './dto/upload-url.dto';
import { DownloadUrlDto } from './dto/download-url.dto';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermission } from 'common/decorators/require-permissions/require-permissions.decorator';
import { RolePermissionScopeEnum } from 'role/enums/role-permission-scope.enum';

@ApiTags('Files')
@Controller('files')
@UseGuards(AuthGuard('api-key'))
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-url')
  @RequirePermission({
    permissions: {
      action: 'generate-upload-url',
      resource: 'file',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
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
    return this.filesService.getUploadUrl(body.contentType);
  }

  @Get('download-url')
  @RequirePermission({
    permissions: {
      action: 'generate-download-url',
      resource: 'file',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
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
}
