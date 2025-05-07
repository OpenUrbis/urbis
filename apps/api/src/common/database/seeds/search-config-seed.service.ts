import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClickActionEnum } from '@open-urbis/map-shared';
import { Repository } from 'typeorm';
import { SearchConfig } from './../../../search-config/entities/search-config.entity';

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
            const setor = term.substring(0, 3); // primeiros 3 dígitos
            const quadra = term.substring(3, 6); // próximos 3 dígitos
            const lote = term.substring(6, 10); // próximos 4 dígitos
            const condominio = term.length === 12 ? term.substring(10, 12) : null; // últimos 2 dígitos, se existirem

            return { quadra, setor, lote, condominio };
          };

          let CQL_FILTER = '';

          const code = parseCode(term);
          if (code) {
            const { condominio, lote, quadra, setor } = code;
            CQL_FILTER = \`cd_setor_fiscal = '\${setor}' AND cd_quadra_fiscal = '\${quadra}' AND cd_lote = '\${lote}'\`;
            if (condominio) CQL_FILTER += \` AND cd_condominio = '\${condominio}'\`;
          } else {
            term = \`%\${term.split(" ").join("%").split(",").join("")}%\`;
            CQL_FILTER = \`nm_logradouro_completo ILIKE '\${term}'\`;
          }

          return {
            service: "WFS",
            version: "1.0.0",
            request: "GetFeature",
            typeName: "slui:view_lote_cidadao",
            maxFeatures: "5",
            outputFormat: "json",
            srsName: "EPSG:4326",
            CQL_FILTER,
          };
        }`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nm_logradouro_completo: name, cd_numero_porta: number } =
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
