import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from "react";
import { useProspectiveSearch } from "./hooks/useProspectiveSearch";
import { UseSearchFilter } from "./ui/UseSearchFilter";
import { UrbanParamsFilter } from "./ui/UrbanParamsFilter";
import { ResultsTable } from "./ui/ResultsTable";
import { SynthesisModal } from "./ui/SynthesisModal";
import { ModalExplicativo } from "./ui/ModalExplicativo";
import { NotesModal } from "./ui/NotesModal";
import { HeaderWithInfo } from "./ui/HeaderWithInfo";
import { ScrollArea, Label, Input } from "@open-urbis/map-ui";
import { LocalSlider } from "./ui/LocalSlider";
import { Layers, Info, Search, Check } from "lucide-react";
export function SearchContainer({ moduleData }) {
    const state = useProspectiveSearch(moduleData);
    const AREA_MAX_DEFAULT = 1000000000;
    const { regrasZonamento, condicoesInstalacao, compatibleZones, compatiblePqas, allPqaNames, canSynthesize, } = state;
    const [synthesisModalOpen, setSynthesisModalOpen] = React.useState(false);
    const [explicativoOpen, setExplicativoOpen] = React.useState(false);
    const [selectedNoteId, setSelectedNoteId] = React.useState(null);
    React.useEffect(() => {
        if (state.synthesisMode) {
            setSynthesisModalOpen(true);
        }
    }, [state.synthesisMode]);
    if (!state.usosData.length) {
        return null;
    }
    return (_jsxs("div", { className: "flex h-full w-full bg-white overflow-hidden text-foreground", children: [_jsx("div", { className: "w-full min-w-[400px] max-w-[400px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full z-20", children: _jsxs(ScrollArea, { className: "flex-1 w-full", children: [_jsxs("div", { className: "px-4 pt-4 pb-1 shrink-0", children: [_jsx(HeaderWithInfo, { title: "Pesquisa prospectiva", tooltipText: "M\u00F3dulo para cruzar dados de atividades e zoneamento", isMainHeader: true, className: "mb-1" }), _jsx("p", { className: "text-[11px]   leading-snug font-normal", children: "Encontre usos permitidos por CNAE ou descri\u00E7\u00E3o, visualize zonas e notas da LPUOS. Descubra a permissibilidade do seu neg\u00F3cio por cores no mapa." })] }), _jsxs("div", { className: "px-4 py-1 flex flex-col", children: [_jsxs("section", { className: "mt-2 mb-4 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(HeaderWithInfo, { title: "Busca por uso e atividades", tooltipText: "Pesquise por CNAE ou nome da atividade para verificar onde ela \u00E9 permitida na cidade.", link: "https://legis.urbis.prefeitura.sp.gov.br/" }), state.selectedUse && (_jsx("button", { onClick: state.clearUseSearch, className: "text-[10px] font-semibold text-primary hover:underline", children: "Limpar" }))] }), _jsx(UseSearchFilter, { useSearchTerm: state.useSearchTerm, setUseSearchTerm: state.setUseSearchTerm, searchMode: state.searchMode, setSearchMode: state.setSearchMode, searchResults: state.useSearchResults, selectedUse: state.selectedUse, onSelectUse: state.setSelectedUse, clearSelection: state.clearUseSearch, usosData: state.usosData, cnaeData: state.cnaeData, cnaeCatalogData: state.cnaeCatalogData })] }), _jsxs("section", { className: "mt-0 mb-6 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(HeaderWithInfo, { title: "\u00C1rea do im\u00F3vel", tooltipText: "A \u00E1rea total do terreno pode influenciar nas regras de ocupa\u00E7\u00E3o e par\u00E2metros exigidos.", link: "https://legis.urbis.prefeitura.sp.gov.br/" }), state.areaImovel !== null && (_jsx("button", { onClick: () => state.updateAreaImovel(null), className: "text-[10px] font-semibold text-primary hover:underline", children: "Limpar" }))] }), _jsxs("div", { className: "group/slider bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors", children: [_jsx("div", { className: "flex items-start justify-between mb-4", children: _jsxs("div", { className: "flex flex-col gap-0.5", children: [_jsx(Label, { className: "text-[10px] font-bold  ", children: "Faixa de \u00E1rea (m\u00B2)" }), _jsx("div", { className: "text-sm flex items-baseline gap-1 mt-1", children: state.areaImovel ? (_jsxs(_Fragment, { children: [_jsxs("span", { className: "font-bold  whitespace-nowrap", children: [state.areaImovel[0], " ", _jsx("span", { className: "text-[10px]  font-bold", children: "m\u00B2" })] }), _jsx("span", { className: "mx-1 opacity-40", children: "\u2014" }), _jsxs("span", { className: "font-bold  whitespace-nowrap", children: [state.areaImovel[1], " ", _jsx("span", { className: "text-[10px]  font-bold", children: "m\u00B2" })] })] })) : (_jsx("span", { className: "font-bold  text-xs", children: "Qualquer \u00E1rea" })) })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "px-1.5 pt-1", children: _jsx(LocalSlider, { min: 0, max: AREA_MAX_DEFAULT, step: 1, defaultValue: state.areaImovel || [0, AREA_MAX_DEFAULT], onValueCommit: (vals) => state.updateAreaImovel([
                                                                    Math.max(0, vals[0]),
                                                                    vals.length > 1
                                                                        ? Math.max(0, vals[1])
                                                                        : AREA_MAX_DEFAULT,
                                                                ]), className: "py-1" }, state.areaImovel
                                                                ? state.areaImovel.join(",")
                                                                : "default") }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex flex-col gap-1.5 flex-1", children: [_jsx(Label, { className: "text-[9px] font-bold ", children: "M\u00EDnimo" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { type: "number", className: "h-8 pr-6 text-xs font-bold rounded-lg border-slate-100 dark:border-slate-800 focus:ring-1", value: state.areaImovel ? state.areaImovel[0] : "", placeholder: "0", onChange: (e) => {
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
                                                                                            state.updateAreaImovel([
                                                                                                newMin,
                                                                                                Math.max(newMin, currentMax),
                                                                                            ]);
                                                                                        }
                                                                                    } }), _jsx("span", { className: "absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold ", children: "m\u00B2" })] })] }), _jsxs("div", { className: "flex flex-col gap-1.5 flex-1", children: [_jsx(Label, { className: "text-[9px] font-bold ", children: "M\u00E1ximo" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { type: "number", className: "h-8 pr-6 text-xs font-bold rounded-lg border-slate-100 dark:border-slate-800 focus:ring-1", value: state.areaImovel ? state.areaImovel[1] : "", placeholder: "Sem limite", onChange: (e) => {
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
                                                                                            state.updateAreaImovel([
                                                                                                Math.min(currentMin, newMax),
                                                                                                newMax,
                                                                                            ]);
                                                                                        }
                                                                                    } }), _jsx("span", { className: "absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold ", children: "m\u00B2" })] })] })] })] })] })] }), _jsxs("section", { className: "mt-0 mb-4 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(HeaderWithInfo, { title: "Buscar por par\u00E2metro urban\u00EDstico", tooltipText: "Filtre zonas da cidade baseado em crit\u00E9rios como Coeficiente de Aproveitamento, Gabarito, Recuos, etc.", link: "https://legis.urbis.prefeitura.sp.gov.br/" }), Object.keys(state.urbanParams).length > 0 && (_jsx("button", { onClick: state.clearUrbanParams, className: "text-[10px] font-semibold text-primary hover:underline", children: "Limpar" }))] }), _jsx(UrbanParamsFilter, { filters: state.urbanParams, options: state.availableOptions, disabledParams: state.disabledUrbanParams, updateFilter: state.updateUrbanParam, removeFilter: state.removeUrbanParam, clearFilters: state.clearUrbanParams, resultsCount: state.urbanParamsResults.length })] }), _jsxs("section", { className: "mt-0 mb-4 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(HeaderWithInfo, { title: "Buscar por Par\u00E2metros de Qualifica\u00E7\u00E3o Ambiental", tooltipText: "Consulte fatores e par\u00E2metros relacionados \u00E0 Quota Ambiental exigidos para os per\u00EDmetros.", link: "https://legis.urbis.prefeitura.sp.gov.br/" }), Object.keys(state.pqaParams).length > 0 && (_jsx("button", { onClick: state.clearPqaParams, className: "text-[10px] font-semibold text-primary hover:underline", children: "Limpar" }))] }), _jsx(UrbanParamsFilter, { filters: state.pqaParams, disabledParams: state.disabledPqaParams, options: state.pqaOptions, availableParams: [
                                                {
                                                    id: "Fatores de Drenagem Beta",
                                                    label: "Fatores de Drenagem Beta",
                                                    unit: "",
                                                    defaultMax: 1,
                                                    step: 0.1,
                                                },
                                                {
                                                    id: "Taxa de Permeabilidade Lote > 500",
                                                    label: "Tx Permeabilidade >500",
                                                    unit: "",
                                                    defaultMax: 1,
                                                    step: 0.05,
                                                },
                                                {
                                                    id: "Fatores Cobertura Vegetal Alfa",
                                                    label: "Fatores Cobertura Vegetal Alfa",
                                                    unit: "",
                                                    defaultMax: 1,
                                                    step: 0.1,
                                                },
                                                {
                                                    id: "Pontuação QA Mínimo Lote > 10000",
                                                    label: "Pt QA Mínimo >10000",
                                                    unit: "",
                                                    defaultMax: 2,
                                                    step: 0.1,
                                                },
                                                {
                                                    id: "Taxa de Permeabilidade Lote ≤ 500",
                                                    label: "Tx Permeabilidade ≤500",
                                                    unit: "",
                                                    defaultMax: 1,
                                                    step: 0.05,
                                                },
                                                {
                                                    id: "Pontuação QA Mínimo Lote > 500 ≤ 1000",
                                                    label: "Pt QA Mínimo >500≤1000",
                                                    unit: "",
                                                    defaultMax: 2,
                                                    step: 0.1,
                                                },
                                                {
                                                    id: "Pontuação QA Mínimo Lote > 1000 ≤ 2500",
                                                    label: "Pt QA Mínimo >1000≤2500",
                                                    unit: "",
                                                    defaultMax: 2,
                                                    step: 0.1,
                                                },
                                                {
                                                    id: "Pontuação QA Mínimo Lote > 2500 ≤ 5000",
                                                    label: "Pt QA Mínimo >2500≤5000",
                                                    unit: "",
                                                    defaultMax: 2,
                                                    step: 0.1,
                                                },
                                                {
                                                    id: "Pontuação QA Mínimo Lote > 5000 ≤ 10000",
                                                    label: "Pt QA Mínimo >5000≤10000",
                                                    unit: "",
                                                    defaultMax: 2,
                                                    step: 0.1,
                                                },
                                                {
                                                    id: "Fator Incentivo Quota Ambiental (Lote > 5000, Pontuação ≥ 4x Qamin)",
                                                    label: "Incentivo QA Lote >5000 (≥4x)",
                                                    unit: "R$",
                                                    defaultMax: 100,
                                                },
                                                {
                                                    id: "Fator Incentivo Quota Ambiental (Lote > 5000, Pontuação ≥ 2x e < 3x Qamin)",
                                                    label: "Incentivo QA Lote >5000 (2x a 3x)",
                                                    unit: "R$",
                                                    defaultMax: 100,
                                                },
                                                {
                                                    id: "Fator Incentivo Quota Ambiental (Lote > 5000, Pontuação ≥ 3x e < 4x Qamin)",
                                                    label: "Incentivo QA Lote >5000 (3x a 4x)",
                                                    unit: "R$",
                                                    defaultMax: 100,
                                                },
                                                {
                                                    id: "Fator Incentivo Quota Ambiental (Lote > 5000, Pontuação ≥ 1.5x e < 2x Qamin)",
                                                    label: "Incentivo QA Lote >5000 (1.5x a 2x)",
                                                    unit: "R$",
                                                    defaultMax: 100,
                                                },
                                                {
                                                    id: "Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 4x Qamin)",
                                                    label: "Incentivo QA Lote >500≤1000 (≥4x)",
                                                    unit: "R$",
                                                    defaultMax: 100,
                                                },
                                                {
                                                    id: "Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 4x Qamin)",
                                                    label: "Incentivo QA Lote >1000≤2500 (≥4x)",
                                                    unit: "R$",
                                                    defaultMax: 100,
                                                },
                                                {
                                                    id: "Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 4x Qamin)",
                                                    label: "Incentivo QA Lote >2500≤5000 (≥4x)",
                                                    unit: "R$",
                                                    defaultMax: 100,
                                                },
                                                {
                                                    id: "Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 2x e < 3x Qamin)",
                                                    label: "Incentivo QA Lote >500≤1000 (2x a 3x)",
                                                    unit: "R$",
                                                    defaultMax: 100,
                                                },
                                                {
                                                    id: "Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 3x e < 4x Qamin)",
                                                    label: "Incentivo QA Lote >500≤1000 (3x a 4x)",
                                                    unit: "R$",
                                                    defaultMax: 100,
                                                },
                                                {
                                                    id: "Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 2x e < 3x Qamin)",
                                                    label: "Incentivo QA Lote >1000≤2500 (2x a 3x)",
                                                    unit: "R$",
                                                    defaultMax: 100,
                                                },
                                                {
                                                    id: "Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 3x e < 4x Qamin)",
                                                    label: "Incentivo QA Lote >1000≤2500 (3x a 4x)",
                                                    unit: "R$",
                                                    defaultMax: 100,
                                                },
                                                {
                                                    id: "Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 2x e < 3x Qamin)",
                                                    label: "Incentivo QA Lote >2500≤5000 (2x a 3x)",
                                                    unit: "R$",
                                                    defaultMax: 100,
                                                },
                                                {
                                                    id: "Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 3x e < 4x Qamin)",
                                                    label: "Incentivo QA Lote >2500≤5000 (3x a 4x)",
                                                    unit: "R$",
                                                    defaultMax: 100,
                                                },
                                                {
                                                    id: "Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 1.5x e < 2x Qamin)",
                                                    label: "Incentivo QA Lote >500≤1000 (1.5x a 2x)",
                                                    unit: "R$",
                                                    defaultMax: 100,
                                                },
                                                {
                                                    id: "Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 1.5x e < 2x Qamin)",
                                                    label: "Incentivo QA Lote >1000≤2500 (1.5x a 2x)",
                                                    unit: "R$",
                                                    defaultMax: 100,
                                                },
                                                {
                                                    id: "Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 1.5x e < 2x Qamin)",
                                                    label: "Incentivo QA Lote >2500≤5000 (1.5x a 2x)",
                                                    unit: "R$",
                                                    defaultMax: 100,
                                                },
                                            ], updateFilter: state.updatePqaParam, removeFilter: state.removePqaParam, clearFilters: state.clearPqaParams, resultsCount: state.urbanParamsPqaResults.length })] })] })] }) }), _jsx("div", { className: "flex-1 h-full overflow-hidden flex flex-col relative min-w-0 z-10", children: _jsx(ScrollArea, { className: "h-full w-full", children: _jsx("div", { className: "p-6 w-full max-w-6xl mx-auto h-full flex flex-col", children: state.synthesisMode ? (_jsxs("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-500", children: [_jsxs("div", { className: "mb-10 flex justify-between items-end", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-semibold  dark:text-white flex items-center gap-3", children: [_jsx(Layers, { className: "w-6 h-6 text-primary" }), "Zonamento compat\u00EDvel"] }), _jsx("p", { className: "  mt-2 text-sm font-medium", children: "Interse\u00E7\u00E3o entre atividades permitidas e par\u00E2metros urban\u00EDsticos." })] }), _jsxs("button", { onClick: () => setSynthesisModalOpen(true), className: "flex items-center gap-2 text-xs  hover:text-primary transition-colors font-semibold", children: [_jsx(Info, { className: "w-4 h-4" }), "Metodologia"] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "flex flex-col h-full bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl overflow-hidden", children: [_jsxs("div", { className: "px-5 py-4 border-b border-emerald-100 dark:border-emerald-900/50 bg-emerald-100/50 dark:bg-emerald-900/20 flex items-center gap-3", children: [_jsx("div", { className: "p-1.5 bg-emerald-500 rounded-full text-white shadow-sm flex items-center justify-center", children: _jsx(Check, { className: "w-3 h-3", strokeWidth: 3 }) }), _jsx("h4", { className: "text-sm font-bold text-emerald-900 dark:text-emerald-400 tracking-tight", children: "Uso permitido direto" })] }), _jsx("div", { className: "p-6 flex-1 bg-white/50 dark:bg-slate-900/20", children: _jsxs("div", { className: "flex flex-wrap gap-2", children: [compatibleZones
                                                                .filter((z) => !regrasZonamento ||
                                                                regrasZonamento.simSemNota.includes(z))
                                                                .map((z) => (_jsx("span", { className: "bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold shadow-sm border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 rounded-lg", children: z }, z))), compatibleZones.filter((z) => !regrasZonamento ||
                                                                regrasZonamento.simSemNota.includes(z)).length === 0 && (_jsx("span", { className: "text-xs text-emerald-600/60 dark:text-emerald-500/50 font-medium", children: "Nenhuma zona encontrada" }))] }) })] }), _jsxs("div", { className: "flex flex-col h-full bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/50 rounded-2xl overflow-hidden", children: [_jsxs("div", { className: "px-5 py-4 border-b border-blue-100 dark:border-blue-900/50 bg-blue-100/50 dark:bg-blue-900/20 flex items-center gap-3", children: [_jsx("div", { className: "p-1.5 bg-blue-500 rounded-full text-white shadow-sm flex items-center justify-center", children: _jsx(Info, { className: "w-3 h-3", strokeWidth: 3 }) }), _jsx("h4", { className: "text-sm font-bold text-blue-900 dark:text-blue-400 tracking-tight", children: "Uso com restri\u00E7\u00F5es" })] }), _jsx("div", { className: "p-6 flex-1 bg-white/50 dark:bg-slate-900/20", children: _jsxs("div", { className: "flex flex-wrap gap-2", children: [compatibleZones
                                                                .filter((z) => regrasZonamento &&
                                                                Object.values(regrasZonamento.simComNota)
                                                                    .flat()
                                                                    .includes(z))
                                                                .map((z) => (_jsx("span", { className: "bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold shadow-sm border border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 rounded-lg", children: z }, z))), compatibleZones.filter((z) => regrasZonamento &&
                                                                Object.values(regrasZonamento.simComNota)
                                                                    .flat()
                                                                    .includes(z)).length === 0 && (_jsx("span", { className: "text-xs text-blue-600/60 dark:text-blue-500/50 font-medium", children: "Nenhuma zona encontrada" }))] }) })] })] })] })) : state.selectedUse ||
                            Object.keys(state.urbanParams).length > 0 ||
                            Object.keys(state.pqaParams).length > 0 ? (_jsxs("div", { className: "flex flex-col gap-8 pb-10", children: [state.selectedUse && (_jsx(ResultsTable, { selectedUse: state.selectedUse, regrasZonamento: regrasZonamento, condicoesInstalacao: condicoesInstalacao, 
                                    // Do not filter by urban params here, show all zones relevant to the use
                                    filteredZones: undefined, compatiblePqas: [], allPqaNames: [], hasPqaFilters: false, hasUrbanFilters: false, setExplicativoOpen: setExplicativoOpen, setSelectedNoteId: setSelectedNoteId })), (Object.keys(state.urbanParams).length > 0 ||
                                    Object.keys(state.pqaParams).length > 0) && (_jsx(ResultsTable, { selectedUse: null, regrasZonamento: null, condicoesInstalacao: [], filteredZones: state.matchingZones, compatiblePqas: compatiblePqas, allPqaNames: allPqaNames, hasPqaFilters: Object.keys(state.pqaParams).length > 0, hasUrbanFilters: Object.keys(state.urbanParams).length > 0, setExplicativoOpen: setExplicativoOpen, setSelectedNoteId: setSelectedNoteId }))] })) : (_jsxs("div", { className: "flex flex-col items-center justify-center h-full w-full py-24 text-center animate-in fade-in duration-700", children: [_jsx(Search, { className: "w-12 h-12   mb-6", strokeWidth: 1 }), _jsx("h3", { className: "text-gray-900  text-base font-semibold mb-2", children: "Nenhum uso selecionado" }), _jsx("p", { className: "text-sm font-normal text-gray-500  max-w-[280px] leading-relaxed", children: "Selecione uma atividade na barra lateral para ver a viabilidade e par\u00E2metros t\u00E9cnicos nesta zona." })] })) }) }) }), _jsx(SynthesisModal, { isOpen: synthesisModalOpen, onClose: () => setSynthesisModalOpen(false) }), _jsx(ModalExplicativo, { isOpen: explicativoOpen, onClose: () => setExplicativoOpen(false), regrasZonamento: regrasZonamento, condicoesInstalacao: condicoesInstalacao, hasCnaeUsed: state.searchMode === "cnae" || !!state.selectedUse?.cnaeOriginario, hasUrbanFilters: Object.keys(state.urbanParams).length > 0, hasPqaFilters: Object.keys(state.pqaParams).length > 0, hasAreaFilter: state.areaImovel !== null }), _jsx(NotesModal, { notaId: selectedNoteId || "", isOpen: !!selectedNoteId, onClose: () => setSelectedNoteId(null) })] }));
}
