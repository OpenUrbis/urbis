import React from "react";
import { UrbanParamsFilters } from "../utils/types";
import { PriceRangeSlider, RangeFilterValue } from "./PriceRangeSlider";
import { Plus, Info } from "lucide-react";
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
} from "@open-urbis/map-ui";

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
  {
    id: "Frente Mínima de Lote (m)",
    label: "Frente mínima do lote",
    unit: "m",
    defaultMax: 50,
  },
  {
    id: "Frente Máxima de Lote (m)",
    label: "Frente máxima do lote",
    unit: "m",
    defaultMax: 200,
  },
  {
    id: "Área Mínima de Lote (m²)",
    label: "Área mínima do lote",
    unit: "m²",
    defaultMax: 20000,
  },
  {
    id: "Área Máxima de Lote (m²)",
    label: "Área máxima do lote",
    unit: "m²",
    defaultMax: 50000,
  },
  {
    id: "Coeficiente de Aproveitamento Mínimo",
    label: "Coeficiente de aproveitamento mínimo",
    unit: "",
    defaultMax: 2,
    step: 0.1,
  },
  {
    id: "Coeficiente de Aproveitamento Básico",
    label: "Coeficiente de aproveitamento básico",
    unit: "",
    defaultMax: 2,
    step: 0.1,
  },
  {
    id: "Coeficiente de Aproveitamento Máximo",
    label: "Coeficiente de aproveitamento máximo",
    unit: "",
    defaultMax: 6,
    step: 0.1,
  },
  {
    id: "Taxa de Ocupação Máxima para Lotes até 500,00 m²",
    label: "TO máx. (lotes<500m²)",
    unit: "",
    defaultMax: 1,
    step: 0.05,
  },
  {
    id: "Taxa de Ocupação Máxima para Lotes igual ou superior a 500,00 m²",
    label: "TO máx. (lotes≥500m²)",
    unit: "",
    defaultMax: 1,
    step: 0.05,
  },
  {
    id: "Gabarito de Altura Máxima (m)",
    label: "Gabarito de altura máx.",
    unit: "m",
    defaultMax: 100,
  },
  {
    id: "Recuo Mínimo de Frente (m)",
    label: "Recuo mín. de frente",
    unit: "m",
    defaultMax: 10,
  },
  {
    id: "Recuo Mínimo de Fundos e Laterais (H ≤ 10m)",
    label: "Recuo mín. de fundos/lat. (≤10m)",
    unit: "m",
    defaultMax: 5,
  },
  {
    id: "Recuo Mínimo de Fundos e Laterais (H > 10m)",
    label: "Recuo mín. de fundos/lat. (>10m)",
    unit: "m",
    defaultMax: 10,
  },
  {
    id: "Cota Parte Máxima de Terreno por Unidade (m²)",
    label: "Cota-parte máxima de terreno por unidade",
    unit: "m²/un",
    defaultMax: 100,
  },
  {
    id: "Ruído (7h-19h)",
    label: "Nível de ruído permitido das 7h às 19h",
    unit: "dB",
    defaultMax: 85,
  },
  {
    id: "Ruído (19h-22h)",
    label: "Nível de ruído permitido das 19h às 22h",
    unit: "dB",
    defaultMax: 85,
  },
  {
    id: "Ruído (22h-7h)",
    label: "Nível de ruído permitido das 22h às 7h",
    unit: "dB",
    defaultMax: 85,
  },
];

export function UrbanParamsFilter({
  filters,
  options = {},
  availableParams = DEFAULT_URBAN_PARAMS,
  disabledParams = [],
  updateFilter,
  removeFilter,
}: UrbanParamsFilterProps) {
  const visibleParams = React.useMemo(() => {
    const filtered = availableParams.filter((param) => {
      const paramOptions = options?.[param.id];
      if (!paramOptions || paramOptions.length === 0) return true;

      const finiteValues = Array.from(
        new Set(paramOptions.filter(Number.isFinite)),
      ).sort((a, b) => a - b);
      return finiteValues.length > 1;
    });
    // Sort alphabetically by label
    return filtered.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [availableParams, options]);

  const handleAddFilter = (param: FilterParamConfig) => {
    const paramOptions = options?.[param.id];
    const finiteOptions = Array.from(
      new Set(paramOptions?.filter(Number.isFinite) ?? []),
    ).sort((a, b) => a - b);
    const hasOptions = finiteOptions.length > 0;
    const minValue = hasOptions ? finiteOptions[0] : 0;
    const maxValue = hasOptions
      ? finiteOptions[finiteOptions.length - 1]
      : param.defaultMax;

    updateFilter(param.id, {
      type: "between",
      min: minValue,
      max: maxValue,
      value: minValue,
      includeNA: false,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-4">
        {Object.keys(filters).length === 0 ? null : (
          <div className="grid gap-3">
            {Object.keys(filters).map((key) => {
              const paramConfig = availableParams.find((p) => p.id === key);
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

        <Select
          value=""
          onValueChange={(id) => {
            const param = availableParams.find((p) => p.id === id);
            if (param) handleAddFilter(param);
          }}
        >
          <SelectTrigger className="w-full border border-slate-200 dark:border-slate-800  hover:text-primary h-10 rounded-full text-[11px] font-semibold transition-all shadow-none flex items-center justify-center gap-2 px-6">
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar um parâmetro</span>
          </SelectTrigger>
          <SelectContent className="rounded-xl w-[360px] max-w-[calc(100vw-2rem)]">
            <SelectGroup>
              <SelectLabel className="text-[10px] font-semibold  py-2 px-3">
                Seleção de parâmetros
              </SelectLabel>
              <SelectSeparator />
              {visibleParams.map((param) => {
                const isActive = Object.keys(filters).includes(param.id);
                const isDisabledByArea = disabledParams.includes(param.id);
                const isItemDisabled = isActive || isDisabledByArea;

                return (
                  <SelectItem
                    key={param.id}
                    value={param.id}
                    disabled={isItemDisabled}
                    title={
                      isDisabledByArea
                        ? "Desativado devido ao parâmetro de área do imóvel"
                        : undefined
                    }
                    className={`min-h-9 whitespace-normal py-2 text-xs font-normal pr-8 ${isDisabledByArea ? "pointer-events-auto cursor-not-allowed opacity-50" : ""}`}
                  >
                    <span className="block pr-2 leading-snug">
                      {param.label}
                      {isDisabledByArea && (
                        <span className="ml-2 text-[9px] text-rose-500/80 font-semibold">
                          (não aplicável pela área)
                        </span>
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
                            Saiba mais sobre {param.label} e como este critério
                            afeta a viabilidade do lote.
                          </p>
                          <a
                            href="https://legis.urbis.prefeitura.sp.gov.br/"
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
