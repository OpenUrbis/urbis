import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LayerGroup } from '../../../maps/layer-groups/entities/layer-group.entity';
import { LayerSchema } from '../../../maps/layer-schemas/entities/layer-schema.entity';
import { LayerSchemaColors } from '../../../maps/layer-schemas/entities/layer-schema-color.entity';
import {
  LayerSchemaColorTypeEnum,
  LayerSchemaTypeEnum,
} from '../../../maps/layer-schemas/enums/layer-schema.enum';

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
    console.info('Starting LayerGroup and LayerSchema seeding...');

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
      {
        id: 'curvas_de_nivel',
        name: 'Curvas de nível',
        ownerGroup: 'geral',
      },
      {
        id: 'documentos_gerais',
        name: 'Documentos gerais',
        ownerGroup: 'geral',
      },
      {
        id: 'legislacao_urbanistica',
        name: 'Legislação urbanística',
        ownerGroup: 'urbanistico',
      },
      {
        id: 'situacoes_de_interesse_urbanistico',
        name: 'Situações de interesse urbanístico',
        ownerGroup: 'urbanistico',
      },
      {
        id: 'vilas',
        name: 'Vilas',
        ownerGroup: 'situacoes_de_interesse_urbanistico',
      },
      {
        id: 'situações_de_interesse_ambiental',
        name: 'Situações de interesse ambiental',
        ownerGroup: 'ambiental',
      },
      { id: 'vegetacao', name: 'Vegetação', ownerGroup: 'ambiental' },
      {
        id: 'biomas_protegidos',
        name: 'Biomas protegidos',
        ownerGroup: 'vegetacao',
      },
      {
        id: 'areas_contaminadas',
        name: 'Áreas contaminadas',
        ownerGroup: 'situações_de_interesse_ambiental',
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

    // Seed default 3D Buildings layer (OpenStreetMap building tiles)
    const defaultLayerSchemas: Partial<LayerSchema>[] = [
      {
        id: 'edificacoes_3d',
        name: 'Edificações 3D (OpenStreetMap)',
        origin: 'https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf',
        type: LayerSchemaTypeEnum.GeoJsonLayer,
        isActive: true,
        isVisible: false,
        isSelected: false,
        minZoom: 13,
        groupId: 'infra_urb',
        properties: {
          source: 'openmaptiles',
          sourceLayer: 'building',
          sourceType: 'vector',
          tiles: ['https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf'],
          minZoom: 13,
          maxZoom: 20,
          extruded: true,
          getElevation: 'height',
          wireframe: false,
          opacity: 0.85,
        },
      },
    ];

    try {
      await this.layerSchemaRepository.upsert(defaultLayerSchemas, ['id']);
      console.info(
        `Seeded LayerSchema: ${defaultLayerSchemas.map((s) => s.id).join(', ')}`,
      );

      const existingColor = await this.layerSchemaColorsRepository.findOne({
        where: { layerSchemaId: 'edificacoes_3d' },
      });

      if (!existingColor) {
        await this.layerSchemaColorsRepository.save({
          layerSchemaId: 'edificacoes_3d',
          type: LayerSchemaColorTypeEnum.FILL,
          label: 'Edificações',
          value: 'default',
          color: [203, 213, 225, 220],
          pattern: 'full',
        });
        console.info('Seeded LayerSchemaColors for edificacoes_3d');
      }
    } catch (error) {
      console.error(`LayerSchema seed failed: ${error}`);
    }

    console.info('LayerGroup and LayerSchema database seeding completed.');
  }
}
