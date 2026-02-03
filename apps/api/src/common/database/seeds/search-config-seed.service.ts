import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClickActionEnum } from '@open-urbis/map-shared';
import { Repository } from 'typeorm';
import { SearchConfig } from '../../../maps/search/entities/search-config.entity';

@Injectable()
export class SearchConfigSeedService {
  constructor(
    @InjectRepository(SearchConfig)
    private readonly searchConfigRepository: Repository<SearchConfig>,
  ) {}

  async run(): Promise<void> {
    console.info('Starting database seeding...');

    // Seed SearchConfig
    const searchConfig: SearchConfig[] = [
      {
        id: 'lots',
        name: 'Logradouros Tributários',
        layerSchemaId: 'lotes',
        index: 10,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => {
          const parseCode = (term) => {
            term = term.replaceAll(" ", "");

            if (!/^\\d{10}(\\d{2})?$/.test(term)) return null;

            const setor = term.substring(0, 3);
            const quadra = term.substring(3, 6);
            const lote = term.substring(6, 10);
            const condominio = term.length === 12 ? term.substring(10, 12) : null;

            return { quadra, setor, lote, condominio };
          };

          let CQL_FILTER = '';
          
          const code = parseCode(term);
          if (code) {
            const { condominio, lote, quadra, setor } = code;
            CQL_FILTER = \`cd_setor_fiscal = '\${setor}' AND cd_quadra_fiscal = '\${quadra}' AND cd_lote = '\${lote}'\`;
            if (condominio) CQL_FILTER += \` AND cd_condominio = '\${condominio}'\`;
          } else {
            term = \`%\${term.split(' ').join('%').split(',').join('')}%\`;
            CQL_FILTER = \`endereco_completo ILIKE '\${term}'\`;
          }

          return {
            service: 'WFS',
            version: '1.0.0',
            request: 'GetFeature',
            typeName: 'slui:view_lote_cidadao',
            maxFeatures: '5',
            outputFormat: 'json',
            srsName: 'EPSG:4326',
            CQL_FILTER,
          };
        }`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { endereco_completo: name, cd_numero_porta: number } =
              properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name: \`\${name}, \${number}\`,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'districts',
        name: 'Distritos',
        layerSchemaId: 'distrito_municipal',
        index: 20,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:distrito_municipal",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`nm_distrito_municipal ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nm_distrito_municipal: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'geocoding',
        name: 'Endereços',
        clickAction: {
          action: ClickActionEnum.SetZoom,
          params: {
            zoom: 17.1,
          },
        },
        origin: '{environment}/geocoding/places',
        index: 30,
        transformParams: `({term}) => ({search: term, service: "nominatim"})`,
        transformRequest: null,
        transformResponse: null,
      },
      {
        id: 'aguas_correntes_ou_dormentes',
        name: 'Águas Correntes ou Dormentes',
        layerSchemaId: 'aguas_correntes_ou_dormentes',
        index: 20,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:aguas_correntes_ou_dormentes",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`nm_acidente ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nm_acidente: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'areas_contaminadas',
        name: 'Áreas Contaminadas',
        layerSchemaId: 'areas_contaminadas',
        index: 30,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:areas_contaminadas",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`tx_endereco_area_contaminada ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { tx_endereco_area_contaminada: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'eixos',
        name: 'Eixos',
        layerSchemaId: 'eixos',
        index: 50,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:eixos",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`nm_perimetro_divisao_pde ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nm_perimetro_divisao_pde: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'macroareas',
        name: 'Macroáreas',
        layerSchemaId: 'macroareas',
        index: 70,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:macroareas",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`nm_perimetro_divisao_pde ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nm_perimetro_divisao_pde: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'macrozonas',
        name: 'Macrozonas',
        layerSchemaId: 'macrozonas',
        index: 80,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:macrozonas",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`nm_perimetro_divisao_pde ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nm_perimetro_divisao_pde: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'minianel_viario',
        name: 'Minianel Viário',
        layerSchemaId: 'minianel_viario',
        index: 90,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:minianel_viario",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`nm_restricao_circulacao_veiculo ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nm_restricao_circulacao_veiculo: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'parques_unidades_conservacao',
        name: 'Parques e Unidades de Conservação',
        layerSchemaId: 'parques_unidades_conservacao',
        index: 100,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:parques_unidades_de_conservacao_e_apa",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`nm_area ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nm_area: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'represas',
        name: 'Represas',
        layerSchemaId: 'represas',
        index: 120,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:represas",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`nm_acidente ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nm_acidente: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'restricoes_geotecnicas',
        name: 'Restrições Geotécnicas',
        layerSchemaId: 'restricoes_geotecnicas',
        index: 130,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:restricoes_geotecnicas",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`nm_perimetro ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nm_perimetro: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'risco_geologico',
        name: 'Risco Geológico',
        layerSchemaId: 'risco_geologico',
        index: 140,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:risco_geologico",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`nm_area_risco ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nm_area_risco: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'risco_hidrologico',
        name: 'Risco Hidrológico',
        layerSchemaId: 'risco_hidrologico',
        index: 150,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:risco_hidrologico",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`nm_area_risco_hidrologico ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nm_area_risco_hidrologico: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'setores_subsetores',
        name: 'Setores e Subsetores',
        layerSchemaId: 'setores_subsetores',
        index: 160,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:setores_e_subsetores",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`subsetor ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { subsetor: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'subprefeitura',
        name: 'Subprefeituras',
        layerSchemaId: 'subprefeitura',
        index: 170,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:subprefeitura",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`nm_subprefeitura ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nm_subprefeitura: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'sujeicao_a_alagamentos',
        name: 'Sujeição a Alagamentos',
        layerSchemaId: 'sujeicao_a_alagamentos',
        index: 180,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:sujeicao_a_alagamentos",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`nm_distrito ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nm_distrito: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'terras_indigenas',
        name: 'Terras Indígenas',
        layerSchemaId: 'terras_indigenas',
        index: 190,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:terras_indigenas",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`nm_terra_indigena ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nm_terra_indigena: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'terrenos_marginais_aos_cursos_dagua_navegaveis',
        name: "Terrenos Marginais aos Cursos D'Água Navegáveis",
        layerSchemaId: 'terrenos_marginais_aos_cursos_dagua_navegaveis',
        index: 200,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:terrenos_marginais_aos_cursos_dagua_navegaveis",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`nm_acidente ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nm_acidente: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'tombamentos-areas',
        name: 'Ambientais e Urbanísticos',
        layerSchemaId: 'tombamentos-areas',
        index: 210,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:tombamentos-areas",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`nm_bairro ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nm_bairro: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'tombamentos-envoltorias-de-imoveis',
        name: 'Envoltorias de Imóveis',
        layerSchemaId: 'tombamentos-envoltorias-de-imoveis',
        index: 220,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:tombamentos-envoltorias-de-imoveis",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`nm_area ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nm_area: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'tombamentos-imoveis',
        name: 'Imóveis',
        layerSchemaId: 'tombamentos-imoveis',
        index: 230,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:tombamentos-imoveis",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`nm_area_tombada ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nm_area_tombada: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'zeis_pde',
        name: 'ZEIS - Lei nº 16.050/14',
        layerSchemaId: 'zeis_pde',
        index: 240,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:ZEIS_(PDE)",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`tx_zoneamento_perimetro ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { tx_zoneamento_perimetro: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'zoneamento_geral',
        name: 'Urbano Geral',
        layerSchemaId: 'zoneamento_geral',
        index: 250,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:zoneamento_geral",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`nm_perimetro_divisao_pde ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nm_perimetro_divisao_pde: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
      {
        id: 'zoneamento_lei_16402_18177',
        name: 'Zoneamento - Lei nº 16.402/16+18.177/24',
        layerSchemaId: 'zoneamento_lei_16402_18177',
        index: 260,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: `({term}) => ({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: "slui:zoneamento",
          maxFeatures: "5",
          outputFormat: "json",
          srsName: "EPSG:4326",
          CQL_FILTER: \`tx_zoneamento_perimetro ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { tx_zoneamento_perimetro: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry.coordinates[0]
            );

            return {
              id,
              latitude,
              longitude,
              name,
              rawData: feature,
            };
          }) ?? [];
        }`,
        transformRequest: null,
        clickAction: null,
      },
    ];

    try {
      await this.searchConfigRepository.upsert(searchConfig, ['id']);

      console.info(
        `Seeded SearchConfig: ${searchConfig.map((group) => group.id).join(', ')}`,
      );
    } catch (error) {
      console.error(`Query failed: ${error}`);
    }

    console.info('Database seeding completed.');
  }
}
