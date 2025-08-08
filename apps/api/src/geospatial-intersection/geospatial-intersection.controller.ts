import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { GeospatialIntersectionService } from './geospatial-intersection.service';
import { GeoJsonDto } from './dto/geojson.dto';
import { SqlcDto } from './dto/sqlc.dto';

/**
 * Controller for handling geospatial intersection queries
 */
@ApiTags('Geospatial intersections')
@Controller('geospatial-intersections')
export class GeospatialIntersectionController {
  constructor(
    private readonly geospatialIntersectionService: GeospatialIntersectionService,
  ) { }

  /**
   * Find intersections between a GeoJSON polygon and GeoServer layers
   * @param geojson - GeoJSON Feature with Polygon or MultiPolygon geometry
   * @returns FeatureCollection with intersecting features and metadata
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Query geospatial intersections',
    description:
      'Receives a GeoJSON Feature (Polygon or MultiPolygon) and returns a FeatureCollection containing features from GeoServer layers that intersect with the input geometry. Includes intersection areas and layer metadata.',
  })
  @ApiBody({
    description: 'GeoJSON Feature with Polygon or MultiPolygon geometry',
    type: GeoJsonDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved intersecting features',
  })
  @ApiBadRequestResponse({
    description: 'Invalid or empty GeoJSON provided',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error occurred',
  })
  async findIntersections(@Body() geojson: GeoJsonDto): Promise<any> {
    const allLayers = [
      'slui:ZEIS_(PDE)',
      'slui:aguas_correntes_ou_dormentes',
      'slui:areas_contaminadas',
      'slui:eixos',
      'slui:lote_cidadao',
      'slui:macroareas',
      'slui:macrozonas',
      'slui:minianel_viario',
      'slui:parques_unidades_de_conservacao_e_apa',
      'slui:represas',
      'slui:restricoes_geotecnicas',
      'slui:risco_geologico',
      'slui:risco_hidrologico',
      'slui:setores_e_subsetores',
      'slui:distrito_municipal',
      'slui:subprefeitura',
      'slui:sujeicao_a_alagamentos',
      'slui:terras_indigenas',
      'slui:terrenos_marginais_aos_cursos_dagua_navegaveis',
      'slui:tombamentos-areas',
      'slui:tombamentos-envoltorias-de-imoveis',
      'slui:tombamentos-imoveis',
      'slui:zoneamento',
      'slui:manancial_billings',
      'slui:manancial_guarapiranga',
      'slui:manancial_juquery',
      'slui:tombamentos_envoltorias_de_imoveis_IPHAN',
      'slui:tombamentos_envoltorias_de_imoveis_CONPRESP',
      'slui:tombamentos_envoltorias_de_imoveis_CONDEPHAAT',
    ];
    console.log('here', geojson);
    return this.geospatialIntersectionService.findIntersections(
      geojson as any,
      allLayers,
      'EPSG:4326',
    );
  }

  /**
   * Find intersections based on SQLC number
   * @param sqlc - SQLC number in format XXX-XXX-XXXX
   * @returns FeatureCollection with intersecting features and metadata
   */
  @Post('sqlc')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Query geospatial intersections by SQLC number',
    description:
      'Receives a SQLC number and returns a FeatureCollection containing features from GeoServer layers that intersect with the lot geometry. Includes intersection areas and layer metadata.',
  })
  @ApiBody({
    description: 'SQLC number in format XXX-XXX-XXXX',
    type: SqlcDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved intersecting features',
  })
  @ApiBadRequestResponse({
    description: 'Invalid SQLC number provided',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error occurred',
  })
  async findIntersectionsBySqlc(@Body() sqlcDto: SqlcDto): Promise<any> {
    return this.geospatialIntersectionService.findIntersectionsBySqlc(sqlcDto.sqlc, sqlcDto.fields);
  }
}
