import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as turf from '@turf/turf';
import {
  Feature,
  FeatureCollection,
  Polygon,
  MultiPolygon,
  Point,
  GeoJsonProperties,
} from 'geojson';
import { LayerSchemasService } from '../layer-schemas/layer-schemas.service';

/**
 * Interface for CIT (Cadastro Imobiliário Territorial) data
 */
interface CitData {
  setor_tributário: string;
  quadra_fiscal: string;
  lote_fiscal: string;
  nível_de_preservação: string | null;
  subprefeitura: string | null;
  descrição_da_preservação: string | null;
  endereço_secundário: string | null;
  denominação_do_bem: string | null;
  endereco_oficial: string | null;
  complemento: string | null;
  bairro: string | null;
  situacao_do_imovel: string | null;
}
/**
 * Interface for FeatureCollection properties
 */
interface GeospatialFeatureCollectionProperties {
  input: Feature<Polygon | MultiPolygon | Point>;
  totalArea: number;
  // Optional CIT metadata when an SQLC/SQC is provided with the input feature
  cit_data?: CitData | null;
}

/**
 * Interface for Feature properties
 */
interface GeospatialFeatureProperties extends GeoJsonProperties {
  totalArea: number;
  totalAreaPercentage: number;
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
 * Helper to identify tax lot features from various layer names or properties
 */
const isLotFeature = (f: any): boolean => {
  const layer = String(f?.properties?.layer || '').toLowerCase();
  const id = String(f?.id || '').toLowerCase();
  const hasTaxLotProps = Boolean(
    f?.properties?.cd_setor_fiscal &&
    f?.properties?.cd_quadra_fiscal &&
    f?.properties?.cd_lote,
  );
  return layer.includes('lote') || id.includes('lote') || hasTaxLotProps;
};

/**
 * Service for computing geospatial intersections between GeoJSON polygons and GeoServer layers
 */
@Injectable()
export class GeospatialIntersectionService {
  private readonly geoserverUrl =
    'https://geoserver.slui.dev/geoserver/slui/ows';

  private readonly fieldToLayerMap = {
    geom_zoneamento_2016: ['slui:zoneamento'],
    geom_subprefeitura: ['slui:subprefeitura'],
    geom_distrito: ['slui:distrito_municipal'],
    geom_tombado: [
      'slui:tombamentos_ambientais_ou_paisagisticos',
      'slui:tombamentos_envoltoria_de_imoveis',
      'slui:tombamentos_imoveis',
    ],
    geom_area_contaminada: ['slui:areas_contaminadas'],
    geom_melhoramento_viario: ['slui:minianel_viario'],
    geom_qualificacao_ambiental: ['slui:qualificacao_ambiental'],
    geom_area_manancial: ['slui:manancial_billings'],
    geom_area_manancial_guarapiranga: ['slui:manancial_guarapiranga'],
    geom_area_manancial_juquery: ['slui:manancial_juquery'],
    geom_area_envoltoria_iphan: [
      'slui:tombamentos_envoltorias_de_imoveis_IPHAN',
    ],
    geom_area_envoltoria_conpresp: [
      'slui:tombamentos_envoltorias_de_imoveis_CONPRESP',
    ],
    geom_area_envoltoria_condephaat: [
      'slui:tombamentos_envoltorias_de_imoveis_CONDEPHAAT',
    ],
  };

  constructor(
    private readonly httpService: HttpService,
    @Optional()
    private readonly layerSchemasService?: LayerSchemasService,
    @Optional()
    private readonly configService?: ConfigService,
  ) {}

  /**
   * Retrieves the maximum allowed polygon area for intersection queries in km²
   */
  private getMaxPolygonAreaKm2(): number {
    const configValue = this.configService?.get<number>(
      'maps.maxPolygonAreaKm2',
    );
    if (configValue !== undefined && !isNaN(Number(configValue))) {
      return Number(configValue);
    }
    const envValue = process.env.MAX_POLYGON_AREA_KM2;
    if (envValue !== undefined && !isNaN(parseFloat(envValue))) {
      return parseFloat(envValue);
    }
    return 25;
  }

  private getGeoServerAuthHeaders(targetUrl?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
      Accept: 'application/json, application/geo+json, */*',
    };

    let isAuthorizedGeoServer = true;
    if (targetUrl) {
      isAuthorizedGeoServer = targetUrl.includes('geoserver.slui.dev');
      try {
        if (process.env.GEOSERVER_BASE_URL) {
          isAuthorizedGeoServer =
            isAuthorizedGeoServer ||
            new URL(targetUrl).host ===
              new URL(process.env.GEOSERVER_BASE_URL).host;
        }
        if (process.env.GEOSERVER_URL) {
          isAuthorizedGeoServer =
            isAuthorizedGeoServer ||
            new URL(targetUrl).host === new URL(process.env.GEOSERVER_URL).host;
        }
      } catch {
        // ignore URL parsing error
      }
    }

    if (isAuthorizedGeoServer) {
      if (process.env.GEOSERVER_BEARER_TOKEN) {
        const token = process.env.GEOSERVER_BEARER_TOKEN.trim();
        headers['Authorization'] =
          token.startsWith('Bearer ') || token.startsWith('Basic ')
            ? token
            : `Bearer ${token}`;
      } else if (process.env.GEOSERVER_USER && process.env.GEOSERVER_PASSWORD) {
        const credentials = Buffer.from(
          `${process.env.GEOSERVER_USER}:${process.env.GEOSERVER_PASSWORD}`,
        ).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      }
    }

    return headers;
  }

  /**
   * Retrieves all active LayerSchemas from database with analysis and FIU flags, extracting their WFS typeNames
   */
  private async getAllLayerSchemas(): Promise<
    {
      typeName: string;
      schemaId?: string;
      schemaName?: string;
      origin?: string;
      includeInAnalysis: boolean;
      includeInFiu: boolean;
    }[]
  > {
    const result: {
      typeName: string;
      schemaId?: string;
      schemaName?: string;
      origin?: string;
      includeInAnalysis: boolean;
      includeInFiu: boolean;
    }[] = [];
    const seenTypes = new Set<string>();

    if (this.layerSchemasService) {
      try {
        const schemas = await this.layerSchemasService.findAll(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          true,
        );
        const schemaList = Array.isArray(schemas)
          ? schemas
          : schemas.data || [];

        for (const schema of schemaList) {
          if (schema.isActive === false) continue;

          let typeName = '';
          if (schema.origin) {
            try {
              const parsedUrl = new URL(schema.origin);
              typeName =
                parsedUrl.searchParams.get('typeName') ||
                parsedUrl.searchParams.get('layers') ||
                '';
            } catch {
              // Not a full URL
            }
          }

          if (!typeName && schema.properties) {
            typeName =
              schema.properties.layers ||
              schema.properties.typeName ||
              schema.properties.type_name ||
              '';
          }

          if (!typeName && schema.id) {
            typeName = schema.id.startsWith('slui:')
              ? schema.id
              : `slui:${schema.id}`;
          }

          const includeInAnalysis =
            schema.includeInAnalysis !== false &&
            schema.properties?.includeInAnalysis !== false;

          const includeInFiu =
            schema.includeInFiu !== false &&
            schema.properties?.includeInFiu !== false;

          if (typeName && !seenTypes.has(typeName)) {
            seenTypes.add(typeName);
            result.push({
              typeName,
              schemaId: schema.id,
              schemaName: schema.name,
              origin: schema.origin,
              includeInAnalysis,
              includeInFiu,
            });
          }
        }
      } catch (e) {
        console.warn(
          'Could not query LayerSchemas for intersections, falling back to defaults:',
          e,
        );
      }
    }

    // Fallback: If no schemas were found in database or minimal count, populate known standard layers
    const defaultLayers = [
      'slui:lote_cidadao',
      'slui:zoneamento',
      'slui:zoneamento_geral',
      'slui:distrito_municipal',
      'slui:subprefeitura',
      'slui:macroareas',
      'slui:macrozonas',
      'slui:setores',
      'slui:subsetores',
      'slui:eixos',
      'slui:minianel_viario',
      'slui:aguas_correntes',
      'slui:aguas_dormentes',
      'slui:qualificacao_ambiental',
      'slui:areas_contaminadas',
      'slui:risco_geologico',
      'slui:risco_hidrologico',
      'slui:tombamentos_imoveis',
      'slui:tombamentos_envoltoria_de_imoveis',
      'slui:tombamentos_ambientais_ou_paisagisticos',
      'slui:tombamentos_envoltorias_de_imoveis_IPHAN',
      'slui:tombamentos_envoltorias_de_imoveis_CONPRESP',
      'slui:tombamentos_envoltorias_de_imoveis_CONDEPHAAT',
      'slui:manancial_billings',
      'slui:manancial_guarapiranga',
      'slui:manancial_juquery',
      'slui:ZEIS_(PDE)',
      'slui:represas',
      'slui:restricoes_geotecnicas',
      'slui:terras_indigenas_funai',
      'slui:terrenos_marginais_aos_cursos_dagua_navegaveis',
    ];

    if (result.length === 0) {
      for (const def of defaultLayers) {
        if (!seenTypes.has(def)) {
          seenTypes.add(def);
          result.push({
            typeName: def,
            includeInAnalysis: true,
            includeInFiu: true,
          });
        }
      }
    }

    return result;
  }

  /**
   * Finds intersections between a GeoJSON polygon or point and multiple GeoServer layers
   * @param geojson - GeoJSON Feature with Polygon, MultiPolygon or Point geometry
   * @param specificLayers - Optional array of layer names to restrict the search
   * @param srsName - Optional SRS name for the query
   * @returns FeatureCollection containing intersecting features with area and layer metadata
   * @throws BadRequestException if GeoJSON is invalid
   * @throws InternalServerErrorException for server errors
   */
  async findIntersections(
    geojson: Feature<Polygon | MultiPolygon | Point>,
    specificLayers?: string[],
    _srsName: string = 'EPSG:31983',
  ): Promise<GeospatialFeatureCollection> {
    try {
      // Validate input GeoJSON
      if (
        !geojson?.geometry ||
        !['Polygon', 'MultiPolygon', 'Point'].includes(geojson.geometry.type)
      ) {
        throw new BadRequestException('Invalid or empty GeoJSON');
      }

      const isPoint = geojson.geometry.type === 'Point';
      const isMultiPolygon = geojson.geometry.type === 'MultiPolygon';

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const proj4Instance = require('proj4');
      const projWGS84 = '+proj=longlat +datum=WGS84';
      const projEPSG31983 =
        '+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';

      let wgs84PolygonGeometry: Feature<Polygon | MultiPolygon> | null = null;
      let wgs84PointGeometry: Feature<Point> | null = null;
      let epsg31983Bbox: number[];
      let inputArea = 0;

      if (isPoint) {
        const coords = geojson.geometry.coordinates as number[];
        const isInputUtm =
          Math.abs(coords[0]) > 180 || Math.abs(coords[1]) > 90;
        let wgs84Coords = coords;
        let utmCoords = coords;

        if (isInputUtm) {
          wgs84Coords = proj4Instance(projEPSG31983, projWGS84, coords);
        } else {
          utmCoords = proj4Instance(projWGS84, projEPSG31983, coords);
        }

        wgs84PointGeometry = turf.point(wgs84Coords);
        const margin = 100;
        epsg31983Bbox = [
          utmCoords[0] - margin,
          utmCoords[1] - margin,
          utmCoords[0] + margin,
          utmCoords[1] + margin,
        ];
      } else {
        // Prepare polygon geometry
        const polygonGeometry = isMultiPolygon
          ? turf.multiPolygon(geojson.geometry.coordinates as number[][][][])
          : turf.polygon(geojson.geometry.coordinates as number[][][]);

        // Calculate bbox and transform it to the default layer CRS: EPSG:31983
        const bbox = turf.bbox(polygonGeometry); // [minX, minY, maxX, maxY]
        const isInputUtm = Math.abs(bbox[0]) > 180 || Math.abs(bbox[1]) > 90;

        wgs84PolygonGeometry = polygonGeometry;

        if (isInputUtm) {
          const transformCoordsToWgs84 = (coords: any): any => {
            if (!Array.isArray(coords)) return coords;
            if (
              typeof coords[0] === 'number' &&
              typeof coords[1] === 'number'
            ) {
              return proj4Instance(projEPSG31983, projWGS84, [
                coords[0],
                coords[1],
              ]);
            }
            return coords.map(transformCoordsToWgs84);
          };
          const transformedCoordinates = transformCoordsToWgs84(
            polygonGeometry.geometry.coordinates,
          );
          wgs84PolygonGeometry = isMultiPolygon
            ? turf.multiPolygon(transformedCoordinates)
            : turf.polygon(transformedCoordinates);

          const margin = 100;
          epsg31983Bbox = [
            bbox[0] - margin,
            bbox[1] - margin,
            bbox[2] + margin,
            bbox[3] + margin,
          ];
        } else {
          // Input is in WGS84 (lon/lat), convert bbox corners to EPSG:31983 for GeoServer WFS 1.0.0 queries
          const p1 = proj4Instance(projWGS84, projEPSG31983, [
            bbox[0],
            bbox[1],
          ]);
          const p2 = proj4Instance(projWGS84, projEPSG31983, [
            bbox[2],
            bbox[3],
          ]);
          const minX = Math.min(p1[0], p2[0]);
          const minY = Math.min(p1[1], p2[1]);
          const maxX = Math.max(p1[0], p2[0]);
          const maxY = Math.max(p1[1], p2[1]);
          const margin = 100;
          epsg31983Bbox = [
            minX - margin,
            minY - margin,
            maxX + margin,
            maxY + margin,
          ];
        }

        inputArea = turf.area(wgs84PolygonGeometry);

        const maxAreaKm2 = this.getMaxPolygonAreaKm2();
        const maxAreaM2 = maxAreaKm2 * 1_000_000;

        if (inputArea > maxAreaM2) {
          const areaKm2 = (inputArea / 1_000_000).toFixed(2);
          throw new BadRequestException(
            `A área do polígono (${areaKm2} km²) excede o limite máximo permitido de ${maxAreaKm2} km². Reduza a área selecionada para realizar a análise.`,
          );
        }
      }

      const bboxParam = epsg31983Bbox.join(',');
      const isMicroQuery =
        isPoint ||
        inputArea < 0.1 ||
        Boolean((geojson.properties as any)?.isPointInspection);

      // Retrieve all registered layer schemas with metadata
      const allSchemas = await this.getAllLayerSchemas();
      const isFiu = Boolean(
        (geojson.properties as any)?.isFiu ||
        (geojson.properties as any)?.context === 'fiu',
      );

      const targetTypeNames = new Set<string>();

      // 1. Mandatory base layers:
      // If FIU context, include all layers with includeInFiu !== false.
      // If regular analysis, include all layers with includeInAnalysis !== false.
      for (const s of allSchemas) {
        if (isFiu) {
          if (s.includeInFiu) {
            targetTypeNames.add(s.typeName);
          }
        } else {
          if (s.includeInAnalysis) {
            targetTypeNames.add(s.typeName);
          }
        }
      }

      // 2. Specific layers requested by caller (e.g. active layers on map)
      if (
        specificLayers &&
        Array.isArray(specificLayers) &&
        specificLayers.length > 0
      ) {
        for (const req of specificLayers) {
          if (!req || typeof req !== 'string') continue;

          const cleanReq = req
            .replace(/^([a-zA-Z0-9_-]+):/, '')
            .toLowerCase()
            .trim();

          const matchingSchema = allSchemas.find((s) => {
            if (
              s.typeName === req ||
              s.schemaId === req ||
              s.schemaName === req
            ) {
              return true;
            }
            const cleanSchemaId = (s.schemaId || '')
              .replace(/^([a-zA-Z0-9_-]+):/, '')
              .toLowerCase()
              .trim();
            const cleanTypeName = (s.typeName || '')
              .replace(/^([a-zA-Z0-9_-]+):/, '')
              .toLowerCase()
              .trim();
            const cleanSchemaName = (s.schemaName || '')
              .replace(/^([a-zA-Z0-9_-]+):/, '')
              .toLowerCase()
              .trim();

            if (
              cleanReq &&
              cleanSchemaId &&
              (cleanReq === cleanSchemaId ||
                cleanReq.includes(cleanSchemaId) ||
                cleanSchemaId.includes(cleanReq))
            ) {
              return true;
            }
            if (
              cleanReq &&
              cleanTypeName &&
              (cleanReq === cleanTypeName ||
                cleanReq.includes(cleanTypeName) ||
                cleanTypeName.includes(cleanReq))
            ) {
              return true;
            }
            if (
              cleanReq &&
              cleanSchemaName &&
              (cleanReq === cleanSchemaName ||
                cleanReq.includes(cleanSchemaName) ||
                cleanSchemaName.includes(cleanReq))
            ) {
              return true;
            }
            return false;
          });

          if (matchingSchema) {
            if (isFiu) {
              if (matchingSchema.includeInFiu) {
                targetTypeNames.add(matchingSchema.typeName);
              }
            } else {
              targetTypeNames.add(matchingSchema.typeName);
            }
          } else if (!isFiu) {
            targetTypeNames.add(req.includes(':') ? req : `slui:${req}`);
          }
        }
      }

      let layers = Array.from(targetTypeNames);
      if (layers.length === 0) {
        layers = allSchemas.map((s) => s.typeName);
      }

      // Query layers and compute intersections concurrently
      const features: Feature<
        Polygon | MultiPolygon,
        GeospatialFeatureProperties
      >[] = [];

      const geoserverOwsUrl =
        process.env.GEOSERVER_BASE_URL ||
        (process.env.GEOSERVER_URL
          ? `${process.env.GEOSERVER_URL.replace(/\/$/, '')}/slui/ows`
          : 'https://geoserver.slui.dev/geoserver/slui/ows');

      await Promise.all(
        layers.map(async (layer) => {
          try {
            const schemaInfo = allSchemas.find((s) => s.typeName === layer);
            let targetOwsUrl = geoserverOwsUrl;
            if (schemaInfo?.origin && schemaInfo.origin.startsWith('http')) {
              try {
                const parsed = new URL(schemaInfo.origin);
                targetOwsUrl = `${parsed.origin}${parsed.pathname}`;
              } catch {
                // Keep default
              }
            }

            const querySrs = 'EPSG:4326';
            const url = `${targetOwsUrl}?service=WFS&version=1.0.0&request=GetFeature&bbox=${bboxParam}&typeName=${layer}&maxFeatures=10000&outputFormat=json&srsName=${querySrs}`;

            const headers = this.getGeoServerAuthHeaders(targetOwsUrl);

            const response = await firstValueFrom(
              this.httpService.get(url, { headers, timeout: 30000 }),
            );

            if (response.data?.features) {
              const normalizeCoordsToWgs84 = (coords: any): any => {
                if (!Array.isArray(coords)) return coords;
                if (
                  typeof coords[0] === 'number' &&
                  typeof coords[1] === 'number'
                ) {
                  if (Math.abs(coords[0]) > 180 || Math.abs(coords[1]) > 90) {
                    return proj4Instance(projEPSG31983, projWGS84, [
                      coords[0],
                      coords[1],
                    ]);
                  }
                  return [coords[0], coords[1]];
                }
                return coords.map(normalizeCoordsToWgs84);
              };

              for (const feature of response.data.features) {
                try {
                  const normalizedCoords = normalizeCoordsToWgs84(
                    feature.geometry?.coordinates,
                  );
                  if (!normalizedCoords) continue;

                  const featureGeometry: any =
                    feature.geometry.type === 'MultiPolygon'
                      ? turf.multiPolygon(normalizedCoords)
                      : turf.polygon(normalizedCoords);

                  if (isPoint && wgs84PointGeometry) {
                    const isInside = turf.booleanPointInPolygon(
                      wgs84PointGeometry,
                      featureGeometry,
                    );
                    if (isInside) {
                      const newFeature: Feature<
                        Polygon | MultiPolygon,
                        GeospatialFeatureProperties
                      > = {
                        ...feature,
                        geometry: {
                          ...feature.geometry,
                          coordinates: normalizedCoords,
                        },
                        properties: {
                          ...feature.properties,
                          totalArea: 0,
                          totalAreaPercentage: 100,
                          smallerPolygonAreaPercentage: 100,
                          layer,
                          layerSchemaId: schemaInfo?.schemaId,
                          layerSchemaName: schemaInfo?.schemaName,
                        },
                      };
                      features.push(newFeature);
                    }
                  } else if (wgs84PolygonGeometry) {
                    const intersection = turf.intersect(
                      turf.featureCollection([
                        featureGeometry,
                        wgs84PolygonGeometry,
                      ]),
                    );
                    if (intersection) {
                      const intersectionArea = turf.area(intersection);
                      if (intersectionArea <= 0) continue;

                      const featureArea = turf.area(featureGeometry);
                      const smallerPolygonArea = Math.min(
                        inputArea,
                        featureArea,
                      );
                      const smallerPolygonPercentage =
                        smallerPolygonArea > 0
                          ? (intersectionArea / smallerPolygonArea) * 100
                          : 0;

                      const totalAreaPercentage =
                        inputArea > 0
                          ? (intersectionArea / inputArea) * 100
                          : 0;

                      // Skip micro slivers and negligible boundary touches on regular polygons
                      if (
                        !isMicroQuery &&
                        (totalAreaPercentage < 0.05 ||
                          intersectionArea < 0.2 ||
                          (intersectionArea < 1 &&
                            smallerPolygonPercentage < 0.1))
                      ) {
                        continue;
                      }

                      const newFeature: Feature<
                        Polygon | MultiPolygon,
                        GeospatialFeatureProperties
                      > = {
                        ...feature,
                        geometry: {
                          ...feature.geometry,
                          coordinates: normalizedCoords,
                        },
                        properties: {
                          ...feature.properties,
                          totalArea: intersectionArea,
                          totalAreaPercentage,
                          smallerPolygonAreaPercentage:
                            smallerPolygonPercentage,
                          layer,
                          layerSchemaId: schemaInfo?.schemaId,
                          layerSchemaName: schemaInfo?.schemaName,
                        },
                      };
                      features.push(newFeature);
                    }
                  }
                } catch (error) {
                  console.error(
                    `Error calculating intersection for layer ${layer}:`,
                    error,
                  );
                }
              }
            }
          } catch (error) {
            console.error(
              `Error querying GeoServer for layer ${layer}:`,
              error,
            );
          }
        }),
      );

      // Enrich lot features with CIT data (per-lot)
      try {
        const lotFeatures = features.filter(isLotFeature);

        // Build a unique set of 10-digit SQLC (setor+quadra+lote)
        const sqlc10Set = new Set<string>();
        const getSqlc10FromProperties = (
          props: Record<string, any>,
        ): string | null => {
          // Preferred fields
          const setor = props?.cd_setor_fiscal?.toString()?.padStart(3, '0');
          const quadra = props?.cd_quadra_fiscal?.toString()?.padStart(3, '0');
          const lote = props?.cd_lote?.toString()?.padStart(4, '0');
          if (setor && quadra && lote) {
            return `${setor}${quadra}${lote}`;
          }
          // Fallback: parse combined field (e.g., "038 114 0062 00")
          const combined: string | undefined =
            props?.setor_quadra_lote_condominio;
          if (combined) {
            const onlyDigits = String(combined).replace(/\D/g, '');
            if (onlyDigits.length >= 10) {
              return onlyDigits.substring(0, 10);
            }
          }
          // Fallback: any other sqlc-like field
          const rawSqlc: string | undefined =
            props?.cd_sql || props?.sqlc || props?.sqc;
          if (rawSqlc) {
            const onlyDigits = String(rawSqlc).replace(/\D/g, '');
            if (onlyDigits.length >= 10) {
              return onlyDigits.substring(0, 10);
            }
          }
          return null;
        };

        for (const lf of lotFeatures) {
          const key = getSqlc10FromProperties(lf.properties || {});
          if (key) sqlc10Set.add(key);
        }

        if (sqlc10Set.size > 0) {
          const sqlc10List = Array.from(sqlc10Set.values());
          const citMap = new Map<string, CitData | null>();

          await Promise.all(
            sqlc10List.map(async (sqlc10) => {
              try {
                const data = await this.getCitData(sqlc10);
                citMap.set(sqlc10, data);
              } catch (e) {
                console.error('Error fetching CIT for', sqlc10, e);
                citMap.set(sqlc10, null);
              }
            }),
          );

          // Attach cit_data to each lot feature
          for (const lf of lotFeatures) {
            const key = getSqlc10FromProperties(lf.properties || {});
            if (key) {
              (lf.properties as any).cit_data = citMap.get(key) ?? null;
            }
          }
        }
      } catch (e) {
        // Do not break main response if CIT enrichment fails
        console.error('Error enriching lote_cidadao with CIT data:', e);
      }
      // Return feature collection
      return {
        type: 'FeatureCollection',
        properties: {
          input: geojson,
          totalArea: isPoint ? 0 : inputArea,
        },
        features,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error processing geospatial intersection:', error);
      throw new InternalServerErrorException(error?.message || 'Server error');
    }
  }

  async findIntersectionsBySqlc(sqlc: string, fields?: string[]): Promise<any> {
    try {
      // Validate SQLC length
      if (sqlc.length !== 10 && sqlc.length !== 12) {
        throw new BadRequestException('SQLC number must be 10 or 12 digits');
      }

      // Get lot geometry from WFS
      const wfsResponse = await this.getLotGeometry(sqlc);

      if (
        !wfsResponse.data ||
        !wfsResponse.data.features ||
        wfsResponse.data.features.length === 0
      ) {
        throw new NotFoundException(
          'No lot found for the provided SQLC number',
        );
      }

      // Get the first feature (lot geometry)
      const lotFeature = wfsResponse.data.features[0];

      // Get CIT data using the first 10 digits of SQLC
      const citData = await this.getCitData(sqlc.substring(0, 10));

      // Determine which layers we need based on requested fields
      let requiredLayers: string[] = [];

      if (!fields || fields.length === 0) {
        // If no fields specified, get all layers
        requiredLayers = Object.values(this.fieldToLayerMap).flat();
      } else {
        // Get unique layers for requested fields
        requiredLayers = [
          ...new Set(
            fields
              .filter((field) => field in this.fieldToLayerMap)
              .flatMap((field) => this.fieldToLayerMap[field]),
          ),
        ];
      }

      // Get intersections with specific layers using EPSG:31983
      const intersections = await this.findIntersections(
        lotFeature,
        requiredLayers,
        'EPSG:31983',
      );

      // Structure the response
      const allFields = {
        cd_sql: sqlc,
        cit_data: citData,
        perimetro: lotFeature,
        geom_lote: lotFeature.geometry,
        geom_zoneamento_2016: intersections.features
          .filter((f) => f.properties.layer === 'slui:zoneamento')
          .map((f) => f),
        geom_subprefeitura: intersections.features
          .filter((f) => f.properties.layer === 'slui:subprefeitura')
          .map((f) => f),
        geom_distrito: intersections.features
          .filter((f) => f.properties.layer === 'slui:distrito_municipal')
          .map((f) => f),
        geom_tombado: intersections.features
          .filter((f) =>
            [
              'slui:tombamentos_ambientais_ou_paisagisticos',
              'slui:tombamentos_envoltoria_de_imoveis',
              'slui:tombamentos_imoveis',
            ].includes(f.properties.layer),
          )
          .map((f) => f),
        geom_uc: [],
        geom_apa: [],
        geom_area_contaminada: intersections.features
          .filter((f) => f.properties.layer === 'slui:areas_contaminadas')
          .map((f) => f),
        geom_melhoramento_viario: intersections.features
          .filter((f) => f.properties.layer === 'slui:minianel_viario')
          .map((f) => f),
        geom_area_manancial: intersections.features
          .filter((f) => f.properties.layer === 'slui:manancial_billings')
          .map((f) => f),
        geom_area_manancial_guarapiranga: intersections.features
          .filter((f) => f.properties.layer === 'slui:manancial_guarapiranga')
          .map((f) => f),
        geom_area_manancial_juquery: intersections.features
          .filter((f) => f.properties.layer === 'slui:manancial_juquery')
          .map((f) => f),
        geom_area_envoltoria_iphan: intersections.features
          .filter(
            (f) =>
              f.properties.layer ===
              'slui:tombamentos_envoltorias_de_imoveis_IPHAN',
          )
          .map((f) => f),
        geom_area_envoltoria_conpresp: intersections.features
          .filter(
            (f) =>
              f.properties.layer ===
              'slui:tombamentos_envoltorias_de_imoveis_CONPRESP',
          )
          .map((f) => f),
        geom_area_envoltoria_condephaat: intersections.features
          .filter(
            (f) =>
              f.properties.layer ===
              'slui:tombamentos_envoltorias_de_imoveis_CONDEPHAAT',
          )
          .map((f) => f),
      };

      // If no fields are specified, return all fields
      if (!fields || fields.length === 0) {
        return allFields;
      }

      // Filter the response based on requested fields
      const response = {};
      fields.forEach((field) => {
        if (field in allFields) {
          response[field] = allFields[field];
        }
      });

      return response;
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error?.message || 'Error processing SQLC query',
      );
    }
  }

  private async getCitData(sqlc: string): Promise<CitData | null> {
    try {
      // Format SQLC for CIT featureID (using only the first 10 digits)
      // Format: cit.XXX.XXX.XXXX (e.g., cit.038.114.0062)
      const setor = sqlc.substring(0, 3);
      const quadra = sqlc.substring(3, 6);
      const lote = sqlc.substring(6, 10);
      const featureId = `cit.${setor}.${quadra}.${lote}`;

      // Make WFS request to get CIT data
      const citUrl = `https://geoserver.slui.dev/geoserver/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=slui:cit&featureID=${featureId}&outputFormat=application/json`;

      const response = await firstValueFrom(
        this.httpService.get(citUrl, {
          headers: this.getGeoServerAuthHeaders(citUrl),
          timeout: 10000,
        }),
      );

      if (response.data?.features && response.data.features.length > 0) {
        return response.data.features[0].properties;
      }

      return null;
    } catch (error) {
      console.error('Error fetching CIT data:', error);
      return null;
    }
  }

  private async getLotGeometry(sqlc: string): Promise<any> {
    // Extract SQLC parts
    const setor = sqlc.substring(0, 3);
    const quadra = sqlc.substring(3, 6);
    const lote = sqlc.substring(6, 10);

    const typeNames = [
      'slui:lote_cidadao',
      'slui:lotes_fiscais',
      'slui:view_lote_cidadao',
    ];

    const authHeaders = this.getGeoServerAuthHeaders(this.geoserverUrl);

    for (const typeName of typeNames) {
      try {
        const wfsResponse = await firstValueFrom(
          this.httpService.get(this.geoserverUrl, {
            params: {
              service: 'WFS',
              version: '1.0.0',
              request: 'GetFeature',
              typeName,
              maxFeatures: 5,
              outputFormat: 'json',
              srsName: 'EPSG:31983',
              CQL_FILTER: `cd_setor_fiscal = '${setor}' AND cd_quadra_fiscal = '${quadra}' AND cd_lote = '${lote}'`,
            },
            headers: {
              ...authHeaders,
              accept: 'application/json',
              origin: 'https://mapa.urbis.prefeitura.sp.gov.br',
            },
            timeout: 15000,
          }),
        );

        if (wfsResponse?.data?.features?.length > 0) {
          return wfsResponse;
        }
      } catch {
        // Continue to fallback
      }
    }

    try {
      // Make WFS request to get the lot feature
      const wfsResponse = await firstValueFrom(
        this.httpService.get(this.geoserverUrl, {
          params: {
            service: 'WFS',
            version: '1.0.0',
            request: 'GetFeature',
            typeName: 'slui:lote_cidadao',
            maxFeatures: 5,
            outputFormat: 'json',
            srsName: 'EPSG:31983',
            CQL_FILTER: `cd_setor_fiscal = '${setor}' AND cd_quadra_fiscal = '${quadra}' AND cd_lote = '${lote}'`,
          },
          headers: {
            ...authHeaders,
            accept: 'application/json',
            origin: 'https://mapa.urbis.prefeitura.sp.gov.br',
          },
          timeout: 15000,
        }),
      );

      return wfsResponse;
    } catch (err: any) {
      console.error('Error fetching from GeoServer:', err?.message || err);
      if (err.response && err.response.data) {
        console.error('GeoServer response data:', err.response.data);
      }
      throw new InternalServerErrorException('Error contacting GeoServer');
    }
  }
}
