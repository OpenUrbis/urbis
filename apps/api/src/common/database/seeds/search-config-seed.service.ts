import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClickActionEnum } from '../../../maps/layer-schemas/enums/click-action.enum';
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
        name: 'Lotes fiscais',
        layerSchemaId: 'lotes_fiscais',
        index: 10,
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        transformParams: String.raw`({term}) => {
          const normalizeDigits = (value) => value.replace(/\D/g, "");
          const normalizeTokenText = (value) => value
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[–—]/g, "-")
            .replace(/\s+/g, "")
            .replace(/[^0-9A-Z]+/g, ".")
            .replace(/\.+/g, ".")
            .replace(/^\./, "")
            .replace(/\.$/, "");

          const parseIptuNumbers = (term) => {
            const candidates = [];
            const addCandidate = (candidate) => {
              if (!candidate?.setor || !candidate?.quadra) return;
              const normalized = {
                setor: candidate.setor,
                quadra: candidate.quadra,
                lote: candidate.lote || null,
                condominio: candidate.condominio || null,
                digito: candidate.digito || null,
                tipoQuadra: candidate.tipoQuadra && candidate.tipoQuadra !== "F" ? candidate.tipoQuadra : null,
                tipoLote: candidate.tipoLote && candidate.tipoLote !== "F" ? candidate.tipoLote : null,
              };
              const key = JSON.stringify(normalized);
              if (!candidates.some((item) => JSON.stringify(item) === key)) candidates.push(normalized);
            };

            const normalizedText = normalizeTokenText(term);
            const tokens = normalizedText ? normalizedText.split(".") : [];
            const shouldUseCompactNumericParser = tokens.length < 2 && !/[A-Z]/.test(normalizedText);
            const digits = normalizeDigits(term);
            if (shouldUseCompactNumericParser && /^\d{10,13}$/.test(digits)) {
              const setor = digits.substring(0, 3);
              const quadra = digits.substring(3, 6);

              if (digits.length === 10 || digits.length === 11) {
                addCandidate({
                  setor,
                  quadra,
                  lote: digits.substring(6, 10),
                  digito: digits.length === 11 ? digits.substring(10, 11) : null,
                });
              }

              if (digits.length === 12 || digits.length === 13) {
                addCandidate({
                  setor,
                  quadra,
                  condominio: digits.substring(6, 8),
                  lote: digits.substring(8, 12),
                  digito: digits.length === 13 ? digits.substring(12, 13) : null,
                });
                addCandidate({
                  setor,
                  quadra,
                  lote: digits.substring(6, 10),
                  condominio: digits.substring(10, 12),
                  digito: digits.length === 13 ? digits.substring(12, 13) : null,
                });
              }
            }

            const numericParts = String(term).trim().split(/[^0-9]+/).filter(Boolean);
            if (numericParts.length >= 3 && /^\d{3}$/.test(numericParts[0]) && /^\d{3}$/.test(numericParts[1])) {
              const setor = numericParts[0];
              const quadra = numericParts[1];
              const first = numericParts[2];
              const second = numericParts[3] || null;
              const third = numericParts[4] || null;

              if (/^\d{4}$/.test(first)) {
                addCandidate({
                  setor,
                  quadra,
                  lote: first,
                  condominio: second && /^\d{2}$/.test(second) ? second : null,
                  digito: third && /^\d$/.test(third) ? third : second && /^\d$/.test(second) ? second : null,
                });
              }

              if (/^\d{2}$/.test(first) && second && /^\d{4}$/.test(second)) {
                addCandidate({
                  setor,
                  quadra,
                  condominio: first,
                  lote: second,
                  digito: third && /^\d$/.test(third) ? third : null,
                });
              }
            }
            if (tokens.length >= 2 && /^\d{3}$/.test(tokens[0])) {
              const setor = tokens[0];
              const quadraMatch = tokens[1].match(/^([FRPDO]?)(\d{3})(.*)$/);
              if (quadraMatch) {
                const base = {
                  setor,
                  quadra: quadraMatch[2],
                  tipoQuadra: quadraMatch[1] || null,
                };
                const rest = [quadraMatch[3], ...tokens.slice(2)].filter(Boolean);

                if (rest.length === 0) addCandidate(base);

                let index = 0;
                let condominio = null;
                const firstRest = rest[index];
                const condominiumMatch = firstRest?.match(/^(?:CD)?(\d{2})$/);
                if (condominiumMatch) {
                  condominio = condominiumMatch[1];
                  index += 1;
                }

                const loteToken = rest[index];
                const loteMatch = loteToken?.match(/^(AL|[FPV])?(\d{4})(\d?)$/);
                if (loteMatch) {
                  addCandidate({
                    ...base,
                    condominio,
                    tipoLote: loteMatch[1] || null,
                    lote: loteMatch[2],
                    digito: loteMatch[3] || (/^\d$/.test(rest[index + 1] || '') ? rest[index + 1] : null),
                  });
                } else if (condominio) {
                  addCandidate({ ...base, condominio });
                }
              }
            }

            const compact = normalizedText.replace(/\./g, "");
            if (/[A-Z]/.test(compact)) {
              const typedLotMatch = compact.match(/^(\d{3})([FRPDO]?)(\d{3})(?:(?:CD)?(\d{2}))?(AL|[FPV])?(\d{4})(\d?)$/);
              if (typedLotMatch) {
                addCandidate({
                  setor: typedLotMatch[1],
                  tipoQuadra: typedLotMatch[2] || null,
                  quadra: typedLotMatch[3],
                  condominio: typedLotMatch[4] || null,
                  tipoLote: typedLotMatch[5] || null,
                  lote: typedLotMatch[6],
                  digito: typedLotMatch[7] || null,
                });
              }

              const typedQuadraMatch = compact.match(/^(\d{3})([FRPDO])(\d{3})$/);
              if (typedQuadraMatch) {
                addCandidate({
                  setor: typedQuadraMatch[1],
                  tipoQuadra: typedQuadraMatch[2],
                  quadra: typedQuadraMatch[3],
                });
              }
            }

            return candidates;
          };

          const buildCql = (candidate) => {
            const parts = [
              "setor_fiscal = " + parseInt(candidate.setor, 10),
              "quadra_fiscal = " + parseInt(candidate.quadra, 10),
            ];
            if (candidate.condominio) parts.push("condominio = " + parseInt(candidate.condominio, 10));
            if (candidate.lote) parts.push("lote_fiscal = " + parseInt(candidate.lote, 10));
            if (candidate.digito) parts.push("digito_verificador = " + parseInt(candidate.digito, 10));
            return parts.join(" AND ");
          };

          const iptuNumbers = parseIptuNumbers(term);
          const safeTerm = String(term).replace(/'/g, "''").trim();
          const words = safeTerm.split(/\s+/).filter(Boolean);
          const logradouroFilter = words.length > 0
            ? words.map((w) => "logradouro ILIKE '%" + w + "%'").join(" AND ")
            : "logradouro ILIKE '%" + safeTerm + "%'";
          const CQL_FILTER = iptuNumbers.length > 0
            ? iptuNumbers.map((candidate) => "(" + buildCql(candidate) + ")").join(" OR ")
            : logradouroFilter;

          return {
            service: 'WFS',
            version: '1.0.0',
            request: 'GetFeature',
            typeName: 'slui:lotes_fiscais',
            maxFeatures: '5',
            outputFormat: 'json',
            srsName: 'EPSG:4326',
            CQL_FILTER,
          };
        }`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const {
              logradouro,
              numero,
              complemento,
              endereco_completo,
              nm_logradouro_completo,
              cd_numero_porta,
              sql,
              sql_condominio,
              setor_fiscal,
              quadra_fiscal,
              lote_fiscal,
              condominio,
              digito_verificador,
              cd_setor_fiscal,
              cd_quadra_fiscal,
              cd_lote,
              cd_condominio,
              cd_digito_sql,
            } = properties;

            const street = logradouro ?? nm_logradouro_completo;
            const num = numero ?? cd_numero_porta;
            const comp = complemento;
            const address = endereco_completo ?? [street, num, comp].filter(Boolean).join(' ');

            const iptuLabel = sql ?? (setor_fiscal !== undefined
              ? \`\${String(setor_fiscal).padStart(3, '0')}.\${String(quadra_fiscal).padStart(3, '0')}.\${condominio ? 'CD' + String(condominio).padStart(2, '0') + '.' : ''}\${String(lote_fiscal).padStart(4, '0')}-\${digito_verificador ?? 0}\`
              : (cd_setor_fiscal
                ? \`\${cd_setor_fiscal}.\${cd_quadra_fiscal}.\${cd_condominio && cd_condominio !== '00' ? 'CD' + cd_condominio + '.' : ''}\${cd_lote}\${cd_digito_sql ? '-' + cd_digito_sql : ''}\`
                : ''));

            const [longitude, latitude] = utils.calculateCenterId(
              feature?.geometry?.coordinates?.[0] || feature?.geometry?.coordinates
            );

            return {
              id,
              latitude,
              longitude,
              name: iptuLabel ? \`SQL \${iptuLabel} — \${address || 'Sem endereço'}\` : (address || 'Lote fiscal'),
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
          CQL_FILTER: \`nome ILIKE '%\${term}%'\`,
        })`,
        transformResponse: `(data) => {
          return JSON.parse(data)?.features?.map((feature) => {
            const { properties, id } = feature;
            const { nome: name } = properties;
            const [longitude, latitude] = utils.calculateCenterId(
              feature
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
        clickAction: {
          action: ClickActionEnum.SetZoom,
          params: {
            zoom: 14,
          },
        },
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
