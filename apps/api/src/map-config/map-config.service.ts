import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as turf from '@turf/turf';
import { firstValueFrom } from 'rxjs';
import { IsNull, Repository } from 'typeorm';
import { LayerGroup } from './../layer-groups/entities/layer-group.entity';
import { LayerSchema } from './../layer-schemas/entities/layer-schema.entity';
import { TextLayerDtoResponse } from './dto/text-layer.dto';

@Injectable()
export class MapConfigService {
  constructor(
    @InjectRepository(LayerGroup)
    private readonly layerGroup: Repository<LayerGroup>,
    @InjectRepository(LayerSchema)
    private readonly layerSchemas: Repository<LayerSchema>,

    private readonly httpService: HttpService,
  ) {}

  async getConfigs() {
    const layerGroups = await this.layerGroup.find({
      where: { ownerGroup: IsNull() },
      order: { name: 'ASC' },
      relations: [
        'childGroups',
        'childGroups.childGroups',
        'childGroups.childGroups.childGroups',
      ],
    });
    const layerSchemas = await this.layerSchemas.find({
      where: { isActive: true },
      order: { name: 'ASC' },
      relations: ['colors'],
    });

    return {
      latitude: -23.5505,
      longitude: -46.6333,
      boundingBox: [
        -47.276872262413406, -24.206465289774574, -46.05576004987694,
        -23.087911153581274,
      ],
      zoom: 10,
      bearing: 0,
      pitch: 0,
      padding: {
        top: 0,
        bottom: 400,
        left: 0,
        right: 0,
      },
      layerGroups,
      layerSchemas,
    };
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const polygon = turf.polygon(coordinates);
      const centroid = turf.centroid(polygon);

      return { id, coordinates: centroid.geometry.coordinates, properties };
    });
  }
}
