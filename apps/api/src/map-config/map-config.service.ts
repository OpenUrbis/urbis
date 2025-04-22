import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LayerGroup } from 'layer-groups/entities/layer-group.entity';
import { LayerSchema } from 'layer-schemas/entities/layer-schema.entity';
import { IsNull, Repository } from 'typeorm';

@Injectable()
export class MapConfigService {
  constructor(
    @InjectRepository(LayerGroup)
    private readonly layerGroup: Repository<LayerGroup>,
    @InjectRepository(LayerSchema)
    private readonly layerSchemas: Repository<LayerSchema>,
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
      boundingBox: [
        -47.18402422775285, // minLng
        -24.17117899554762, // minLat
        -46.12192641964189, // maxLng
        -23.12906655419254, // maxLat
      ],
      zoom: 10,
      bearing: -45,
      pitch: 0,
      padding: {
        top: 0,
        bottom: 150,
        left: 280,
        right: 0,
      },
      layerGroups,
      layerSchemas,
    };
  }
}
