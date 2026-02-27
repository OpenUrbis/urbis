import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { Permission } from 'role/entities/permission.entity';
import { PermissionService } from './permission.service';

@ApiTags('Permission')
@UseGuards(AccessControlGuard)
@Controller('role/permission')
export class PermissionController {
  constructor(private readonly service: PermissionService) {}

  @Get('list')
  @ApiOperation({ summary: 'Get permissions' })
  @ApiResponse({ status: 200, description: 'Permissions' })
  @ApiResponse({ status: 400, description: 'Error' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: String,
    description: 'Page of pagination',
    example: 0,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: String,
    description: 'Limit of registers',
    example: 100,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
    example: 0,
  })
  @ApiQuery({
    name: 'exclude',
    required: false,
    type: String,
    description: 'Exclude permissions',
    example: "['role:create','user:create']",
  })
  list(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search: string,
    @Query('exclude') exclude: string[],
  ): Promise<Permission[]> {
    return this.service.list({ page, limit }, search, exclude);
  }
}
