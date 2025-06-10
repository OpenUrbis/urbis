import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as turf from '@turf/turf';
import {
  Feature,
  FeatureCollection,
  Polygon,
  MultiPolygon,
  GeoJsonProperties,
} from 'geojson';
import { formatBoundsForURL, transformBoundsToUTM } from './utils';
import axios from 'axios';

/**
 * Interface for FeatureCollection properties
 */
interface GeospatialFeatureCollectionProperties {
  input: Feature<Polygon | MultiPolygon>;
  totalArea: number;
}

/**
 * Interface for Feature properties
 */
interface GeospatialFeatureProperties extends GeoJsonProperties {
  totalArea: number;
  layer: string;
  [key: string]: any; // Allow additional dynamic properties from GeoServer
}

/**
 * Custom FeatureCollection type with typed properties
 */
interface GeospatialFeatureCollection extends FeatureCollection {
  properties: GeospatialFeatureCollectionProperties;
  features: Feature<Polygon | MultiPolygon, GeospatialFeatureProperties>[];
}

/**
 * Service for computing geospatial intersections between GeoJSON polygons and GeoServer layers
 */
@Injectable()
export class GeospatialIntersectionService {
  private readonly geoserverUrl = 'https://geoserver.slui.dev/geoserver/slui/ows';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Finds intersections between a GeoJSON polygon and multiple GeoServer layers
   * @param geojson - GeoJSON Feature with Polygon or MultiPolygon geometry
   * @param specificLayers - Optional array of layer names to restrict the search
   * @returns FeatureCollection containing intersecting features with area and layer metadata
   * @throws BadRequestException if GeoJSON is invalid
   * @throws InternalServerErrorException for server errors
   */
  async findIntersections(
    geojson: Feature<Polygon | MultiPolygon>,
    specificLayers?: string[],
  ): Promise<GeospatialFeatureCollection> {
    try {
      // Validate input GeoJSON
      if (
        !geojson?.geometry ||
        !['Polygon', 'MultiPolygon'].includes(geojson.geometry.type)
      ) {
        throw new BadRequestException('Invalid or empty GeoJSON');
      }

      // Prepare polygon geometry
      const isMultiPolygon = geojson.geometry.type === 'MultiPolygon';
      const polygonGeometry = isMultiPolygon
        ? turf.multiPolygon(geojson.geometry.coordinates as number[][][][])
        : turf.polygon(geojson.geometry.coordinates as number[][][]);

      // Calculate expanded bounding box
      const bbox = turf.bbox(polygonGeometry);
      const margin = 0.01;
      const expandedBbox = [
        bbox[0] - margin,
        bbox[1] - margin,
        bbox[2] + margin,
        bbox[3] + margin,
      ];

      // Transform bounds to UTM
      const bounds = [
        [expandedBbox[0], expandedBbox[1]],
        [expandedBbox[2], expandedBbox[3]],
      ];
      const utmBounds = bounds.map(([lng, lat]) =>
        transformBoundsToUTM([lng, lat]),
      );
      const formattedBounds = formatBoundsForURL([
        utmBounds[0][0],
        utmBounds[0][1],
        utmBounds[1][0],
        utmBounds[1][1],
      ]);

      // Define GeoServer layers
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
        'slui:subprefeitura',
        'slui:sujeicao_a_alagamentos',
        'slui:terras_indigenas',
        'slui:terrenos_marginais_aos_cursos_dagua_navegaveis',
        'slui:tombamentos-areas',
        'slui:tombamentos-envoltorias-de-imoveis',
        'slui:tombamentos-imoveis',
        'slui:zoneamento_geral',
      ];

      // Use specific layers if provided, otherwise use all layers
      const layers = specificLayers || allLayers;

      // Query layers and compute intersections
      const features: Feature<
        Polygon | MultiPolygon,
        GeospatialFeatureProperties
      >[] = [];
      for (const layer of layers) {
        const url = `https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&bbox=${formattedBounds}&typeName=${layer}&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326`;
        const response = await firstValueFrom(this.httpService.get(url));

        if (response.data?.features) {
          for (const feature of response.data.features) {
            try {
              const featureGeometry: any =
                feature.geometry.type === 'MultiPolygon'
                  ? turf.multiPolygon(feature.geometry.coordinates)
                  : turf.polygon(feature.geometry.coordinates);

              const intersection = turf.intersect(
                turf.featureCollection([featureGeometry, polygonGeometry]),
              );
              if (intersection) {
                const newFeature: Feature<
                  Polygon | MultiPolygon,
                  GeospatialFeatureProperties
                > = {
                  ...feature,
                  properties: {
                    ...feature.properties,
                    totalArea: turf.area(intersection),
                    layer,
                  },
                };
                features.push(newFeature);
              }
            } catch (error) {
              console.error(
                `Error calculating intersection for layer ${layer}:`,
                error,
              );
            }
          }
        }
      }

      // Return feature collection
      return {
        type: 'FeatureCollection',
        properties: {
          input: geojson,
          totalArea: turf.area(polygonGeometry),
        },
        features,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error processing geospatial intersection:', error);
      throw new InternalServerErrorException('Server error');
    }
  }

  async findIntersectionsBySqlc(sqlc: string): Promise<any> {
    try {
      // Validate SQLC length
      if (sqlc.length !== 10 && sqlc.length !== 12) {
        throw new HttpException('SQLC must be 10 or 12 characters long', HttpStatus.BAD_REQUEST);
      }

      // Format SQLC number based on length
      let formattedSqlc: string;
      if (sqlc.length === 10) {
        formattedSqlc = `${sqlc.substring(0, 3)} ${sqlc.substring(3, 6)} ${sqlc.substring(6, 10)} 00`;
      } else {
        formattedSqlc = `${sqlc.substring(0, 3)} ${sqlc.substring(3, 6)} ${sqlc.substring(6, 10)} ${sqlc.substring(10, 12)}`;
      }

      // Make WFS request to get the lot feature
      const wfsResponse = await axios.get(this.geoserverUrl, {
        params: {
          service: 'WFS',
          version: '1.0.0',
          request: 'GetFeature',
          typeName: 'slui:view_lote_cidadao',
          maxFeatures: 5,
          outputFormat: 'json',
          srsName: 'EPSG:4326',
          CQL_FILTER: `setor_quadra_lote_condominio = '${formattedSqlc}'`,
        },
        headers: {
          'accept': 'application/json',
          'origin': 'https://mapa.urbis.sampa.br',
        },
      });

      if (!wfsResponse.data.features || wfsResponse.data.features.length === 0) {
        throw new HttpException('Lot not found', HttpStatus.NOT_FOUND);
      }

      // Get the first feature (lot geometry)
      const lotFeature = wfsResponse.data.features[0];

      // Define the specific layers we need for this query
      const requiredLayers = [
        'slui:zoneamento_geral',
        'slui:subprefeitura',
        'slui:setores_e_subsetores',
        'slui:area_manancial_billings',
        'slui:area_manancial_juquery',
        'slui:area_manancial_guarapiranga',
        'slui:tombamentos-areas',
        'slui:tombamentos-envoltorias-de-imoveis',
        'slui:tombamentos-imoveis',
        'slui:area_envoltoria_conpresp',
        'slui:area_envoltoria_iphan',
        'slui:area_envoltoria_condephaat',
        'slui:parques_unidades_de_conservacao_e_apa',
        'slui:areas_contaminadas',
        'slui:melhoramento_viario',
        'slui:operacao_urbana'
      ];

      // Get intersections with specific layers
      const intersections = await this.findIntersections(lotFeature, requiredLayers);

      // Structure the response
      const response = {
        cd_sql: sqlc,
        geom_lote: lotFeature,
        geom_zoneamento_2016: intersections.features
          .filter(f => f.properties.layer === 'slui:zoneamento_geral')
          .map(f => f),
        geom_subprefeitura: intersections.features
          .filter(f => f.properties.layer === 'slui:subprefeitura')
          .map(f => f),
        geom_distrito: intersections.features
          .filter(f => f.properties.layer === 'slui:setores_e_subsetores')
          .map(f => f),
        geom_area_manancial_billings: intersections.features
          .filter(f => f.properties.layer === 'slui:area_manancial_billings')
          .map(f => f),
        geom_area_manancial_juquery: intersections.features
          .filter(f => f.properties.layer === 'slui:area_manancial_juquery')
          .map(f => f),
        geom_area_manancial_guarapiranga: intersections.features
          .filter(f => f.properties.layer === 'slui:area_manancial_guarapiranga')
          .map(f => f),
        geom_tombado: intersections.features
          .filter(f => ['slui:tombamentos-areas', 'slui:tombamentos-envoltorias-de-imoveis', 'slui:tombamentos-imoveis'].includes(f.properties.layer))
          .map(f => f),
        geom_area_envoltoria_conpresp: intersections.features
          .filter(f => f.properties.layer === 'slui:area_envoltoria_conpresp')
          .map(f => f),
        geom_area_envoltoria_iphan: intersections.features
          .filter(f => f.properties.layer === 'slui:area_envoltoria_iphan')
          .map(f => f),
        geom_area_envoltoria_condephaat: intersections.features
          .filter(f => f.properties.layer === 'slui:area_envoltoria_condephaat')
          .map(f => f),
        geom_uc: intersections.features
          .filter(f => f.properties.layer === 'slui:parques_unidades_de_conservacao_e_apa' && f.properties.tipo === 'UC')
          .map(f => f),
        geom_apa: intersections.features
          .filter(f => f.properties.layer === 'slui:parques_unidades_de_conservacao_e_apa' && f.properties.tipo === 'APA')
          .map(f => f),
        geom_area_contaminada: intersections.features
          .filter(f => f.properties.layer === 'slui:areas_contaminadas')
          .map(f => f),
        geom_melhoramento_viario: intersections.features
          .filter(f => f.properties.layer === 'slui:melhoramento_viario')
          .map(f => f),
        geom_operacao_urbana: intersections.features
          .filter(f => f.properties.layer === 'slui:operacao_urbana')
          .map(f => f)
      };

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error processing SQLC query',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
