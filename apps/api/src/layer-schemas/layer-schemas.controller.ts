import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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

@ApiSecurity('api_key')
@ApiTags('Layer Schemas')
@UseGuards(AuthGuard('api-key'))
@Controller('layer-schemas')
export class LayerSchemasController {
  constructor(private readonly service: LayerSchemasService) {}

  @Get()
  @ApiOperation({ summary: 'Get all layer schemas' })
  @ApiResponse({
    status: 200,
    description: 'List of layer schemas',
    type: [LayerSchema],
  })
  async findAll(): Promise<LayerSchema[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a layer schema by ID' })
  @ApiResponse({
    status: 200,
    description: 'The layer schema',
    type: LayerSchema,
  })
  async findOne(@Param('id') id: string): Promise<LayerSchema> {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new layer schema' })
  @ApiResponse({
    status: 201,
    description: 'The created layer schema',
    type: LayerSchema,
  })
  async create(@Body() dto: LayerSchemaDto): Promise<LayerSchema> {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a layer schema by ID' })
  @ApiResponse({
    status: 200,
    description: 'The updated layer schema',
    type: LayerSchema,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: LayerSchemaDto,
  ): Promise<LayerSchema> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a layer schema by ID' })
  @ApiResponse({ status: 200, description: 'Deletion successful' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.service.delete(id);
  }

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
