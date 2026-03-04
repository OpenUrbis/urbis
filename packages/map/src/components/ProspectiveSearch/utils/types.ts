// packages/map/src/components/ProspectiveSearch/utils/types.ts
import { RangeFilterValue } from '../ui/PriceRangeSlider';

// --- URBAM PARAMETERS & USES (Base types) ---
export interface UsoLPUOS {
  Código: string;
  Divisão: 'Categoria de uso' | 'Subcategoria de uso' | 'Tipologia' | 'Grupo de atividades' | 'Subtipologia' | 'Atividade';
  Descrição: string;
  'Categoria de uso'?: string;
  'Subcategoria de uso'?: string;
  'Grupo de atividades ou Tipologia'?: string;
  'Atividade ou Subtipologia'?: string;
}

export interface CnaePorAtividade {
  'Seção (CNAE 2.2)': string;
  'Divisão (CNAE 2.2)': string;
  'Grupo (CNAE 2.2)': string;
  'Classe (CNAE 2.2)': string;
  'Subclasses (CNAE 2.2)': string;
  'Denominação (CNAE 2.2)': string;
  'Descrição Complementar do Município de São Paulo onde constam restrições municipais'?: string;
  'Subcategoria de Uso': string;
  'Grupo de Atividades': string;
  'Atividade': string;
}

export interface UsoPermitidoPorZona {
  [key: string]: string; // Column headers vary by Zone (e.g. ZEU, ZM, ZCOR-1)
}

export interface ParametrosUrbanisticosPorUso {
  [key: string]: string; // Parameter names vary
}

export interface ParametrosUrbanisticosPorZona {
  [key: string]: string | number; // e.g. "Taxa de ocupação máxima", "Coeficiente de aproveitamento máximo"
}

// --- SEARCH RESULT TYPES ---

export interface UsoHierarchy {
  categoria?: UsoLPUOS;
  subcategoria?: UsoLPUOS;
  tipologiaOuGrupo?: UsoLPUOS;
  subtipologiaOuAtividade?: UsoLPUOS;
}

export interface UsoSearchResultItem {
  item: UsoLPUOS;
  arvore: UsoHierarchy;
  cnaeOriginario?: CnaePorAtividade;
}

export interface PesquisaUsoResult {
  tipoBusca: 'CNAE' | 'TEXTO' | 'CODIGO';
  termoBuscado: string;
  resultados: UsoSearchResultItem[];
}

export interface RegraZonamento {
  simSemNota: string[];
  simComNota: Record<string, string[]>;
  naoComNota: Record<string, string[]>;
  naoSemNota: string[];
  zoeZep: string[];
}

export interface CondicaoInstalacao {
  parametro: string;
  valor: string;
  notas: string[];
}

// --- STATE MANAGEMENT TYPES ---

export interface UrbanParamsFilters {
  [parametro: string]: RangeFilterValue; 
}

export interface SearchState {
  // Data
  moduleData: Record<string, any[]>;
  
  // Use Search
  useSearchTerm: string;
  useSearchResults: PesquisaUsoResult | null;
  selectedUse: UsoSearchResultItem | null;
  
  // Urban Params Search
  urbanParams: UrbanParamsFilters;
  urbanParamsResults: any[]; // The zones/perimeters that match the params
  
  // Synthesis
  synthesisMode: boolean;
}
