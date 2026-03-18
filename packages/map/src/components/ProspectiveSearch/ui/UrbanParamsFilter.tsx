import React from 'react';
import { UrbanParamsFilters } from '../utils/types';
import { PriceRangeSlider, RangeFilterValue } from './PriceRangeSlider';
import { Plus, Info } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectLabel,
  SelectGroup,
  SelectSeparator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@open-urbis/map-ui';

export interface FilterParamConfig {
  id: string;
  label: string;
  unit: string;
  defaultMax: number;
  step?: number;
}

interface UrbanParamsFilterProps {
  filters: UrbanParamsFilters;
  options?: Record<string, number[]>;
  availableParams?: FilterParamConfig[];
  disabledParams?: string[];
  updateFilter: (param: string, value: RangeFilterValue) => void;
  removeFilter?: (param: string) => void;
  clearFilters: () => void;
  resultsCount: number;
}

export const DEFAULT_URBAN_PARAMS: FilterParamConfig[] = [
  { id: 'Frente Mínima de Lote (m)', label: 'Frente mínima de lote', unit: 'm', defaultMax: 50 },
  { id: 'Frente Máxima de Lote (m)', label: 'Frente máxima de lote', unit: 'm', defaultMax: 200 },
  { id: 'Área Mínima de Lote (m²)', label: 'Área mínima de lote', unit: 'm²', defaultMax: 2000 },
  { id: 'Área Máxima de Lote (m²)', label: 'Área máxima de lote', unit: 'm²', defaultMax: 50000 },
  { id: 'Coeficiente de Aproveitamento Mínimo', label: 'C.A. mínimo', unit: '', defaultMax: 2, step: 0.1 },
  { id: 'Coeficiente de Aproveitamento Básico', label: 'C.A. básico', unit: '', defaultMax: 2, step: 0.1 },
  { id: 'Coeficiente de Aproveitamento Máximo', label: 'C.A. máximo', unit: '', defaultMax: 6, step: 0.1 },
  { id: 'Taxa de Ocupação Máxima para Lotes até 500,00 m²', label: 'T.O. máx (≤ 500m²)', unit: '', defaultMax: 1, step: 0.05 },
  { id: 'Taxa de Ocupação Máxima para Lotes igual ou superior a 500,00 m²', label: 'T.O. máx (≥ 500m²)', unit: '', defaultMax: 1, step: 0.05 },
  { id: 'Gabarito de Altura Máxima (m)', label: 'Gabarito de altura', unit: 'm', defaultMax: 100 },
  { id: 'Recuo Mínimo de Frente (m)', label: 'Recuo de frente', unit: 'm', defaultMax: 10 },
  { id: 'Recuo Mínimo de Fundos e Laterais (H ≤ 10m)', label: 'Recuo fundos/lat (≤10m)', unit: 'm', defaultMax: 5 },
  { id: 'Recuo Mínimo de Fundos e Laterais (H > 10m)', label: 'Recuo fundos/lat (>10m)', unit: 'm', defaultMax: 10 },
  { id: 'Cota Parte Máxima de Terreno por Unidade (m²)', label: 'Cota parte máxima', unit: 'm²/un', defaultMax: 100 },
  { id: 'Ruído (7h-19h)', label: 'Ruído (7h-19h)', unit: 'dB', defaultMax: 85 },
  { id: 'Ruído (19h-22h)', label: 'Ruído (19h-22h)', unit: 'dB', defaultMax: 85 },
  { id: 'Ruído (22h-7h)', label: 'Ruído (22h-7h)', unit: 'dB', defaultMax: 85 },
  { id: 'Vibração Associada', label: 'Vibração', unit: '', defaultMax: 1 },
  { id: 'Emissão de Radiação', label: 'Radiação', unit: '', defaultMax: 1 },
  { id: 'Emissão de Odores', label: 'Odores', unit: '', defaultMax: 1 },
  { id: 'Emissão de Gases e Vapores', label: 'Gases e Vapores', unit: '', defaultMax: 1 },
];

export function UrbanParamsFilter({
  filters,
  options = {},
  availableParams = DEFAULT_URBAN_PARAMS,
  disabledParams = [],
  updateFilter,
  removeFilter,
}: UrbanParamsFilterProps) {

  const isFilterActive = (id: string) => Object.keys(filters).includes(id) || disabledParams.includes(id);

  const handleAddFilter = (param: FilterParamConfig) => {
    updateFilter(param.id, {
      type: 'between',
      min: 0,
      max: param.defaultMax,
      value: 0
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-4">
        {Object.keys(filters).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 pt-4 pb-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-slate-900/20">
            <p className="text-xs font-semibold  ">Nenhum parâmetro ativo</p>
            <p className="text-[10px]  mt-1 max-w-[200px] leading-relaxed font-normal">Adicione filtros técnicos para refinar sua busca.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {Object.keys(filters).map(key => {
              const paramConfig = availableParams.find(p => p.id === key);
              if (!paramConfig) return null;

              return (
                <PriceRangeSlider
                  key={key}
                  label={paramConfig.label}
                  unit={paramConfig.unit}
                  min={0}
                  max={paramConfig.defaultMax * 1.5}
                  step={paramConfig.step || 1}
                  options={options?.[key]}
                  value={filters[key]}
                  onChange={(newValue) => updateFilter(key, newValue)}
                  onRemove={removeFilter ? () => removeFilter(key) : undefined}
                />
              );
            })}
          </div>
        )}

        <Select value="" onValueChange={(id) => {
          const param = availableParams.find(p => p.id === id);
          if (param) handleAddFilter(param);
        }}>
          <SelectTrigger className="w-full border border-slate-200 dark:border-slate-800  hover:text-primary h-10 rounded-full text-[11px] font-semibold transition-all shadow-none flex items-center justify-center gap-2 px-6">
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar critério</span>
          </SelectTrigger>
          <SelectContent className="rounded-xl w-[280px]">
            <SelectGroup>
              <SelectLabel className="text-[10px] font-semibold  py-2 px-3">Seleção de parâmetros</SelectLabel>
              <SelectSeparator />
              {availableParams.map(param => {
                const isActive = Object.keys(filters).includes(param.id);
                const isDisabledByArea = disabledParams.includes(param.id);
                const isItemDisabled = isActive || isDisabledByArea;

                return (
                  <SelectItem
                    key={param.id}
                    value={param.id}
                    disabled={isItemDisabled}
                    title={isDisabledByArea ? "Desativado devido ao parâmetro de área do imóvel" : undefined}
                    className={`text-xs font-normal pr-8 ${isDisabledByArea ? 'pointer-events-auto cursor-not-allowed opacity-50' : ''}`}
                  >
                    <span className="block pr-2">
                      {param.label}
                      {isDisabledByArea && (
                        <span className="ml-2 text-[9px] text-rose-500/80 font-semibold">(não aplicável pela área)</span>
                      )}
                    </span>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            type="button"
                            onClick={(e) => e.stopPropagation()} 
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none p-1"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent 
                          className="max-w-[250px] p-3 space-y-2 bg-background border-border shadow-lg z-[1000]" 
                          side="right"
                          sideOffset={10}
                        >
                          <p className="text-xs text-foreground font-normal leading-relaxed">
                            Saiba mais sobre {param.label} e como este critério afeta a viabilidade do lote.
                          </p>
                          <a 
                            href="https://legis.urbis.sampa.br/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] font-medium text-primary hover:underline block mt-1"
                          >
                            Abrir mais ajuda
                          </a>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
