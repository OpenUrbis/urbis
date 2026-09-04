import { useState, useMemo, useCallback, useEffect, useRef } from "preact/hooks";
import { Input, cn } from "@open-urbis/map-ui";
import { Copy, Check, Search, Layers, FileSpreadsheet, ExternalLink, X, SlidersHorizontal } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { useMapContext } from "../../hooks/useMapContext";
import proj4 from "proj4";

// ==============================================================================
// 1. Dicionários Globais de DE-PARA (Urbis / GeoSampa / PMSP)
// ==============================================================================

export const GLOBAL_LAYER_NAMES_DE_PARA: Record<string, string> = {
  sirgas_lote_fiscal: "Lotes Fiscais",
  view_lote_cidadao: "Lotes Fiscais",
  lotes_fiscais: "Lotes Fiscais",
  lote_fiscal: "Lotes Fiscais",
  lotes: "Lotes Fiscais",
  lote: "Lotes Fiscais",
  sirgas_zoneamento_sub_lpuos2016: "Zoneamento (LPUOS 2016)",
  zoneamento_sub_lpuos2016: "Zoneamento (LPUOS 2016)",
  zoneamento_lpuos_2016: "Zoneamento (LPUOS 2016)",
  zoneamento: "Zoneamento",
  macroarea: "Macroáreas (PDE)",
  macroareas: "Macroáreas (PDE)",
  sirgas_macroareas: "Macroáreas (PDE)",
  sirgas_eixos_estruturacao_transformacao_urbana: "Eixos de Estruturação (PDE)",
  eixos_estruturacao: "Eixos de Estruturação (PDE)",
  sirgas_distrito_municipal: "Distritos Municipais",
  distrito_municipal: "Distritos Municipais",
  distrito: "Distritos Municipais",
  distritos: "Distritos Municipais",
  sirgas_subprefeitura: "Subprefeituras",
  subprefeitura: "Subprefeituras",
  subprefeituras: "Subprefeituras",
  sirgas_logradouros: "Logradouros",
  logradouros: "Logradouros",
  logradouro: "Logradouros",
  sirgas_espacos_livres_cif: "Espaços Livres (CIF)",
  espacos_livres_cif: "Espaços Livres (CIF)",
  sirgas_vias_cif: "Vias Públicas (CIF)",
  vias_cif: "Vias Públicas (CIF)",
  sirgas_imoveis_em_vila: "Imóveis em Vila",
  imoveis_em_vila: "Imóveis em Vila",
  sirgas_perimetro_acao_promac: "Perímetro de Ação PROMAC",
  perimetro_acao_promac: "Perímetro de Ação PROMAC",
  sirgas_leis_esparsas: "Leis Esparsas",
  leis_esparsas: "Leis Esparsas",
  sirgas_patrimonio_cultural: "Patrimônio Cultural",
  patrimonio_cultural: "Patrimônio Cultural",
  cit_imoveis: "Patrimônio Cultural — Imóveis (CIT)",
  cit_envoltorias: "Patrimônio Cultural — Envoltórias (CIT)",
  cit_ambientais_paisagisticos: "Patrimônio Cultural — Bens Ambientais (CIT)",
  cit_arqueologico: "Patrimônio Cultural — Bens Arqueológicos (CIT)",
  idesp_imoveis_estadual: "Patrimônio Estadual — Imóveis (IDESP)",
  idesp_envoltorias_estadual: "Patrimônio Estadual — Envoltórias (IDESP)",
  idesp_ambientais_paisagisticos_estadual: "Patrimônio Estadual — Bens Ambientais (IDESP)",
  idesp_bens_moveis_estadual: "Patrimônio Estadual — Bens Móveis (IDESP)",
  indicativo_area_construida_3d: "Edificações 3D (Área Construída)",
  edificacoes_3d: "Edificações 3D (OpenStreetMap)",
  indicativo_funai: "Terras Indígenas (FUNAI)",
  indicativo_igc: "Limites Municipais (IGC)",
  limites_municipio: "Limites do Município",
};

export const GLOBAL_ATTRIBUTE_LABELS_DE_PARA: Record<string, string> = {
  // --- Cadastro & Identificação Fiscal ---
  sql: "SQL (Setor-Quadra-Lote)",
  cd_sql: "SQL (Setor-Quadra-Lote)",
  nr_sql: "SQL (Setor-Quadra-Lote)",
  sql_formatado: "SQL Formatado",
  cd_sql_formatado: "SQL Formatado",
  cd_sql_condominio: "SQL Condomínio",
  sql_condominio: "SQL Condomínio",
  cd_identificador: "Identificador Único",
  identificador: "Identificador Único",
  cd_id: "Identificador Único",
  id_geosampa: "ID GeoSampa",
  id_origem: "ID de Origem",
  cd_setor_fiscal: "Setor Fiscal",
  setor_fiscal: "Setor Fiscal",
  setor: "Setor Fiscal",
  cd_quadra_fiscal: "Quadra Fiscal",
  quadra_fiscal: "Quadra Fiscal",
  quadra: "Quadra Fiscal",
  cd_lote: "Lote Fiscal",
  lote_fiscal: "Lote Fiscal",
  cd_lote_fiscal: "Lote Fiscal",
  lote: "Lote Fiscal",
  codigo_lote: "Lote Fiscal",
  cd_condominio: "Condomínio",
  condominio: "Condomínio",
  codigo_condominio: "Código do Condomínio",
  cd_digito_sql: "Dígito Verificador (DV)",
  digito_verificador: "Dígito Verificador (DV)",
  digito_sql: "Dígito Verificador (DV)",
  cd_digito: "Dígito Verificador (DV)",
  cd_tipo_lote: "Tipo de Lote",
  tipo_lote: "Tipo de Lote",
  tx_tipo_lote: "Tipo de Lote",
  cd_tipo_quadra: "Tipo de Quadra",
  tipo_quadra: "Tipo de Quadra",
  tx_tipo_quadra: "Tipo de Quadra",
  situacao_cadastro: "Situação Cadastral",
  tx_situacao_cadastro: "Situação Cadastral",
  st_cadastro: "Situação Cadastral",
  status: "Situação / Status",
  dt_cadastro: "Data de Cadastro",
  data_cadastro: "Data de Cadastro",
  dt_atualizacao: "Data de Atualização",
  data_atualizacao: "Data de Atualização",
  dt_ultima_atualizacao: "Última Atualização",
  ano_exercicio: "Ano de Exercício",
  exercicio: "Ano de Exercício",
  ano_base: "Ano Base",
  an_legislacao: "Ano da Legislação",
  an_legislacao_zoneamento: "Ano da Legislação",
  ano_legislacao: "Ano da Legislação",
  nr_legislacao: "Número da Legislação",
  cd_usuario_atualizacao: "Usuário de Atualização",
  cd_usuario_cadastro: "Usuário de Cadastro",
  cd_usuario: "Código do Usuário",
  usuario_atualizacao: "Usuário de Atualização",

  // --- Endereço, Logradouro & Localização ---
  logradouro: "Endereço Oficial",
  tx_nome_logradouro: "Logradouro",
  nm_logradouro: "Logradouro",
  nome_logradouro: "Logradouro",
  endereco: "Endereço",
  tx_logradouro: "Logradouro",
  cd_tipo_logradouro: "Tipo de Logradouro",
  tp_logradouro: "Tipo de Logradouro",
  tipo_logradouro: "Tipo de Logradouro",
  tx_tipo_logradouro: "Tipo de Logradouro",
  cd_titulo_logradouro: "Título do Logradouro",
  titulo_logradouro: "Título do Logradouro",
  tx_titulo_logradouro: "Título do Logradouro",
  cd_logradouro: "Código do Logradouro (CODLOG)",
  cd_logradouro_geoinfo: "Código do Logradouro (CODLOG)",
  codigo_logradouro_codlog: "Código do Logradouro (CODLOG)",
  codlog: "Código do Logradouro (CODLOG)",
  cd_codlog: "Código do Logradouro (CODLOG)",
  nr_porta: "Número de Porta",
  numero: "Número de Porta",
  numero_porta: "Número de Porta",
  nr_imovel: "Número de Porta",
  nr_endereco: "Número de Porta",
  menor_numero: "Menor Número",
  nr_menor_porta: "Menor Número",
  maior_numero: "Maior Número",
  nr_maior_porta: "Maior Número",
  tx_complemento: "Complemento",
  complemento: "Complemento",
  tx_bairro: "Bairro",
  bairro: "Bairro",
  nm_bairro: "Bairro",
  cd_cep: "CEP",
  cep: "CEP",
  nr_cep: "CEP",
  cd_subprefeitura: "Subprefeitura",
  subprefeitura: "Subprefeitura",
  nm_subprefeitura: "Subprefeitura",
  cd_distrito: "Distrito Municipal",
  distrito: "Distrito Municipal",
  nm_distrito: "Distrito Municipal",
  nome_distrito: "Distrito Municipal",
  cd_zona_eleitoral: "Zona Eleitoral",
  zona_eleitoral: "Zona Eleitoral",
  regiao: "Região Administrativa",

  // --- Dimensões, Áreas & Métricas ---
  vl_area_terreno: "Área do Terreno",
  area_terreno: "Área do Terreno",
  vl_metragem_terreno: "Área do Terreno",
  metragem_terreno: "Área do Terreno",
  ar_terreno: "Área do Terreno",
  area_m2: "Área (m²)",
  area_total: "Área Total",
  vl_area_construida: "Área Construída",
  area_construida: "Área Construída",
  ar_construida: "Área Construída",
  area_edificada: "Área Edificada",
  vl_area_ocupada: "Área Ocupada",
  area_ocupada: "Área Ocupada",
  ar_ocupada: "Área Ocupada",
  vl_testada: "Testada Principal",
  testada: "Testada Principal",
  vl_testada_principal: "Testada Principal",
  testada_principal: "Testada Principal",
  vl_fracao_ideal: "Fração Ideal",
  fracao_ideal: "Fração Ideal",
  vl_frente: "Frente (m)",
  frente_terreno: "Frente (m)",
  vl_fundo: "Fundo (m)",
  fundo_terreno: "Fundo (m)",
  vl_profundidade: "Profundidade (m)",
  profundidade: "Profundidade (m)",
  perimetro: "Perímetro",
  vl_perimetro: "Perímetro",

  // --- Zoneamento, Uso do Solo e Parâmetros Urbanísticos (PDE / LPUOS) ---
  tx_zoneamento_perimetro: "Zoneamento",
  zoneamento: "Zoneamento",
  cd_zoneamento_perimetro: "Zoneamento",
  sigla_zona: "Sigla do Zoneamento",
  nm_zona: "Nome da Zona",
  zona_uso: "Zona de Uso",
  tx_perimetro_qualificacao: "Perímetro de Qualificação",
  perimetro_qualificacao: "Perímetro de Qualificação",
  nm_perimetro_qualificacao: "Perímetro de Qualificação",
  tx_macroarea: "Macroárea",
  macroarea: "Macroárea",
  nm_macroarea: "Macroárea",
  nm_tema_divisao_pde: "Perímetro PDE",
  nm_perimetro_divisao_pde: "Perímetro PDE",
  tema_divisao_pde: "Tema PDE",
  tipo_eixo: "Tipo de Eixo",
  tx_tipo_eixo: "Tipo de Eixo",
  nm_eixo: "Nome do Eixo",
  tipo_zona: "Tipo de Zona",
  tx_tipo_zona: "Tipo de Zona",
  coeficiente_aproveitamento_basico: "C.A. Básico",
  ca_basico: "C.A. Básico",
  ca_minimo: "C.A. Mínimo",
  coeficiente_aproveitamento_maximo: "C.A. Máximo",
  ca_maximo: "C.A. Máximo",
  taxa_ocupacao_maxima: "Taxa de Ocupação Máxima",
  to_maxima: "Taxa de Ocupação Máxima",
  taxa_ocupacao: "Taxa de Ocupação",
  gabarito_altura_maxima: "Gabarito de Altura Máxima",
  gabarito: "Gabarito",
  altura_maxima: "Altura Máxima (m)",
  taxa_permeabilidade_minima: "Taxa de Permeabilidade Mínima",
  tp_minima: "Taxa de Permeabilidade Mínima",
  permeabilidade_minima: "Taxa de Permeabilidade Mínima",
  recuo_frontal_minimo: "Recuo Frontal Mínimo",
  recuo_frontal: "Recuo Frontal",
  quota_ambiental: "Quota Ambiental",
  qa_minima: "Quota Ambiental Mínima",
  pontuacao_minima_qa: "Pontuação Mínima QA",
  largura_minima_via: "Largura Mínima da Via",
  largura_via: "Largura da Via",
  nm_restricao: "Restrição Urbanística",
  tipo_restricao: "Tipo de Restrição",
  restricao: "Restrição",
  tx_enquadramento: "Enquadramento Urbanístico",
  enquadramento: "Enquadramento",

  // --- Patrimônio Cultural & Histórico (CIT / CONPRESP / CONDEPHAAT / IPHAN) ---
  numero_imovel_cif: "Número do Imóvel no CIF (SQL)",
  nr_cif: "Número CIF",
  cif: "Código CIF",
  denominacao_bem: "Denominação do Bem",
  nm_bem: "Denominação do Bem",
  denominacao: "Denominação",
  grau_protecao: "Grau de Proteção",
  nivel_protecao: "Nível de Proteção",
  grau_preservacao: "Grau de Preservação",
  legislacao: "Legislação / Resolução",
  nr_resolucao: "Número da Resolução",
  resolucao: "Resolução",
  ato_legal: "Ato Legal",
  orgao_responsavel: "Órgão Responsável",
  orgao: "Órgão Responsável",
  orgao_tutelador: "Órgão Tutelador",
  processo_tombamento: "Processo de Tombamento",
  nr_processo: "Número do Processo",
  data_tombamento: "Data do Tombamento",
  dt_resolucao: "Data da Resolução",
  tipo_patrimonio: "Categoria do Patrimônio",
  categoria_patrimonio: "Categoria do Patrimônio",

  // --- Dados Imobiliários, Fiscais & IPTU ---
  vl_venal_imovel: "Valor Venal do Imóvel",
  valor_venal: "Valor Venal",
  vl_venal: "Valor Venal",
  vl_venal_terreno: "Valor Venal do Terreno",
  valor_venal_terreno: "Valor Venal do Terreno",
  vl_venal_construcao: "Valor Venal da Construção",
  valor_venal_construcao: "Valor Venal da Construção",
  vl_m2_terreno: "Valor do m² do Terreno",
  valor_m2_terreno: "Valor do m² do Terreno",
  vl_m2_construcao: "Valor do m² da Construção",
  valor_m2_construcao: "Valor do m² da Construção",
  cd_uso: "Uso do Imóvel",
  tx_uso: "Uso do Imóvel",
  tipo_uso: "Tipo de Uso",
  uso_imovel: "Uso do Imóvel",
  descricao_uso: "Descrição do Uso",
  tx_padrao_construcao: "Padrão de Construção",
  padrao_construcao: "Padrão de Construção",
  tx_tipo_terreno: "Tipo de Terreno",
  tipo_terreno: "Tipo de Terreno",
  qtd_pavimentos: "Número de Pavimentos",
  nr_pavimentos: "Número de Pavimentos",
  numero_pavimentos: "Número de Pavimentos",
  qtd_unidades: "Número de Unidades",
  nr_unidades: "Número de Unidades",

  // --- Sobreposição & Análise Espacial ---
  totalareapercentage: "Sobreposição Territorial",
  total_area_percentage: "Sobreposição Territorial",
  smallerpolygonareapercentage: "Interseção no Polígono",
  smaller_polygon_area_percentage: "Interseção no Polígono",
  percentage: "Sobreposição",
  latitude: "Latitude",
  lat: "Latitude",
  longitude: "Longitude",
  lon: "Longitude",
  lng: "Longitude",
  altitude: "Altitude",
};

export const formatAttributeLabel = (rawKey: string): string => {
  if (!rawKey) return "";

  // Remove workspace prefix if present (e.g. "geosampa:layer_name" -> "layer_name")
  const key = rawKey.includes(":") ? rawKey.split(":").slice(1).join(":") : rawKey;

  // Split by underscores, dashes, spaces or camelCase transitions
  const words = key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[-_\s]+/)
    .filter(Boolean);

  if (words.length === 0) return key;

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const normalizeGeoJsonCoords = (geojsonFeature: any): any => {
  if (!geojsonFeature) return null;
  const geom = geojsonFeature.geometry || geojsonFeature;
  if (!geom?.coordinates || !geom?.type) return geojsonFeature;

  const isUtm = (coords: any): boolean => {
    if (!Array.isArray(coords) || coords.length < 2) return false;
    return Math.abs(coords[0]) > 180 || Math.abs(coords[1]) > 90;
  };

  const transformPoint = (pt: number[]): number[] => {
    if (!Array.isArray(pt) || pt.length < 2) return pt;
    if (isUtm(pt)) {
      try {
        const [lon, lat] = proj4("EPSG:31983", "EPSG:4326", [pt[0], pt[1]]);
        return [lon, lat];
      } catch {
        return pt;
      }
    }
    return pt;
  };

  const transformCoords = (coords: any, depth: number): any => {
    if (!Array.isArray(coords)) return coords;
    if (depth === 0) return transformPoint(coords);
    return coords.map((c) => transformCoords(c, depth - 1));
  };

  let depth = 0;
  if (geom.type === "Point") depth = 0;
  else if (geom.type === "MultiPoint" || geom.type === "LineString") depth = 1;
  else if (geom.type === "Polygon" || geom.type === "MultiLineString") depth = 2;
  else if (geom.type === "MultiPolygon") depth = 3;

  const transformedCoordinates = transformCoords(geom.coordinates, depth);

  const transformedGeom = {
    ...geom,
    coordinates: transformedCoordinates,
  };

  if (geojsonFeature.geometry) {
    return {
      ...geojsonFeature,
      geometry: transformedGeom,
    };
  }

  return transformedGeom;
};

export const getBoundsFromFeature = (
  feat: any,
): [[number, number], [number, number]] | null => {
  if (!feat) return null;
  const normalized = normalizeGeoJsonCoords(feat);
  const geom = normalized?.geometry || normalized;
  if (!geom?.coordinates) return null;

  try {
    if (geom.type === "Point" && typeof geom.coordinates[0] === "number") {
      const [lon, lat] = geom.coordinates;
      if (Math.abs(lon) <= 180 && Math.abs(lat) <= 90) {
        return [
          [lon - 0.001, lat - 0.001],
          [lon + 0.001, lat + 0.001],
        ];
      }
    }

    if (geom.type === "Polygon" && Array.isArray(geom.coordinates[0])) {
      const ring = geom.coordinates[0];
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      ring.forEach(([x, y]: [number, number]) => {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      });
      if (
        Number.isFinite(minX) &&
        Number.isFinite(maxX) &&
        Math.abs(minX) <= 180 &&
        Math.abs(minY) <= 90
      ) {
        const deltaX = Math.max(maxX - minX, 0.0005);
        const deltaY = Math.max(maxY - minY, 0.0005);
        return [
          [minX - deltaX * 0.1, minY - deltaY * 0.1],
          [maxX + deltaX * 0.1, maxY + deltaY * 0.1],
        ];
      }
    }

    if (geom.type === "MultiPolygon" && Array.isArray(geom.coordinates)) {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      geom.coordinates.forEach((poly: any) => {
        if (Array.isArray(poly[0])) {
          poly[0].forEach(([x, y]: [number, number]) => {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          });
        }
      });
      if (
        Number.isFinite(minX) &&
        Number.isFinite(maxX) &&
        Math.abs(minX) <= 180 &&
        Math.abs(minY) <= 90
      ) {
        const deltaX = Math.max(maxX - minX, 0.0005);
        const deltaY = Math.max(maxY - minY, 0.0005);
        return [
          [minX - deltaX * 0.1, minY - deltaY * 0.1],
          [maxX + deltaX * 0.1, maxY + deltaY * 0.1],
        ];
      }
    }
  } catch (e) {
    console.warn("Failed to calculate bounds from feature", e);
  }

  return null;
};

export const findLayerSchema = (
  props?: Record<string, unknown>,
  rawLayer?: string,
  schemas?: any[],
  feat?: any,
): any => {
  if (!schemas || !Array.isArray(schemas) || schemas.length === 0) return null;

  const targetIds = [
    props?.layerSchemaId,
    props?.layer_schema_id,
    props?._layerId,
    props?.layer,
    props?.source,
    rawLayer,
    feat?.id,
    feat?.layer,
  ]
    .filter(Boolean)
    .map((id) => String(id).trim());

  if (targetIds.length === 0) return null;

  // 1. Direct ID / proxyLayerId / Name exact match
  for (const s of schemas) {
    if (!s) continue;
    const sId = String(s.id || "").trim();
    const sProxy = String(s.proxyLayerId || "").trim();
    const sName = String(s.name || "").trim();

    for (const tid of targetIds) {
      if (sId && tid.toLowerCase() === sId.toLowerCase()) return s;
      if (sProxy && tid.toLowerCase() === sProxy.toLowerCase()) return s;
      if (sName && tid.toLowerCase() === sName.toLowerCase()) return s;
    }
  }

  // 2. Stripped prefix / URL Origin match
  for (const s of schemas) {
    if (!s) continue;
    const sIdClean = String(s.id || "").replace(/^([a-zA-Z0-9_-]+):/, "").toLowerCase().trim();
    const sNameClean = String(s.name || "").toLowerCase().trim();
    const sOrigin = String(s.origin || "").toLowerCase();

    for (const tid of targetIds) {
      const tidClean = tid.replace(/^([a-zA-Z0-9_-]+):/, "").toLowerCase().trim();
      if (!tidClean) continue;
      if (sIdClean && (tidClean === sIdClean || (tidClean.length > 3 && sIdClean.includes(tidClean)) || (sIdClean.length > 3 && tidClean.includes(sIdClean)))) {
        return s;
      }
      if (sNameClean && (tidClean === sNameClean || (tidClean.length > 3 && sNameClean.includes(tidClean)) || (sNameClean.length > 3 && tidClean.includes(sNameClean)))) {
        return s;
      }
      if (sOrigin && sOrigin.includes(tidClean)) {
        return s;
      }
    }
  }

  return null;
};

export const getFeatureDisplayLabel = (
  props: Record<string, unknown>,
  rawLayer?: string,
  schemas?: any[],
  feat?: any,
): string => {
  // 1. Se possuir nome de schema explícito nas propriedades
  if (props.layerSchemaName) {
    return String(props.layerSchemaName);
  }
  if (props.layer_name) {
    return String(props.layer_name);
  }
  if (props.nm_tema_divisao_pde) {
    return String(props.nm_tema_divisao_pde);
  }

  // 2. Busca no catálogo de layer schemas
  const matchedSchema = findLayerSchema(props, rawLayer, schemas, feat);
  if (matchedSchema?.name) {
    return matchedSchema.name;
  }

  const cleanLayer = (
    rawLayer?.includes(":") ? rawLayer.split(":").slice(1).join(":") : (rawLayer || "")
  ).trim().toLowerCase();
  const normLayer = cleanLayer.replace(/[-_\s]+/g, "_");

  // 3. Busca no DE-PARA canônico de camadas
  if (GLOBAL_LAYER_NAMES_DE_PARA[cleanLayer]) {
    return GLOBAL_LAYER_NAMES_DE_PARA[cleanLayer];
  }
  if (GLOBAL_LAYER_NAMES_DE_PARA[normLayer]) {
    return GLOBAL_LAYER_NAMES_DE_PARA[normLayer];
  }

  // 4. Formatação padrão a partir do nome da camada
  if (rawLayer && rawLayer !== "Geometria Selecionada" && rawLayer !== "local") {
    return formatAttributeLabel(rawLayer);
  }

  return "Dados da Geometria";
};

export const getAttributeDisplayLabel = (
  rawKey: string,
  layerSchema?: any,
  fallbackTemplates?: any[],
): { label: string; description?: string } => {
  if (!rawKey) return { label: "" };

  const cleanKey = rawKey.includes(":") ? rawKey.split(":").slice(1).join(":") : rawKey;
  const lowerKey = cleanKey.toLowerCase().trim();
  const normalizedKey = lowerKey.replace(/[-_\s]+/g, "");

  // 1. Busca no attributeMapping configurado no LayerSchema
  const mapping =
    layerSchema?.properties?.attributeMapping ||
    layerSchema?.attributeMapping ||
    layerSchema?.properties?.metadata?.attributeMapping;

  if (mapping && typeof mapping === "object") {
    for (const [mapKey, mapVal] of Object.entries(mapping)) {
      if (!mapVal) continue;
      const cleanMapKey = mapKey.replace(/^([a-zA-Z0-9_-]+):/, "").toLowerCase().trim();
      const normMapKey = cleanMapKey.replace(/[-_\s]+/g, "");
      if (cleanMapKey === lowerKey || normMapKey === normalizedKey) {
        const valObj = typeof mapVal === "object" ? (mapVal as any) : { label: String(mapVal) };
        const label = valObj.label || valObj.name || String(mapVal);
        if (label && typeof label === "string") {
          return { label, description: valObj.description };
        }
      }
    }
  }

  // 2. Busca nos templates visuais configurados (ViewTemplate / BoardTemplate)
  const templatesToCheck = [
    ...(Array.isArray(layerSchema?.viewTemplate) ? layerSchema.viewTemplate : []),
    ...(Array.isArray(layerSchema?.boardTemplate) ? layerSchema.boardTemplate : []),
    ...(Array.isArray(fallbackTemplates) ? fallbackTemplates : []),
  ];

  for (const t of templatesToCheck) {
    if (!t) continue;
    const tProp = String(t.properties?.property || t.name || t.id || "").toLowerCase().trim();
    const normTProp = tProp.replace(/[-_\s]+/g, "");
    if ((tProp === lowerKey || normTProp === normalizedKey) && t.label) {
      return { label: String(t.label) };
    }
  }

  // 3. Busca no DE-PARA global de nomes de campos
  if (GLOBAL_ATTRIBUTE_LABELS_DE_PARA[lowerKey]) {
    return { label: GLOBAL_ATTRIBUTE_LABELS_DE_PARA[lowerKey] };
  }
  if (GLOBAL_ATTRIBUTE_LABELS_DE_PARA[normalizedKey]) {
    return { label: GLOBAL_ATTRIBUTE_LABELS_DE_PARA[normalizedKey] };
  }

  // 4. Formatação heurística
  return { label: formatAttributeLabel(cleanKey) };
};

export const formatAttributeValue = (
  value: unknown,
  key: string,
): { display: string; isUrl: boolean; isNumeric: boolean } => {
  if (value === null || value === undefined || value === "") {
    return { display: "—", isUrl: false, isNumeric: false };
  }

  if (typeof value === "boolean") {
    return { display: value ? "Sim" : "Não", isUrl: false, isNumeric: false };
  }

  const lowerKey = key.toLowerCase();

  // Valores monetários (R$)
  if (
    typeof value === "number" &&
    (lowerKey.startsWith("vl_venal") ||
      lowerKey.startsWith("valor_venal") ||
      lowerKey.startsWith("vl_m2") ||
      lowerKey.startsWith("valor_m2") ||
      lowerKey.includes("preco") ||
      lowerKey.includes("custo"))
  ) {
    return {
      display: `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      isUrl: false,
      isNumeric: true,
    };
  }

  // Porcentagens (%)
  if (
    typeof value === "number" &&
    (lowerKey.includes("percentage") ||
      lowerKey.includes("percent") ||
      lowerKey.includes("porcentagem") ||
      lowerKey.includes("taxa_"))
  ) {
    return {
      display: `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`,
      isUrl: false,
      isNumeric: true,
    };
  }

  // Áreas (m²)
  if (
    typeof value === "number" &&
    (lowerKey.includes("area") ||
      lowerKey.includes("metragem") ||
      lowerKey.startsWith("ar_") ||
      lowerKey.includes("superficie"))
  ) {
    return {
      display: `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} m²`,
      isUrl: false,
      isNumeric: true,
    };
  }

  // Números genéricos e códigos
  if (typeof value === "number") {
    if (
      Number.isInteger(value) &&
      (lowerKey.startsWith("cd_") ||
        lowerKey.startsWith("nr_") ||
        lowerKey.includes("codigo") ||
        lowerKey.includes("identificador") ||
        lowerKey.includes("sql") ||
        lowerKey.includes("cep") ||
        lowerKey.includes("ano") ||
        lowerKey.includes("exercicio"))
    ) {
      return {
        display: String(value),
        isUrl: false,
        isNumeric: true,
      };
    }

    return {
      display: value.toLocaleString("pt-BR"),
      isUrl: false,
      isNumeric: true,
    };
  }

  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return {
        display: value.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join(", "),
        isUrl: false,
        isNumeric: false,
      };
    }
    return { display: JSON.stringify(value), isUrl: false, isNumeric: false };
  }

  const strVal = String(value).trim();

  // Links e URLs
  if (strVal.startsWith("http://") || strVal.startsWith("https://")) {
    return { display: strVal, isUrl: true, isNumeric: false };
  }

  // Datas no formato ISO ou SQL (YYYY-MM-DD...)
  const dateMatch = strVal.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (
    dateMatch &&
    (lowerKey.startsWith("dt_") || lowerKey.startsWith("data_") || lowerKey.includes("data") || lowerKey.includes("atualizacao") || lowerKey.includes("cadastro"))
  ) {
    const [, year, month, day] = dateMatch;
    return {
      display: `${day}/${month}/${year}`,
      isUrl: false,
      isNumeric: false,
    };
  }

  return { display: strVal, isUrl: false, isNumeric: false };
};

export interface FeatureAttributesTableProps {
  feature?: any;
  intersectingFeatures?: any[];
  selectedFeature?: any;
  onSelectFeature?: (rawFeature: any, item: any) => void;
  title?: string;
  calculatedArea?: string | null;
  className?: string;
  canOpenFiu?: boolean;
  onOpenFiu?: () => void;
}

export const FeatureAttributesTable = ({
  feature,
  intersectingFeatures = [],
  selectedFeature,
  onSelectFeature,
  className,
  canOpenFiu = false,
  onOpenFiu,
}: FeatureAttributesTableProps) => {
  const {
    layerSchemas,
    activeHighlightFeature,
    flyTo,
    layerWithRootEditTemplate,
    editFeatureTemplate,
  } = useMapContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const { toastSuccess } = useToast();

  // Helper to check if a layer matches any visible/active layer on the map
  const isLayerActiveOnMap = useCallback((layerName: string, schemaId?: string) => {
    if (!layerSchemas?.value || (!layerName && !schemaId)) return false;
    const clean = (layerName?.includes(":") ? layerName.split(":").slice(1).join(":") : (layerName || ""))
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .trim();

    return layerSchemas.value.some((s) => {
      if (!s.isVisible && !s.isSelected) return false;
      if (schemaId && String(s.id) === String(schemaId)) return true;
      const sId = (s.id?.includes(":") ? s.id.split(":").slice(1).join(":") : (s.id || ""))
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .trim();
      const sName = (s.name || "")
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .trim();
      if (sId === clean || sName === clean) return true;
      if (clean.length > 3 && (sId.includes(clean) || clean.includes(sId))) return true;
      if (clean.length > 3 && (sName.includes(clean) || clean.includes(sName))) return true;
      return false;
    });
  }, [layerSchemas?.value]);

  useEffect(() => {
    setSelectedLayerIndex(0);
    setSearchTerm("");
  }, [feature, intersectingFeatures]);

  const isPointGeometry = useMemo(() => {
    if (!feature) return false;
    const geom = feature.geometry || feature;
    return geom?.type === "Point" || Boolean(feature.properties?.isPointInspection);
  }, [feature]);

  // Clear highlighted selection geometry on unmount
  useEffect(() => {
    return () => {
      activeHighlightFeature.value = null;
    };
  }, [activeHighlightFeature]);

  // Combine and sort features: each feature is its own separate item
  const availableFeatures = useMemo(() => {
    const list: Array<{
      label: string;
      rawLayer: string;
      layerSchema?: any;
      isActiveOnMap: boolean;
      isBaseEditLayer: boolean;
      isTaxLot: boolean;
      percentage: string | null;
      percentageNum: number;
      isPrimary: boolean;
      properties: Record<string, unknown>;
      rawFeature?: any;
    }> = [];
    const seenFeatureKeys = new Set<string>();

    const buildFeatureKey = (
      feat: any,
      itemProps: Record<string, unknown>,
      rawLayer: string,
      index?: number,
    ): string => {
      const cleanLayer = String(rawLayer || "")
        .toLowerCase()
        .replace(/^([a-zA-Z0-9_-]+):/, "")
        .trim();

      const layerId = (feat?.properties?.layerSchemaId as string) || cleanLayer || "local";
      const rawId = feat?.id || itemProps?.id;
      if (rawId) {
        const cleanId = String(rawId).replace(/^([a-zA-Z0-9_-]+):/, "").trim();
        return `${layerId}::id-${cleanId}`;
      }
      return `${layerId}::feat-${index !== undefined ? index : JSON.stringify(itemProps)}`;
    };

    const isPerimeterOrSynthetic = (feat: any, p: Record<string, unknown>) => {
      const layerStr = String(p.layer || p.source || p.layer_name || p.layerSchemaName || feat?.id || "").toLowerCase();
      return Boolean(
        p.isPointInspection ||
        p.origem_perimetro ||
        layerStr.includes("perímetro") ||
        layerStr.includes("perimetro") ||
        layerStr.includes("geometria selecionada") ||
        layerStr.includes("ponto consultado") ||
        layerStr.includes("ponto de inspeção") ||
        layerStr.includes("consulta pontual") ||
        layerStr.includes("consulta territorial") ||
        String(feat?.id || "").startsWith("perimeter-") ||
        String(feat?.id || "").startsWith("query-point-")
      );
    };

    const isTaxLot = (feat: any, p: Record<string, unknown>, rawLayer: string) => {
      if (
        (p.cd_setor_fiscal !== undefined && p.cd_quadra_fiscal !== undefined) ||
        (p.setor !== undefined && p.quadra !== undefined && p.lote !== undefined) ||
        p.sql !== undefined ||
        p.sql_formatado !== undefined ||
        p.nr_sql !== undefined ||
        p.codigo_lote !== undefined
      ) {
        return true;
      }
      const s = String(p.layer || rawLayer || p.layerSchemaName || feat?.id || "").toLowerCase();
      return s.includes("lote_fiscal") || s.includes("lotes_fiscais") || s.includes("lote fiscal") || s.includes("lotes fiscais") || s === "lotes" || s === "lote";
    };

    const isBaseEditLayer = (feat: any, p: Record<string, unknown>, rawLayer: string) => {
      const rootId = (layerWithRootEditTemplate?.value || "").trim().toLowerCase();
      if (!rootId) return false;
      const layerId = String(p.layerSchemaId || p.layer || rawLayer || feat?.id || "").toLowerCase().trim();
      return layerId === rootId || layerId.includes(rootId) || rootId.includes(layerId);
    };

    const extractPercentage = (props: Record<string, unknown>): { str: string | null; num: number } => {
      const raw = props.totalAreaPercentage ?? props.smallerPolygonAreaPercentage ?? props.percentage;
      if (raw !== undefined && raw !== null && raw !== "") {
        const num = Number(raw);
        if (!isNaN(num) && num > 0.01) {
          return {
            str: num >= 99.95 ? "100%" : `${num.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`,
            num,
          };
        }
      }
      return { str: null, num: 0 };
    };

    const isItemPrimary = (itemFeat: any, itemProps: Record<string, unknown>, rawLayer: string) => {
      if (!feature) return false;
      if (itemFeat && (itemFeat === feature || itemFeat === selectedFeature)) return true;
      if (feature.id && (itemFeat?.id === feature.id || itemProps?.id === feature.id)) return true;
      const p = feature.properties || feature;
      if (p.cd_setor_fiscal && p.cd_quadra_fiscal && p.cd_lote) {
        if (
          itemProps.cd_setor_fiscal === p.cd_setor_fiscal &&
          itemProps.cd_quadra_fiscal === p.cd_quadra_fiscal &&
          itemProps.cd_lote === p.cd_lote
        ) {
          return true;
        }
      }
      if (p.layerSchemaId && itemProps.layerSchemaId === p.layerSchemaId) return true;
      if (p.layer && itemProps.layer && p.layer === itemProps.layer) return true;
      const raw = String(p.layer || feature.id || "");
      if (raw && rawLayer && (rawLayer === raw || rawLayer.includes(raw) || raw.includes(rawLayer))) {
        return true;
      }
      return false;
    };

    // 1. Process intersecting features first (real catalog layers)
    if (Array.isArray(intersectingFeatures) && intersectingFeatures.length > 0) {
      intersectingFeatures.forEach((feat, idx) => {
        const featureProps = (feat?.properties as Record<string, unknown>) ?? {};
        if (Object.keys(featureProps).length > 0) {
          // Discard synthetic point inspection or analysis perimeter features
          if (isPerimeterOrSynthetic(feat, featureProps)) return;

          const pct = Number(featureProps["totalAreaPercentage"]);
          if (!isPointGeometry && featureProps["totalAreaPercentage"] !== undefined && !isNaN(pct) && pct < 0.05) {
            return;
          }
          const rawLayer = String(featureProps["layer"] || featureProps["nm_tema_divisao_pde"] || featureProps["source"] || `Camada ${idx + 1}`);
          const featureKey = buildFeatureKey(feat, featureProps, rawLayer, idx);

          if (!seenFeatureKeys.has(featureKey)) {
            seenFeatureKeys.add(featureKey);
            const layerSchema = findLayerSchema(featureProps, rawLayer, layerSchemas?.value, feat);
            const label = getFeatureDisplayLabel(featureProps, rawLayer, layerSchemas?.value, feat);
            const isPrim = isItemPrimary(feat, featureProps, rawLayer);
            const isBase = isBaseEditLayer(feat, featureProps, rawLayer);
            const isLot = isTaxLot(feat, featureProps, rawLayer);
            const { str: pctStr, num: pctNum } = extractPercentage(featureProps);

            list.push({
              label,
              rawLayer,
              layerSchema,
              isActiveOnMap: isLayerActiveOnMap(rawLayer, featureProps?.layerSchemaId as string),
              isBaseEditLayer: isBase,
              isTaxLot: isLot,
              percentage: pctStr,
              percentageNum: pctNum,
              isPrimary: isPrim,
              properties: featureProps,
              rawFeature: feat,
            });
          }
        }
      });
    }

    // 2. If root feature is a real layer feature (not perimeter/synthetic) and not already in list, add it
    if (feature?.properties && Object.keys(feature.properties).length > 0) {
      const p = feature.properties as Record<string, unknown>;
      if (!isPerimeterOrSynthetic(feature, p)) {
        const rawLayer = String(p["layer"] || p["source"] || "");
        const featureKey = buildFeatureKey(feature, p, rawLayer);
        if (!seenFeatureKeys.has(featureKey)) {
          seenFeatureKeys.add(featureKey);
          const layerSchema = findLayerSchema(p, rawLayer, layerSchemas?.value, feature);
          const label = getFeatureDisplayLabel(p, rawLayer, layerSchemas?.value, feature);
          const isBase = isBaseEditLayer(feature, p, rawLayer);
          const isLot = isTaxLot(feature, p, rawLayer);
          const { str: pctStr, num: pctNum } = extractPercentage(p);

          list.push({
            label,
            rawLayer: rawLayer || "local",
            layerSchema,
            isActiveOnMap: isLayerActiveOnMap(rawLayer, p?.layerSchemaId as string),
            isBaseEditLayer: isBase,
            isTaxLot: isLot,
            percentage: pctStr,
            percentageNum: pctNum,
            isPrimary: true,
            properties: p,
            rawFeature: feature,
          });
        }
      }
    }

    // Fallback only if no real intersecting features were found at all
    if (list.length === 0 && feature) {
      const fallbackProps: Record<string, unknown> = {};
      Object.entries(feature).forEach(([k, v]) => {
        if (k !== "geometry" && k !== "type" && typeof v !== "function" && k !== "origem_perimetro") {
          fallbackProps[k] = v;
        }
      });
      if (Object.keys(fallbackProps).length > 0) {
        list.push({
          label: "Dados da Geometria",
          rawLayer: "local",
          isActiveOnMap: true,
          isBaseEditLayer: false,
          isTaxLot: false,
          percentage: null,
          percentageNum: 0,
          isPrimary: true,
          properties: fallbackProps,
          rawFeature: feature,
        });
      }
    }

    // Disambiguate duplicate labels only if multiple distinct features have the exact same label: "Lote Fiscal 1", "Lote Fiscal 2"
    const labelCounts = new Map<string, number>();
    list.forEach((item) => {
      const base = item.label.replace(/\s+\d+$/, "").trim();
      labelCounts.set(base, (labelCounts.get(base) || 0) + 1);
    });

    const labelIndices = new Map<string, number>();
    list.forEach((item) => {
      const base = item.label.replace(/\s+\d+$/, "").trim();
      if ((labelCounts.get(base) || 0) > 1) {
        const currentIdx = (labelIndices.get(base) || 0) + 1;
        labelIndices.set(base, currentIdx);
        item.label = `${base} ${currentIdx}`;
      }
    });

    // Ordenação estrita por prioridade:
    // 1º: Camada base de edição configurada (layerWithRootEditTemplate)
    // 2º: Primeiro lote fiscal disponível
    // 3º: Feição primária clicada
    // 4º: Camadas ativas/visíveis no mapa
    // 5º: Maior sobreposição e ordem alfabética
    return list.sort((a, b) => {
      if (a.isBaseEditLayer && !b.isBaseEditLayer) return -1;
      if (!a.isBaseEditLayer && b.isBaseEditLayer) return 1;

      if (a.isTaxLot && !b.isTaxLot) return -1;
      if (!a.isTaxLot && b.isTaxLot) return 1;

      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;

      if (a.isActiveOnMap && !b.isActiveOnMap) return -1;
      if (!a.isActiveOnMap && b.isActiveOnMap) return 1;

      if (Math.abs(a.percentageNum - b.percentageNum) > 0.1) {
        return b.percentageNum - a.percentageNum;
      }

      return a.label.localeCompare(b.label);
    });
  }, [
    feature,
    selectedFeature,
    intersectingFeatures,
    layerSchemas?.value,
    layerWithRootEditTemplate?.value,
    isLayerActiveOnMap,
    isPointGeometry,
  ]);

  // Sync selected layer when feature or selectedFeature changes
  useEffect(() => {
    const targetFeat = selectedFeature || feature;
    if (targetFeat && availableFeatures.length > 0) {
      const sProps = targetFeat.properties || targetFeat;
      const sLayer = String(sProps?.layer || targetFeat.id || targetFeat?.layer || "");
      const matchIdx = availableFeatures.findIndex((item) => {
        if (item.rawFeature === targetFeat) return true;
        if (item.properties === sProps) return true;
        if (targetFeat.id && item.rawFeature?.id === targetFeat.id) return true;
        const itemProps = item.properties || {};
        if (sProps.layerSchemaId && itemProps.layerSchemaId === sProps.layerSchemaId) return true;
        if (sProps.layer && itemProps.layer && sProps.layer === itemProps.layer) return true;
        if (item.rawLayer && sLayer && (item.rawLayer === sLayer || item.rawLayer.includes(sLayer) || sLayer.includes(item.rawLayer))) {
          return true;
        }
        return false;
      });
      if (matchIdx !== -1) {
        setSelectedLayerIndex(matchIdx);
        return;
      }
    }
    setSelectedLayerIndex(0);
    setSearchTerm("");
  }, [feature, selectedFeature, availableFeatures]);

  const safeLayerIndex = selectedLayerIndex >= availableFeatures.length ? 0 : selectedLayerIndex;

  const handleSelectFeature = (globalIndex: number, item: any) => {
    setSelectedLayerIndex(globalIndex);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
    if (onSelectFeature && item.rawFeature) {
      onSelectFeature(item.rawFeature, item);
    }
    if (item.rawFeature) {
      try {
        const normalized = normalizeGeoJsonCoords(item.rawFeature);
        activeHighlightFeature.value = normalized || item.rawFeature;
        const bounds = getBoundsFromFeature(normalized || item.rawFeature);
        if (bounds) {
          flyTo({ bounds, padding: 120 });
        }
      } catch (err) {
        console.warn("Error highlighting feature on map:", err);
      }
    }
  };

  const handleChipKeyDown = (e: any, currentIndex: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % availableFeatures.length;
      handleSelectFeature(nextIndex, availableFeatures[nextIndex]);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + availableFeatures.length) % availableFeatures.length;
      handleSelectFeature(prevIndex, availableFeatures[prevIndex]);
    }
  };

  const activeItem = availableFeatures[safeLayerIndex] || availableFeatures[0];

  const activeProperties = useMemo(() => {
    return activeItem?.properties || {};
  }, [activeItem]);

  const filteredEntries = useMemo(() => {
    const ignoredKeys = new Set([
      "geometry",
      "coordinates",
      "type",
      "layer",
      "layerschemaid",
      "layerschemaname",
      "layer_name",
      "layer_schema_id",
      "layer_schema_name",
      "_layerid",
      "_initialtab",
      "ispointinspection",
      "source",
      "origem_perimetro",
      "origem_fiu",
      "totalarea",
      "totalareapercentage",
      "smallerpolygonareapercentage",
    ]);

    const entries = Object.entries(activeProperties).filter(([key]) => {
      if (key.startsWith("__")) return false;
      const lowerKey = key.toLowerCase().replace(/[-_\s]+/g, "");
      if (ignoredKeys.has(key) || ignoredKeys.has(lowerKey)) return false;
      return true;
    });

    if (!searchTerm.trim()) return entries;

    const term = searchTerm.toLowerCase();
    return entries.filter(([key, value]) => {
      const { label } = getAttributeDisplayLabel(
        key,
        activeItem?.layerSchema,
        editFeatureTemplate?.value,
      );
      const valStr = String(value ?? "").toLowerCase();
      return (
        label.toLowerCase().includes(term) ||
        key.toLowerCase().includes(term) ||
        valStr.includes(term)
      );
    });
  }, [activeProperties, searchTerm, activeItem?.layerSchema, editFeatureTemplate?.value]);

  const handleCopy = (key: string, value: string, displayLabel: string) => {
    void navigator.clipboard.writeText(value);
    setCopiedKey(key);
    toastSuccess(`Copiado: ${displayLabel}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (availableFeatures.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <FileSpreadsheet className="h-10 w-10 opacity-40 mb-2 text-primary" aria-hidden="true" />
        <p className="text-sm font-semibold text-foreground">Nenhum atributo encontrado</p>
        <p className="text-xs mt-1 max-w-xs text-muted-foreground">
          Clique em um elemento ou desenhe uma geometria no mapa para consultar seus dados cadastrais.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={tableContainerRef}
      className={cn("flex flex-col w-full text-foreground space-y-3 p-3 select-text pointer-events-auto", className)}
      role="region"
      aria-label="Tabela de atributos da geometria consultada"
    >
      {/* Feições identificadas - Chips ultra-compactos agrupados lado a lado */}
      {availableFeatures.length > 0 && (
        <div className="space-y-1 rounded-lg border border-border/70 bg-muted/10 p-2 shadow-2xs">
          <div className="flex items-center justify-between gap-1.5 px-0.5 text-[10.5px] font-semibold text-muted-foreground">
            <div className="flex items-center gap-1">
              <Layers className="h-3 w-3 text-primary" aria-hidden="true" />
              <span>
                {availableFeatures.length === 1
                  ? "Feição selecionada (1 feição):"
                  : `Feições das camadas (${availableFeatures.length}):`}
              </span>
            </div>
            <span className="text-[9.5px] text-muted-foreground/80 font-normal hidden sm:inline">
              Clique para alternar a feição
            </span>
          </div>

          <div
            className="flex items-center gap-1 flex-wrap"
            role="tablist"
            aria-label="Lista de feições das camadas identificadas"
          >
            {availableFeatures.map((item, idx) => {
              const isSelected = safeLayerIndex === idx;
              return (
                <button
                  key={`${item.label}-${idx}`}
                  type="button"
                  role="tab"
                  id={`pkg-tab-layer-${idx}`}
                  aria-selected={isSelected}
                  aria-controls={`pkg-panel-layer-${idx}`}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => handleSelectFeature(idx, item)}
                  onKeyDown={(e) => handleChipKeyDown(e, idx)}
                  className={cn(
                    "h-6 px-2 rounded-md text-[10.5px] font-medium transition-all border flex items-center gap-1 shrink-0 select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-2xs font-semibold"
                      : "bg-background text-foreground border-border/70 hover:bg-muted/60 hover:border-primary/40"
                  )}
                  aria-label={`${item.label}${item.percentage ? `, sobreposição de ${item.percentage}` : ""}${item.isActiveOnMap ? ", camada visível no mapa" : ""}`}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      isSelected
                        ? "bg-primary-foreground"
                        : item.isActiveOnMap
                          ? "bg-emerald-500"
                          : "bg-muted-foreground/40"
                    )}
                    aria-hidden="true"
                  />
                  <span className="truncate max-w-[150px] leading-none">{item.label}</span>

                  {/* Porcentagem de Intersecção no Chip */}
                  {item.percentage && (
                    <span
                      className={cn(
                        "text-[8.5px] font-bold px-1 py-0.2 rounded-xs leading-none shrink-0",
                        isSelected
                          ? "bg-primary-foreground/25 text-primary-foreground"
                          : "bg-primary/10 text-primary border border-primary/20"
                      )}
                      title={`Sobreposição territorial de ${item.percentage}`}
                    >
                      {item.percentage}
                    </span>
                  )}

                  {/* Tag de Ativa no mapa */}
                  {item.isActiveOnMap && (
                    <span
                      className={cn(
                        "text-[8px] font-semibold px-1 py-0.2 rounded-xs leading-none shrink-0",
                        isSelected
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      )}
                      title="Esta camada está ligada e visível no mapa"
                    >
                      Ativa
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Input, FIU Action and Advanced View Toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <label htmlFor="pkg-search-attributes-input" className="sr-only">
            Buscar atributo ou valor nesta camada
          </label>
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="pkg-search-attributes-input"
            type="text"
            placeholder="Buscar atributo ou valor nesta camada..."
            value={searchTerm}
            onInput={(e) => setSearchTerm(e.currentTarget.value)}
            className="h-8 pl-8 pr-8 text-xs bg-background focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Buscar atributo ou valor na camada selecionada"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              title="Limpar busca"
              aria-label="Limpar termo de busca"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Botão Abrir FIU (Exibido estritamente quando é perímetro e não ponto) */}
        {canOpenFiu && onOpenFiu && (
          <button
            type="button"
            onClick={onOpenFiu}
            className="h-8 px-2.5 rounded-md text-[11px] font-semibold transition-all border flex items-center gap-1.5 shrink-0 select-none cursor-pointer bg-primary text-primary-foreground border-primary hover:bg-primary/90 shadow-2xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            title="Abrir Ficha de Informações Urbanísticas oficial em nova aba"
            aria-label="Abrir Ficha de Informações Urbanísticas para este perímetro"
          >
            <span
              className="h-3.5 w-3.5 shrink-0"
              style={{
                backgroundColor: "currentColor",
                mask: "url(/capivara-icone.svg) no-repeat center / contain",
                WebkitMask: "url(/capivara-icone.svg) no-repeat center / contain",
              }}
              aria-hidden="true"
            />
            <span>Iniciar FIU</span>
            <ExternalLink className="h-3 w-3 opacity-80" aria-hidden="true" />
          </button>
        )}

        {/* Toggle Modo Avançado */}
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className={cn(
            "h-8 px-2.5 rounded-md text-[11px] font-medium transition-all border flex items-center gap-1.5 shrink-0 select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
            showAdvanced
              ? "bg-primary text-primary-foreground border-primary shadow-2xs font-semibold"
              : "bg-background text-muted-foreground border-border/70 hover:bg-muted/60 hover:text-foreground"
          )}
          title={
            showAdvanced
              ? "Modo avançado ativo: exibindo nomes técnicos e descrições dos atributos"
              : "Ativar modo avançado para ver nomes técnicos das colunas e descrições completas"
          }
          aria-pressed={showAdvanced}
          aria-label="Alternar visualização avançada com nomes técnicos de colunas e descrições"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Avançado</span>
        </button>
      </div>

      {/* Table content */}
      <div
        id={`pkg-panel-layer-${safeLayerIndex}`}
        role="tabpanel"
        aria-labelledby={`pkg-tab-layer-${safeLayerIndex}`}
      >
        {filteredEntries.length === 0 ? (
          <div
            className="p-6 text-center text-xs text-muted-foreground rounded-xl border border-border bg-card space-y-1"
            role="status"
            aria-live="polite"
          >
            <p className="font-semibold text-foreground">Nenhum atributo encontrado para &ldquo;{searchTerm}&rdquo;</p>
            <p className="text-[11px]">Tente buscar por outro termo ou limpe o campo de busca.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <table
              className="w-full text-left text-xs border-collapse"
              aria-label={`Tabela de atributos de ${activeItem?.label || "camada selecionada"}`}
            >
              <caption className="sr-only">
                Atributos cadastrais e valores da camada {activeItem?.label || "selecionada"}
              </caption>
              <thead>
                <tr className="border-b border-border bg-muted/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
                  <th scope="col" className="py-2.5 px-3.5 w-[42%] font-medium border-r border-border/50">
                    Atributo
                  </th>
                  <th scope="col" className="py-2.5 px-3.5 w-[48%] font-medium">
                    Valor
                  </th>
                  <th scope="col" className="py-2.5 px-2 w-[10%] text-center font-medium border-l border-border/50">
                    Copiar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredEntries.map(([key, rawValue], rowIdx) => {
                  const { label, description } = getAttributeDisplayLabel(
                    key,
                    activeItem?.layerSchema,
                    editFeatureTemplate?.value,
                  );
                  const displayLabel = label || key;
                  const { display, isUrl, isNumeric } = formatAttributeValue(rawValue, key);
                  const isCopied = copiedKey === key;
                  const isEvenRow = rowIdx % 2 === 1;

                  return (
                    <tr
                      key={key}
                      className={cn(
                        "group transition-colors",
                        isEvenRow
                          ? "bg-muted/35 dark:bg-muted/15 hover:bg-primary/[0.08]"
                          : "bg-background hover:bg-primary/[0.05]"
                      )}
                    >
                      {/* Coluna Atributo */}
                      <th
                        scope="row"
                        className={cn(
                          "py-2.5 px-3.5 font-semibold text-foreground border-r border-border/40 select-text text-left w-[42%]",
                          showAdvanced ? "align-top" : "align-middle"
                        )}
                      >
                        {showAdvanced ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-foreground leading-tight">
                              {displayLabel}
                            </span>
                            {displayLabel.toLowerCase() !== key.toLowerCase() && (
                              <span className="text-[10px] font-mono text-muted-foreground/70 tracking-tight select-all">
                                {key}
                              </span>
                            )}
                            {description && (
                              <span className="text-[10px] text-muted-foreground leading-snug">
                                {description}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-semibold text-foreground leading-tight">
                            {displayLabel}
                          </span>
                        )}
                      </th>

                      {/* Coluna Valor */}
                      <td className="py-2.5 px-3.5 align-top select-text w-[48%]">
                        {isUrl ? (
                          <a
                            href={display}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-medium break-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-xs"
                            aria-label={`Acessar link externo: ${displayLabel}`}
                          >
                            <span>Acessar link</span>
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        ) : typeof rawValue === "boolean" ? (
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
                              rawValue
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {display}
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "text-foreground break-words leading-relaxed select-text",
                              isNumeric && "font-mono font-medium text-foreground/95"
                            )}
                          >
                            {display}
                          </span>
                        )}
                      </td>

                      {/* Coluna Copiar */}
                      <td className="py-2 px-2 align-middle text-center border-l border-border/40 w-[10%]">
                        <button
                          type="button"
                          onClick={() => handleCopy(key, display, displayLabel)}
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-md transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                            isCopied
                              ? "bg-emerald-500/15 text-emerald-600 font-semibold"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground opacity-60 group-hover:opacity-100"
                          )}
                          title={`Copiar valor de ${displayLabel}`}
                          aria-label={`Copiar valor de ${displayLabel}: ${display}`}
                        >
                          {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div
        className="px-1 flex items-center justify-between text-[11px] text-muted-foreground pt-1"
        aria-live="polite"
      >
        <span>
          {filteredEntries.length === 1
            ? "1 atributo listado"
            : `${filteredEntries.length} atributos listados`}
          {searchTerm && ` (filtrado de ${Object.keys(activeProperties).length})`}
        </span>
        <span className="text-[10px] text-muted-foreground/80">Dados oficiais · Urbis</span>
      </div>
    </div>
  );
};
