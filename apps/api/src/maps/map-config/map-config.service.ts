import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as turf from '@turf/turf';
import { firstValueFrom } from 'rxjs';
import { IsNull, Repository } from 'typeorm';
import { LayerGroup } from './../layer-groups/entities/layer-group.entity';
import { LayerSchema } from './../layer-schemas/entities/layer-schema.entity';
import { AccessControl } from 'common/guards/access-control/access-control';
import { TextLayerDtoResponse } from './dto/text-layer.dto';
import { UpdateMapConfigDto } from './dto/update-map-config.dto';
import { MapConfig, MapConfigType } from './entities/map-config.entity';

@Injectable()
export class MapConfigService {
  constructor(
    @InjectRepository(MapConfig)
    private readonly repository: Repository<MapConfig>,
    @InjectRepository(LayerGroup)
    private readonly layerGroup: Repository<LayerGroup>,
    @InjectRepository(LayerSchema)
    private readonly layerSchemas: Repository<LayerSchema>,

    private readonly httpService: HttpService,
  ) {}

  async getConfigs(accessControl?: AccessControl) {
    const result: any = {};

    result.layerGroups = await this.layerGroup.find({
      where: { ownerGroup: IsNull() },
      order: { index: 'ASC', name: 'ASC' },
      relations: [
        'childGroups',
        'childGroups.childGroups',
        'childGroups.childGroups.childGroups',
      ],
    });

    const userRoleIds = accessControl?.roles.map((role) => role.id) ?? [];

    const layerQuery = this.layerSchemas
      .createQueryBuilder('layerSchema')
      .leftJoinAndSelect('layerSchema.colors', 'colors')
      .where(
        accessControl?.isAdminMaster()
          ? '1 = 1'
          : '(layerSchema.isPublic = :isPublicTrue OR layerSchema.isPublic IS NULL OR (layerSchema.isPublic = :isPublicFalse AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(layerSchema.allowedRoles, $$[]$$::jsonb)) AS role_id WHERE role_id IN (:...roles))))',
        {
          isPublicTrue: true,
          isPublicFalse: false,
          roles: userRoleIds.length > 0 ? userRoleIds : ['__no_role__'],
        },
      )
      .orderBy('layerSchema.index', 'ASC')
      .addOrderBy('layerSchema.name', 'ASC');

    result.layerSchemas = await layerQuery.getMany();

    const mapConfig = await this.repository.find();
    mapConfig.forEach(({ id, value }) => {
      result[id] =
        (value as any)?.literally === null ||
        (value as any)?.literally === undefined
          ? value
          : (value as any).literally;
    });

    return result;
  }

  async findAll(): Promise<MapConfig[]> {
    return this.repository.find({
      order: {
        id: 'ASC',
      },
    });
  }

  async getTextLayer(
    { origin, ...params }: any,
    _headers?: Record<string, string>,
  ): Promise<TextLayerDtoResponse[]> {
    try {
      let targetUrl = origin as string;
      const headers: Record<string, string> = {};

      if (targetUrl.includes('/maps/proxy/layers/')) {
        // It is a self-request pointing to a layer proxy!
        // Extract the layer ID and all of the original search parameters from the origin URL!
        const urlObj = new URL(targetUrl);
        const originParams = Object.fromEntries(urlObj.searchParams.entries());

        const pathParts = urlObj.pathname
          .split('/maps/proxy/layers/')[1]
          .split('/');
        const layerId = pathParts[0];

        // Resolve coordinates segments for cells if needed (e.g. cell-lotes-...)
        const cellMatch = layerId.match(
          /^cell-(.+?)-[0-9_#-]+-[0-9_#-]+-[0-9_#-]+-[0-9_#-]+$/,
        );
        const persistedLayerId = cellMatch ? cellMatch[1] : layerId;

        const layer = await this.layerSchemas.findOne({
          where: { id: persistedLayerId },
        });

        if (layer) {
          const configuredTargetUrl =
            layer.properties?.wfs?.url || layer.properties?.url || layer.origin;
          if (configuredTargetUrl) {
            try {
              const urlObj = new URL(configuredTargetUrl);
              urlObj.search = '';
              targetUrl = urlObj.toString();
            } catch {
              targetUrl = configuredTargetUrl.split('?')[0];
            }

            // Merge the query parameters from the frontend's origin URL into our request parameters!
            Object.assign(params, originParams);
          }
        }
      }

      let isAuthorizedGeoServer = targetUrl.includes('geoserver.slui.dev');
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

      const { data } = await firstValueFrom(
        this.httpService.get(targetUrl, { params, headers }),
      );

      let responseJson = data;
      if (
        Buffer.isBuffer(responseJson) ||
        responseJson instanceof ArrayBuffer
      ) {
        responseJson = JSON.parse(Buffer.from(responseJson).toString('utf-8'));
      } else if (typeof responseJson === 'string') {
        responseJson = JSON.parse(responseJson);
      }

      if (!responseJson?.features) {
        return [];
      }

      return responseJson.features.map(({ id, geometry, properties }) => {
        const coordinates = geometry?.coordinates;
        const geometryType = geometry?.type;
        const centroid = turf.centroid({
          type: 'Feature',
          geometry,
          properties: {},
        } as any);

        return {
          id,
          coordinates: centroid.geometry.coordinates,
          properties,
          rawCoordinates: coordinates,
          geometryType,
        };
      });
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) {
        return [];
      }

      throw error;
    }
  }

  async update(id: string, dto: UpdateMapConfigDto): Promise<MapConfig> {
    const mapConfig = await this.repository.findOneBy({ id });

    if (!mapConfig) {
      throw new NotFoundException(`Map Config with ID "${id}" not found`);
    }

    mapConfig.description = dto.description;
    mapConfig.value = this.normalizeValueByType(mapConfig.type, dto.value);

    return this.repository.save(mapConfig);
  }

  private normalizeValueByType(type: MapConfigType, value: unknown): unknown {
    switch (type) {
      case MapConfigType.LITERAL_NUMBER: {
        const literalValue = this.extractLiteralValue(value);

        if (typeof literalValue !== 'number' || Number.isNaN(literalValue)) {
          throw new NotFoundException(
            'Map config value must be a valid literal number',
          );
        }

        return { literally: literalValue };
      }

      case MapConfigType.LITERAL_STRING: {
        const literalValue = this.extractLiteralValue(value);

        if (typeof literalValue !== 'string') {
          throw new NotFoundException(
            'Map config value must be a valid literal string',
          );
        }

        return { literally: literalValue };
      }

      case MapConfigType.ARRAY:
        if (!Array.isArray(value)) {
          throw new NotFoundException('Map config value must be an array');
        }

        return value;

      case MapConfigType.OBJECT:
        if (!this.isPlainObject(value)) {
          throw new NotFoundException('Map config value must be an object');
        }

        return value;

      case MapConfigType.VIEW_TEMPLATE:
        if (Array.isArray(value)) {
          return value;
        }

        if (this.isPlainObject(value)) {
          return [value];
        }

        throw new NotFoundException(
          'Map config value must be a valid view template structure',
        );

      default:
        return value;
    }
  }

  private extractLiteralValue(value: unknown): unknown {
    if (this.isPlainObject(value) && 'literally' in value) {
      return value.literally;
    }

    return value;
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
