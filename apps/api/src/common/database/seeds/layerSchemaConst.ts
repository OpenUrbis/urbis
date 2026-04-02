import { ClickActionEnum } from '@open-urbis/map-shared';
import { LayerSchema } from './../../../maps/layer-schemas/entities/layer-schema.entity';
import {
  LayerSchemaColorTypeEnum,
  LayerSchemaTypeEnum,
} from './../../../maps/layer-schemas/enums/layer-schema.enum';

export const layerSchemas: LayerSchema[] = [
  {
    id: 'limites_municipio_10',
    name: 'indicativo de conferência pelo IGC',
    index: 21,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=slui:limites_municipio_10&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'limites_administrativos',
    clickAction: {
      action: ClickActionEnum.SetZoom,
      params: {
        zoom: 18.1,
      },
    },
    properties: {
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
        color: [153, 203, 255, 95],
        label: 'default',
        type: LayerSchemaColorTypeEnum.FILL,
        pattern: 'dots',
      },
      {
        color: [65, 92, 119, 200],
        label: 'default',
        type: LayerSchemaColorTypeEnum.TEXT,
      },
      {
        color: [0, 0, 0, 95],
        label: 'default',
        type: LayerSchemaColorTypeEnum.LINE,
      },
    ],
  },
  {
    id: 'limites_municipio',
    name: 'Limites do município',
    index: 20,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=slui:limites_municipio&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'limites_administrativos',
    clickAction: {
      action: ClickActionEnum.SetZoom,
      params: {
        zoom: 18.1,
      },
    },
    properties: {
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
        color: [65, 92, 119, 200],
        label: 'default',
        type: LayerSchemaColorTypeEnum.TEXT,
      },
      {
        color: [0, 0, 0, 95],
        label: 'default',
        type: LayerSchemaColorTypeEnum.LINE,
      },
    ],
  },
  {
    id: 'distrito_municipal',
    name: 'Distritos',
    index: 23,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=slui:distrito_municipal&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    isSelected: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: true,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'limites_administrativos',
    clickAction: {
      action: ClickActionEnum.SetZoom,
      params: {
        zoom: 18.1,
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
        color: [153, 203, 255, 0],
        label: 'default',
        type: LayerSchemaColorTypeEnum.FILL,
      },
      {
        color: [65, 92, 119, 200],
        label: 'default',
        type: LayerSchemaColorTypeEnum.TEXT,
      },
      {
        color: [0, 0, 0, 95],
        label: 'default',
        type: LayerSchemaColorTypeEnum.LINE,
      },
    ],
  },
  {
    id: 'lotes',
    name: 'Perímetros tributários',
    index: 24,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Alote_cidadao&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    isSelected: true,
    type: LayerSchemaTypeEnum.Stream,
    isVisible: true,
    minZoom: 17,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    clickAction: {
      action: ClickActionEnum.SelectFeature,
      params: { zoom: 19.5 },
    },
    viewTemplate: [
      {
        type: 'wrapper-card',
        label: 'Identificador',
        properties: {
          helper: 'Identificador do lote, (setor.quadra.lote.condominio)',
          printColumn: 1,
          semanticCardWeight: 1,
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
        properties: {
          printColumn: 1,
          semanticCardWeight: 1,
        },
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
                  getFillColor: [30, 111, 249, 100],
                  getLineColor: [30, 111, 249],
                })
              `,
              initialViewState: `
                (data) => {
                  const centroid = utils.calculateCenterId(data.geometry.coordinates[0]);
                  const zoom = utils.calculateZoom(data);

                  return {
                    longitude: centroid[0],
                    latitude: centroid[1],
                    zoom: zoom,
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
          /* {
            type: 'edit-polygon',
          }, */
          /* {
            type: 'button',
            label: 'Imprimir',
            properties: {
              action:
                "(data) => window.open(`/print?layerSchema=lotes&CQL_FILTER=cd_setor_fiscal = '${data.properties.cd_setor_fiscal}' AND cd_quadra_fiscal = '${data.properties.cd_quadra_fiscal}' AND cd_lote = '${data.properties.cd_lote}' AND cd_condominio = '${data.properties.cd_condominio}'`,'_blank')",
            },
          }, */
        ],
      },
      {
        type: 'wrapper-card',
        label: 'Informações prediais',
        properties: {
          printColumn: 1,
          semanticCardWeight: 1,
        },
        templates: [
          {
            type: 'wrapper-grid',
            templates: [
              {
                type: 'wrapper-grid-column',
                templates: [
                  {
                    type: 'label-value',
                    label: 'Área do Terreno',
                    value: "<%- properties?.qt_area_terreno ?? '-' %>",
                  },
                  {
                    type: 'label-value',
                    label: 'Situação do Lote',
                    value: "<%- properties?.tx_situ_lote ?? '-' %>",
                  },
                  {
                    type: 'label-value',
                    label: 'Tipo de Quadra',
                    value: "<%- properties?.tx_tipo_quadra ?? '-' %>",
                  },
                ],
              },
              {
                type: 'wrapper-grid-column',
                templates: [
                  {
                    type: 'label-value',
                    label: 'Área Construída',
                    value: "<%- properties?.qt_area_construida ?? '-' %>",
                  },

                  {
                    type: 'label-value',
                    label: 'Condomínio',
                    value: "<%- properties?.cd_condominio ?? '-' %>",
                  },

                  {
                    type: 'label-value',
                    label: 'Numeração',
                    value: "<%- properties?.cd_quadra_fiscal ?? '-' %>",
                  },
                ],
              },
            ],
            properties: {
              columns: [6, 6],
            },
            id: '94bef4de-7956-4cb0-829c-7a81548defdd',
          },
        ],
      },
    ],
    boardTemplate: [
      {
        type: 'wrapper-card',
        label: 'Identificador',
        properties: {
          helper: 'Identificador do lote, (setor.quadra.lote.condominio)',
          printColumn: 1,
          semanticCardWeight: 1,
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
        properties: {
          printColumn: 1,
          semanticCardWeight: 1,
        },
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
                  getFillColor: [30, 111, 249, 100],
                  getLineColor: [30, 111, 249],
                })
              `,
              initialViewState: `
                (data) => {
                  const centroid = utils.calculateCenterId(data.geometry.coordinates[0]);
                  const zoom = utils.calculateZoom(data);

                  return {
                    longitude: centroid[0],
                    latitude: centroid[1],
                    zoom: zoom,
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
          /* {
            type: 'edit-polygon',
          }, */
          /* {
            type: 'button',
            label: 'Imprimir',
            properties: {
              action:
                "(data) => window.open(`/print?layerSchema=lotes&CQL_FILTER=cd_setor_fiscal = '${data.properties.cd_setor_fiscal}' AND cd_quadra_fiscal = '${data.properties.cd_quadra_fiscal}' AND cd_lote = '${data.properties.cd_lote}' AND cd_condominio = '${data.properties.cd_condominio}'`,'_blank')",
            },
          }, */
        ],
      },
      {
        type: 'wrapper-card',
        label: 'Informações prediais',
        properties: {
          printColumn: 1,
          semanticCardWeight: 1,
        },
        templates: [
          {
            type: 'wrapper-grid',
            templates: [
              {
                type: 'wrapper-grid-column',
                templates: [
                  {
                    type: 'label-value',
                    label: 'Área do Terreno',
                    value: "<%- properties?.qt_area_terreno ?? '-' %>",
                  },
                  {
                    type: 'label-value',
                    label: 'Situação do Lote',
                    value: "<%- properties?.tx_situ_lote ?? '-' %>",
                  },
                  {
                    type: 'label-value',
                    label: 'Tipo de Quadra',
                    value: "<%- properties?.tx_tipo_quadra ?? '-' %>",
                  },
                ],
              },
              {
                type: 'wrapper-grid-column',
                templates: [
                  {
                    type: 'label-value',
                    label: 'Área Construída',
                    value: "<%- properties?.qt_area_construida ?? '-' %>",
                  },

                  {
                    type: 'label-value',
                    label: 'Condomínio',
                    value: "<%- properties?.cd_condominio ?? '-' %>",
                  },

                  {
                    type: 'label-value',
                    label: 'Numeração',
                    value: "<%- properties?.cd_quadra_fiscal ?? '-' %>",
                  },
                ],
              },
            ],
            properties: {
              columns: [6, 6],
            },
            id: '94bef4de-7956-4cb0-829c-7a81548defdd',
          },
        ],
      },
      {
        type: 'wrapper-request',
        properties: {
          url: '/maps/geospatial-intersections',
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

            response.features.forEach((feat) => {
              const rgb = utils.generateColor(feat.id);
              feat.properties.ui_color = rgb;
              feat.properties.ui_color_hex = "#" + rgb.map(x => x.toString(16).padStart(2, '0')).join('');
            });

            return response;
          };`,
        },
        templates: [
          {
            type: 'wrapper-card',
            label: 'Restrições',
            properties: {
              printColumn: 3,
              semanticCardWeight: 1,
            },
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
            properties: {
              printColumn: 3,
              semanticCardWeight: 1,
            },
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
            label: 'Polígonos de Interseção',
            properties: {
              printColumn: 2,
              semanticCardWeight: 1,
            },
            templates: [
              {
                type: 'wrapper-tabs',
                properties: {
                  data: `(data) => data.response.features.filter((f) => {
                    if (f.id.includes("lote_cidadao") || f.properties?.layer === "slui:lote_cidadao") {
                      return String(f.properties?.cd_identificador_original_lote) !== String(data.properties?.cd_identificador_original_lote);
                    }
                    return true;
                  })`,
                  tabTitle: `(data) => {
                    const props = data.data.properties;
                    if (props.nm_tema_divisao_pde) return props.nm_tema_divisao_pde;
                    if (props.nm_subprefeitura) return props.nm_subprefeitura;
                    if (props.nm_distrito_municipal) return props.nm_distrito_municipal;
                    if (props.nm_area_tombada) return props.nm_area_tombada;
                    if (props.nm_area) return props.nm_area;
                    if (props.cd_lote) return "Lote " + props.cd_lote.padStart(4, "0");
                    if (props.layer) return props.layer.replace("slui:", "");
                    return "Polígono";
                  }`,
                  tabColor: '(data) => data.data.properties.ui_color_hex',
                  indexTab: {
                    title: 'Geral',
                    templates: [
                      {
                        type: 'polygon-map',
                        properties: {
                          polygonProps: `
                        (data) => {
                          const inters = data.response.features.filter(f => {
                            if (f.id.includes("lote_cidadao") || f.properties?.layer === "slui:lote_cidadao") {
                              return String(f.properties?.cd_identificador_original_lote) !== String(data.properties?.cd_identificador_original_lote);
                            }
                            return true;
                          });
                          
                          const polygonData = [];
                          
                          /* Lote principal */
                          if (data.geometry?.coordinates) {
                            if (data.geometry.type === "MultiPolygon") {
                              data.geometry.coordinates.forEach(c => {
                                polygonData.push({ coordinates: c, fillColor: [30, 111, 249, 100], lineColor: [30, 111, 249] });
                              });
                            } else {
                              polygonData.push({ coordinates: data.geometry.coordinates, fillColor: [30, 111, 249, 100], lineColor: [30, 111, 249] });
                            }
                          }
                          
                          /* Outras interseções */
                          inters.forEach(l => {
                            if (!l.geometry || !l.geometry.coordinates || !l.geometry.coordinates.length) return;
                            const fColor = [...(l.properties.ui_color || [150, 150, 150]), 50];
                            const lColor = l.properties.ui_color || [150, 150, 150];
                            
                            if (l.geometry.type === "MultiPolygon") {
                              l.geometry.coordinates.forEach(c => {
                                polygonData.push({ coordinates: c, fillColor: fColor, lineColor: lColor });
                              });
                            } else {
                              polygonData.push({ coordinates: l.geometry.coordinates, fillColor: fColor, lineColor: lColor });
                            }
                          });

                          return {
                            id: "polygon-layer-multiple",
                            data: polygonData,
                            pickable: false,
                            stroked: true,
                            filled: true,
                            lineWidthMinPixels: 2,
                            getPolygon: (d) => d.coordinates,
                            getFillColor: (d) => d.fillColor,
                            getLineColor: (d) => d.lineColor,
                          };
                        }
                      `,
                          initialViewState: `
                        (data) => {
                          const centroid = utils.calculateCenterId(data.geometry.coordinates[0]);
                          const zoom = utils.calculateZoom(data);

                          return {
                            longitude: centroid[0],
                            latitude: centroid[1],
                            zoom: zoom,
                            pitch: 0,
                            bearing: 0,
                          };
                        }
                      `,
                        },
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
                                  <% } else if (id.includes("slui:setores_e_subsetores")) { %>
                                    <%- properties.setor %> - <%- properties.totalAreaPercentage ? properties.totalAreaPercentage.toFixed(2) + '%' : '' %>
                                  <% } else if (properties.layer.includes("slui:distrito_municipal")) { %>
                                    Distrito municipal - <%- properties.totalAreaPercentage ? properties.totalAreaPercentage.toFixed(2) + '%' : '' %>
                                  <% } else if (properties.layer.includes("slui:tombamentos")) { %>
                                    Imóvel tombado - <%- properties.totalAreaPercentage ? properties.totalAreaPercentage.toFixed(2) + '%' : '' %>
                                  <% } else if (properties.layer.includes("slui:zoneamento")) { %>
                                    Zoneamento perimetro - <%- properties.totalAreaPercentage ? properties.totalAreaPercentage.toFixed(2) + '%' : '' %>
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
                },
                templates: [
                  {
                    type: 'polygon-map',
                    properties: {
                      polygonProps: `
                    (data) => {
                      const polygonData = [];
                      
                      /* Geometria do Lote Base */
                      if (data.__parentData && data.__parentData.geometry?.coordinates) {
                        const baseColor = [30, 111, 249];
                        if (data.__parentData.geometry.type === "MultiPolygon") {
                          data.__parentData.geometry.coordinates.forEach(c => {
                            polygonData.push({ coordinates: c, fillColor: [...baseColor, 100], lineColor: baseColor });
                          });
                        } else {
                          polygonData.push({ coordinates: data.__parentData.geometry.coordinates, fillColor: [...baseColor, 100], lineColor: baseColor });
                        }
                      }
                      
                      /* Geometria da feição interceptada atual */
                      if (data.geometry && data.geometry.coordinates && data.geometry.coordinates.length) {
                        const fColor = [...(data.properties.ui_color || [150, 150, 150]), 50];
                        const lColor = data.properties.ui_color || [150, 150, 150];
                        
                        if (data.geometry.type === "MultiPolygon") {
                          data.geometry.coordinates.forEach(c => {
                            polygonData.push({ coordinates: c, fillColor: fColor, lineColor: lColor });
                          });
                        } else {
                          polygonData.push({ coordinates: data.geometry.coordinates, fillColor: fColor, lineColor: lColor });
                        }
                      }

                      return {
                        id: "polygon-layer-individual",
                        data: polygonData,
                        pickable: false,
                        stroked: true,
                        filled: true,
                        lineWidthMinPixels: 2,
                        getPolygon: (d) => d.coordinates,
                        getFillColor: (d) => d.fillColor,
                        getLineColor: (d) => d.lineColor,
                      };
                    }
                  `,
                      initialViewState: `
                    (data) => {
                      /* Tenta focar na geometria do lote filho atual primeiro */
                      let centroid;
                      let zoom = 16.5;
                      if (data.geometry && data.geometry.coordinates && data.geometry.coordinates.length) {
                        centroid = utils.calculateCenterId(data.geometry.coordinates[0]);
                        zoom = utils.calculateZoom(data);
                      } else if (data.__parentData && data.__parentData.geometry?.coordinates) {
                        centroid = utils.calculateCenterId(data.__parentData.geometry.coordinates[0]);
                        zoom = utils.calculateZoom(data.__parentData);
                      } else {
                        return {};
                      }
                      
                      return {
                        longitude: centroid[0],
                        latitude: centroid[1],
                        zoom: zoom,
                        pitch: 0,
                        bearing: 0,
                      };
                    }
                  `,
                    },
                  },
                  {
                    type: 'wrapper-card',
                    label: 'Informações da Interseção',
                    templates: [
                      {
                        type: 'label-value',
                        label: 'Classificação / Setor',
                        value:
                          "<%- properties.nm_perimetro_divisao_pde || properties.nm_tema_divisao_pde || properties.nm_subprefeitura || properties.cd_setor_fiscal || properties.nm_area_tombada || '-' %>",
                      },
                      {
                        type: 'label-value',
                        label: 'Área da Feição',
                        value:
                          "<%- properties.totalArea ? properties.totalArea.toFixed(2) + ' m²' : (properties.qt_area_terreno ? properties.qt_area_terreno + ' m²' : '-') %>",
                      },
                      {
                        type: 'label-value',
                        label: 'Porcentagem de Interseção',
                        value:
                          "<%- properties.totalAreaPercentage ? properties.totalAreaPercentage.toFixed(2) + '%' : '-' %>",
                      },
                    ],
                  },
                ],
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
      getLineWidth: 0.5,
      autoHighlight: true,
      highlightColor: [252, 252, 255, 95],
      getElevation: `(allotment) => {
        const { qt_area_construida, qt_area_terreno } =
          allotment?.properties || {};
        if (!qt_area_construida || !qt_area_terreno) return 0.01;

        return (qt_area_construida / qt_area_terreno) * 2 * 3;
      }`,
      layerActions: [
        {
          icon: 'info',
          action:
            "() => window.open('https://dadosabertos.urbis.prefeitura.sp.gov.br/','_blank')",
        },
      ],
      getText: `(d) => d.properties.cd_lote?.padStart(4, '0') ?? ''`,
    },
    colors: [
      {
        color: [30, 111, 249, 95],
        label: 'default',
        type: LayerSchemaColorTypeEnum.FILL,
      },
      {
        color: [255, 255, 255, 200],
        label: 'default',
        type: LayerSchemaColorTypeEnum.TEXT,
      },
      {
        color: [30, 111, 249, 200],
        label: 'default',
        type: LayerSchemaColorTypeEnum.LINE,
      },
    ],
  },
  {
    id: 'macroareas',
    name: 'Macroáreas',
    index: 46,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Amacroareas&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
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
        color: [127, 1, 0, 190],
        pattern: 'full',
        label: 'Macroarea de Estruturacao Metropolitana',
        value: 'Macroarea de Estruturacao Metropolitana',
      },
      {
        color: [154, 89, 89, 190],
        pattern: 'full',
        label: 'Macroarea de Urbanizacao Consolidada',
        value: 'Macroarea de Urbanizacao Consolidada',
      },
      {
        color: [210, 99, 28, 190],
        pattern: 'full',
        label: 'Macroarea de Qualificacao da Urbanizacao',
        value: 'Macroarea de Qualificacao da Urbanizacao',
      },
      {
        color: [244, 191, 3, 190],
        pattern: 'full',
        label: 'Macroarea de Reducao da Vulnerabilidade Urbana',
        value: 'Macroarea de Reducao da Vulnerabilidade Urbana',
      },
      {
        color: [250, 236, 176, 190],
        pattern: 'full',
        label:
          'Macroarea de Reducao da Vulnerabilidade Urbana e Recuperacao Ambiental',
        value:
          'Macroarea de Reducao da Vulnerabilidade Urbana e Recuperacao Ambiental',
      },
      {
        color: [192, 212, 167, 190],
        pattern: 'full',
        label: 'Macroarea de Controle e Qualificacao Urbana e Ambiental',
        value: 'Macroarea de Controle e Qualificacao Urbana e Ambiental',
      },
      {
        color: [108, 162, 150, 190],
        pattern: 'full',
        label: 'Macroarea de Contencao Urbana e Uso Sustentavel',
        value: 'Macroarea de Contencao Urbana e Uso Sustentavel',
      },
      {
        color: [33, 89, 86, 190],
        pattern: 'full',
        label: 'Macroarea de Preservacao dos Ecossistemas Naturais',
        value: 'Macroarea de Preservacao dos Ecossistemas Naturais',
      },
    ],
  },
  {
    id: 'macrozonas',
    name: 'Macrozonas',
    index: 45,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Amacrozonas&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
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
        color: [190, 190, 190, 190],
        pattern: 'full',
        label: 'Macrozona de Estruturacao e Qualificacao Urbana',
        value: 'Macrozona de Estruturacao e Qualificacao Urbana',
      },
      {
        color: [50, 130, 138, 190],
        pattern: 'full',
        label: 'Macrozona de Protecao e Recuperacao Ambiental',
        value: 'Macrozona de Protecao e Recuperacao Ambiental',
      },
    ],
  },
  {
    id: 'setores',
    name: 'Setores',
    index: 47,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Asetores&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: 'setor',
    getFillColorPropName: 'setor',
    getLineColorPropName: 'setor',
    groupId: 'macrozoneamento',
    colors: [
      {
        color: [140, 1, 0, 190],
        pattern: 'full',
        label: 'Setor Orla Ferroviária e Fluvial',
        value: '3 - Setor Orla Ferroviária e Fluvial',
      },
      {
        color: [205, 3, 0, 190],
        pattern: 'full',
        label: 'Setor Eixos de Desenvolvimento',
        value: '2 - Setor Eixos de Desenvolvimento',
      },
      {
        color: [238, 64, 0, 190],
        pattern: 'full',
        label: 'Setor Central',
        value: '1 - Centro',
      },
    ],
  },
  {
    id: 'subsetores',
    name: 'Subsetores',
    index: 48,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Asubsetores&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
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
        color: [140, 1, 0, 190],
        pattern: 'full',
        label: 'Arco Tiete',
        value: 'Arco Tiete',
      },
      {
        color: [205, 3, 0, 190],
        pattern: 'full',
        label: 'Arco Tamanduatei',
        value: 'Arco Tamanduatei',
      },
      {
        color: [238, 64, 0, 190],
        pattern: 'full',
        label: 'Arco Leste',
        value: 'Arco Leste',
      },
      {
        color: [205, 79, 57, 190],
        pattern: 'full',
        label: 'Arco Pinheiros',
        value: 'Arco Pinheiros',
      },
      {
        color: [241, 99, 72, 190],
        pattern: 'full',
        label: 'Faria Lima-Agua Espraiada-Chucri Zaidan',
        value: 'Faria Lima-Agua Espraiada-Chucri Zaidan',
      },
      {
        color: [244, 160, 122, 190],
        pattern: 'full',
        label: 'Arco Jurubatuba',
        value: 'Arco Jurubatuba',
      },
      {
        color: [252, 251, 205, 190],
        pattern: 'full',
        label: 'Avenida Cupece',
        value: 'Avenida Cupece',
      },
      {
        color: [238, 234, 191, 190],
        pattern: 'full',
        label: 'Noroeste',
        value: 'Noroeste',
      },
      {
        color: [219, 205, 116, 190],
        pattern: 'full',
        label: 'Arco Jacu-Pessego',
        value: 'Arco Jacu-Pessego',
      },
      {
        color: [167, 155, 88, 190],
        pattern: 'full',
        label: 'Fernao Dias',
        value: 'Fernao Dias',
      },
      {
        color: [161, 62, 54, 190],
        pattern: 'full',
        label: 'Centro',
        value: 'Centro',
      },
    ],
  },
  {
    id: 'eixos',
    name: 'Eixos',
    index: 49,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Aeixos&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
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
        color: [136, 144, 173, 190],
        pattern: 'full',
        label: 'Area de Influencia',
        value: 'Area de Influencia',
      },
      {
        color: [201, 186, 119, 190],
        pattern: 'full',
        label: 'Area de Influencia (2016)',
        value: 'Area de Influencia (2016)',
      },
    ],
  },
  {
    id: 'zoneamento_geral',
    name: 'Zoneamento de destinação (urbano/rural)',
    index: 44,
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
        color: [160, 160, 160, 190],
        pattern: 'full',
        label: 'Zona Urbana',
        value: 'Zona Urbana',
      },
      {
        color: [146, 74, 0, 190],
        pattern: 'full',
        label: 'Zona Rural',
        value: 'Zona Rural',
      },
    ],
  },
  {
    id: 'zoneamento_lei_16402_18177',
    name: 'Zoneamento',
    index: 50,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Azoneamento&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.Stream,
    isVisible: false,
    minZoom: 13,
    getTextColorPropName: 'cd_zoneamento_perimetro',
    getFillColorPropName: 'cd_zoneamento_perimetro',
    getLineColorPropName: 'cd_zoneamento_perimetro',
    groupId: 'urbanistico',
    clickAction: {
      action: ClickActionEnum.SelectFeature,
      params: {
        zoom: 19.5,
      },
    },
    colors: [
      {
        color: [223, 253, 178, 190],
        pattern: 'full',
        label: 'AC-1',
        value: 'AC-1',
      },
      {
        color: [223, 253, 178, 190],
        pattern: 'dots',
        label: 'AC-2',
        value: 'AC-2',
      },
      {
        color: [208, 234, 197, 190],
        pattern: 'full',
        label: 'Praça/Canteiro',
        value: 'Praça/Canteiro',
      },
      {
        color: [173, 160, 152, 190],
        pattern: 'full',
        label: 'ZC',
        value: 'ZC',
      },
      {
        color: [173, 160, 152, 190],
        pattern: 'dots',
        label: 'ZCa',
        value: 'ZCa',
      },
      {
        color: [207, 178, 161, 190],
        pattern: 'full',
        label: 'ZC-ZEIS',
        value: 'ZC-ZEIS',
      },
      {
        color: [137, 142, 189, 190],
        pattern: 'full',
        label: 'ZCOR-1',
        value: 'ZCOR-1',
      },
      {
        color: [129, 186, 226, 190],
        pattern: 'full',
        label: 'ZCOR-2',
        value: 'ZCOR-2',
      },
      {
        color: [181, 207, 231, 190],
        pattern: 'full',
        label: 'ZCOR-3',
        value: 'ZCOR-3',
      },
      {
        color: [154, 190, 193, 190],
        pattern: 'full',
        label: 'ZCORa',
        value: 'ZCORa',
      },
      {
        color: [181, 146, 177, 190],
        pattern: 'full',
        label: 'ZDE-1',
        value: 'ZDE-1',
      },
      {
        color: [208, 175, 185, 190],
        pattern: 'full',
        label: 'ZDE-2',
        value: 'ZDE-2',
      },
      {
        color: [219, 206, 159, 190],
        pattern: 'full',
        label: 'ZEIS-1',
        value: 'ZEIS-1',
      },
      {
        color: [254, 208, 155, 190],
        pattern: 'full',
        label: 'ZEIS-2',
        value: 'ZEIS-2',
      },
      {
        color: [255, 230, 170, 190],
        pattern: 'full',
        label: 'ZEIS-3',
        value: 'ZEIS-3',
      },
      {
        color: [255, 239, 195, 190],
        pattern: 'full',
        label: 'ZEIS-4',
        value: 'ZEIS-4',
      },
      {
        color: [255, 249, 221, 190],
        pattern: 'full',
        label: 'ZEIS-5',
        value: 'ZEIS-5',
      },
      {
        color: [212, 159, 148, 190],
        pattern: 'full',
        label: 'ZEM',
        value: 'ZEM',
      },
      {
        color: [227, 192, 169, 190],
        pattern: 'hatch-1x',
        label: 'ZEMP',
        value: 'ZEMP',
      },
      {
        color: [145, 170, 149, 190],
        pattern: 'full',
        label: 'ZEP',
        value: 'ZEP',
      },
      {
        color: [167, 211, 186, 190],
        pattern: 'full',
        label: 'ZEPAM',
        value: 'ZEPAM',
      },
      {
        color: [255, 239, 195, 190],
        pattern: 'hatch-cross',
        label: 'ZER-1',
        value: 'ZER-1',
      },
      {
        color: [255, 225, 158, 190],
        pattern: 'hatch-1x',
        label: 'ZER-2',
        value: 'ZER-2',
      },
      {
        color: [255, 255, 153, 190],
        pattern: 'dots',
        label: 'ZERa',
        value: 'ZERa',
      },
      {
        color: [189, 138, 140, 190],
        pattern: 'full',
        label: 'ZEU',
        value: 'ZEU',
      },
      {
        color: [189, 138, 140, 190],
        pattern: 'dots',
        label: 'ZEUa',
        value: 'ZEUa',
      },
      {
        color: [196, 158, 157, 190],
        pattern: 'hatch-1x',
        label: 'ZEUP',
        value: 'ZEUP',
      },
      {
        color: [197, 184, 184, 190],
        pattern: 'dots',
        label: 'ZEUPa',
        value: 'ZEUPa',
      },
      {
        color: [206, 206, 206, 190],
        pattern: 'full',
        label: 'ZM',
        value: 'ZM',
      },
      {
        color: [217, 217, 217, 190],
        pattern: 'dots',
        label: 'ZMa',
        value: 'ZMa',
      },
      {
        color: [186, 186, 186, 190],
        pattern: 'full',
        label: 'ZMIS',
        value: 'ZMIS',
      },
      {
        color: [232, 232, 232, 190],
        pattern: 'full',
        label: 'ZMISa',
        value: 'ZMISa',
      },
      {
        color: [224, 218, 197, 190],
        pattern: 'full',
        label: 'ZOE',
        value: 'ZOE',
      },
      {
        color: [176, 193, 171, 190],
        pattern: 'full',
        label: 'ZPDS',
        value: 'ZPDS',
      },
      {
        color: [200, 206, 175, 190],
        pattern: 'full',
        label: 'ZPDSr',
        value: 'ZPDSr',
      },
      {
        color: [161, 154, 181, 190],
        pattern: 'full',
        label: 'ZPI-1',
        value: 'ZPI-1',
      },
      {
        color: [212, 195, 221, 190],
        pattern: 'full',
        label: 'ZPI-2',
        value: 'ZPI-2',
      },
      {
        color: [255, 255, 153, 190],
        pattern: 'full',
        label: 'ZPR',
        value: 'ZPR',
      },
    ],
  },
  {
    id: 'minianel_viario',
    name: 'Minianel viário',
    index: 67,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Aminianel_viario&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
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
        color: [217, 234, 211, 190],
        label: 'default',
        pattern: 'hatch-1x',
        patternConfig: { getFillPatternScale: 0.3 },
      },
    ],
  },
  {
    id: 'aguas_dormentes',
    name: 'Águas dormentes',
    index: 68,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Aaguas_dormentes&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'aguas',
    colors: [
      {
        color: [17, 85, 204, 190],
        label: 'default',
      },
    ],
  },
  {
    id: 'aguas_correntes',
    name: 'Águas correntes',
    index: 69,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Aaguas_correntes&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'aguas',
    colors: [
      {
        color: [17, 85, 204, 190],
        label: 'default',
      },
    ],
  },
  {
    id: 'aguas_correntes_estimadas',
    name: 'Águas Correntes Estimadas',
    index: 70,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?request=GetMap&typeName=slui%3Aaguas_correntes_estimadas&format=image%2Fvnd.jpeg-png&TRANSPARENT=true&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.CustomWMSLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'aguas',
    colors: [
      {
        color: [65, 120, 216, 190],
        label: 'default',
      },
    ],
  },
  {
    id: 'terrenos_marginais_aos_cursos_dagua_navegaveis',
    name: 'Terrenos marginais aos cursos d’água navegáveis',
    index: 71,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Aterrenos_marginais_aos_cursos_dagua_navegaveis&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'aguas',
    colors: [
      {
        color: [241, 194, 50, 190],
        label: 'default',
      },
    ],
  },
  {
    id: 'calcadas',
    name: 'Calçadas',
    index: 72,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Acalcadas&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.Stream,
    isVisible: false,
    minZoom: 13,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'vias_publicas',
    colors: [
      {
        color: [217, 217, 217, 190],
        label: 'default',
      },
    ],
  },
  {
    id: 'pracas_e_canteiros',
    name: 'Canteiros',
    index: 74,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Apracas_e_canteiros&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.Stream,
    isVisible: false,
    minZoom: 13,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'vias_publicas',
    colors: [
      {
        color: [182, 215, 168, 190],
        label: 'default',
      },
    ],
  },
  {
    id: 'risco_geologico',
    name: 'Risco Geológico',
    index: 112,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Arisco_geologico&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'alto_risco_geologico_e_hidrologico',
    colors: [
      {
        color: [255, 0, 0, 190],
        pattern: 'dots',
        label: 'default',
        patternConfig: { getFillPatternScale: 0.3 },
      },
    ],
  },
  {
    id: 'risco_hidrologico',
    name: 'Risco Hidrológico',
    index: 113,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Arisco_hidrologico&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'alto_risco_geologico_e_hidrologico',
    colors: [
      {
        color: [204, 0, 0, 190],
        pattern: 'dots',
        label: 'default',
        patternConfig: { getFillPatternScale: 0.3 },
      },
    ],
  },
  {
    id: 'restricoes_geotecnicas',
    name: 'Restrições Geotécnicas',
    index: 114,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Arestricoes_geotecnicas&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
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
        color: [153, 0, 0, 190],
        pattern: 'dots',
        label: 'default',
        patternConfig: { getFillPatternScale: 0.3 },
      },
    ],
  },
  {
    id: 'areas_protecao_mananciais',
    name: 'Áreas de Proteção aos Mananciais - APM',
    index: 131,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Aareas_de_protecao_e_recuperacao_dos_mananciais&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'areas_protegidas',
    colors: [
      {
        color: [0, 0, 255, 190],
        label: 'default',
      },
    ],
  },
  {
    id: 'subprefeitura',
    name: 'Subprefeituras',
    index: 22,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Asubprefeitura&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'limites_administrativos',
    properties: {
      getText: `(d) => d?.properties?.nm_subprefeitura`,
      minZoomText: 14,
    },
    colors: [
      {
        color: [183, 183, 183, 190],
        label: 'default',
        type: LayerSchemaColorTypeEnum.LINE,
      },
    ],
  },
  {
    id: 'curvas_de_nivel',
    name: 'Curvas mestras',
    index: 26,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=slui:curva_mestra&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'curvas_de_nivel',
    colors: [
      {
        color: [0, 0, 0, 255],
        label: 'default',
      },
    ],
  },
  {
    id: 'curva_intermediaria',
    name: 'Curvas intermediárias',
    index: 27,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=slui:curva_intermediaria&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'curvas_de_nivel',
    colors: [
      {
        color: [102, 102, 102, 255],
        label: 'default',
      },
    ],
  },
  {
    id: 'cartorio_registro_imovel',
    name: 'Cartório de imóveis',
    index: 27,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=slui:cartorio_registro_imovel&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'documentos_gerais',
    properties: {
      getText: `(d) => d?.properties?.cd_numero_cartorio`,
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
    },
    colors: [
      {
        color: [153, 203, 255, 255],
        label: 'default',
        type: LayerSchemaColorTypeEnum.FILL,
      },
      {
        color: [65, 92, 119, 200],
        label: 'default',
        type: LayerSchemaColorTypeEnum.TEXT,
      },
      {
        color: [0, 0, 0, 95],
        label: 'default',
        type: LayerSchemaColorTypeEnum.LINE,
      },
    ],
  },
  {
    id: 'operacao_urbana',
    name: 'Operações Urbanas Consorciadas - OUC',
    index: 55,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=slui:operacao_urbana&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: 'nm_operacao_urbana',
    getFillColorPropName: 'nm_operacao_urbana',
    getLineColorPropName: 'nm_operacao_urbana',
    groupId: 'legislacao_urbanistica',
    colors: [
      {
        color: [255, 153, 255, 255],
        label: 'Água Espraiada',
        value: 'AGUA ESPRAIADA',
      },
      {
        color: [255, 204, 153, 255],
        label: 'Faria Lima',
        value: 'FARIA LIMA',
      },
      /* {
        color: [255, 153, 153, 255],
        label: 'Centro',
        value: 'CENTRO',
      }, */
      {
        color: [154, 153, 255, 255],
        label: 'Água Branca',
        value: 'AGUA BRANCA',
      },
      {
        color: [191, 191, 191, 255],
        label: 'Água Branca (perímetro expandido)',
        value: 'AGUA BRANCA (perimetro expandido)',
      },
      {
        color: [219, 220, 221, 255],
        label: 'Faria Lima  (perímetro expandido)',
        value: 'FARIA LIMA (perimetro expandido)',
      },
    ],
  },
  {
    id: 'zoneamento_incentivos_edif_garagem',
    name: 'Perímetros de incentivos para edifícios-garagem',
    index: 57,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=slui:zoneamento_incentivos_edif_garagem&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'legislacao_urbanistica',
    colors: [
      {
        color: [194, 76, 66, 190],
        label: 'default',
      },
    ],
  },
  {
    id: 'perimetros_incentivo',
    name: 'Perímetros de Incentivo ao Desenvolvimento Econômico',
    index: 58,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=slui:perimetros_incentivo&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: 'nm_perimetro_divisao_pde',
    getFillColorPropName: 'nm_perimetro_divisao_pde',
    getLineColorPropName: 'nm_perimetro_divisao_pde',
    groupId: 'legislacao_urbanistica',
    properties: {
      getLineWidth: 12,
    },
    colors: [
      {
        color: [170, 0, 127, 190],
        label: 'Cupecê',
        value: 'Cupecê',
        type: LayerSchemaColorTypeEnum.LINE,
      },
      {
        color: [255, 2, 127, 190],
        label: 'Fernão Dias',
        value: 'Fernão Dias',
        type: LayerSchemaColorTypeEnum.LINE,
      },
      {
        color: [255, 85, 0, 190],
        label: 'Jacu-Pêssego',
        value: 'Jacu-Pêssego',
        type: LayerSchemaColorTypeEnum.LINE,
      },
      {
        color: [255, 32, 255, 190],
        label: 'Raimundo Pereira de Magalhães (previsto)',
        value: 'Raimundo Pereira de Magalhães (previsto)',
        type: LayerSchemaColorTypeEnum.LINE,
      },
      {
        color: [170, 0, 127, 0],
        label: 'Cupecê',
        value: 'Cupecê',
        type: LayerSchemaColorTypeEnum.FILL,
      },
      {
        color: [255, 2, 127, 0],
        label: 'Fernão Dias',
        value: 'Fernão Dias',
        type: LayerSchemaColorTypeEnum.FILL,
      },
      {
        color: [255, 85, 0, 0],
        label: 'Jacu-Pêssego',
        value: 'Jacu-Pêssego',
        type: LayerSchemaColorTypeEnum.FILL,
      },
      {
        color: [255, 32, 255, 0],
        label: 'Raimundo Pereira de Magalhães (previsto)',
        value: 'Raimundo Pereira de Magalhães (previsto)',
        type: LayerSchemaColorTypeEnum.FILL,
      },
    ],
  },
  {
    id: 'qualificacao_ambiental',
    name: 'Perímetros de qualificação ambiental',
    index: 59,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=slui:qualificacao_ambiental&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.Stream,
    isVisible: false,
    minZoom: 15,
    getTextColorPropName: 'cd_zoneamento_perimetro',
    getFillColorPropName: 'cd_zoneamento_perimetro',
    getLineColorPropName: 'cd_zoneamento_perimetro',
    groupId: 'legislacao_urbanistica',
    colors: [
      {
        color: [164, 76, 76, 190],
        label: 'PA 1',
        value: 'PA 1',
      },
      {
        color: [213, 76, 76, 190],
        label: 'PA 2',
        value: 'PA 2',
      },
      {
        color: [225, 130, 122, 190],
        label: 'PA 3',
        value: 'PA 3',
      },
      {
        color: [183, 138, 138, 190],
        label: 'PA 4',
        value: 'PA 4',
      },
      {
        color: [255, 199, 141, 190],
        label: 'PA 5',
        value: 'PA 5',
      },
      {
        color: [223, 145, 96, 190],
        label: 'PA 6',
        value: 'PA 6',
      },
      {
        color: [255, 154, 132, 190],
        label: 'PA 7',
        value: 'PA 7',
      },
      {
        color: [255, 160, 92, 190],
        label: 'PA 8',
        value: 'PA 8',
      },
      {
        color: [255, 209, 77, 190],
        label: 'PA 9',
        value: 'PA 9',
      },
      {
        color: [253, 252, 179, 190],
        label: 'PA 10',
        value: 'PA 10',
      },
      {
        color: [211, 224, 193, 190],
        label: 'PA 11',
        value: 'PA 11',
      },
      {
        color: [174, 197, 148, 190],
        label: 'PA 12',
        value: 'PA 12',
      },
      {
        color: [200, 200, 200, 190],
        label: 'PA 13',
        value: 'PA 13',
      },
    ],
  },
  {
    id: 'imoveis_em_vila',
    name: 'Imóveis em vila',
    index: 61,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=slui:imoveis_em_vila&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: 'tx_indicador_enquadramento_vila',
    getFillColorPropName: 'tx_indicador_enquadramento_vila',
    getLineColorPropName: 'tx_indicador_enquadramento_vila',
    groupId: 'vilas',
    colors: [
      {
        color: [247, 116, 154, 190],
        label: 'Não enquadrado como vila',
        value: 'Não enquadrado como vila',
      },
      {
        color: [176, 218, 110, 190],
        label: 'Enquadrado como vila',
        value: 'Enquadrado como vila',
      },
    ],
  },
  {
    id: 'vias',
    name: 'Vias públicas',
    index: 61,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Avias&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.Stream,
    isVisible: false,
    minZoom: 13,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'areas_publicas',
    colors: [
      {
        color: [217, 217, 217, 190],
        label: 'default',
      },
    ],
  },
  {
    id: 'geo_cati_reserva_legal',
    name: 'Reserva Legal - RL',
    index: 136,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Ageo_cati_reserva_legal&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: null,
    getFillColorPropName: null,
    getLineColorPropName: null,
    groupId: 'situações_de_interesse_ambiental',
    colors: [
      {
        color: [217, 217, 217, 190],
        label: 'default',
      },
    ],
  },
  {
    id: 'remanescentes_mata_atlantica',
    name: 'Mata Atlântica',
    index: 142,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui:remanescentes_mata_atlantica&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: 'dc_classe_vegetacao',
    getFillColorPropName: 'dc_classe_vegetacao',
    getLineColorPropName: 'dc_classe_vegetacao',
    groupId: 'biomas_protegidos',
    colors: [
      {
        color: [247, 247, 157, 190],
        label: 'Bosque Heterogêneo',
        value: 'Bosque Heterogeneo',
      },
      {
        color: [217, 162, 132, 190],
        label: 'Campo Alto Montano',
        value: 'Campo Alto Montano',
      },
      {
        color: [242, 162, 247, 190],
        label: 'Campo de Varzea e Vegetação Aquática',
        value: 'Campo de Varzea e Vegetacao Aquatica',
      },
      {
        color: [242, 227, 172, 190],
        label: 'Campos Gerais',
        value: 'Campos Gerais',
      },
      {
        color: [132, 197, 147, 190],
        label: 'Mata Ombrofila Densa',
        value: 'Mata Ombrofila Densa',
      },
      {
        color: [229, 255, 229, 190],
        label: 'Mata de Varzea',
        value: 'Mata de Varzea',
      },
    ],
  },
  {
    id: 'areas_contaminadas',
    name: 'Áreas contaminadas',
    index: 150,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui:areas_contaminadas&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: 'dc_classificacao_area_contaminada',
    getFillColorPropName: 'dc_classificacao_area_contaminada',
    getLineColorPropName: 'dc_classificacao_area_contaminada',
    groupId: 'areas_contaminadas',
    colors: [
      {
        color: [91, 15, 0, 190],
        label: 'Contaminada',
        value: 'Contaminada',
        pattern: 'hatch-1x',
        patternConfig: { getFillPatternScale: 0.3 },
      },
      {
        color: [120, 63, 4, 190],
        label: 'Contaminada sob investigação (suspeita ou potencialmente)',
        value: 'Contaminada Sob Investigação',
        pattern: 'dots',
        patternConfig: { getFillPatternScale: 0.3 },
      },
      {
        color: [180, 95, 6, 190],
        label: 'Em processo de monitoramento para reabilitação',
        value: 'Em Processo de Monitoramento para Reabilitação',
        pattern: 'hatch-cross',
        patternConfig: { getFillPatternScale: 0.3 },
      },
    ],
  },
  {
    id: 'lei_espercas',
    name: 'Áreas de Intervenção Urbana - AIU',
    index: 150,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui:lei_espercas&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.GeoJsonLayer,
    isVisible: false,
    minZoom: null,
    getTextColorPropName: 'tipo_camada',
    getFillColorPropName: 'tipo_camada',
    getLineColorPropName: 'tipo_camada',
    groupId: 'legislacao_urbanistica',
    colors: [
      {
        color: [2, 253, 17, 190],
        label: 'Perímetro Área Central',
        value: 'requalifica_centro',
        pattern: 'hatch-1x',
        patternConfig: { getFillPatternScale: 0.3 },
      },
      {
        color: [255, 182, 81, 190],
        label: 'Estação Meteorológica',
        value: 'estacao_meteorologica',
        pattern: 'hatch-1x',
        patternConfig: { getFillPatternScale: 0.3 },
      },
    ],
  },
  {
    id: 'vegetacao_de_porte_arboreo',
    name: 'Vegetação de porte arbóreo	',
    index: 72,
    origin:
      'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Avegetacao_de_porte_arboreo&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    isActive: true,
    type: LayerSchemaTypeEnum.Stream,
    isVisible: false,
    minZoom: 15,
    getTextColorPropName: 'descricao_vegetacao',
    getFillColorPropName: 'descricao_vegetacao',
    getLineColorPropName: 'descricao_vegetacao',
    groupId: 'ambiental',
    colors: [
      {
        color: [90, 115, 98, 190],
        label:
          'Floresta ombrófila densa secundária em estágio avançado e floresta ombrófila densa primária',
        value:
          'Floresta ombrófila densa secundária em estágio avançado e floresta ombrófila densa primária',
      },
      {
        color: [92, 202, 89, 190],
        label: 'Floresta ombrófila densa secundária em estágio médio',
        value: 'Floresta ombrófila densa secundária em estágio médio',
      },
      {
        color: [158, 239, 173, 190],
        label: 'Floresta ombrófila densa secundária em estágio inicial',
        value: 'Floresta ombrófila densa secundária em estágio inicial',
      },
      {
        color: [90, 149, 98, 190],
        label: 'Floresta ombrófila densa alto-montana (mata nebular)',
        value: 'Floresta ombrófila densa alto-montana (mata nebular)',
      },
      {
        color: [205, 195, 95, 190],
        label: 'Floresta paludosa e ou de várzea',
        value: 'Floresta paludosa e ou de várzea',
      },
      {
        color: [223, 234, 121, 190],
        label: 'Campos alto-montanos',
        value: 'Campos alto-montanos',
      },
      {
        color: [248, 250, 93, 190],
        label: 'Vegetação herbáceo-arbustiva de várzea ou de brejo',
        value: 'Vegetação herbáceo-arbustiva de várzea ou de brejo',
      },
      {
        color: [254, 188, 101, 190],
        label: 'Vegetação aquática flutuante',
        value: 'Vegetação aquática flutuante',
      },
      {
        color: [255, 124, 76, 190],
        label: 'Maciços florestais heterogêneos e bosques urbanos',
        value: 'Maciços florestais heterogêneos e bosques urbanos',
      },
      {
        color: [151, 79, 101, 190],
        label: 'Maciços florestais homogêneos',
        value: 'Maciços florestais homogêneos',
      },
      {
        color: [245, 173, 242, 190],
        label: 'Baixa cobertura arbórea, arbóreo-arbustiva e ou arborescente',
        value: 'Baixa cobertura arbórea, arbóreo-arbustiva e ou arborescente',
      },
      {
        color: [254, 214, 168, 190],
        label: 'Agricultura',
        value: 'Agricultura',
      },
      {
        color: [158, 98, 221, 190],
        label:
          'Média a alta cobertura arbórea, arbóreo-arbustiva e ou arborescente',
        value:
          'Média a alta cobertura arbórea, arbóreo-arbustiva e ou arborescente',
      },
      {
        color: [255, 92, 176, 190],
        label: 'Vegetação herbáceo-arbustiva',
        value: 'Vegetação herbáceo-arbustiva',
      },
      {
        color: [190, 88, 75, 190],
        label: 'Mista',
        value: 'Mista',
      },

      {
        color: [0, 0, 0, 190],
        label: 'Espatodea',
        value: 'Espatodea',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Jacarandá-Mimoso',
        value: 'Jacarandá-Mimoso',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Sibipiruna',
        value: 'Sibipiruna',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Chapéu de sol',
        value: 'Chapéu de sol',
      },
      {
        color: [0, 0, 0, 190],
        label: 'benjamim',
        value: 'benjamim',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Ipê amarelo',
        value: 'Ipê amarelo',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Jeriva',
        value: 'Jeriva',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Ipê',
        value: 'Ipê',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Pata de vaca',
        value: 'Pata de vaca',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Reseda',
        value: 'Reseda',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Areca bambu',
        value: 'Areca bambu',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Pitanga',
        value: 'Pitanga',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Magnólia amarela',
        value: 'Magnólia amarela',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Manga',
        value: 'Manga',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Goiaba',
        value: 'Goiaba',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Alfeneiro',
        value: 'Alfeneiro',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Amora',
        value: 'Amora',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Uva japonesa',
        value: 'Uva japonesa',
      },
      {
        color: [0, 0, 0, 190],
        label: 'ni',
        value: 'ni',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Tipuana',
        value: 'Tipuana',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Falsa murta',
        value: 'Falsa murta',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Brassaia',
        value: 'Brassaia',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Quaresmeira',
        value: 'Quaresmeira',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Laranja / Limão',
        value: 'Laranja / Limão',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Leucena',
        value: 'Leucena',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Figueira',
        value: 'Figueira',
      },
      {
        color: [0, 0, 0, 190],
        label: 'Cassia fistula',
        value: 'Cassia fistula',
      },
    ],
  },
];
