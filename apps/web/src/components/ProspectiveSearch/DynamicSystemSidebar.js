import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useProspectiveSearchContext } from "./ProspectiveSearchContext";
import { UseSearchFilter } from "./ui/UseSearchFilter";
import { UrbanParamsFilter, DEFAULT_URBAN_PARAMS, } from "./ui/UrbanParamsFilter";
import { ScrollArea, Label, Input, Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@open-urbis/map-ui";
import { Info, ArrowLeft, Loader2 } from "lucide-react";
import { InfoModal } from "./ui/InfoModal";
const PQA_PARAMS = [
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
        label: "Pontuação mínima de Quota Ambiental para lote maior que 500 m² e até 1.000 m²",
        unit: "",
        defaultMax: 2,
        step: 0.1,
    },
    {
        id: "Pontuação QA Mínimo Lote > 1000 ≤ 2500",
        label: "Pontuação mínima de Quota Ambiental para lote maior que 1.000 m² e até 2.500 m²",
        unit: "",
        defaultMax: 2,
        step: 0.1,
    },
    {
        id: "Pontuação QA Mínimo Lote > 2500 ≤ 5000",
        label: "Pontuação mínima de Quota Ambiental para lote maior que 2.500 m² e até 5.000 m²",
        unit: "",
        defaultMax: 2,
        step: 0.1,
    },
    {
        id: "Pontuação QA Mínimo Lote > 5000 ≤ 10000",
        label: "Pontuação mínima de Quota Ambiental para lote maior que 5.000 m² e até 10.000 m²",
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
        label: "Incentivo para lote maior que 500 m² e até 1.000 m² — QA mínima ≥ 1,5x e < 2x",
        unit: "R$",
        defaultMax: 100,
    },
    {
        id: "Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 2x e < 3x Qamin)",
        label: "Incentivo para lote maior que 500 m² e até 1.000 m² — QA mínima ≥ 2x e < 3x",
        unit: "R$",
        defaultMax: 100,
    },
    {
        id: "Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 3x e < 4x Qamin)",
        label: "Incentivo para lote maior que 500 m² e até 1.000 m² — QA mínima ≥ 3x e < 4x",
        unit: "R$",
        defaultMax: 100,
    },
    {
        id: "Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 4x Qamin)",
        label: "Incentivo para lote maior que 500 m² e até 1.000 m² — QA mínima ≥ 4x",
        unit: "R$",
        defaultMax: 100,
    },
    {
        id: "Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 1.5x e < 2x Qamin)",
        label: "Incentivo para lote maior que 1.000 m² e até 2.500 m² — QA mínima ≥ 1,5x e < 2x",
        unit: "R$",
        defaultMax: 100,
    },
    {
        id: "Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 2x e < 3x Qamin)",
        label: "Incentivo para lote maior que 1.000 m² e até 2.500 m² — QA mínima ≥ 2x e < 3x",
        unit: "R$",
        defaultMax: 100,
    },
    {
        id: "Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 3x e < 4x Qamin)",
        label: "Incentivo para lote maior que 1.000 m² e até 2.500 m² — QA mínima ≥ 3x e < 4x",
        unit: "R$",
        defaultMax: 100,
    },
    {
        id: "Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 4x Qamin)",
        label: "Incentivo para lote maior que 1.000 m² e até 2.500 m² — QA mínima ≥ 4x",
        unit: "R$",
        defaultMax: 100,
    },
    {
        id: "Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 1.5x e < 2x Qamin)",
        label: "Incentivo para lote maior que 2.500 m² e até 5.000 m² — QA mínima ≥ 1,5x e < 2x",
        unit: "R$",
        defaultMax: 100,
    },
    {
        id: "Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 2x e < 3x Qamin)",
        label: "Incentivo para lote maior que 2.500 m² e até 5.000 m² — QA mínima ≥ 2x e < 3x",
        unit: "R$",
        defaultMax: 100,
    },
    {
        id: "Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 3x e < 4x Qamin)",
        label: "Incentivo para lote maior que 2.500 m² e até 5.000 m² — QA mínima ≥ 3x e < 4x",
        unit: "R$",
        defaultMax: 100,
    },
    {
        id: "Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 4x Qamin)",
        label: "Incentivo para lote maior que 2.500 m² e até 5.000 m² — QA mínima ≥ 4x",
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
export function DynamicSystemSidebar({ onBack }) {
    const state = useProspectiveSearchContext();
    const AREA_MAX_DEFAULT = 1000000000;
    const [infoModalType, setInfoModalType] = useState(null);
    const [isMapLoading, setIsMapLoading] = useState(false);
    useEffect(() => {
        setIsMapLoading(true);
        const timer = setTimeout(() => {
            setIsMapLoading(false);
        }, 5000); // 5 seconds
        return () => clearTimeout(timer);
    }, [state.selectedUse, state.areaImovel, state.urbanParams, state.pqaParams]);
    const isOnlyAreaImovel = state.areaImovel !== null &&
        !state.selectedUse &&
        Object.keys(state.urbanParams).length === 0 &&
        Object.keys(state.pqaParams).length === 0;
    const _isSidebarEmpty = !state.selectedUse &&
        Object.keys(state.urbanParams).length === 0 &&
        Object.keys(state.pqaParams).length === 0 &&
        state.areaImovel === null;
    const isSearching = state.useSearchTerm.trim().length > 0 && !state.selectedUse;
    const isAreaRangeInvalid = state.areaImovel !== null && state.areaImovel[0] > state.areaImovel[1];
    return (_jsxs("div", { className: "w-full md:min-w-[400px] md:max-w-[400px] border-r border-border bg-background flex flex-col h-full z-20", children: [onBack && (_jsxs("div", { className: "flex items-center gap-2 px-4 py-3 shrink-0 border-b border-border bg-background", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: onBack, className: "h-8 w-8 rounded-full", children: _jsx(ArrowLeft, { className: "h-4 w-4" }) }), _jsx("h2", { className: "text-base font-semibold text-foreground flex-1", children: "Pesquisa Prospectiva" }), _jsx(TooltipProvider, { delayDuration: 100, children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border cursor-help select-none shrink-0", children: isMapLoading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-3 h-3 animate-spin text-primary" }), _jsx("span", { className: "text-[10px] font-medium text-slate-500", children: "Atualizando mapa..." })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" }), _jsx("span", { className: "text-[10px] font-medium text-slate-500", children: "Mapa atualizado" })] })) }) }), _jsx(TooltipContent, { className: "max-w-[260px] p-2.5 bg-background border border-border shadow-md text-[11px] font-medium leading-relaxed text-foreground rounded-lg z-[10000]", side: "bottom", align: "end", sideOffset: 5, children: "As camadas no mapa s\u00E3o atualizadas em tempo real com base nos seus filtros. Pode haver uma breve demora para carregar as imagens na direita." })] }) })] })), _jsxs(ScrollArea, { className: "flex-1 w-full", children: [!isSearching && !state.selectedUse && (_jsx("div", { className: "px-4 pt-4 pb-2 shrink-0", children: _jsx("p", { className: "text-[11px] leading-snug font-normal text-slate-500 dark:text-slate-400", children: "\u00C9 poss\u00EDvel prospectar locais por par\u00E2metros urban\u00EDsticos, como uso, outros (ex.: gabarito de altura m\u00E1xima, taxa de permeabilidade), ou imobili\u00E1rios, como \u00E1rea do im\u00F3vel." }) })), _jsxs("div", { className: "px-4 py-3 md:py-4 flex flex-col gap-4", children: [_jsxs("section", { className: "space-y-4", children: [!isSearching && (_jsxs("div", { className: "flex items-center gap-1.5 pb-1", children: [_jsx("h2", { className: "text-xs font-semibold text-foreground uppercase", children: "Par\u00E2metros urban\u00EDsticos :" }), _jsx("button", { onClick: () => setInfoModalType("parametros"), className: "text-muted-foreground hover:text-primary transition-colors focus:outline-none", title: "Informa\u00E7\u00F5es sobre Par\u00E2metros Urban\u00EDsticos", children: _jsx(Info, { className: "w-3.5 h-3.5" }) })] })), _jsxs("div", { className: "space-y-3", children: [!isSearching && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "flex items-center gap-1.5", children: _jsx("h3", { className: "text-sm font-medium text-slate-900 dark:text-slate-100", children: "Uso" }) }), state.selectedUse && (_jsx("button", { onClick: state.clearUseSearch, className: "text-[10px] font-semibold text-primary hover:underline focus:outline-none", children: "Limpar uso" }))] })), !isSearching && !state.selectedUse && (_jsxs("p", { className: "text-[11px] leading-relaxed text-slate-500 dark:text-slate-400", children: ["Selecione um uso diretamente", " ", _jsx("button", { type: "button", onClick: () => setInfoModalType("uso"), className: "inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors p-0.5 focus:outline-none align-middle", title: "Informa\u00E7\u00F5es sobre Uso", children: _jsx(Info, { className: "w-3.5 h-3.5" }) }), " ", "ou atrav\u00E9s do n\u00BA da classifica\u00E7\u00E3o nacional de atividades econ\u00F4micas - CNAE", " ", _jsx("button", { type: "button", onClick: () => setInfoModalType("cnae"), className: "inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors p-0.5 focus:outline-none align-middle", title: "Informa\u00E7\u00F5es sobre CNAE", children: _jsx(Info, { className: "w-3.5 h-3.5" }) }), " ", "ou cadastro nacional de pessoas jur\u00EDdicas - CNPJ", " ", _jsx("button", { type: "button", onClick: () => setInfoModalType("cnpj"), className: "inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors p-0.5 focus:outline-none align-middle", title: "Informa\u00E7\u00F5es sobre CNPJ", children: _jsx(Info, { className: "w-3.5 h-3.5" }) })] })), _jsx(UseSearchFilter, { useSearchTerm: state.useSearchTerm, setUseSearchTerm: state.setUseSearchTerm, searchMode: state.searchMode, setSearchMode: state.setSearchMode, searchResults: state.useSearchResults, selectedUse: state.selectedUse, onSelectUse: state.setSelectedUse, clearSelection: state.clearUseSearch, usosData: state.usosData, cnaeData: state.cnaeData, cnaeCatalogData: state.cnaeCatalogData, onOpenInfo: setInfoModalType })] }), !isSearching && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-xs font-semibold text-slate-405 uppercase tracking-tight", children: "Outros:" }), (Object.keys(state.urbanParams).length > 0 ||
                                                        Object.keys(state.pqaParams).length > 0) && (_jsx("button", { onClick: () => {
                                                            state.clearUrbanParams();
                                                            state.clearPqaParams();
                                                        }, className: "text-[10px] font-semibold text-primary hover:underline focus:outline-none", children: "Limpar outros" }))] }), _jsx(UrbanParamsFilter, { filters: { ...state.urbanParams, ...state.pqaParams }, options: { ...state.availableOptions, ...state.pqaOptions }, disabledParams: [
                                                    ...state.disabledUrbanParams,
                                                    ...state.disabledPqaParams,
                                                ], availableParams: [...DEFAULT_URBAN_PARAMS, ...PQA_PARAMS], updateFilter: (paramId, value) => {
                                                    const isPqa = PQA_PARAMS.some((p) => p.id === paramId);
                                                    if (isPqa) {
                                                        state.updatePqaParam(paramId, value);
                                                    }
                                                    else {
                                                        state.updateUrbanParam(paramId, value);
                                                    }
                                                }, removeFilter: (paramId) => {
                                                    const isPqa = PQA_PARAMS.some((p) => p.id === paramId);
                                                    if (isPqa) {
                                                        state.removePqaParam(paramId);
                                                    }
                                                    else {
                                                        state.removeUrbanParam(paramId);
                                                    }
                                                }, clearFilters: () => {
                                                    state.clearUrbanParams();
                                                    state.clearPqaParams();
                                                }, resultsCount: state.urbanParamsResults.length +
                                                    state.urbanParamsPqaResults.length })] }))] }), !isSearching && (_jsxs("section", { className: "space-y-4 pt-2 border-t border-border/40", children: [_jsxs("div", { className: "flex items-center gap-1.5 pb-1", children: [_jsx("h2", { className: "text-xs font-semibold text-foreground uppercase", children: "Par\u00E2metros imobili\u00E1rios :" }), _jsx("button", { onClick: () => setInfoModalType("area"), className: "text-muted-foreground hover:text-primary transition-colors focus:outline-none", title: "Informa\u00E7\u00F5es sobre Par\u00E2metros Imobili\u00E1rios", children: _jsx(Info, { className: "w-3.5 h-3.5" }) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("h3", { className: "text-sm font-medium text-slate-900 dark:text-slate-100", children: "\u00C1rea do im\u00F3vel" }), _jsx(TooltipProvider, { delayDuration: 150, children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", className: "text-muted-foreground hover:text-primary transition-colors focus:outline-none p-0.5", title: "Visualiza\u00E7\u00E3o dos lotes no mapa dispon\u00EDvel a partir do zoom 14.", children: _jsx(Info, { className: "w-3.5 h-3.5" }) }) }), _jsx(TooltipContent, { className: "max-w-[250px] p-2.5 bg-background border border-border shadow-md text-[11px] font-medium leading-relaxed text-foreground rounded-lg", side: "top", sideOffset: 5, children: "Visualiza\u00E7\u00E3o dos lotes no mapa dispon\u00EDvel a partir do zoom 14." })] }) })] }), state.areaImovel !== null && (_jsx("button", { onClick: () => state.updateAreaImovel(null), className: "text-[10px] font-semibold text-primary hover:underline focus:outline-none", children: "Limpar \u00E1rea" }))] }), _jsxs("div", { className: "space-y-3 mt-1.5", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex flex-col gap-1.5 flex-1", children: [_jsx(Label, { className: "text-[9px] font-semibold text-slate-500", children: "M\u00EDnimo" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { type: "number", min: 0, className: "h-8 pr-6 text-xs font-medium rounded-lg border-border focus:ring-1 placeholder:font-normal placeholder:text-muted-foreground/45", value: state.areaImovel ? state.areaImovel[0] : "", placeholder: "0", onChange: (e) => {
                                                                                    const val = parseInt(e.target.value, 10);
                                                                                    const newMin = Math.max(0, isNaN(val) ? 0 : val);
                                                                                    const currentMax = state.areaImovel
                                                                                        ? state.areaImovel[1]
                                                                                        : AREA_MAX_DEFAULT;
                                                                                    if (e.target.value === "" &&
                                                                                        (!state.areaImovel ||
                                                                                            state.areaImovel[1] === AREA_MAX_DEFAULT)) {
                                                                                        state.updateAreaImovel(null);
                                                                                    }
                                                                                    else {
                                                                                        state.updateAreaImovel([newMin, currentMax]);
                                                                                    }
                                                                                } }), _jsx("span", { className: "absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-medium text-slate-400", children: "m\u00B2" })] })] }), _jsxs("div", { className: "flex flex-col gap-1.5 flex-1", children: [_jsx(Label, { className: "text-[9px] font-semibold text-slate-500", children: "M\u00E1ximo" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { type: "number", min: 0, className: "h-8 pr-6 text-xs font-medium rounded-lg border-border focus:ring-1 placeholder:font-normal placeholder:text-muted-foreground/45", value: state.areaImovel &&
                                                                                    state.areaImovel[1] !== AREA_MAX_DEFAULT
                                                                                    ? state.areaImovel[1]
                                                                                    : "", placeholder: "Sem limite", onChange: (e) => {
                                                                                    const val = parseInt(e.target.value, 10);
                                                                                    const newMax = Math.max(0, isNaN(val) ? AREA_MAX_DEFAULT : val);
                                                                                    const currentMin = state.areaImovel
                                                                                        ? state.areaImovel[0]
                                                                                        : 0;
                                                                                    if (e.target.value === "" &&
                                                                                        (!state.areaImovel || state.areaImovel[0] === 0)) {
                                                                                        state.updateAreaImovel(null);
                                                                                    }
                                                                                    else {
                                                                                        state.updateAreaImovel([currentMin, newMax]);
                                                                                    }
                                                                                } }), _jsx("span", { className: "absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-medium text-slate-400", children: "m\u00B2" })] })] })] }), isOnlyAreaImovel && (_jsx("div", { className: "mt-3 p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-lg text-[10px] text-rose-500 leading-normal text-center font-normal animate-in fade-in duration-300", children: "N\u00E3o \u00E9 permitida a prospec\u00E7\u00E3o exclusivamente com base em dados imobili\u00E1rios. Selecione um Uso ou outros par\u00E2metros t\u00E9cnicos para ativar a an\u00E1lise." })), isAreaRangeInvalid && (_jsx("div", { className: "mt-3 p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-lg text-[10px] text-rose-500 leading-normal text-center font-normal animate-in fade-in duration-300", children: "O valor m\u00EDnimo n\u00E3o pode ser maior que o valor m\u00E1ximo." }))] })] })] }))] })] }), _jsx(InfoModal, { isOpen: infoModalType !== null, onClose: () => setInfoModalType(null), type: infoModalType })] }));
}
