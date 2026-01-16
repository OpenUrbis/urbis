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
import { LayerSchemaDto } from './dto/layer-schema.dto';
import { LayerSchema } from './entities/layer-schema.entity';
import { LayerSchemasService } from './layer-schemas.service';

@ApiTags('Layer Schemas')
@Controller('maps/layer-schemas')
export class LayerSchemasController {
  constructor(private readonly service: LayerSchemasService) {}

  @Get()
  @ApiOperation({ summary: 'Get all layer schemas' })
  @ApiResponse({
    status: 200,
    description: 'List of layer schemas',
    type: [LayerSchema],
  })
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('search') search?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderType') orderType?: 'ASC' | 'DESC',
  ): Promise<LayerSchema[] | { data: LayerSchema[]; total: number }> {
    return this.service.findAll(page, pageSize, search, orderBy, orderType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a layer schema by ID' })
  @ApiResponse({
    status: 200,
    description: 'The layer schema',
    type: LayerSchema,
  })
  @ApiResponse({
    status: 404,
    description: 'Layer schema with ID not found',
    type: LayerSchema,
  })
  async findOne(@Param('id') id: string): Promise<LayerSchema> {
    return this.service.findOne(id);
  }

  @ApiSecurity('api_key')
  @ApiBearerAuth()
  @UseGuards(OrGuard(AccessControlGuard, AuthGuard('api-key')))
  @RequirePermission({
    permissions: {
      action: 'create',
      resource: 'layer-schema',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @Post()
  @ApiOperation({ summary: 'Create a new layer schema' })
  @ApiResponse({
    status: 201,
    description: 'The created layer schema',
    type: LayerSchema,
  })
  @ApiResponse({
    status: 400,
    description: 'Layer schema with ID already exist',
    example: {
      message: 'Layer schema with ID iffel-towesr already exist',
      error: 'Bad Request',
      statusCode: 400,
    },
  })
  async create(@Body() dto: LayerSchemaDto): Promise<LayerSchema> {
    return this.service.create(dto);
  }

  @ApiSecurity('api_key')
  @ApiBearerAuth()
  @UseGuards(OrGuard(AccessControlGuard, AuthGuard('api-key')))
  @RequirePermission({
    permissions: {
      action: 'update',
      resource: 'layer-schema',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @Put(':id')
  @ApiOperation({ summary: 'Update a layer schema by ID' })
  @ApiResponse({
    status: 200,
    description: 'The updated layer schema',
    type: LayerSchema,
  })
  @ApiResponse({
    status: 404,
    description: 'Layer schema with ID not found',
    example: {
      message: 'Layer schema with ID iffel-towesr not found',
      error: 'Bad Request',
      statusCode: 400,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Layer schema with ID already exist',
    example: {
      message: 'Layer schema with ID iffel-towesr already exist',
      error: 'Bad Request',
      statusCode: 400,
    },
  })
  async update(
    @Param('id') id: string,
    @Body() dto: LayerSchemaDto,
  ): Promise<LayerSchema> {
    return this.service.update(id, dto);
  }

  @ApiSecurity('api_key')
  @ApiBearerAuth()
  @UseGuards(OrGuard(AccessControlGuard, AuthGuard('api-key')))
  @RequirePermission({
    permissions: {
      action: 'delete',
      resource: 'layer-schema',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a layer schema by ID' })
  @ApiResponse({ status: 200, description: 'Deletion successful' })
  @ApiResponse({
    status: 404,
    description: 'Layer schema with ID not found',
    example: {
      message: 'Layer schema with ID iffel-towesr not found',
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
        action: 'update',
        resource: 'layer-schema',
        scope: RolePermissionScopeEnum.ANY,
      },
      {
        action: 'create',
        resource: 'layer-schema',
        scope: RolePermissionScopeEnum.ANY,
      },
    ],
    mode: 'AND',
  })
  @Post('upsert')
  @ApiOperation({ summary: 'Create or update a layer schema based on ID' })
  @ApiResponse({
    status: 201,
    description: 'The created or updated layer schema',
    type: LayerSchema,
  })
  async upsert(@Body() dto: LayerSchemaDto): Promise<LayerSchema> {
    return this.service.upsert(dto);
  }
}
