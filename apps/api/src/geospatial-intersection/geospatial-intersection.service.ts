import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
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
import { formatBoundsForURL } from './utils';

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

  private readonly fieldToLayerMap = {
    geom_zoneamento_2016: ['slui:zoneamento'],
    geom_subprefeitura: ['slui:subprefeitura'],
    geom_distrito: ['slui:distrito_municipal'],
    geom_tombado: [
      'slui:tombamentos-areas',
      'slui:tombamentos-envoltorias-de-imoveis',
      'slui:tombamentos-imoveis'
    ],
    geom_uc: ['slui:parques_unidades_de_conservacao_e_apa'],
    geom_apa: ['slui:parques_unidades_de_conservacao_e_apa'],
    geom_area_contaminada: ['slui:areas_contaminadas'],
    geom_melhoramento_viario: ['slui:minianel_viario'],
    geom_area_manancial: ['slui:manancial_billings'],
    geom_area_manancial_guarapiranga: ['slui:manancial_guarapiranga'],
    geom_area_manancial_juquery: ['slui:manancial_juquery'],
    geom_area_envoltoria_iphan: ['slui:tombamentos_envoltorias_de_imoveis_IPHAN'],
    geom_area_envoltoria_conpresp: ['slui:tombamentos_envoltorias_de_imoveis_CONPRESP'],
    geom_area_envoltoria_condephaat: ['slui:tombamentos_envoltorias_de_imoveis_CONDEPHAAT'],
  };

  constructor(private readonly httpService: HttpService) { }

  /**
   * Finds intersections between a GeoJSON polygon and multiple GeoServer layers
   * @param geojson - GeoJSON Feature with Polygon or MultiPolygon geometry
   * @param specificLayers - Optional array of layer names to restrict the search
   * @param srsName - Optional SRS name for the query
   * @returns FeatureCollection containing intersecting features with area and layer metadata
   * @throws BadRequestException if GeoJSON is invalid
   * @throws InternalServerErrorException for server errors
   */
  async findIntersections(
    geojson: Feature<Polygon | MultiPolygon>,
    specificLayers?: string[],
    srsName: string = 'EPSG:31983',
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
      const utmBounds = bounds;
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

      // Use specific layers if provided, otherwise use all layers
      const layers = specificLayers || allLayers;

      // Query layers and compute intersections
      const features: Feature<
        Polygon | MultiPolygon,
        GeospatialFeatureProperties
      >[] = [];
      for (const layer of layers) {
        const url = `https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&bbox=${formattedBounds}&typeName=${layer}&maxFeatures=10000&outputFormat=json&srsName=${srsName}`;
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

  async findIntersectionsBySqlc(sqlc: string, fields?: string[]): Promise<any> {
    try {
      // Validate SQLC length
      if (sqlc.length !== 10 && sqlc.length !== 12) {
        throw new Error('SQLC number must be 10 or 12 digits');
      }

      // Get lot geometry from WFS
      const wfsResponse = await this.getLotGeometry(sqlc);

      if (!wfsResponse.data.features || wfsResponse.data.features.length === 0) {
        throw new Error('No lot found for the provided SQLC number');
      }

      // Get the first feature (lot geometry)
      const lotFeature = wfsResponse.data.features[0];

      // Determine which layers we need based on requested fields
      let requiredLayers: string[] = [];

      if (!fields || fields.length === 0) {
        // If no fields specified, get all layers
        requiredLayers = Object.values(this.fieldToLayerMap).flat();
      } else {
        // Get unique layers for requested fields
        requiredLayers = [...new Set(
          fields
            .filter(field => field in this.fieldToLayerMap)
            .flatMap(field => this.fieldToLayerMap[field])
        )];
      }

      // Get intersections with specific layers using EPSG:31983
      const intersections = await this.findIntersections(lotFeature, requiredLayers, 'EPSG:31983');

      // Structure the response
      const allFields = {
        cd_sql: sqlc,
        perimetro: lotFeature,
        geom_lote: lotFeature.geometry,
        geom_zoneamento_2016: intersections.features
          .filter(f => f.properties.layer === 'slui:zoneamento')
          .map(f => f),
        geom_subprefeitura: intersections.features
          .filter(f => f.properties.layer === 'slui:subprefeitura')
          .map(f => f),
        geom_distrito: intersections.features
          .filter(f => f.properties.layer === 'slui:distrito_municipal')
          .map(f => f),
        geom_tombado: intersections.features
          .filter(f => ['slui:tombamentos-areas', 'slui:tombamentos-envoltorias-de-imoveis', 'slui:tombamentos-imoveis'].includes(f.properties.layer))
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
          .filter(f => f.properties.layer === 'slui:minianel_viario')
          .map(f => f),
        geom_area_manancial: intersections.features
          .filter(f => f.properties.layer === 'slui:manancial_billings')
          .map(f => f),
        geom_area_manancial_guarapiranga: intersections.features
          .filter(f => f.properties.layer === 'slui:manancial_guarapiranga')
          .map(f => f),
        geom_area_manancial_juquery: intersections.features
          .filter(f => f.properties.layer === 'slui:manancial_juquery')
          .map(f => f),
        geom_area_envoltoria_iphan: intersections.features
          .filter(f => f.properties.layer === 'slui:tombamentos_envoltorias_de_imoveis_IPHAN')
          .map(f => f),
        geom_area_envoltoria_conpresp: intersections.features
          .filter(f => f.properties.layer === 'slui:tombamentos_envoltorias_de_imoveis_CONPRESP')
          .map(f => f),
        geom_area_envoltoria_condephaat: intersections.features
          .filter(f => f.properties.layer === 'slui:tombamentos_envoltorias_de_imoveis_CONDEPHAAT')
          .map(f => f),
      };

      // If no fields are specified, return all fields
      if (!fields || fields.length === 0) {
        return allFields;
      }

      // Filter the response based on requested fields
      const response = {};
      fields.forEach(field => {
        if (field in allFields) {
          response[field] = allFields[field];
        }
      });

      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        'Error processing SQLC query',
      );
    }
  }

  private async getLotGeometry(sqlc: string): Promise<any> {
    // Format SQLC number based on length
    let formattedSqlc: string;
    if (sqlc.length === 10) {
      formattedSqlc = `${sqlc.substring(0, 3)} ${sqlc.substring(3, 6)} ${sqlc.substring(6, 10)} 00`;
    } else {
      formattedSqlc = `${sqlc.substring(0, 3)} ${sqlc.substring(3, 6)} ${sqlc.substring(6, 10)} ${sqlc.substring(10, 12)}`;
    }

    // Make WFS request to get the lot feature
    const wfsResponse = await this.httpService.get(this.geoserverUrl, {
      params: {
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName: 'slui:view_lote_cidadao',
        maxFeatures: 5,
        outputFormat: 'json',
        srsName: 'EPSG:31983',
        CQL_FILTER: `setor_quadra_lote_condominio = '${formattedSqlc}'`,
      },
      headers: {
        'accept': 'application/json',
        'origin': 'https://mapa.urbis.sampa.br',
      },
    }).toPromise();

    return wfsResponse;
  }
}
