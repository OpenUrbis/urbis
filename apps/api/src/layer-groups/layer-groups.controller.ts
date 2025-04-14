import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { LayerGroupsService } from './layer-groups.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBasicAuth } from '@nestjs/swagger';
import { LayerGroup } from './entities/layer-group.entity';
import { LayerGroupDto } from './dto/layer-group.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiBasicAuth('api-key')
@ApiTags('Layer Groups')
@UseGuards(AuthGuard('api-key'))
@Controller('layer-groups')
export class LayerGroupsController {
  constructor(private readonly service: LayerGroupsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all layer groups' })
  @ApiResponse({ status: 200, description: 'List of layer groups', type: [LayerGroup] })
  async findAll(): Promise<LayerGroup[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a layer group by ID' })
  @ApiResponse({ status: 200, description: 'The layer group', type: LayerGroup })
  async findOne(@Param('id') id: string): Promise<LayerGroup> {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new layer group' })
  @ApiResponse({ status: 201, description: 'The created layer group', type: LayerGroup })
  async create(@Body() dto: LayerGroupDto): Promise<LayerGroup> {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a layer group by ID' })
  @ApiResponse({ status: 200, description: 'The updated layer group', type: LayerGroup })
  async update(@Param('id') id: string, @Body() dto: LayerGroupDto): Promise<LayerGroup> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a layer group by ID' })
  @ApiResponse({ status: 200, description: 'Deletion successful' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.service.delete(id);
  }

  @Post('upsert')
  @ApiOperation({ summary: 'Create or update a layer group based on ID' })
  @ApiResponse({ status: 201, description: 'The created or updated layer group', type: LayerGroup })
  async upsert(@Body() dto: LayerGroupDto): Promise<LayerGroup> {
    return this.service.upsert(dto);
  }
}