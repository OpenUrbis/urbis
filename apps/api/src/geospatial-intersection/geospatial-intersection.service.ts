import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as turf from '@turf/turf';
import { Feature, FeatureCollection, Polygon, MultiPolygon, GeoJsonProperties } from 'geojson';
import { formatBoundsForURL, transformBoundsToUTM } from './utils';
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
  constructor(private readonly httpService: HttpService) {}

  /**
   * Finds intersections between a GeoJSON polygon and multiple GeoServer layers
   * @param geojson - GeoJSON Feature with Polygon or MultiPolygon geometry
   * @returns FeatureCollection containing intersecting features with area and layer metadata
   * @throws BadRequestException if GeoJSON is invalid
   * @throws InternalServerErrorException for server errors
   */
  async findIntersections(geojson: Feature<Polygon | MultiPolygon>): Promise<GeospatialFeatureCollection> {
    try {
      // Validate input GeoJSON
      if (!geojson?.geometry || !['Polygon', 'MultiPolygon'].includes(geojson.geometry.type)) {
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
      const utmBounds = bounds.map(([lng, lat]) => transformBoundsToUTM([lng, lat]));
      const formattedBounds = formatBoundsForURL([
        utmBounds[0][0],
        utmBounds[0][1],
        utmBounds[1][0],
        utmBounds[1][1],
      ]);

      // Define GeoServer layers
      const layers = [
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

      // Query layers and compute intersections
      const features: Feature<Polygon | MultiPolygon, GeospatialFeatureProperties>[] = [];
      for (const layer of layers) {
        const url = `https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&bbox=${formattedBounds}&typeName=${layer}&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326`;
        const response = await firstValueFrom(this.httpService.get(url));

        if (response.data?.features) {
          for (const feature of response.data.features) {
            try {
              const featureGeometry: any = feature.geometry.type === 'MultiPolygon'
                ? turf.multiPolygon(feature.geometry.coordinates)
                : turf.polygon(feature.geometry.coordinates);

              const intersection = turf.intersect(
                turf.featureCollection([featureGeometry, polygonGeometry]),
              );
              if (intersection) {
                const newFeature: Feature<Polygon | MultiPolygon, GeospatialFeatureProperties> = {
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
              console.error(`Error calculating intersection for layer ${layer}:`, error);
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
}