import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LayerGroup } from '../../../maps/layer-groups/entities/layer-group.entity';
import { LayerSchemaColors } from './../../../maps/layer-schemas/entities/layer-schema-color.entity';
import { LayerSchema } from './../../../maps/layer-schemas/entities/layer-schema.entity';
import { layerSchemas } from './layerSchemaConst';

@Injectable()
export class LayerSeedService {
  constructor(
    @InjectRepository(LayerGroup)
    private readonly layerGroupRepository: Repository<LayerGroup>,
    @InjectRepository(LayerSchema)
    private readonly layerSchemaRepository: Repository<LayerSchema>,
    @InjectRepository(LayerSchemaColors)
    private readonly layerSchemaColorsRepository: Repository<LayerSchemaColors>,
  ) { }

  async run(): Promise<void> {
    console.info('Starting database seeding...');

    // Seed LayerGroup
    const layerGroup: LayerGroup[] = [
      { id: 'geral', name: 'Geral' },
      {
        id: 'limites_administrativos',
        name: 'Limites administrativos',
        ownerGroup: 'geral',
      },
      { id: 'seguranca', name: 'Segurança' },
      { id: 'ambiental', name: 'Ambiental' },
      { id: 'cultural', name: 'Cultural' },
      { id: 'tombamento', name: 'Tombamentos', ownerGroup: 'cultural' },
      { id: 'infra_urb', name: 'Infraestrutura urbana' },
      {
        id: 'alto_risco_geologico_e_hidrologico',
        name: 'Alto risco geológico e hidrológico',
        ownerGroup: 'seguranca',
      },
      {
        id: 'areas_publicas',
        name: 'Áreas públicas - Uso comum',
        ownerGroup: 'infra_urb',
      },
      {
        id: 'urbanistico',
        name: 'Urbanístico',
      },
      {
        id: 'macrozoneamento',
        name: 'Macrozoneamento',
        ownerGroup: 'urbanistico',
      },
      {
        id: 'aguas',
        name: 'Águas',
        ownerGroup: 'areas_publicas',
      },
      {
        id: 'vias_publicas',
        name: 'Vias públicas',
        ownerGroup: 'areas_publicas',
      },
      {
        id: 'areas_protegidas',
        name: 'Áreas protegidas',
        ownerGroup: 'ambiental',
      },
    ];

    try {
      await this.layerGroupRepository.upsert(layerGroup, ['id']);

      console.info(
        `Seeded LayerGroup: ${layerGroup.map((group) => group.id).join(', ')}`,
      );
    } catch (error) {
      console.error(`Query failed: ${error}`);
    }

    // Seed LayerSchema
    try {
      const promises = layerSchemas.map(async (layer) => {
        let register = await this.layerSchemaRepository.findOne({
          where: { id: layer.id },
          relations: ['colors'],
        });
        if (!register)
          register = this.layerSchemaRepository.create(layer) as any;
        else register = layer;

        register.colors = layer.colors.map((color) =>
          this.layerSchemaColorsRepository.create(color),
        );

        return await this.layerSchemaRepository.save(register);
      });

      await Promise.all(promises);

      console.info(
        `Seeded LayerSchemas: ${layerSchemas.map((group) => group.id).join(', ')}`,
      );
    } catch (error: any) {
      console.error(`Query failed: ${error.message}`);
    }

    console.info('Database seeding completed.');
  }
}
