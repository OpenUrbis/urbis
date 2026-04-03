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
import { SearchConfigDto } from './dto/search.dto';
import { SearchConfig } from './entities/search-config.entity';
import { SearchService } from './search.service';

@ApiTags('Search configurations')
@Controller('maps/search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Get all search configs' })
  @ApiResponse({
    status: 200,
    description: 'List of search configs',
    type: [SearchConfig],
  })
  async findAll(): Promise<SearchConfig[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a search config by ID' })
  @ApiResponse({
    status: 200,
    description: 'The search config',
    type: SearchConfig,
  })
  @ApiResponse({
    status: 404,
    description: 'Search Config with ID not found',
    type: SearchConfig,
  })
  async findOne(@Param('id') id: string): Promise<SearchConfig> {
    return this.service.findOne(id);
  }

  @ApiSecurity('api_key')
  @UseGuards(AuthGuard('api-key'))
  @Post()
  @ApiOperation({ summary: 'Create a new search config' })
  @ApiResponse({
    status: 201,
    description: 'The created search config',
    type: SearchConfig,
  })
  @ApiResponse({
    status: 400,
    description: 'Search Config with ID already exist',
    example: {
      message: 'Search Config with ID iffel-towesr already exist',
      error: 'Bad Request',
      statusCode: 400,
    },
  })
  async create(@Body() dto: SearchConfigDto): Promise<SearchConfig> {
    return this.service.create(dto);
  }

  @ApiSecurity('api_key')
  @UseGuards(AuthGuard('api-key'))
  @Put(':id')
  @ApiOperation({ summary: 'Update a search config by ID' })
  @ApiResponse({
    status: 200,
    description: 'The updated search config',
    type: SearchConfig,
  })
  @ApiResponse({
    status: 404,
    description: 'Search Config with ID not found',
    example: {
      message: 'Search Config with ID iffel-towesr not found',
      error: 'Bad Request',
      statusCode: 400,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Search Config with ID already exist',
    example: {
      message: 'Search Config with ID iffel-towesr already exist',
      error: 'Bad Request',
      statusCode: 400,
    },
  })
  async update(
    @Param('id') id: string,
    @Body() dto: SearchConfigDto,
  ): Promise<SearchConfig> {
    return this.service.update(id, dto);
  }

  @ApiSecurity('api_key')
  @UseGuards(AuthGuard('api-key'))
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a search config by ID' })
  @ApiResponse({ status: 200, description: 'Deletion successful' })
  @ApiResponse({
    status: 404,
    description: 'Search Config with ID not found',
    example: {
      message: 'Search Config with ID iffel-towesr not found',
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
  @ApiOperation({ summary: 'Create or update a search config based on ID' })
  @ApiResponse({
    status: 201,
    description: 'The created or updated search config',
    type: SearchConfig,
  })
  async upsert(@Body() dto: SearchConfigDto): Promise<SearchConfig> {
    return this.service.upsert(dto);
  }
}
