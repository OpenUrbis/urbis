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
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
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
  ): Promise<LayerSchema[] | { data: LayerSchema[]; total: number }> {
    return this.service.findAll(page, pageSize);
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

  // TO DO: Reativar e adicionar access key guard
  // @ApiSecurity('api_key')
  // @UseGuards(AuthGuard('api-key'))
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

  // TO DO: Reativar e adicionar access key guard
  // @ApiSecurity('api_key')
  // @UseGuards(AuthGuard('api-key'))
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

  // TO DO: Reativar e adicionar access key guard
  // @ApiSecurity('api_key')
  // @UseGuards(AuthGuard('api-key'))
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
  @UseGuards(AuthGuard('api-key'))
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
