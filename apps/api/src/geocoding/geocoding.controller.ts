import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GeocodingService } from './geocoding.service';
import { GeocodingQueryDto, SearchResultDto } from './dto/geocoding.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('Geocoding')
@Controller('geocoding/places')
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Get()
  @ApiOperation({ summary: 'Search places by query term' })
  @ApiQuery({
    name: 'search',
    type: String,
    description: 'Search term',
    required: true,
  })
  @ApiQuery({
    name: 'service',
    type: String,
    description: 'Geocoding service (mapbox or nominatim)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of search results',
    type: [SearchResultDto],
  })
  @ApiResponse({ status: 400, description: 'Invalid service' })
  @ApiResponse({ status: 500, description: 'Server error' })
  async searchPlaces(
    @Query() query: GeocodingQueryDto,
  ): Promise<SearchResultDto[]> {
    try {
      return await this.geocodingService.searchPlaces(
        query.search,
        query.service,
      );
    } catch (error: any) {
      throw new HttpException(
        { error: 'Server error', message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
