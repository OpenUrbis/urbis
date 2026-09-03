import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { PriceRangeSlider } from "./PriceRangeSlider";
import { Plus, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectLabel, SelectGroup, SelectSeparator, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@open-urbis/map-ui";
export const DEFAULT_URBAN_PARAMS = [
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
export function UrbanParamsFilter({ filters, options = {}, availableParams = DEFAULT_URBAN_PARAMS, disabledParams = [], updateFilter, removeFilter, }) {
    const visibleParams = React.useMemo(() => {
        const filtered = availableParams.filter((param) => {
            const paramOptions = options?.[param.id];
            if (!paramOptions || paramOptions.length === 0)
                return true;
            const finiteValues = Array.from(new Set(paramOptions.filter(Number.isFinite))).sort((a, b) => a - b);
            return finiteValues.length > 1;
        });
        // Sort alphabetically by label
        return filtered.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
    }, [availableParams, options]);
    const handleAddFilter = (param) => {
        const paramOptions = options?.[param.id];
        const finiteOptions = Array.from(new Set(paramOptions?.filter(Number.isFinite) ?? [])).sort((a, b) => a - b);
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
    return (_jsx("div", { className: "flex flex-col gap-5", children: _jsxs("div", { className: "space-y-4", children: [Object.keys(filters).length === 0 ? null : (_jsx("div", { className: "grid gap-3", children: Object.keys(filters).map((key) => {
                        const paramConfig = availableParams.find((p) => p.id === key);
                        if (!paramConfig)
                            return null;
                        return (_jsx(PriceRangeSlider, { label: paramConfig.label, unit: paramConfig.unit, min: 0, max: paramConfig.defaultMax * 1.5, step: paramConfig.step || 1, options: options?.[key], value: filters[key], onChange: (newValue) => updateFilter(key, newValue), onRemove: removeFilter ? () => removeFilter(key) : undefined }, key));
                    }) })), _jsxs(Select, { value: "", onValueChange: (id) => {
                        const param = availableParams.find((p) => p.id === id);
                        if (param)
                            handleAddFilter(param);
                    }, children: [_jsxs(SelectTrigger, { className: "w-full border border-slate-200 dark:border-slate-800  hover:text-primary h-10 rounded-full text-[11px] font-semibold transition-all shadow-none flex items-center justify-center gap-2 px-6", children: [_jsx(Plus, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Adicionar um par\u00E2metro" })] }), _jsx(SelectContent, { className: "rounded-xl w-[360px] max-w-[calc(100vw-2rem)]", children: _jsxs(SelectGroup, { children: [_jsx(SelectLabel, { className: "text-[10px] font-semibold  py-2 px-3", children: "Sele\u00E7\u00E3o de par\u00E2metros" }), _jsx(SelectSeparator, {}), visibleParams.map((param) => {
                                        const isActive = Object.keys(filters).includes(param.id);
                                        const isDisabledByArea = disabledParams.includes(param.id);
                                        const isItemDisabled = isActive || isDisabledByArea;
                                        return (_jsxs(SelectItem, { value: param.id, disabled: isItemDisabled, title: isDisabledByArea
                                                ? "Desativado devido ao parâmetro de área do imóvel"
                                                : undefined, className: `min-h-9 whitespace-normal py-2 text-xs font-normal pr-8 ${isDisabledByArea ? "pointer-events-auto cursor-not-allowed opacity-50" : ""}`, children: [_jsxs("span", { className: "block pr-2 leading-snug", children: [param.label, isDisabledByArea && (_jsx("span", { className: "ml-2 text-[9px] text-rose-500/80 font-semibold", children: "(n\u00E3o aplic\u00E1vel pela \u00E1rea)" }))] }), _jsx(TooltipProvider, { delayDuration: 200, children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", onClick: (e) => e.stopPropagation(), className: "absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none p-1", children: _jsx(Info, { className: "w-3.5 h-3.5" }) }) }), _jsxs(TooltipContent, { className: "max-w-[250px] p-3 space-y-2 bg-background border-border shadow-lg z-[1000]", side: "right", sideOffset: 10, children: [_jsxs("p", { className: "text-xs text-foreground font-normal leading-relaxed", children: ["Saiba mais sobre ", param.label, " e como este crit\u00E9rio afeta a viabilidade do lote."] }), _jsx("a", { href: "https://legis.urbis.prefeitura.sp.gov.br/", target: "_blank", rel: "noopener noreferrer", onClick: (e) => e.stopPropagation(), className: "text-[11px] font-medium text-primary hover:underline block mt-1", children: "Abrir mais ajuda" })] })] }) })] }, param.id));
                                    })] }) })] })] }) }));
}
