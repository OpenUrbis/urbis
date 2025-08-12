import { ClickActionEnum } from '@open-urbis/map-shared';
import { LayerSchema } from './../../../layer-schemas/entities/layer-schema.entity';
import {
  LayerSchemaColorTypeEnum,
  LayerSchemaTypeEnum,
} from './../../../layer-schemas/enums/layer-schema.enum';

export const layerSchemas: LayerSchema[] = [
  {
    id: 'aguas_correntes_estimadas',
    name: 'Águas Correntes Estimadas',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?LAYERS=slui%3Aaguas_correntes_estimadas&FORMAT=image%2Fjpeg&TRANSPARENT=true',
    isActive: true,
    type: LayerSchemaTypeEnum.CustomWMSLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'areas_publicas',
    colors: [
      {
        color: [65, 120, 216, 240],
        label: 'default',
      },
    ],
  },
  {
    id: 'aguas_correntes_ou_dormentes',
    name: 'Águas Correntes ou Dormentes',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:aguas_correntes_ou_dormentes&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'areas_publicas',
    colors: [
      {
        color: [56, 85, 204, 240],
        label: 'default',
      },
    ],
  },
  {
    id: 'areas_contaminadas',
    name: 'Áreas Contaminadas',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:areas_contaminadas&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'ambiental',
    colors: [
      {
        color: [180, 95, 6, 240],
        label: 'default',
      },
    ],
  },
  {
    id: 'distrito_municipal',
    name: 'Distritos',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:distrito_municipal&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: true,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'geral',
    clickAction: {
      action: ClickActionEnum.SetZoom,
      params: {
        zoom: 17.1,
      },
    },
    properties: {
      getText: `(d) => d?.properties?.nm_distrito_municipal`,
      minZoomText: 10,
      stroked: true,
      filled: true,
      pointType: 'circle+text',
      pickable: true,
      wireframe: true,
      getLineWidth: 12,
      getPointRadius: 12,
      getTextAnchor: 'middle',
      getElevation: -10,
      getTextSize: 12,
      autoHighlight: true,
      highlightColor: [153, 203, 255, 140],
      maxZoom: 17,
    },
    colors: [
      {
        color: [153, 203, 255, 120],
        label: 'default',
        type: LayerSchemaColorTypeEnum.FILL,
      },
      {
        color: [65, 92, 119, 255],
        label: 'default',
        type: LayerSchemaColorTypeEnum.TEXT,
      },
      {
        color: [0, 0, 0, 120],
        label: 'default',
        type: LayerSchemaColorTypeEnum.LINE,
      },
    ],
  },
  {
    id: 'eixos',
    name: 'Eixos',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:eixos&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: 'nm_perimetro_divisao_pde',
    getFillColorPropName: 'nm_perimetro_divisao_pde',
    getLineColorPropName: 'nm_perimetro_divisao_pde',
    groupId: 'macrozoneamento',
    colors: [
      {
        color: [136, 144, 173, 240],
        pattern: 'full',
        label: 'Area de Influencia',
        value: 'Area de Influencia',
      },
      {
        color: [201, 186, 119, 240],
        pattern: 'full',
        label: 'Area de Influencia (2016)',
        value: 'Area de Influencia (2016)',
      },
    ],
  },
  {
    id: 'lotes',
    name: 'Lotes',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui%3Aview_lote_cidadao&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.Stream,
    isVisible: true,
    minZoom: 17,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    clickAction: { action: ClickActionEnum.SelectFeature, params: {} },
    viewTemplate: [
      {
        type: 'wrapper-card',
        label: 'Identificador',
        properties: {
          helper: 'Identificador do lote, (setor.quadra.lote.condominio)',
        },
        templates: [
          {
            type: 'label-value',
            label: 'Inscrição',
            value:
              "<%- properties.cd_setor_fiscal?.padStart(3, '0') ?? '000' %> <%- properties.cd_quadra_fiscal?.padStart(3, '0') ?? '000' %> <%- properties.cd_lote?.padStart(4, '0') ?? '0000' %> <%- properties.cd_condominio?.padStart(2, '0') ?? '00' %>",
          },
        ],
      },
      {
        type: 'wrapper-card',
        label: 'Localização',
        templates: [
          {
            type: 'label-value',
            label: 'Endereço',
            properties: { helper: 'Endereço do lote' },
            value:
              "<%- properties?.nm_logradouro_completo ?? '-' %>, <%- properties?.cd_numero_porta ?? '-' %>",
          },
          {
            type: 'label-value',
            label: 'Tipo de Imóvel',
            value: "<%- properties?.dc_tipo_uso_imovel ?? '-' %>",
          },
          {
            type: 'label-value',
            label: 'Categoria SIAAU',
            value: "<%- properties?.tx_tipo_lote ?? '-' %>",
          },
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
                  getFillColor: [255, 165, 0, 100],
                  getLineColor: [255, 140, 0],
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
          {
            type: 'label-value',
            label: 'Distrito',
            value: "<%- properties?.cd_setor_fiscal ?? '-' %>",
          },
          {
            type: 'label-value',
            label: 'Subprefeitura',
            value: 'Não disponível',
          },
          {
            type: 'edit-polygon',
          },
          {
            type: 'button',
            label: 'Imprimir',
            properties: {
              action:
                "(data) => window.open(`/print?layerSchema=lotes&CQL_FILTER=cd_setor_fiscal = '${data.properties.cd_setor_fiscal}' AND cd_quadra_fiscal = '${data.properties.cd_quadra_fiscal}' AND cd_lote = '${data.properties.cd_lote}' AND cd_condominio = '${data.properties.cd_condominio}'`,'_blank')",
            },
          },
        ],
      },
      {
        type: 'wrapper-card',
        label: 'Informações prediais',
        templates: [
          {
            type: 'wrapper-row',
            templates: [
              {
                type: 'label-value',
                label: 'Área do Terreno',
                value: "<%- properties?.qt_area_terreno ?? '-' %>",
                properties: {
                  columnClass: 'col-md-6',
                },
              },
              {
                type: 'label-value',
                label: 'Área Construída',
                value: "<%- properties?.qt_area_construida ?? '-' %>",
                properties: {
                  columnClass: 'col-md-6',
                },
              },
              {
                type: 'label-value',
                label: 'Situação do Lote',
                value: "<%- properties?.tx_situ_lote ?? '-' %>",
                properties: {
                  columnClass: 'col-md-6',
                },
              },
              {
                type: 'label-value',
                label: 'Condomínio',
                value: "<%- properties?.cd_condominio ?? '-' %>",
                properties: {
                  columnClass: 'col-md-6',
                },
              },
              {
                type: 'label-value',
                label: 'Tipo de Quadra',
                value: "<%- properties?.tx_tipo_quadra ?? '-' %>",
                properties: {
                  columnClass: 'col-md-6',
                },
              },
              {
                type: 'label-value',
                label: 'Numeração',
                value: "<%- properties?.cd_quadra_fiscal ?? '-' %>",
                properties: {
                  columnClass: 'col-md-6',
                },
              },
            ],
          },
        ],
      },
      {
        type: 'wrapper-request',
        properties: {
          url: 'https://api.mapa.urbis.sampa.br/geospatial-intersections',
          method: 'post',
          data: `({data}) => data`,
          transformResponse: `(response) => {
            response = JSON.parse(response);
            const { features } = response;

            const fieldToLayerMap = {
              geom_zoneamento_2016: ["slui:zoneamento"],
              geom_subprefeitura: ["slui:subprefeitura"],
              geom_distrito: ["slui:distrito_municipal"],
              geom_tombado: [
                "slui:tombamentos-areas",
                "slui:tombamentos-envoltorias-de-imoveis",
                "slui:tombamentos-imoveis",
              ],
              geom_uc: ["slui:parques_unidades_de_conservacao_e_apa"],
              geom_apa: ["slui:parques_unidades_de_conservacao_e_apa"],
              geom_area_contaminada: ["slui:areas_contaminadas"],
              geom_melhoramento_viario: ["slui:minianel_viario"],
              geom_area_manancial: ["slui:manancial_billings"],
              geom_area_manancial_guarapiranga: ["slui:manancial_guarapiranga"],
              geom_area_manancial_juquery: ["slui:manancial_juquery"],
              geom_area_envoltoria_iphan: [
                "slui:tombamentos_envoltorias_de_imoveis_IPHAN",
              ],
              geom_area_envoltoria_conpresp: [
                "slui:tombamentos_envoltorias_de_imoveis_CONPRESP",
              ],
              geom_area_envoltoria_condephaat: [
                "slui:tombamentos_envoltorias_de_imoveis_CONDEPHAAT",
              ],
            };
            const camadasTombamento = [
              "geom_tombado",
              "geom_area_envoltoria_condephaat",
              "geom_area_envoltoria_conpresp",
              "geom_area_envoltoria_iphan",
            ];
            const camadasPreservada = [
              "geom_apa",
              "geom_area_manancial_juquery",
              "geom_area_manancial_guarapiranga",
              "geom_area_manancial_billings",
            ];

            response.properties.cit_data = [];
            response.properties.restricoes = [];

            features.forEach((feat) => {
              const { properties } = feat;
              const { layer } = properties;

              if (properties?.cit_data?.situacao_do_imovel) 
                response.properties.cit_data.push(properties.cit_data);

              Object.keys(fieldToLayerMap).forEach((key) => {
                if (fieldToLayerMap[key].includes(layer)) {
                  response.properties.restricoes.push(key);
                }
              });

              camadasTombamento.forEach((camada) => {
                if (response.properties.restricoes.includes(camada)) {
                  response.properties.tombamento_restrito = true;
                }
              });

              camadasPreservada.forEach((camada) => {
                if (response.properties.restricoes.includes(camada)) {
                  response.properties.area_preservada = true;
                }
              });
            });

            return response;
          };`,
        },
        templates: [
          {
            type: 'wrapper-card',
            label: 'Restrições',
            templates: [
              {
                type: 'label-value',
                label: 'ITBI',
                value: "<%= 'Não disponivel' %>",
              },
              {
                type: 'label-value',
                label: 'Tombamento',
                value:
                  "<%- response?.properties?.tombamento_restrito ? 'Tombado' : 'Sem restrição' %>",
              },
              {
                type: 'label-value',
                label: 'Área de Preservação Ambiental',
                value:
                  "<%- response?.properties?.area_preservada ? 'Preservada' : 'Sem restrição' %>",
              },
              {
                type: 'label-value',
                label: 'Árvores no Imóvel',
                value: "<%= 'Não disponivel' %>",
              },
            ],
          },
          {
            type: 'wrapper-card',
            label: 'IPTU',
            templates: [
              {
                type: 'wrapper-list-items',
                templates: [
                  {
                    type: 'primary-item',
                    value: `<%- descrição_da_preservação ?? 'Não disponível' %>`,
                  },
                  {
                    type: 'secondary-item',
                    value: `<%- situacao_do_imovel ?? 'Não disponível' %>`,
                  },
                ],
                properties: {
                  data: '(data) => data.response.properties.cit_data.length ? data.response.properties.cit_data : [{"descrição_da_preservação": "Não disponível", situacao_do_imovel: "Não disponível"}]',
                  twoLine: true,
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
                          <% } else if (properties.layer.includes("slui:setores_e_subsetores")) { %>
                            <%- properties.nm_tema_divisao_pde %>
                          <% } else if (properties.layer.includes("slui:distrito_municipal")) { %>
                            <%- properties.nm_distrito_municipal %>
                          <% } else if (properties.layer.includes("slui:tombamentos")) { %>
                            <%- properties?.nm_area ?? properties?.nm_area_tombada %>
                          <% } else if (properties.layer.includes("slui:zoneamento")) { %>
                            <%- properties?.tx_zoneamento_perimetro %>
                          <% } else { %>
                            Não mapeado
                          <% } %>
                        `,
                  },
                  {
                    type: 'secondary-item',
                    value: `
                          <% if (id.includes("macroareas")) { %>
                            Macroarea
                          <% } else if (id.includes("minianel_viario")) { %>
                            Minianel Viario
                          <% } else if (id.includes("subprefeitura")) { %>
                            Sub-Prefeitura
                          <% } else if (id.includes("macrozonas")) { %>
                            Macrozona
                          <% } else if (id.includes("tombamentos-areas")) { %>
                            <%- properties.tx_resolucao_condephaat %>
                          <% } else if (id.includes("zoneamento_geral")) { %>
                            Zoneamento
                          <% } else if (id.includes("slui:setores_e_subsetores")) { %>
                            <%- properties.setor %>
                          <% } else if (properties.layer.includes("slui:distrito_municipal")) { %>
                            Distrito municipal
                          <% } else if (properties.layer.includes("slui:tombamentos")) { %>
                            Imóvel tombado
                          <% } else if (properties.layer.includes("slui:zoneamento")) { %>
                            Zoneamento perimetro
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
        ],
      },
    ],
    groupId: 'geral',
    properties: {
      filled: true,
      pointType: 'circle+text',
      pickable: true,
      extruded: true,
      wireframe: true,
      getPointRadius: 0,
      getTextSize: 12,
      autoHighlight: true,
      highlightColor: [252, 252, 255, 150],
      getElevation: `(allotment) => {
        const { qt_area_construida, qt_area_terreno } =
          allotment?.properties || {};
        if (!qt_area_construida || !qt_area_terreno) return 0;

        return (qt_area_construida / qt_area_terreno) * 2 * 3;
      }`,
      layerActions: [
        {
          icon: 'info',
          action:
            "() => window.open('https://dadosabertos.urbis.sampa.br/','_blank')",
        },
      ],
      getText: `(d) => d.properties.cd_lote?.padStart(4, '0') ?? ''`,
    },
    colors: [
      {
        color: [57, 118, 29, 175],
        label: 'default',
        type: LayerSchemaColorTypeEnum.FILL,
      },
      {
        color: [255, 255, 255, 255],
        label: 'default',
        type: LayerSchemaColorTypeEnum.TEXT,
      },
      {
        color: [255, 255, 255, 255],
        label: 'default',
        type: LayerSchemaColorTypeEnum.LINE,
      },
    ],
  },
  {
    id: 'macroareas',
    name: 'Macroáreas',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:macroareas&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: 'nm_perimetro_divisao_pde',
    getFillColorPropName: 'nm_perimetro_divisao_pde',
    getLineColorPropName: 'nm_perimetro_divisao_pde',
    groupId: 'macrozoneamento',
    colors: [
      {
        color: [127, 1, 0, 240],
        pattern: 'full',
        label: 'Macroarea de Estruturacao Metropolitana',
        value: 'Macroarea de Estruturacao Metropolitana',
      },
      {
        color: [154, 89, 89, 240],
        pattern: 'full',
        label: 'Macroarea de Urbanizacao Consolidada',
        value: 'Macroarea de Urbanizacao Consolidada',
      },
      {
        color: [210, 99, 28, 240],
        pattern: 'full',
        label: 'Macroarea de Qualificacao da Urbanizacao',
        value: 'Macroarea de Qualificacao da Urbanizacao',
      },
      {
        color: [244, 191, 3, 240],
        pattern: 'full',
        label: 'Macroarea de Reducao da Vulnerabilidade Urbana',
        value: 'Macroarea de Reducao da Vulnerabilidade Urbana',
      },
      {
        color: [250, 236, 176, 240],
        pattern: 'full',
        label:
          'Macroarea de Reducao da Vulnerabilidade Urbana e Recuperacao Ambiental',
        value:
          'Macroarea de Reducao da Vulnerabilidade Urbana e Recuperacao Ambiental',
      },
      {
        color: [192, 212, 167, 240],
        pattern: 'full',
        label: 'Macroarea de Controle e Qualificacao Urbana e Ambiental',
        value: 'Macroarea de Controle e Qualificacao Urbana e Ambiental',
      },
      {
        color: [108, 162, 150, 240],
        pattern: 'full',
        label: 'Macroarea de Contencao Urbana e Uso Sustentavel',
        value: 'Macroarea de Contencao Urbana e Uso Sustentavel',
      },
      {
        color: [33, 89, 86, 240],
        pattern: 'full',
        label: 'Macroarea de Preservacao dos Ecossistemas Naturais',
        value: 'Macroarea de Preservacao dos Ecossistemas Naturais',
      },
    ],
  },
  {
    id: 'macrozonas',
    name: 'Macrozonas',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:macrozonas&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: 'nm_perimetro_divisao_pde',
    getFillColorPropName: 'nm_perimetro_divisao_pde',
    getLineColorPropName: 'nm_perimetro_divisao_pde',
    groupId: 'macrozoneamento',
    colors: [
      {
        color: [190, 190, 190, 240],
        pattern: 'full',
        label: 'Macrozona de Estruturacao e Qualificacao Urbana',
        value: 'Macrozona de Estruturacao e Qualificacao Urbana',
      },
      {
        color: [50, 130, 138, 240],
        pattern: 'full',
        label: 'Macrozona de Protecao e Recuperacao Ambiental',
        value: 'Macrozona de Protecao e Recuperacao Ambiental',
      },
    ],
  },
  {
    id: 'minianel_viario',
    name: 'Minianel Viário',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:minianel_viario&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'urbanistico',
    colors: [
      {
        color: [217, 234, 211, 240],
        label: 'default',
      },
    ],
  },
  {
    id: 'parques_unidades_conservacao',
    name: 'Parques e Unidades de Conservação',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:parques_unidades_de_conservacao_e_apa&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: false,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'areas_publicas',
    colors: [{ color: [0, 0, 0, 240], label: 'default' }],
  },
  {
    id: 'pracas_e_canteiros',
    name: 'Praças e Canteiros',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?LAYERS=slui%3Apracas_e_canteiros&FORMAT=image%2Fjpeg&TRANSPARENT=true',
    isActive: true,
    type: LayerSchemaTypeEnum.CustomWMSLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'areas_publicas',
    colors: [
      {
        color: [147, 196, 125, 240],
        label: 'default',
      },
    ],
  },
  {
    id: 'represas',
    name: 'Represas',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:represas&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: false,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'areas_publicas',
    colors: [{ color: [0, 0, 0, 240], label: 'default' }],
  },
  {
    id: 'restricoes_geotecnicas',
    name: 'Restrições Geotécnicas',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:restricoes_geotecnicas&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'seguranca',
    colors: [
      {
        color: [153, 2, 0, 240],
        label: 'default',
      },
    ],
  },
  {
    id: 'risco_geologico',
    name: 'Risco Geológico',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:risco_geologico&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'seguranca',
    colors: [
      {
        color: [255, 0, 0, 240],
        label: 'default',
      },
    ],
  },
  {
    id: 'risco_hidrologico',
    name: 'Risco Hidrológico',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:risco_hidrologico&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: 'tx_tipo_processo',
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'seguranca',
    colors: [
      {
        color: [204, 0, 1, 240],
        label: 'default',
      },
    ],
  },
  {
    id: 'setores_subsetores',
    name: 'Setores e Subsetores',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:setores_e_subsetores&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: 'subsetor',
    getFillColorPropName: 'subsetor',
    getLineColorPropName: 'subsetor',
    groupId: 'macrozoneamento',
    colors: [
      {
        color: [140, 1, 0, 240],
        pattern: 'full',
        label: 'Arco Tiete',
        value: 'Arco Tiete',
      },
      {
        color: [205, 3, 0, 240],
        pattern: 'full',
        label: 'Arco Tamanduatei',
        value: 'Arco Tamanduatei',
      },
      {
        color: [238, 64, 0, 240],
        pattern: 'full',
        label: 'Arco Leste',
        value: 'Arco Leste',
      },
      {
        color: [205, 79, 57, 240],
        pattern: 'full',
        label: 'Arco Pinheiros',
        value: 'Arco Pinheiros',
      },
      {
        color: [241, 99, 72, 240],
        pattern: 'full',
        label: 'Faria Lima-Agua Espraiada-Chucri Zaidan',
        value: 'Faria Lima-Agua Espraiada-Chucri Zaidan',
      },
      {
        color: [244, 160, 122, 240],
        pattern: 'full',
        label: 'Arco Jurubatuba',
        value: 'Arco Jurubatuba',
      },
      {
        color: [252, 251, 205, 240],
        pattern: 'full',
        label: 'Avenida Cupece',
        value: 'Avenida Cupece',
      },
      {
        color: [238, 234, 191, 240],
        pattern: 'full',
        label: 'Noroeste',
        value: 'Noroeste',
      },
      {
        color: [219, 205, 116, 240],
        pattern: 'full',
        label: 'Arco Jacu-Pessego',
        value: 'Arco Jacu-Pessego',
      },
      {
        color: [167, 155, 88, 240],
        pattern: 'full',
        label: 'Fernao Dias',
        value: 'Fernao Dias',
      },
      {
        color: [161, 62, 54, 240],
        pattern: 'full',
        label: 'Centro',
        value: 'Centro',
      },
    ],
  },
  {
    id: 'subprefeitura',
    name: 'Subprefeituras',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:subprefeitura&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'geral',
    colors: [
      {
        color: [183, 183, 183, 240],
        label: 'default',
      },
    ],
  },
  {
    id: 'sujeicao_a_alagamentos',
    name: 'Sujeição a Alagamentos',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:sujeicao_a_alagamentos&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.CustomWMSLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'seguranca',
    colors: [
      {
        color: [133, 32, 12, 240],
        label: 'default',
      },
    ],
  },
  {
    id: 'terras_indigenas',
    name: 'Terras Indígenas',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:terras_indigenas&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'geral',
    colors: [
      {
        color: [191, 144, 0, 240],
        label: 'default',
      },
    ],
  },
  {
    id: 'terrenos_marginais_aos_cursos_dagua_navegaveis',
    name: "Terrenos Marginais aos Cursos D'Água Navegáveis",
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:terrenos_marginais_aos_cursos_dagua_navegaveis&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'areas_publicas',
    colors: [
      {
        color: [241, 194, 50, 240],
        label: 'default',
      },
    ],
  },
  {
    id: 'tombamentos-areas',
    name: 'Ambientais e Urbanísticos',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:tombamentos-areas&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'tombamento',
    colors: [
      {
        color: [255, 165, 0, 240],
        label: 'default',
      },
    ],
  },
  {
    id: 'tombamentos-envoltorias-de-imoveis',
    name: 'Envoltorias de Imóveis',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:tombamentos-envoltorias-de-imoveis&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'tombamento',
    colors: [
      {
        color: [247, 217, 103, 240],
        label: 'default',
      },
    ],
  },
  {
    id: 'tombamentos-imoveis',
    name: 'Imóveis',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:tombamentos-imoveis&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'tombamento',
    colors: [
      {
        color: [249, 255, 0, 240],
        label: 'default',
      },
    ],
  },
  {
    id: 'zeis_pde',
    name: 'ZEIS - Lei nº 16.050/14',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:ZEIS_(PDE)&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: 'cd_zoneamento_perimetro',
    getFillColorPropName: 'cd_zoneamento_perimetro',
    getLineColorPropName: 'cd_zoneamento_perimetro',
    groupId: 'urbanistico',
    colors: [
      {
        color: [196, 80, 80, 240],
        pattern: 'full',
        label: 'ZEIS-1',
        value: 'ZEIS-1',
      },
      {
        color: [54, 125, 169, 240],
        pattern: 'full',
        label: 'ZEIS-2',
        value: 'ZEIS-2',
      },
      {
        color: [65, 156, 139, 240],
        pattern: 'full',
        label: 'ZEIS-3',
        value: 'ZEIS-3',
      },
      {
        color: [164, 89, 164, 240],
        pattern: 'full',
        label: 'ZEIS-4',
        value: 'ZEIS-4',
      },
      {
        color: [241, 127, 4, 240],
        pattern: 'full',
        label: 'ZEIS-5',
        value: 'ZEIS-5',
      },
    ],
  },
  {
    id: 'zoneamento_geral',
    name: 'Urbano Geral',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:zoneamento_geral&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: 'nm_perimetro_divisao_pde',
    getFillColorPropName: 'nm_perimetro_divisao_pde',
    getLineColorPropName: 'nm_perimetro_divisao_pde',
    groupId: 'macrozoneamento',
    colors: [
      {
        color: [160, 160, 160, 240],
        pattern: 'full',
        label: 'Zona Urbana',
        value: 'Zona Urbana',
      },
      {
        color: [146, 74, 0, 240],
        pattern: 'full',
        label: 'Zona Rural',
        value: 'Zona Rural',
      },
    ],
  },
  {
    id: 'zoneamento_lei_16402_18177',
    name: 'Zoneamento - Lei nº 16.402/16+18.177/24',
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:zoneamento&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.Stream,
    isVisible: false,
    minZoom: 17,
    getTextColorPropName: 'cd_zoneamento_perimetro',
    getFillColorPropName: 'cd_zoneamento_perimetro',
    getLineColorPropName: 'cd_zoneamento_perimetro',
    groupId: 'urbanistico',
    colors: [
      {
        color: [223, 253, 178, 240],
        pattern: 'full',
        label: 'AC-1',
        value: 'AC-1',
      },
      {
        color: [223, 253, 178, 240],
        pattern: 'dots',
        label: 'AC-2',
        value: 'AC-2',
      },
      {
        color: [208, 234, 197, 240],
        pattern: 'full',
        label: 'Praça/Canteiro',
        value: 'Praça/Canteiro',
      },
      {
        color: [173, 160, 152, 240],
        pattern: 'full',
        label: 'ZC',
        value: 'ZC',
      },
      {
        color: [173, 160, 152, 240],
        pattern: 'dots',
        label: 'ZCa',
        value: 'ZCa',
      },
      {
        color: [207, 178, 161, 240],
        pattern: 'full',
        label: 'ZC-ZEIS',
        value: 'ZC-ZEIS',
      },
      {
        color: [137, 142, 189, 240],
        pattern: 'full',
        label: 'ZCOR-1',
        value: 'ZCOR-1',
      },
      {
        color: [129, 186, 226, 240],
        pattern: 'full',
        label: 'ZCOR-2',
        value: 'ZCOR-2',
      },
      {
        color: [181, 207, 231, 240],
        pattern: 'full',
        label: 'ZCOR-3',
        value: 'ZCOR-3',
      },
      {
        color: [154, 190, 193, 240],
        pattern: 'full',
        label: 'ZCORa',
        value: 'ZCORa',
      },
      {
        color: [181, 146, 177, 240],
        pattern: 'full',
        label: 'ZDE-1',
        value: 'ZDE-1',
      },
      {
        color: [208, 175, 185, 240],
        pattern: 'full',
        label: 'ZDE-2',
        value: 'ZDE-2',
      },
      {
        color: [219, 206, 159, 240],
        pattern: 'full',
        label: 'ZEIS-1',
        value: 'ZEIS-1',
      },
      {
        color: [254, 208, 155, 240],
        pattern: 'full',
        label: 'ZEIS-2',
        value: 'ZEIS-2',
      },
      {
        color: [255, 230, 170, 240],
        pattern: 'full',
        label: 'ZEIS-3',
        value: 'ZEIS-3',
      },
      {
        color: [255, 239, 195, 240],
        pattern: 'full',
        label: 'ZEIS-4',
        value: 'ZEIS-4',
      },
      {
        color: [255, 249, 221, 240],
        pattern: 'full',
        label: 'ZEIS-5',
        value: 'ZEIS-5',
      },
      {
        color: [212, 159, 148, 240],
        pattern: 'full',
        label: 'ZEM',
        value: 'ZEM',
      },
      {
        color: [227, 192, 169, 240],
        pattern: 'hatch-1x',
        label: 'ZEMP',
        value: 'ZEMP',
      },
      {
        color: [145, 170, 149, 240],
        pattern: 'full',
        label: 'ZEP',
        value: 'ZEP',
      },
      {
        color: [167, 211, 186, 240],
        pattern: 'full',
        label: 'ZEPAM',
        value: 'ZEPAM',
      },
      {
        color: [255, 239, 195, 240],
        pattern: 'hatch-cross',
        label: 'ZER-1',
        value: 'ZER-1',
      },
      {
        color: [255, 225, 158, 240],
        pattern: 'hatch-1x',
        label: 'ZER-2',
        value: 'ZER-2',
      },
      {
        color: [255, 255, 153, 240],
        pattern: 'dots',
        label: 'ZERa',
        value: 'ZERa',
      },
      {
        color: [189, 138, 140, 240],
        pattern: 'full',
        label: 'ZEU',
        value: 'ZEU',
      },
      {
        color: [189, 138, 140, 240],
        pattern: 'dots',
        label: 'ZEUa',
        value: 'ZEUa',
      },
      {
        color: [196, 158, 157, 240],
        pattern: 'hatch-1x',
        label: 'ZEUP',
        value: 'ZEUP',
      },
      {
        color: [197, 184, 184, 240],
        pattern: 'dots',
        label: 'ZEUPa',
        value: 'ZEUPa',
      },
      {
        color: [206, 206, 206, 240],
        pattern: 'full',
        label: 'ZM',
        value: 'ZM',
      },
      {
        color: [217, 217, 217, 240],
        pattern: 'dots',
        label: 'ZMa',
        value: 'ZMa',
      },
      {
        color: [186, 186, 186, 240],
        pattern: 'full',
        label: 'ZMIS',
        value: 'ZMIS',
      },
      {
        color: [232, 232, 232, 240],
        pattern: 'full',
        label: 'ZMISa',
        value: 'ZMISa',
      },
      {
        color: [224, 218, 197, 240],
        pattern: 'full',
        label: 'ZOE',
        value: 'ZOE',
      },
      {
        color: [176, 193, 171, 240],
        pattern: 'full',
        label: 'ZPDS',
        value: 'ZPDS',
      },
      {
        color: [200, 206, 175, 240],
        pattern: 'full',
        label: 'ZPDSr',
        value: 'ZPDSr',
      },
      {
        color: [161, 154, 181, 240],
        pattern: 'full',
        label: 'ZPI-1',
        value: 'ZPI-1',
      },
      {
        color: [212, 195, 221, 240],
        pattern: 'full',
        label: 'ZPI-2',
        value: 'ZPI-2',
      },
      {
        color: [255, 255, 153, 240],
        pattern: 'full',
        label: 'ZPR',
        value: 'ZPR',
      },
    ],
  },
];
