import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as turf from '@turf/turf';
import { firstValueFrom } from 'rxjs';
import { IsNull, Repository } from 'typeorm';
import { LayerGroup } from './../layer-groups/entities/layer-group.entity';
import { LayerSchema } from './../layer-schemas/entities/layer-schema.entity';
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

  async getConfigs() {
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

    result.layerSchemas = await this.layerSchemas.find({
      order: { index: 'ASC', name: 'ASC' },
      relations: ['colors'],
    });

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

  async getTextLayer({
    origin,
    ...params
  }: any): Promise<TextLayerDtoResponse[]> {
    const { data } = await firstValueFrom(
      this.httpService.get(origin as string, { params }),
    );

    return data.features.map(({ id, geometry, properties }) => {
      const { coordinates } = geometry;

      const polygon = turf.polygon(coordinates);
      const centroid = turf.centroid(polygon);

      return {
        id,
        coordinates: centroid.geometry.coordinates,
        properties,
        rawCoordinates: coordinates,
      };
    });
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
        if (!Array.isArray(value) && !this.isPlainObject(value)) {
          throw new NotFoundException(
            'Map config value must be a valid view template structure',
          );
        }

        return value;

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
