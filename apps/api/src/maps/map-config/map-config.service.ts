import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as turf from '@turf/turf';
import { firstValueFrom } from 'rxjs';
import { IsNull, Repository } from 'typeorm';
import { LayerGroup } from './../layer-groups/entities/layer-group.entity';
import { LayerSchema } from './../layer-schemas/entities/layer-schema.entity';
import { TextLayerDtoResponse } from './dto/text-layer.dto';
import { MapConfig } from './entities/map-config.entity';

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
        value?.literally === null || value?.literally === undefined
          ? value
          : value.literally;
    });

    return result;
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
}
