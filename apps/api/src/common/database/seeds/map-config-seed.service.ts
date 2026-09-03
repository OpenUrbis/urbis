import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MapConfig,
  MapConfigType,
} from './../../../maps/map-config/entities/map-config.entity';

@Injectable()
export class MapConfigSeedService {
  constructor(
    @InjectRepository(MapConfig)
    private readonly mapConfigRepository: Repository<MapConfig>,
  ) {}

  async run(): Promise<void> {
    console.info('Starting database seeding...');

    // Seed MapConfig
    const mapConfig: MapConfig[] = [
      {
        id: 'latitude',
        type: MapConfigType.LITERAL_NUMBER,
        description: 'Latitude inicial usada para centralizar o mapa.',
        value: { literally: -23.5505 },
      },
      {
        id: 'longitude',
        type: MapConfigType.LITERAL_NUMBER,
        description: 'Longitude inicial usada para centralizar o mapa.',
        value: { literally: -46.6333 },
      },
      {
        id: 'boundingBox',
        type: MapConfigType.ARRAY,
        description:
          'Área limite permitida para navegação e enquadramento do mapa.',
        value: [
          -47.276872262413406, -24.206465289774574, -46.05576004987694,
          -23.087911153581274,
        ],
      },
      {
        id: 'zoom',
        type: MapConfigType.LITERAL_NUMBER,
        description: 'Nível de zoom inicial exibido ao carregar o mapa.',
        value: { literally: 10 },
      },
      {
        id: 'bearing',
        type: MapConfigType.LITERAL_NUMBER,
        description: 'Rotação inicial do mapa em graus.',
        value: { literally: 0 },
      },
      {
        id: 'pitch',
        type: MapConfigType.LITERAL_NUMBER,
        description: 'Inclinação inicial da câmera do mapa em graus.',
        value: { literally: 0 },
      },
      {
        id: 'padding',
        type: MapConfigType.OBJECT,
        description:
          'Espaçamentos internos aplicados ao enquadramento do mapa.',
        value: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
      },
      {
        id: 'layerWithRootEditTemplate',
        type: MapConfigType.LITERAL_STRING,
        description:
          'Camada base utilizada como referência para o template raiz de edição.',
        value: { literally: 'lotes' },
      },
      {
        id: 'editFeatureTemplate',
        type: MapConfigType.VIEW_TEMPLATE,
        description:
          'Template dinâmico usado para renderizar a interface de edição e inspeção de feições.',
        value: [],
      },
    ];

    try {
      await this.mapConfigRepository.upsert(mapConfig, ['id']);

      console.info(
        `Seeded MapConfig: ${mapConfig.map((group) => group.id).join(', ')}`,
      );
    } catch (error) {
      console.error(`Query failed: ${error}`);
    }

    console.info('Database seeding completed.');
  }
}
