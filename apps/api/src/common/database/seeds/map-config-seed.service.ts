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
        value: [
          {
            type: 'wrapper-card',
            label: 'Área selecionada',
            templates: [
              {
                type: 'polygon-map',
                properties: {
                  polygonProps: `
                        (data) => ({
                          id: "polygon-layer",
                          data: [{ coordinates: data.geometry.coordinates }],
                          pickable: false,
                          stroked: true,
                          filled: true,
                          lineWidthMinPixels: 2,
                          getPolygon: (d) => d.coordinates,
                          getFillColor: [30, 111, 249, 100],
                          getLineColor: [30, 111, 249],
                        })
                      `,
                  initialViewState: `
                        (data) => {
                          const centroid = utils.calculateCenterId(data.geometry.coordinates[0]);

                          return {
                          longitude: centroid[0],
                          latitude: centroid[1],
                          zoom: 16.5,
                          pitch: 0,
                          bearing: 0,
                          };
                        }
                      `,
                },
              },
            ],
          },
          {
            type: 'wrapper-card',
            label: 'Interseções no Perímetro',
            templates: [
              {
                type: 'wrapper-list-items',
                templates: [
                  {
                    type: 'primary-item',
                    value: `
                          <% if (id.includes("macroareas")) { %>
                            <%- properties.nm_perimetro_divisao_pde %>
                          <% } else if (id.includes("minianel_viario")) { %>
                            <%- properties.nm_restricao_circulacao_veiculo %>
                          <% } else if (id.includes("subprefeitura")) { %>
                            <%- properties.nm_subprefeitura %>
                          <% } else if (id.includes("macrozonas")) { %>
                            <%- properties.nm_perimetro_divisao_pde %>
                          <% } else if (id.includes("tombamentos-areas")) { %>
                            <%- properties.nm_bairro %>
                          <% } else if (id.includes("zoneamento_geral")) { %>
                            <%- properties.nm_perimetro_divisao_pde %>
                          <% } else { %>
                            Não mapeado
                          <% } %>
                        `,
                  },
                  {
                    type: 'secondary-item',
                    value: `
                          <% if (id.includes("macroareas")) { %>
                            Macroarea - <%- properties.totalAreaPercentage ? properties.totalAreaPercentage.toFixed(2) + '%' : '' %>
                          <% } else if (id.includes("minianel_viario")) { %>
                            Minianel Viario - <%- properties.totalAreaPercentage ? properties.totalAreaPercentage.toFixed(2) + '%' : '' %>
                          <% } else if (id.includes("subprefeitura")) { %>
                            Sub-Prefeitura - <%- properties.totalAreaPercentage ? properties.totalAreaPercentage.toFixed(2) + '%' : '' %>
                          <% } else if (id.includes("macrozonas")) { %>
                            Macrozona - <%- properties.totalAreaPercentage ? properties.totalAreaPercentage.toFixed(2) + '%' : '' %>
                          <% } else if (id.includes("tombamentos-areas")) { %>
                            <%- properties.tx_resolucao_condephaat %> - <%- properties.totalAreaPercentage ? properties.totalAreaPercentage.toFixed(2) + '%' : '' %>
                          <% } else if (id.includes("zoneamento_geral")) { %>
                            Zoneamento - <%- properties.totalAreaPercentage ? properties.totalAreaPercentage.toFixed(2) + '%' : '' %>
                          <% } else { %>
                            Não mapeado
                          <% } %>
                        `,
                  },
                ],
                properties: {
                  data: '(data) => data.response.features.filter(({ id }) => !id.includes("lote_cidadao"))',
                  twoLine: true,
                },
              },
            ],
          },
          {
            type: 'wrapper-card',
            label: 'Lotes no Perímetro',
            templates: [
              {
                type: 'wrapper-list-items',
                templates: [
                  {
                    type: 'primary-item',
                    value:
                      'Identificador #<%- properties.id.replace("lote_cidadao.", "") %>',
                  },
                  {
                    type: 'secondary-item',
                    value:
                      "SQL: <%- properties.cd_setor_fiscal %>-<%- properties.cd_quadra_fiscal %>-<%- properties.cd_lote %> <%- properties.cd_condominio %> <%- properties.nm_logradouro_completo ?? '-' %> - <%- properties.totalAreaPercentage ? properties.totalAreaPercentage.toFixed(2) + '%' : '' %>",
                  },
                ],
                properties: {
                  data: '(data) => data.response.features.filter(({ id }) => id.includes("lote_cidadao"))',
                  twoLine: true,
                  onItemClick: {
                    action: 'openFeature',
                    params: {
                      template: 'root',
                    },
                  },
                },
              },
            ],
          },
        ],
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
