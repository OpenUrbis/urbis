import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { ExportGeoJsonDto } from './dto/export-geojson.dto';
import { LayerSchema } from '../layer-schemas/entities/layer-schema.entity';
import { FeatureCollection, Feature } from 'geojson';
import { convertToDxf } from './dxf-utils';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  // Constants for projection
  private readonly projWGS84 = '+proj=longlat +datum=WGS84';
  private readonly projEPSG31983 =
    '+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(LayerSchema)
    private readonly layerSchemaRepository: Repository<LayerSchema>,
  ) {}

  async exportGeoJson(
    dto: ExportGeoJsonDto,
  ): Promise<FeatureCollection | string> {
    const { bounds, layers: layerIds, zoom, format } = dto;
    this.logger.log(
      `Export request for layers: ${layerIds.join(', ')}, zoom: ${zoom}, bounds: ${bounds.join(',')}`,
    );

    const features: Feature[] = [];
    const MAX_FEATURES = 1000;

    // Use WGS84 bounds directly for WFS query to avoid projection issues
    // bounds: [minLon, minLat, maxLon, maxLat]
    // Using Lon/Lat order which is safer for default GeoServer configurations even in 1.1.0 if not using URN
    const bboxParam = `${bounds[0]},${bounds[1]},${bounds[2]},${bounds[3]}`;
    this.logger.log(`BBOX EPSG:4326: ${bboxParam}`);

    // Fetch schemas from DB
    const schemas = await this.layerSchemaRepository.find({
      where: { id: In(layerIds) },
    });
    this.logger.log(`Found ${schemas.length} schemas in DB.`);

    const skippedByZoom: string[] = [];

    for (const schema of schemas) {
      this.logger.log(`Processing layer: ${schema.id}`);

      if (features.length >= MAX_FEATURES) {
        this.logger.warn(
          `Max features limit reached before layer ${schema.id}`,
        );
        throw new BadRequestException(
          `Limite de ${MAX_FEATURES} feições excedido. Por favor, aproxime mais o mapa para reduzir a quantidade de dados.`,
        );
      }

      // Check Zoom Level
      if (
        typeof zoom === 'number' &&
        typeof schema.minZoom === 'number' &&
        zoom < schema.minZoom
      ) {
        this.logger.log(
          `Skipping layer ${schema.id} due to zoom limit (minZoom: ${schema.minZoom}, current: ${zoom})`,
        );
        skippedByZoom.push(schema.name || schema.id);
        continue;
      }

      const wfsInfo = this.extractWfsInfo(schema);
      if (!wfsInfo) {
        this.logger.warn(
          `Layer ${schema.id} is not WFS exportable (missing info).`,
        );
        continue;
      }

      // Merge override filter from externalLayers
      if (dto.externalLayers) {
        const override = dto.externalLayers.find((e) => e.id === schema.id);
        if (override && override.cqlFilter) {
          if (wfsInfo.cqlFilter) {
            wfsInfo.cqlFilter = `(${wfsInfo.cqlFilter}) AND (${override.cqlFilter})`;
          } else {
            wfsInfo.cqlFilter = override.cqlFilter;
          }
        }
      }

      try {
        const limit = MAX_FEATURES - features.length + 1;
        this.logger.log(
          `Fetching WFS data for ${schema.id} (typeName: ${wfsInfo.typeName}) with limit ${limit}`,
        );

        const layerFeatures = await this.fetchLayerData(
          wfsInfo,
          bboxParam,
          limit,
        );

        this.logger.log(
          `Fetched ${layerFeatures.length} features for ${schema.id}`,
        );

        if (features.length + layerFeatures.length > MAX_FEATURES) {
          throw new BadRequestException(
            `Limite de ${MAX_FEATURES} feições excedido. Por favor, aproxime mais o mapa para reduzir a quantidade de dados.`,
          );
        }

        features.push(...layerFeatures);
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        this.logger.error(`Failed to fetch data for layer ${schema.id}`, error);
      }
    }

    if (dto.externalLayers) {
      for (const extLayer of dto.externalLayers) {
        this.logger.log(`Processing external layer: ${extLayer.id}`);

        if (features.length >= MAX_FEATURES) {
          this.logger.warn(
            `Max features limit reached before external layer ${extLayer.id}`,
          );
          throw new BadRequestException(
            `Limite de ${MAX_FEATURES} feições excedido. Por favor, aproxime mais o mapa para reduzir a quantidade de dados.`,
          );
        }

        // Check Zoom Level
        if (
          typeof zoom === 'number' &&
          typeof extLayer.minZoom === 'number' &&
          zoom < extLayer.minZoom
        ) {
          this.logger.log(
            `Skipping external layer ${extLayer.id} due to zoom limit (minZoom: ${extLayer.minZoom}, current: ${zoom})`,
          );
          skippedByZoom.push(extLayer.id);
          continue;
        }

        try {
          const limit = MAX_FEATURES - features.length + 1;
          this.logger.log(
            `Fetching WFS data for external ${extLayer.id} (typeName: ${extLayer.typeName}) with limit ${limit}`,
          );

          const layerFeatures = await this.fetchLayerData(
            extLayer,
            bboxParam,
            limit,
          );
          this.logger.log(
            `Fetched ${layerFeatures.length} features for external ${extLayer.id}`,
          );

          if (features.length + layerFeatures.length > MAX_FEATURES) {
            throw new BadRequestException(
              `Limite de ${MAX_FEATURES} feições excedido. Por favor, aproxime mais o mapa para reduzir a quantidade de dados.`,
            );
          }
          features.push(...layerFeatures);
        } catch (error) {
          if (error instanceof BadRequestException) {
            throw error;
          }
          this.logger.error(
            `Failed to fetch data for external layer ${extLayer.id}`,
            error,
          );
        }
      }
    }

    if (features.length === 0 && skippedByZoom.length > 0) {
      throw new BadRequestException(
        `Nenhuma feição exportada. As seguintes camadas requerem maior zoom para serem visualizadas/exportadas: ${skippedByZoom.join(
          ', ',
        )}`,
      );
    }

    const result: FeatureCollection = {
      type: 'FeatureCollection',
      features: features,
    };

    if (format === 'dwg') {
      return convertToDxf(result);
    }

    return result;
  }

  private extractWfsInfo(schema: LayerSchema) {
    let typeName =
      schema.properties?.layers ||
      schema.properties?.typeName ||
      schema.properties?.type_name;
    const wfsUrl = schema.origin;
    let cqlFilter =
      schema.properties?.cql_filter || schema.properties?.cqlFilter;

    if ((!typeName || !cqlFilter) && wfsUrl) {
      try {
        const urlObj = new URL(wfsUrl); // Assuming valid URL
        if (!typeName) {
          typeName =
            urlObj.searchParams.get('typeName') ||
            urlObj.searchParams.get('typename') ||
            urlObj.searchParams.get('layers');
        }
        if (!cqlFilter) {
          cqlFilter =
            urlObj.searchParams.get('CQL_FILTER') ||
            urlObj.searchParams.get('cql_filter');
        }
      } catch (_e) {
        // ignore
      }
    }

    if (typeName && wfsUrl) {
      return {
        id: schema.id,
        typeName: Array.isArray(typeName) ? typeName.join(',') : typeName,
        wfsUrl,
        cqlFilter,
      };
    }
    return null;
  }

  private async getGeometryColumnName(
    wfsUrl: string,
    typeName: string,
  ): Promise<string> {
    try {
      const params = {
        service: 'WFS',
        version: '1.1.0',
        request: 'DescribeFeatureType',
        typeName: typeName,
        outputFormat: 'application/json',
      };

      const headers: Record<string, string> = {};
      let isAuthorizedGeoServer = wfsUrl.includes('geoserver.slui.dev');
      try {
        if (process.env.GEOSERVER_BASE_URL) {
          isAuthorizedGeoServer =
            isAuthorizedGeoServer ||
            new URL(wfsUrl).host ===
              new URL(process.env.GEOSERVER_BASE_URL).host;
        }
        if (process.env.GEOSERVER_URL) {
          isAuthorizedGeoServer =
            isAuthorizedGeoServer ||
            new URL(wfsUrl).host === new URL(process.env.GEOSERVER_URL).host;
        }
      } catch {
        // ignore URL parsing errors
      }

      if (isAuthorizedGeoServer) {
        if (process.env.GEOSERVER_BEARER_TOKEN) {
          const token = process.env.GEOSERVER_BEARER_TOKEN.trim();
          headers['Authorization'] =
            token.startsWith('Bearer ') || token.startsWith('Basic ')
              ? token
              : `Bearer ${token}`;
        } else if (
          process.env.GEOSERVER_USER &&
          process.env.GEOSERVER_PASSWORD
        ) {
          const credentials = Buffer.from(
            `${process.env.GEOSERVER_USER}:${process.env.GEOSERVER_PASSWORD}`,
          ).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
      }

      const response = await firstValueFrom(
        this.httpService.get(wfsUrl, { params, headers }),
      );

      if (
        response.data &&
        response.data.featureTypes &&
        response.data.featureTypes[0]
      ) {
        const properties = response.data.featureTypes[0].properties;
        const geomProp = properties.find(
          (p: any) =>
            p.type.includes('gml:') ||
            p.type.includes('Geometry') ||
            p.type.includes('Point') ||
            p.type.includes('Curve') ||
            p.type.includes('Surface'),
        );
        return geomProp ? geomProp.name : 'the_geom';
      }
    } catch (e) {
      this.logger.warn(
        `Failed to describe feature type for ${typeName}, defaulting to 'the_geom'`,
        e,
      );
    }
    return 'the_geom';
  }

  private async fetchLayerData(
    layer: {
      id: string;
      wfsUrl: string;
      typeName: string;
      cqlFilter?: string;
    },
    bboxParam: string,
    limit: number,
  ): Promise<Feature[]> {
    let wfsUrl =
      layer.wfsUrl || 'https://geoserver.slui.dev/geoserver/slui/ows';
    const originParams: Record<string, string> = {};

    // Parse URL to extract base and existing params
    try {
      const urlObj = new URL(wfsUrl);
      wfsUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
      urlObj.searchParams.forEach((value, key) => {
        originParams[key] = value;
      });
    } catch {
      // ignore invalid url, keep original wfsUrl
    }

    // Construct URL params (merging origin params with overrides)
    const params: any = {
      ...originParams,
      service: 'WFS',
      version: '1.1.0',
      request: 'GetFeature',
      typeName: layer.typeName,
      outputFormat: 'json',
      srsName: 'EPSG:4326', // Request output in WGS84
      maxFeatures: limit,
    };

    if (layer.cqlFilter) {
      // Need geometry column name for BBOX CQL with SRS
      const geomCol = await this.getGeometryColumnName(wfsUrl, layer.typeName);
      params.CQL_FILTER = `(${layer.cqlFilter}) AND BBOX(${geomCol}, ${bboxParam}, 'EPSG:4326')`;
    } else {
      params.bbox = `${bboxParam},EPSG:4326`;
    }

    try {
      const headers: Record<string, string> = {};
      let isAuthorizedGeoServer = wfsUrl.includes('geoserver.slui.dev');
      try {
        if (process.env.GEOSERVER_BASE_URL) {
          isAuthorizedGeoServer =
            isAuthorizedGeoServer ||
            new URL(wfsUrl).host ===
              new URL(process.env.GEOSERVER_BASE_URL).host;
        }
        if (process.env.GEOSERVER_URL) {
          isAuthorizedGeoServer =
            isAuthorizedGeoServer ||
            new URL(wfsUrl).host === new URL(process.env.GEOSERVER_URL).host;
        }
      } catch {
        // ignore URL parsing errors
      }

      if (isAuthorizedGeoServer) {
        if (process.env.GEOSERVER_BEARER_TOKEN) {
          const token = process.env.GEOSERVER_BEARER_TOKEN.trim();
          headers['Authorization'] =
            token.startsWith('Bearer ') || token.startsWith('Basic ')
              ? token
              : `Bearer ${token}`;
        } else if (
          process.env.GEOSERVER_USER &&
          process.env.GEOSERVER_PASSWORD
        ) {
          const credentials = Buffer.from(
            `${process.env.GEOSERVER_USER}:${process.env.GEOSERVER_PASSWORD}`,
          ).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
      }

      this.logger.log(
        `WFS Request: ${wfsUrl} params: ${JSON.stringify(params)}`,
      );
      const response = await firstValueFrom(
        this.httpService.get(wfsUrl, { params, headers }),
      );

      if (response.data && response.data.type === 'FeatureCollection') {
        const feats = response.data.features as Feature[];
        // Add metadata to features
        return feats.map((f) => ({
          ...f,
          properties: {
            ...f.properties,
            _layerId: layer.id,
          },
        }));
      } else {
        const dataPreview =
          typeof response.data === 'string'
            ? response.data.substring(0, 500)
            : JSON.stringify(response.data).substring(0, 500);
        this.logger.warn(
          `WFS response for ${layer.id} is not FeatureCollection. Type: ${response.data?.type}. Data: ${dataPreview}`,
        );
      }
    } catch (e) {
      this.logger.error(`Error fetching layer ${layer.typeName}`, e);
      if (e.response) {
        this.logger.error(
          `WFS Error Response: ${JSON.stringify(e.response.data)}`,
        );
      }
      throw e;
    }

    return [];
  }
}
