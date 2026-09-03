import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermission } from 'common/decorators/require-permissions/require-permissions.decorator';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { OrGuard } from 'common/guards/or-guard/or.guard';
import { RolePermissionScopeEnum } from 'role/enums/role-permission-scope.enum';
import { LayerGroupDto } from './dto/layer-group.dto';
import { LayerGroup } from './entities/layer-group.entity';
import { LayerGroupsService } from './layer-groups.service';

@ApiTags('Layer Groups')
@Controller('maps/layer-groups')
export class LayerGroupsController {
  constructor(private readonly service: LayerGroupsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all layer groups' })
  @ApiResponse({
    status: 200,
    description: 'List of layer groups',
    type: [LayerGroup],
  })
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('search') search?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderType') orderType?: 'ASC' | 'DESC',
  ): Promise<LayerGroup[] | { data: LayerGroup[]; total: number }> {
    return this.service.findAll(page, pageSize, search, orderBy, orderType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a layer group by ID' })
  @ApiResponse({
    status: 200,
    description: 'The layer group',
    type: LayerGroup,
  })
  @ApiResponse({
    status: 404,
    description: 'Layer schema with ID not found',
    example: {
      message: 'Layer group with ID iffel-towesr not found',
      error: 'Bad Request',
      statusCode: 400,
    },
  })
  async findOne(@Param('id') id: string): Promise<LayerGroup> {
    return this.service.findOne(id);
  }

  @ApiSecurity('api_key')
  @ApiBearerAuth()
  @UseGuards(OrGuard(AccessControlGuard, AuthGuard('api-key')))
  @RequirePermission({
    permissions: {
      action: 'create',
      resource: 'layer-group',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @Post()
  @ApiOperation({ summary: 'Create a new layer group' })
  @ApiResponse({
    status: 201,
    description: 'The created layer group',
    type: LayerGroup,
  })
  @ApiResponse({
    status: 400,
    description: 'Layer group with ID already exist',
    example: {
      message: 'Layer schema with ID iffel-towesr already exist',
      error: 'Bad Request',
      statusCode: 400,
    },
  })
  async create(@Body() dto: LayerGroupDto): Promise<LayerGroup> {
    return this.service.create(dto);
  }

  @ApiSecurity('api_key')
  @ApiBearerAuth()
  @UseGuards(OrGuard(AccessControlGuard, AuthGuard('api-key')))
  @RequirePermission({
    permissions: {
      action: 'update',
      resource: 'layer-group',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @Put(':id')
  @ApiOperation({ summary: 'Update a layer group by ID' })
  @ApiResponse({
    status: 200,
    description: 'The updated layer group',
    type: LayerGroup,
  })
  @ApiResponse({
    status: 404,
    description: 'Layer schema with ID not found',
    example: {
      message: 'Layer group with ID iffel-towesr not found',
      error: 'Bad Request',
      statusCode: 400,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Layer group with ID already exist',
    example: {
      message: 'Layer schema with ID iffel-towesr already exist',
      error: 'Bad Request',
      statusCode: 400,
    },
  })
  async update(
    @Param('id') id: string,
    @Body() dto: LayerGroupDto,
  ): Promise<LayerGroup> {
    return this.service.update(id, dto);
  }

  @ApiSecurity('api_key')
  @ApiBearerAuth()
  @UseGuards(OrGuard(AccessControlGuard, AuthGuard('api-key')))
  @RequirePermission({
    permissions: {
      action: 'delete',
      resource: 'layer-group',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a layer group by ID' })
  @ApiResponse({ status: 200, description: 'Deletion successful' })
  @ApiResponse({
    status: 404,
    description: 'Layer schema with ID not found',
    example: {
      message: 'Layer group with ID iffel-towesr not found',
      error: 'Bad Request',
      statusCode: 400,
    },
  })
  async delete(@Param('id') id: string): Promise<void> {
    return this.service.delete(id);
  }

  @ApiSecurity('api_key')
  @ApiBearerAuth()
  @UseGuards(OrGuard(AccessControlGuard, AuthGuard('api-key')))
  @RequirePermission({
    permissions: [
      {
        action: 'create',
        resource: 'layer-group',
        scope: RolePermissionScopeEnum.ANY,
      },
      {
        action: 'update',
        resource: 'layer-group',
        scope: RolePermissionScopeEnum.ANY,
      },
    ],
    mode: 'AND',
  })
  @Post('upsert')
  @ApiOperation({ summary: 'Create or update a layer group based on ID' })
  @ApiResponse({
    status: 201,
    description: 'The created or updated layer group',
    type: LayerGroup,
  })
  async upsert(@Body() dto: LayerGroupDto): Promise<LayerGroup> {
    return this.service.upsert(dto);
  }
}
