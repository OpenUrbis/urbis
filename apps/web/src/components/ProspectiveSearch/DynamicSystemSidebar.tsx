import React, { useState, useEffect } from "react";
import { useProspectiveSearchContext } from "./ProspectiveSearchContext";
import { UseSearchFilter } from "./ui/UseSearchFilter";
import {
  UrbanParamsFilter,
  FilterParamConfig,
  DEFAULT_URBAN_PARAMS,
} from "./ui/UrbanParamsFilter";
import {
  ScrollArea,
  Label,
  Input,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@open-urbis/map-ui";
import { Info, ArrowLeft, Loader2 } from "lucide-react";
import { InfoModal } from "./ui/InfoModal";

const PQA_PARAMS: FilterParamConfig[] = [
  {
    id: "Taxa de Permeabilidade Lote ≤ 500",
    label: "Taxa de permeabilidade para lote até 500 m²",
    unit: "",
    defaultMax: 1,
    step: 0.05,
  },
  {
    id: "Taxa de Permeabilidade Lote > 500",
    label: "Taxa de permeabilidade para lote maior que 500 m²",
    unit: "",
    defaultMax: 1,
    step: 0.05,
  },
  {
    id: "Pontuação QA Mínimo Lote > 500 ≤ 1000",
    label:
      "Pontuação mínima de Quota Ambiental para lote maior que 500 m² e até 1.000 m²",
    unit: "",
    defaultMax: 2,
    step: 0.1,
  },
  {
    id: "Pontuação QA Mínimo Lote > 1000 ≤ 2500",
    label:
      "Pontuação mínima de Quota Ambiental para lote maior que 1.000 m² e até 2.500 m²",
    unit: "",
    defaultMax: 2,
    step: 0.1,
  },
  {
    id: "Pontuação QA Mínimo Lote > 2500 ≤ 5000",
    label:
      "Pontuação mínima de Quota Ambiental para lote maior que 2.500 m² e até 5.000 m²",
    unit: "",
    defaultMax: 2,
    step: 0.1,
  },
  {
    id: "Pontuação QA Mínimo Lote > 5000 ≤ 10000",
    label:
      "Pontuação mínima de Quota Ambiental para lote maior que 5.000 m² e até 10.000 m²",
    unit: "",
    defaultMax: 2,
    step: 0.1,
  },
  {
    id: "Pontuação QA Mínimo Lote > 10000",
    label: "Pontuação mínima de Quota Ambiental para lote maior que 10.000 m²",
    unit: "",
    defaultMax: 2,
    step: 0.1,
  },
  {
    id: "Fatores Cobertura Vegetal Alfa",
    label: "Fator de cobertura vegetal (alfa)",
    unit: "",
    defaultMax: 1,
    step: 0.1,
  },
  {
    id: "Fatores de Drenagem Beta",
    label: "Fator de drenagem (beta)",
    unit: "",
    defaultMax: 1,
    step: 0.1,
  },
  {
    id: "Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 1.5x e < 2x Qamin)",
    label:
      "Incentivo para lote maior que 500 m² e até 1.000 m² — QA mínima ≥ 1,5x e < 2x",
    unit: "R$",
    defaultMax: 100,
  },
  {
    id: "Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 2x e < 3x Qamin)",
    label:
      "Incentivo para lote maior que 500 m² e até 1.000 m² — QA mínima ≥ 2x e < 3x",
    unit: "R$",
    defaultMax: 100,
  },
  {
    id: "Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 3x e < 4x Qamin)",
    label:
      "Incentivo para lote maior que 500 m² e até 1.000 m² — QA mínima ≥ 3x e < 4x",
    unit: "R$",
    defaultMax: 100,
  },
  {
    id: "Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 4x Qamin)",
    label:
      "Incentivo para lote maior que 500 m² e até 1.000 m² — QA mínima ≥ 4x",
    unit: "R$",
    defaultMax: 100,
  },
  {
    id: "Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 1.5x e < 2x Qamin)",
    label:
      "Incentivo para lote maior que 1.000 m² e até 2.500 m² — QA mínima ≥ 1,5x e < 2x",
    unit: "R$",
    defaultMax: 100,
  },
  {
    id: "Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 2x e < 3x Qamin)",
    label:
      "Incentivo para lote maior que 1.000 m² e até 2.500 m² — QA mínima ≥ 2x e < 3x",
    unit: "R$",
    defaultMax: 100,
  },
  {
    id: "Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 3x e < 4x Qamin)",
    label:
      "Incentivo para lote maior que 1.000 m² e até 2.500 m² — QA mínima ≥ 3x e < 4x",
    unit: "R$",
    defaultMax: 100,
  },
  {
    id: "Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 4x Qamin)",
    label:
      "Incentivo para lote maior que 1.000 m² e até 2.500 m² — QA mínima ≥ 4x",
    unit: "R$",
    defaultMax: 100,
  },
  {
    id: "Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 1.5x e < 2x Qamin)",
    label:
      "Incentivo para lote maior que 2.500 m² e até 5.000 m² — QA mínima ≥ 1,5x e < 2x",
    unit: "R$",
    defaultMax: 100,
  },
  {
    id: "Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 2x e < 3x Qamin)",
    label:
      "Incentivo para lote maior que 2.500 m² e até 5.000 m² — QA mínima ≥ 2x e < 3x",
    unit: "R$",
    defaultMax: 100,
  },
  {
    id: "Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 3x e < 4x Qamin)",
    label:
      "Incentivo para lote maior que 2.500 m² e até 5.000 m² — QA mínima ≥ 3x e < 4x",
    unit: "R$",
    defaultMax: 100,
  },
  {
    id: "Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 4x Qamin)",
    label:
      "Incentivo para lote maior que 2.500 m² e até 5.000 m² — QA mínima ≥ 4x",
    unit: "R$",
    defaultMax: 100,
  },
  {
    id: "Fator Incentivo Quota Ambiental (Lote > 5000, Pontuação ≥ 1.5x e < 2x Qamin)",
    label: "Incentivo para lote maior que 5.000 m² — QA mínima ≥ 1,5x e < 2x",
    unit: "R$",
    defaultMax: 100,
  },
  {
    id: "Fator Incentivo Quota Ambiental (Lote > 5000, Pontuação ≥ 2x e < 3x Qamin)",
    label: "Incentivo para lote maior que 5.000 m² — QA mínima ≥ 2x e < 3x",
    unit: "R$",
    defaultMax: 100,
  },
  {
    id: "Fator Incentivo Quota Ambiental (Lote > 5000, Pontuação ≥ 3x e < 4x Qamin)",
    label: "Incentivo para lote maior que 5.000 m² — QA mínima ≥ 3x e < 4x",
    unit: "R$",
    defaultMax: 100,
  },
  {
    id: "Fator Incentivo Quota Ambiental (Lote > 5000, Pontuação ≥ 4x Qamin)",
    label: "Incentivo para lote maior que 5.000 m² — QA mínima ≥ 4x",
    unit: "R$",
    defaultMax: 100,
  },
];

interface DynamicSystemSidebarProps {
  onBack?: () => void;
}

export function DynamicSystemSidebar({ onBack }: DynamicSystemSidebarProps) {
  const state = useProspectiveSearchContext();
  const AREA_MAX_DEFAULT = 1_000_000_000;
  const [infoModalType, setInfoModalType] = useState<
    "uso" | "cnae" | "cnpj" | "parametros" | "area" | "ver-prospeccao" | null
  >(null);

  const [isMapLoading, setIsMapLoading] = useState(false);

  useEffect(() => {
    setIsMapLoading(true);
    const timer = setTimeout(() => {
      setIsMapLoading(false);
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, [state.selectedUse, state.areaImovel, state.urbanParams, state.pqaParams]);

  const isOnlyAreaImovel =
    state.areaImovel !== null &&
    !state.selectedUse &&
    Object.keys(state.urbanParams).length === 0 &&
    Object.keys(state.pqaParams).length === 0;

  const _isSidebarEmpty =
    !state.selectedUse &&
    Object.keys(state.urbanParams).length === 0 &&
    Object.keys(state.pqaParams).length === 0 &&
    state.areaImovel === null;

  const isSearching =
    state.useSearchTerm.trim().length > 0 && !state.selectedUse;

  const isAreaRangeInvalid =
    state.areaImovel !== null && state.areaImovel[0] > state.areaImovel[1];

  return (
    <div className="w-full md:min-w-[400px] md:max-w-[400px] border-r border-border bg-background flex flex-col h-full z-20">
      {onBack && (
        <div className="flex items-center gap-2 px-4 py-3 shrink-0 border-b border-border bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold text-foreground flex-1">
            Pesquisa Prospectiva
          </h2>

          {/* Map sync indicator */}
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border cursor-help select-none shrink-0">
                  {isMapLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                      <span className="text-[10px] font-medium text-slate-500">
                        Atualizando mapa...
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-medium text-slate-500">
                        Mapa atualizado
                      </span>
                    </>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent
                className="max-w-[260px] p-2.5 bg-background border border-border shadow-md text-[11px] font-medium leading-relaxed text-foreground rounded-lg z-[10000]"
                side="bottom"
                align="end"
                sideOffset={5}
              >
                As camadas no mapa são atualizadas em tempo real com base nos
                seus filtros. Pode haver uma breve demora para carregar as
                imagens na direita.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <ScrollArea className="flex-1 w-full">
        {/* Intro description */}
        {!isSearching && !state.selectedUse && (
          <div className="px-4 pt-4 pb-2 shrink-0">
            <p className="text-[11px] leading-snug font-normal text-slate-500 dark:text-slate-400">
              É possível prospectar locais por parâmetros urbanísticos, como
              uso, outros (ex.: gabarito de altura máxima, taxa de
              permeabilidade), ou imobiliários, como área do imóvel.
            </p>
          </div>
        )}

        <div className="px-4 py-3 md:py-4 flex flex-col gap-4">
          {/* BLOCK 1: Parâmetros Urbanísticos */}
          <section className="space-y-4">
            {!isSearching && (
              <div className="flex items-center gap-1.5 pb-1">
                <h2 className="text-xs font-semibold text-foreground uppercase">
                  Parâmetros urbanísticos:
                </h2>
                <button
                  onClick={() => setInfoModalType("parametros")}
                  className="text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                  title="Informações sobre Parâmetros Urbanísticos"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Sub-item: Uso */}
            <div className="space-y-3">
              {!isSearching && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Uso
                    </h3>
                  </div>
                  {state.selectedUse && (
                    <button
                      onClick={state.clearUseSearch}
                      className="text-[10px] font-semibold text-primary hover:underline focus:outline-none"
                    >
                      Limpar uso
                    </button>
                  )}
                </div>
              )}

              {!isSearching && !state.selectedUse && (
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Selecione um uso diretamente{" "}
                  <button
                    type="button"
                    onClick={() => setInfoModalType("uso")}
                    className="inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors p-0.5 focus:outline-none align-middle"
                    title="Informações sobre Uso"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>{" "}
                  ou através do nº da classificação nacional de atividades
                  econômicas - CNAE{" "}
                  <button
                    type="button"
                    onClick={() => setInfoModalType("cnae")}
                    className="inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors p-0.5 focus:outline-none align-middle"
                    title="Informações sobre CNAE"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>{" "}
                  ou cadastro nacional de pessoas jurídicas - CNPJ{" "}
                  <button
                    type="button"
                    onClick={() => setInfoModalType("cnpj")}
                    className="inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors p-0.5 focus:outline-none align-middle"
                    title="Informações sobre CNPJ"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </p>
              )}

              <UseSearchFilter
                useSearchTerm={state.useSearchTerm}
                setUseSearchTerm={state.setUseSearchTerm}
                searchMode={state.searchMode}
                setSearchMode={state.setSearchMode}
                searchResults={state.useSearchResults}
                selectedUse={state.selectedUse}
                onSelectUse={state.setSelectedUse}
                clearSelection={state.clearUseSearch}
                usosData={state.usosData}
                cnaeData={state.cnaeData}
                cnaeCatalogData={state.cnaeCatalogData}
                onOpenInfo={setInfoModalType}
              />
            </div>

            {/* Sub-item: Outros parâmetros urbanísticos */}
            {!isSearching && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-405 uppercase tracking-tight">
                    Outros
                  </h3>
                  {(Object.keys(state.urbanParams).length > 0 ||
                    Object.keys(state.pqaParams).length > 0) && (
                    <button
                      onClick={() => {
                        state.clearUrbanParams();
                        state.clearPqaParams();
                      }}
                      className="text-[10px] font-semibold text-primary hover:underline focus:outline-none"
                    >
                      Limpar outros
                    </button>
                  )}
                </div>

                <UrbanParamsFilter
                  filters={{ ...state.urbanParams, ...state.pqaParams }}
                  options={{ ...state.availableOptions, ...state.pqaOptions }}
                  disabledParams={[
                    ...state.disabledUrbanParams,
                    ...state.disabledPqaParams,
                  ]}
                  availableParams={[...DEFAULT_URBAN_PARAMS, ...PQA_PARAMS]}
                  updateFilter={(paramId, value) => {
                    const isPqa = PQA_PARAMS.some((p) => p.id === paramId);
                    if (isPqa) {
                      state.updatePqaParam(paramId, value);
                    } else {
                      state.updateUrbanParam(paramId, value);
                    }
                  }}
                  removeFilter={(paramId) => {
                    const isPqa = PQA_PARAMS.some((p) => p.id === paramId);
                    if (isPqa) {
                      state.removePqaParam(paramId);
                    } else {
                      state.removeUrbanParam(paramId);
                    }
                  }}
                  clearFilters={() => {
                    state.clearUrbanParams();
                    state.clearPqaParams();
                  }}
                  resultsCount={
                    state.urbanParamsResults.length +
                    state.urbanParamsPqaResults.length
                  }
                />
              </div>
            )}
          </section>

          {/* BLOCK 2: Parâmetros Imobiliários */}
          {!isSearching && (
            <section className="space-y-4 pt-2 border-t border-border/40">
              <div className="flex items-center gap-1.5 pb-1">
                <h2 className="text-xs font-semibold text-foreground uppercase">
                  Parâmetros imobiliários:
                </h2>
                <button
                  onClick={() => setInfoModalType("area")}
                  className="text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                  title="Informações sobre Parâmetros Imobiliários"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sub-item: Área do Imóvel */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Área do imóvel
                    </h3>
                    <TooltipProvider delayDuration={150}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-primary transition-colors focus:outline-none p-0.5"
                            title="Visualização dos lotes no mapa disponível a partir do zoom 14."
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          className="max-w-[250px] p-2.5 bg-background border border-border shadow-md text-[11px] font-medium leading-relaxed text-foreground rounded-lg"
                          side="top"
                          sideOffset={5}
                        >
                          Visualização dos lotes no mapa disponível a partir do
                          zoom 14.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {state.areaImovel !== null && (
                    <button
                      onClick={() => state.updateAreaImovel(null)}
                      className="text-[10px] font-semibold text-primary hover:underline focus:outline-none"
                    >
                      Limpar área
                    </button>
                  )}
                </div>

                <div className="space-y-3 mt-1.5">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <Label className="text-[9px] font-semibold text-slate-500">
                        Mínimo
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          className="h-8 pr-6 text-xs font-medium rounded-lg border-border focus:ring-1 placeholder:font-normal placeholder:text-muted-foreground/45"
                          value={state.areaImovel ? state.areaImovel[0] : ""}
                          placeholder="0"
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            const newMin = Math.max(0, isNaN(val) ? 0 : val);
                            const currentMax = state.areaImovel
                              ? state.areaImovel[1]
                              : AREA_MAX_DEFAULT;
                            if (
                              e.target.value === "" &&
                              (!state.areaImovel ||
                                state.areaImovel[1] === AREA_MAX_DEFAULT)
                            ) {
                              state.updateAreaImovel(null);
                            } else {
                              state.updateAreaImovel([newMin, currentMax]);
                            }
                          }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-medium text-slate-400">
                          m²
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      <Label className="text-[9px] font-semibold text-slate-500">
                        Máximo
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          className="h-8 pr-6 text-xs font-medium rounded-lg border-border focus:ring-1 placeholder:font-normal placeholder:text-muted-foreground/45"
                          value={
                            state.areaImovel &&
                            state.areaImovel[1] !== AREA_MAX_DEFAULT
                              ? state.areaImovel[1]
                              : ""
                          }
                          placeholder="Sem limite"
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            const newMax = Math.max(
                              0,
                              isNaN(val) ? AREA_MAX_DEFAULT : val,
                            );
                            const currentMin = state.areaImovel
                              ? state.areaImovel[0]
                              : 0;
                            if (
                              e.target.value === "" &&
                              (!state.areaImovel || state.areaImovel[0] === 0)
                            ) {
                              state.updateAreaImovel(null);
                            } else {
                              state.updateAreaImovel([currentMin, newMax]);
                            }
                          }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-medium text-slate-400">
                          m²
                        </span>
                      </div>
                    </div>
                  </div>
                  {isOnlyAreaImovel && (
                    <div className="mt-3 p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-lg text-[10px] text-rose-500 leading-normal text-center font-normal animate-in fade-in duration-300">
                      Não é permitida a prospecção exclusivamente com base em
                      dados imobiliários. Selecione um Uso ou outros parâmetros
                      técnicos para ativar a análise.
                    </div>
                  )}
                  {isAreaRangeInvalid && (
                    <div className="mt-3 p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-lg text-[10px] text-rose-500 leading-normal text-center font-normal animate-in fade-in duration-300">
                      O valor mínimo não pode ser maior que o valor máximo.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </ScrollArea>

      <InfoModal
        isOpen={infoModalType !== null}
        onClose={() => setInfoModalType(null)}
        type={infoModalType}
      />
    </div>
  );
}
