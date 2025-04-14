import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LayerSchemaColors } from 'layer-schemas/entities/layer-schema-color.entity';
import { Repository } from 'typeorm';
import { LayerGroup } from './../../../layer-groups/entities/layer-group.entity';
import { LayerSchema } from './../../../layer-schemas/entities/layer-schema.entity';
import { layerSchemaColors, layerSchemas } from './layerSchemaConst';

@Injectable()
export class LayerSeedService {
  constructor(
    @InjectRepository(LayerGroup)
    private readonly layerGroupRepository: Repository<LayerGroup>,
    @InjectRepository(LayerSchema)
    private readonly layerSchemaRepository: Repository<LayerSchema>,
    @InjectRepository(LayerSchemaColors)
    private readonly layerSchemaColorsRepository: Repository<LayerSchemaColors>,
  ) {}

  async run(): Promise<void> {
    console.log('Starting database seeding...');

    // Seed LayerGroup
    const layerGroup: LayerGroup[] = [
      { id: 'geral', name: 'Geral' },
      { id: 'seguranca', name: 'Segurança', ownerGroup: 'geral' },
      { id: 'ambiental', name: 'Ambiental', ownerGroup: 'geral' },
      { id: 'cultural', name: 'Cultural', ownerGroup: 'geral' },
      { id: 'tombamento', name: 'Tombamentos', ownerGroup: 'cultural' },
      { id: 'infra_urb', name: 'Infraestrutura urbana', ownerGroup: 'geral' },
      {
        id: 'areas_publicas',
        name: 'Áreas públicas - Uso comum',
        ownerGroup: 'infra_urb',
      },
      {
        id: 'urbanistico',
        name: 'Urbanístico',
        ownerGroup: 'geral',
      },
      {
        id: 'macrozoneamento',
        name: 'Macrozoneamento - Lei nº 16.050/14',
        ownerGroup: 'urbanistico',
      },
    ];

    try {
      await this.layerGroupRepository.upsert(layerGroup, ['id']);

      console.log(
        `Seeded LayerGroup: ${layerGroup.map((group) => group.id).join(', ')}`,
      );
    } catch (error) {
      console.error(`Query failed: ${error}`);
    }

    // Seed LayerSchema
    try {
      await this.layerSchemaRepository.upsert(layerSchemas, ['id']);

      console.log(
        `Seeded LayerSchemas: ${layerSchemas.map((group) => group.id).join(', ')}`,
      );
    } catch (error: any) {
      console.error(`Query failed: ${error.message}`);
    }

    // Seed layerSchemaColors
    try {
      await this.layerSchemaColorsRepository.upsert(layerSchemaColors, ['id']);

      console.log(`Seeded layerSchemaColors`);
    } catch (error: any) {
      console.error(`Query failed: ${error.message}`);
    }

    console.log('Database seeding completed.');
  }
}
