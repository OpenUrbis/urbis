// packages/map/src/components/ProspectiveSearch/hooks/useProspectiveSearch.ts

import { useState, useMemo } from 'react';
import {
  UrbanParamsFilters,
  PesquisaUsoResult,
  UsoSearchResultItem
} from '../utils/types';
import { pesquisarUsos, getRegrasZonamento, getCondicoesInstalacao } from '../utils/use-logic';
import { RangeFilterValue } from '../ui/PriceRangeSlider';

export function useProspectiveSearch(moduleData: Record<string, any[]>) {
  // --- Data References ---
  const usosData = useMemo(() => moduleData['Usos'] || [], [moduleData]);
  const cnaeData = useMemo(() => moduleData['CNAEs por Atividade'] || [], [moduleData]);

  // You might need these in the UI for cross-referencing
  const usosPorZonaData = useMemo(() => moduleData['Usos permitidos por Zona'] || [], [moduleData]);
  const parametrosUsoData = useMemo(() => moduleData['Parâmetros urbanísticos por Uso'] || [], [moduleData]);
  const parametrosZonasData = useMemo(() => {
    // Fuzzy match for the sheet name to avoid truncation issues
    const key = Object.keys(moduleData).find(k => k.startsWith('Parâmetros urbanísticos por Zon'));
    return key ? moduleData[key] : [];
  }, [moduleData]);

  const parametrosPqaData = useMemo(() => {
    const key = Object.keys(moduleData).find(k => k.startsWith('Parâmetros urbanísticos por Per'));
    return key ? moduleData[key] : [];
  }, [moduleData]);

  // --- Search States ---

  // 1. Use Search State
  const [useSearchTerm, setUseSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<'atividade' | 'cnae' | 'cnpj'>('atividade');
  const [selectedUse, setSelectedUse] = useState<UsoSearchResultItem | null>(null);

  // 2. Urban Params State
  const [urbanParams, setUrbanParams] = useState<UrbanParamsFilters>({});

  // 3. PQA Params State
  const [pqaParams, setPqaParams] = useState<UrbanParamsFilters>({});
  const [areaImovel, setAreaImovel] = useState<[number, number] | null>(null);

  // 4. Synthesis Mode State
  const [synthesisMode, setSynthesisMode] = useState(false);

  // --- Derived Data (Options Extraction) ---
  const availableOptions = useMemo(() => {
    if (!parametrosZonasData.length) return {};

    const options: Record<string, number[]> = {};

    const KEYS_TO_EXTRACT: Record<string, string[]> = {
      'Frente Mínima de Lote (m)': ['frenteMinimaLote'],
      'Frente Máxima de Lote (m)': ['frenteMaximaLote'],
      'Área Mínima de Lote (m²)': ['areaMinimaLote'],
      'Área Máxima de Lote (m²)': ['areaMaximaLote'],
      'Coeficiente de Aproveitamento Mínimo': ['coeficienteAproveitamentoMinimo'],
      'Coeficiente de Aproveitamento Básico': ['coeficienteAproveitamentoBasico'],
      'Coeficiente de Aproveitamento Máximo': ['coeficienteAproveitamentoMaximo'],
      'Taxa de Ocupação Máxima para Lotes até 500,00 m²': ['taxaOcupacaoMaximaLotesAte500'],
      'Taxa de Ocupação Máxima para Lotes igual ou superior a 500,00 m²': ['taxaOcupacaoMaximaLotesIgualOuSuperior500'],
      'Gabarito de Altura Máxima (m)': ['gabaritoAlturaMaxima'],
      'Recuo Mínimo de Frente (m)': ['recuoMinimoFrente'],
      'Recuo Mínimo de Fundos e Laterais (H ≤ 10m)': ['recuoMinimoFundosLateraisAlturaEdificacaoMenorOuIgual10'],
      'Recuo Mínimo de Fundos e Laterais (H > 10m)': ['recuoMinimoFundosLateraisAlturaEdificacaoSuperior10'],
      'Cota Parte Máxima de Terreno por Unidade (m²)': ['cotaParteMaximaTerrenoPorUnidade'],
      'Ruído (7h-19h)': ['nivelCriterioAvaliacaoNcaAmbienteExternoDbEmissaoRuido7hAs19h'],
      'Ruído (19h-22h)': ['nivelCriterioAvaliacaoNcaAmbienteExternoDbEmissaoRuido19hAs22h'],
      'Ruído (22h-7h)': ['nivelCriterioAvaliacaoNcaAmbienteExternoDbEmissaoRuido22hAs7h'],
      'Vibração Associada': ['vibracaoAssociada'],
      'Emissão de Radiação': ['emissaoRadiacaoFaixaFrequencia0Hz300Ghz'],
      'Emissão de Odores': ['emissaoOdores'],
      'Emissão de Gases e Vapores': ['emissaoGases,VaporesMaterialParticulado'],
    };

    Object.entries(KEYS_TO_EXTRACT).forEach(([uiKey, dataKeys]) => {
      const values = new Set<number>();

      parametrosZonasData.forEach(row => {
        dataKeys.forEach(key => {
          const val = row[key];
          if (!val || String(val).trim().toUpperCase() === 'NA' || val === '-') return;
          const normalized = String(val).replace(',', '.').trim();
          const parsed = parseFloat(normalized);
          if (!isNaN(parsed)) values.add(parsed);
        });
      });

      options[uiKey] = Array.from(values).sort((a, b) => a - b);
    });

    return options;
  }, [parametrosZonasData]);

  const pqaOptions = useMemo(() => {
    if (!parametrosPqaData.length) return {};

    const options: Record<string, number[]> = {};

    const KEYS_TO_EXTRACT: Record<string, string[]> = {
      'Fatores de Drenagem Beta': ['fatoresDrenagemBeta'],
      'Taxa de Permeabilidade Lote > 500': ['taxaPermeabilidadeLote>500'],
      'Fatores Cobertura Vegetal Alfa': ['fatoresCoberturaVegetalAlfa'],
      'Pontuação QA Mínimo Lote > 10000': ['pontuacaoQaMinimoLote>10000'],
      'Taxa de Permeabilidade Lote ≤ 500': ['taxaPermeabilidadeLote≤500'],
      'Pontuação QA Mínimo Lote > 500 ≤ 1000': ['pontuacaoQaMinimoLote>500≤1000'],
      'Pontuação QA Mínimo Lote > 1000 ≤ 2500': ['pontuacaoQaMinimoLote>1000≤2500'],
      'Pontuação QA Mínimo Lote > 2500 ≤ 5000': ['pontuacaoQaMinimoLote>2500≤5000'],
      'Pontuação QA Mínimo Lote > 5000 ≤ 10000': ['pontuacaoQaMinimoLote>5000≤10000'],
      'Fator Incentivo Quota Ambiental (Lote > 5000, Pontuação ≥ 4x Qamin)': ['fatorIncentivoQuotaAmbientalR$/Lote>5.000Pontuacao≥4VezesQamin'],
      'Fator Incentivo Quota Ambiental (Lote > 5000, Pontuação ≥ 2x e < 3x Qamin)': ['fatorIncentivoQuotaAmbientalR$/Lote>5.000Pontuacao≥2<3VezesQamin'],
      'Fator Incentivo Quota Ambiental (Lote > 5000, Pontuação ≥ 3x e < 4x Qamin)': ['fatorIncentivoQuotaAmbientalR$/Lote>5.000Pontuacao≥3<4VezesQamin'],
      'Fator Incentivo Quota Ambiental (Lote > 5000, Pontuação ≥ 1.5x e < 2x Qamin)': ['fatorIncentivoQuotaAmbientalR$/Lote>5.000Pontuacao≥1,5<2VezesQamin'],
      'Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 4x Qamin)': ['fatorIncentivoQuotaAmbientalR$/Lote>500≤1.000Pontuacao≥4VezesQamin'],
      'Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 4x Qamin)': ['fatorIncentivoQuotaAmbientalR$/Lote>1.000≤2.500Pontuacao≥4VezesQamin'],
      'Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 4x Qamin)': ['fatorIncentivoQuotaAmbientalR$/Lote>2.500≤5.000Pontuacao≥4VezesQamin'],
      'Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 2x e < 3x Qamin)': ['fatorIncentivoQuotaAmbientalR$/Lote>500≤1.000Pontuacao≥2<3VezesQamin'],
      'Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 3x e < 4x Qamin)': ['fatorIncentivoQuotaAmbientalR$/Lote>500≤1.000Pontuacao≥3<4VezesQamin'],
      'Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 2x e < 3x Qamin)': ['fatorIncentivoQuotaAmbientalR$/Lote>1.000≤2.500Pontuacao≥2<3VezesQamin'],
      'Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 3x e < 4x Qamin)': ['fatorIncentivoQuotaAmbientalR$/Lote>1.000≤2.500Pontuacao≥3<4VezesQamin'],
      'Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 2x e < 3x Qamin)': ['fatorIncentivoQuotaAmbientalR$/Lote>2.500≤5.000Pontuacao≥2<3VezesQamin'],
      'Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 3x e < 4x Qamin)': ['fatorIncentivoQuotaAmbientalR$/Lote>2.500≤5.000Pontuacao≥3<4VezesQamin'],
      'Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 1.5x e < 2x Qamin)': ['fatorIncentivoQuotaAmbientalR$/Lote>500≤1.000Pontuacao≥1,5<2VezesQamin'],
      'Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 1.5x e < 2x Qamin)': ['fatorIncentivoQuotaAmbientalR$/Lote>1.000≤2.500Pontuacao≥1,5<2VezesQamin'],
      'Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 1.5x e < 2x Qamin)': ['fatorIncentivoQuotaAmbientalR$/Lote>2.500≤5.000Pontuacao≥1,5<2VezesQamin'],
    };

    Object.entries(KEYS_TO_EXTRACT).forEach(([uiKey, dataKeys]) => {
      const values = new Set<number>();

      parametrosPqaData.forEach(row => {
        dataKeys.forEach(key => {
          let val = row[key];
          if (!val || String(val).trim().toUpperCase() === 'NA' || val === '-') return;
          // some values might have "(3A - a) (3A - b)", strip those out
          let stringVal = String(val).split(' ')[0]; // take just the number part
          const normalized = stringVal.replace(',', '.').trim();
          const parsed = parseFloat(normalized);
          if (!isNaN(parsed)) values.add(parsed);
        });
      });

      options[uiKey] = Array.from(values).sort((a, b) => a - b);
    });

    return options;
  }, [parametrosPqaData]);

  // --- Derived Data (Search Results) ---

  const useSearchResults: PesquisaUsoResult | null = useMemo(() => {
    if (useSearchTerm.length < 2) return null;
    if (searchMode === 'cnpj') return null; // CNPJ search is handled asynchronously in the UI
    return pesquisarUsos(useSearchTerm, usosData, cnaeData, searchMode as 'atividade' | 'cnae');
  }, [useSearchTerm, usosData, cnaeData, searchMode]);

  // Filter valid zones based on current `urbanParams`
  const urbanParamsResults = useMemo(() => {
    if (!parametrosZonasData.length) return [];

    let filteredZonas = [...parametrosZonasData];

    // Mapping between the Filter ID (UI) and the Data Key (Excel/JSON)
    const PARAM_KEY_MAPPING: Record<string, string> = {
      'Frente Mínima de Lote (m)': 'frenteMinimaLote',
      'Frente Máxima de Lote (m)': 'frenteMaximaLote',
      'Área Mínima de Lote (m²)': 'areaMinimaLote',
      'Área Máxima de Lote (m²)': 'areaMaximaLote',
      'Coeficiente de Aproveitamento Mínimo': 'coeficienteAproveitamentoMinimo',
      'Coeficiente de Aproveitamento Básico': 'coeficienteAproveitamentoBasico',
      'Coeficiente de Aproveitamento Máximo': 'coeficienteAproveitamentoMaximo',
      'Taxa de Ocupação Máxima para Lotes até 500,00 m²': 'taxaOcupacaoMaximaLotesAte500',
      'Taxa de Ocupação Máxima para Lotes igual ou superior a 500,00 m²': 'taxaOcupacaoMaximaLotesIgualOuSuperior500',
      'Gabarito de Altura Máxima (m)': 'gabaritoAlturaMaxima',
      'Recuo Mínimo de Frente (m)': 'recuoMinimoFrente',
      'Recuo Mínimo de Fundos e Laterais (H ≤ 10m)': 'recuoMinimoFundosLateraisAlturaEdificacaoMenorOuIgual10',
      'Recuo Mínimo de Fundos e Laterais (H > 10m)': 'recuoMinimoFundosLateraisAlturaEdificacaoSuperior10',
      'Cota Parte Máxima de Terreno por Unidade (m²)': 'cotaParteMaximaTerrenoPorUnidade',
      'Ruído (7h-19h)': 'nivelCriterioAvaliacaoNcaAmbienteExternoDbEmissaoRuido7hAs19h',
      'Ruído (19h-22h)': 'nivelCriterioAvaliacaoNcaAmbienteExternoDbEmissaoRuido19hAs22h',
      'Ruído (22h-7h)': 'nivelCriterioAvaliacaoNcaAmbienteExternoDbEmissaoRuido22hAs7h',
      'Vibração Associada': 'vibracaoAssociada',
      'Emissão de Radiação': 'emissaoRadiacaoFaixaFrequencia0Hz300Ghz',
      'Emissão de Odores': 'emissaoOdores',
      'Emissão de Gases e Vapores': 'emissaoGases,VaporesMaterialParticulado',
    };

    // Iterate over each active filter
    Object.keys(urbanParams).forEach(paramKey => {
      const filter = urbanParams[paramKey];

      // Helper for value parsing
      const parseVal = (val: any) => {
        if (!val || String(val).trim().toUpperCase() === 'NA' || val === '-') return null;
        const normalized = String(val).replace(',', '.').trim();
        const parsed = parseFloat(normalized);
        return isNaN(parsed) ? null : parsed;
      };

      // Standard Logic for other parameters
      // Get the correct key from mapping, or fallback to the paramKey itself
      const dataKey = PARAM_KEY_MAPPING[paramKey] || paramKey;

      filteredZonas = filteredZonas.filter(zonaData => {
        const columnKey = Object.keys(zonaData).find(k => k === dataKey);
        if (!columnKey) return true;

        const value = parseVal(zonaData[columnKey]);
        if (value === null) return true; // Skip filtering if data is NA

        switch (filter.type) {
          case 'between':
            return value >= filter.min && value <= filter.max;
          case 'greater_than':
            return value > filter.value;
          case 'less_than':
            return value < filter.value;
          case 'equal':
            return value === filter.value;
          default:
            return true;
        }
      });
    });

    return filteredZonas;
  }, [urbanParams, parametrosZonasData]);

  const urbanParamsPqaResults = useMemo(() => {
    if (!parametrosPqaData.length) return [];

    let filteredPqas = [...parametrosPqaData];

    const PARAM_KEY_MAPPING: Record<string, string> = {
      'Fatores de Drenagem Beta': 'fatoresDrenagemBeta',
      'Taxa de Permeabilidade Lote > 500': 'taxaPermeabilidadeLote>500',
      'Fatores Cobertura Vegetal Alfa': 'fatoresCoberturaVegetalAlfa',
      'Pontuação QA Mínimo Lote > 10000': 'pontuacaoQaMinimoLote>10000',
      'Taxa de Permeabilidade Lote ≤ 500': 'taxaPermeabilidadeLote≤500',
      'Pontuação QA Mínimo Lote > 500 ≤ 1000': 'pontuacaoQaMinimoLote>500≤1000',
      'Pontuação QA Mínimo Lote > 1000 ≤ 2500': 'pontuacaoQaMinimoLote>1000≤2500',
      'Pontuação QA Mínimo Lote > 2500 ≤ 5000': 'pontuacaoQaMinimoLote>2500≤5000',
      'Pontuação QA Mínimo Lote > 5000 ≤ 10000': 'pontuacaoQaMinimoLote>5000≤10000',
      'Fator Incentivo Quota Ambiental (Lote > 5000, Pontuação ≥ 4x Qamin)': 'fatorIncentivoQuotaAmbientalR$/Lote>5.000Pontuacao≥4VezesQamin',
      'Fator Incentivo Quota Ambiental (Lote > 5000, Pontuação ≥ 2x e < 3x Qamin)': 'fatorIncentivoQuotaAmbientalR$/Lote>5.000Pontuacao≥2<3VezesQamin',
      'Fator Incentivo Quota Ambiental (Lote > 5000, Pontuação ≥ 3x e < 4x Qamin)': 'fatorIncentivoQuotaAmbientalR$/Lote>5.000Pontuacao≥3<4VezesQamin',
      'Fator Incentivo Quota Ambiental (Lote > 5000, Pontuação ≥ 1.5x e < 2x Qamin)': 'fatorIncentivoQuotaAmbientalR$/Lote>5.000Pontuacao≥1,5<2VezesQamin',
      'Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 4x Qamin)': 'fatorIncentivoQuotaAmbientalR$/Lote>500≤1.000Pontuacao≥4VezesQamin',
      'Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 4x Qamin)': 'fatorIncentivoQuotaAmbientalR$/Lote>1.000≤2.500Pontuacao≥4VezesQamin',
      'Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 4x Qamin)': 'fatorIncentivoQuotaAmbientalR$/Lote>2.500≤5.000Pontuacao≥4VezesQamin',
      'Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 2x e < 3x Qamin)': 'fatorIncentivoQuotaAmbientalR$/Lote>500≤1.000Pontuacao≥2<3VezesQamin',
      'Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 3x e < 4x Qamin)': 'fatorIncentivoQuotaAmbientalR$/Lote>500≤1.000Pontuacao≥3<4VezesQamin',
      'Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 2x e < 3x Qamin)': 'fatorIncentivoQuotaAmbientalR$/Lote>1.000≤2.500Pontuacao≥2<3VezesQamin',
      'Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 3x e < 4x Qamin)': 'fatorIncentivoQuotaAmbientalR$/Lote>1.000≤2.500Pontuacao≥3<4VezesQamin',
      'Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 2x e < 3x Qamin)': 'fatorIncentivoQuotaAmbientalR$/Lote>2.500≤5.000Pontuacao≥2<3VezesQamin',
      'Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 3x e < 4x Qamin)': 'fatorIncentivoQuotaAmbientalR$/Lote>2.500≤5.000Pontuacao≥3<4VezesQamin',
      'Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 1.5x e < 2x Qamin)': 'fatorIncentivoQuotaAmbientalR$/Lote>500≤1.000Pontuacao≥1,5<2VezesQamin',
      'Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 1.5x e < 2x Qamin)': 'fatorIncentivoQuotaAmbientalR$/Lote>1.000≤2.500Pontuacao≥1,5<2VezesQamin',
      'Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 1.5x e < 2x Qamin)': 'fatorIncentivoQuotaAmbientalR$/Lote>2.500≤5.000Pontuacao≥1,5<2VezesQamin',
    };

    Object.keys(pqaParams).forEach(paramKey => {
      const filter = pqaParams[paramKey];
      const dataKey = PARAM_KEY_MAPPING[paramKey] || paramKey;

      const parseVal = (val: any) => {
        if (!val || String(val).trim().toUpperCase() === 'NA' || val === '-') return null;
        let stringVal = String(val).split(' ')[0];
        const normalized = stringVal.replace(',', '.').trim();
        const parsed = parseFloat(normalized);
        return isNaN(parsed) ? null : parsed;
      };

      filteredPqas = filteredPqas.filter(pqaData => {
        const columnKey = Object.keys(pqaData).find(k => k === dataKey);
        if (!columnKey) return true;

        const value = parseVal(pqaData[columnKey]);
        if (value === null) return true;

        switch (filter.type) {
          case 'between': return value >= filter.min && value <= filter.max;
          case 'greater_than': return value > filter.value;
          case 'less_than': return value < filter.value;
          case 'equal': return value === filter.value;
          default: return true;
        }
      });
    });

    return filteredPqas;
  }, [pqaParams, parametrosPqaData]);

  // --- Actions ---

  const updateUrbanParam = (param: string, value: RangeFilterValue) => {
    setUrbanParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  const removeUrbanParam = (param: string) => {
    setUrbanParams(prev => {
      const next = { ...prev };
      delete next[param];
      return next;
    });
  }

  const updatePqaParam = (param: string, value: RangeFilterValue) => {
    setPqaParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  const removePqaParam = (param: string) => {
    setPqaParams(prev => {
      const next = { ...prev };
      delete next[param];
      return next;
    });
  }

  const clearUseSearch = () => {
    setUseSearchTerm('');
    setSelectedUse(null);
  };

  const clearUrbanParams = () => {
    setUrbanParams({});
  };

  const clearPqaParams = () => {
    setPqaParams({});
  };

  const isParamEnabledForArea = (paramId: string, areaRange: [number, number] | null) => {
    let requiredMin = 0;
    let requiredMax = Infinity;
    let hasAreaCondition = false;

    const normalizedParamId = paramId.toLowerCase().replace(/\./g, '');
    
    if (normalizedParamId.includes('até 500')) {
      hasAreaCondition = true;
      requiredMax = 500;
    } else if (normalizedParamId.includes('superior a 500')) {
      hasAreaCondition = true;
      requiredMin = 500;
    } else if (normalizedParamId.includes('lote')) {
      const condRegex = /([><≤≥])\s*(\d+)/g;
      let match;
      while ((match = condRegex.exec(normalizedParamId)) !== null) {
        hasAreaCondition = true;
        const op = match[1];
        const val = parseInt(match[2], 10);
        if (op === '>') requiredMin = Math.max(requiredMin, val + 0.01);
        else if (op === '≥') requiredMin = Math.max(requiredMin, val);
        else if (op === '<') requiredMax = Math.min(requiredMax, val - 0.01);
        else if (op === '≤') requiredMax = Math.min(requiredMax, val);
      }
    }

    if (!hasAreaCondition) return true;

    if (areaRange === null || areaRange === undefined) return false;

    const [minArea, maxArea] = areaRange;
    return minArea <= requiredMax && maxArea >= requiredMin;
  };

  const updateAreaImovel = (newArea: [number, number] | null) => {
    setAreaImovel(newArea);
    
    setPqaParams(prev => {
      const next = { ...prev };
      let changed = false;
      Object.keys(next).forEach(paramId => {
        if (!isParamEnabledForArea(paramId, newArea)) {
          delete next[paramId];
          changed = true;
        }
      });
      return changed ? next : prev;
    });

    setUrbanParams(prev => {
      const next = { ...prev };
      let changed = false;
      Object.keys(next).forEach(paramId => {
        if (!isParamEnabledForArea(paramId, newArea)) {
          delete next[paramId];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  };

  const disabledPqaParams = useMemo(() => {
    const disabled: string[] = [];
    if (!pqaOptions) return disabled;
    Object.keys(pqaOptions).forEach(paramId => {
      if (!isParamEnabledForArea(paramId, areaImovel)) {
        disabled.push(paramId);
      }
    });
    return disabled;
  }, [pqaOptions, areaImovel]);

  const disabledUrbanParams = useMemo(() => {
    const disabled: string[] = [];
    if (!availableOptions) return disabled;
    Object.keys(availableOptions).forEach(paramId => {
      if (!isParamEnabledForArea(paramId, areaImovel)) {
        disabled.push(paramId);
      }
    });
    return disabled;
  }, [availableOptions, areaImovel]);

  // --- Consolidada Logic (Rules & Conditions) ---

  const selectedUseCode = useMemo(() => {
    const getVal = (obj: any, keys: string[]) => {
      if (!obj) return '';
      const foundKey = Object.keys(obj).find(k => keys.includes(k.trim()));
      return foundKey ? obj[foundKey] : '';
    };

    return (
      getVal(selectedUse?.arvore.tipologiaOuGrupo, ['Código', 'Codigo', 'codigo']) ||
      getVal(selectedUse?.item, ['Código', 'Codigo', 'codigo'])
    );
  }, [selectedUse]);

  const regrasZonamento = useMemo(() => {
    if (!selectedUseCode) return null;
    return getRegrasZonamento(selectedUseCode, usosPorZonaData);
  }, [selectedUseCode, usosPorZonaData]);

  const condicoesInstalacao = useMemo(() => {
    if (!selectedUseCode) return [];
    return getCondicoesInstalacao(selectedUseCode, parametrosUsoData);
  }, [selectedUseCode, parametrosUsoData]);

  // Unified list of compatible zones (used for mapping and results)
  const compatibleZones = useMemo(() => {
    const paramZoneNames = urbanParamsResults.map((r: any) => r['zona'] || r['Zona'] || Object.values(r)[0]);

    if (!selectedUseCode) {
      // If no use selected, compatible zones are those matching urban params
      return Object.keys(urbanParams).length > 0 ? Array.from(new Set(paramZoneNames)) : [];
    }

    if (!regrasZonamento) return [];

    // If use selected, intersect urban params with permitted/conditional zones
    const permittedZones = [
      ...regrasZonamento.simSemNota,
      ...Object.values(regrasZonamento.simComNota).flat()
    ];

    // Functional intersection
    const finalZones = paramZoneNames.length > 0
      ? paramZoneNames.filter(z => permittedZones.includes(z))
      : permittedZones;

    return Array.from(new Set(finalZones)).sort();
  }, [selectedUseCode, regrasZonamento, urbanParamsResults, urbanParams]);

  const compatiblePqas = useMemo(() => {
    const pqaNames = urbanParamsPqaResults.map((r: any) =>
      r['perimetroQualificacaoAmbiental'] || r['perimetro'] || r['Perímetro'] || Object.values(r)[0]
    );

    // PQAs typically don't depend on activity rules in the same way zones do
    // So if there are filters, we show filtered ones. If no filters, show none (to keep UI clean)
    // unless a use is selected, in which case we might show all? 
    // User said "estruturar os dados como fizemos com as zonas"
    if (Object.keys(pqaParams).length === 0 && !selectedUseCode) return [];

    return Array.from(new Set(pqaNames)).sort();
  }, [urbanParamsPqaResults, pqaParams, selectedUseCode]);

  const allPqaNames = useMemo(() => {
    return Array.from(new Set(parametrosPqaData.map((r: any) =>
      r['perimetroQualificacaoAmbiental'] || r['perimetro'] || r['Perímetro'] || Object.values(r)[0]
    ))).sort();
  }, [parametrosPqaData]);

  const canSynthesize = useMemo(() => {
    return selectedUse !== null && Object.keys(urbanParams).length > 0;
  }, [selectedUse, urbanParams]);

  return {
    // Raw Data Access
    usosData,
    cnaeData,
    usosPorZonaData,
    parametrosUsoData,
    parametrosZonasData,
    parametrosPqaData,

    // Use State
    useSearchTerm,
    setUseSearchTerm,
    searchMode,
    setSearchMode,
    useSearchResults,
    selectedUse,
    setSelectedUse,
    clearUseSearch,

    // Urban Params State
    urbanParams,
    updateUrbanParam,
    removeUrbanParam,
    urbanParamsResults,
    urbanParamsPqaResults,
    clearUrbanParams,
    availableOptions,
    disabledUrbanParams,

    // PQA Params State
    pqaParams,
    updatePqaParam,
    removePqaParam,
    clearPqaParams,
    pqaOptions,
    areaImovel,
    updateAreaImovel,
    disabledPqaParams,

    // Consolidada Logic
    regrasZonamento,
    condicoesInstalacao,
    compatibleZones,
    compatiblePqas,
    allPqaNames,
    canSynthesize,

    // Synthesis
    synthesisMode,
    setSynthesisMode
  };
}
