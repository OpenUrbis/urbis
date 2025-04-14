import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LayerGroup } from './../../../layer-groups/entities/layer-group.entity';
import { LayerSchema } from './../../../layer-schemas/entities/layer-schema.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LayerSeedService {
  constructor(
    @InjectRepository(LayerGroup)
    private readonly layerGroupRepository: Repository<LayerGroup>,
    @InjectRepository(LayerSchema)
    private readonly layerSchemaRepository: Repository<LayerSchema>,
  ) {}

  async run(): Promise<void> {
    console.log('Starting database seeding...');

    // Seed LayerGroup
    const layerGroup: LayerGroup = {
      id: 'urbanistico',
      name: 'Urbanístico',
      subGroups: [
        {
          id: 'macrozoneamento',
          name: 'Macrozoneamento - Lei nº 16.050/14',
        },
      ],
    };

    try {
      await this.layerGroupRepository.upsert(layerGroup, ['id']);
      console.log(`Seeded LayerGroup: ${layerGroup.id}`);
    } catch (error) {
      console.error(`Failed to seed LayerGroup: ${error.message}`);
    }

    // Seed LayerSchema
    const layerSchema: LayerSchema = {
      id: 'river_layer',
      '@@type': 'GeoJsonLayer',
      name: 'River Layer',
      visible: true,
      getFillColor: [0, 128, 255, 255],
      mapLegend: [
        {
          label: 'River',
          color: [0, 128, 255, 255],
        },
      ],
    };

    try {
      await this.layerSchemaRepository.upsert(layerSchema, ['id']);
      console.log(`Seeded LayerSchema: ${layerSchema.id}`);
    } catch (error) {
      console.error(`Failed to seed LayerSchema: ${error.message}`);
    }

    console.log('Database seeding completed.');
  }
}