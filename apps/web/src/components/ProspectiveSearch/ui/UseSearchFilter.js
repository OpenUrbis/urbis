import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, X, Loader2, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Input, Tabs, TabsList, TabsTrigger } from "@open-urbis/map-ui";
import axios from "axios";
import { getAuthHeaders } from "../../../utils/auth-headers";
import { buildUsoHierarchy } from "../utils/use-logic";
const highlightTerm = (text, term) => {
    if (!term)
        return _jsx("span", { children: text });
    const parts = text.split(new RegExp(`(${term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")})`, "gi"));
    return (_jsx(_Fragment, { children: parts.map((part, i) => part.toLowerCase() === term.toLowerCase() ? (_jsx("span", { className: "text-foreground font-semibold underline underline-offset-2", children: part }, i)) : (part)) }));
};
export function UseSearchFilter({ useSearchTerm, setUseSearchTerm, searchMode, setSearchMode, searchResults, onSelectUse, selectedUse, clearSelection, usosData, cnaeData, cnaeCatalogData, onOpenInfo, }) {
    const [cnpjData, setCnpjData] = useState(null);
    const [activeCnpj, setActiveCnpj] = useState(null);
    const [isCnpjLoading, setIsCnpjLoading] = useState(false);
    const [cnpjError, setCnpjError] = useState(null);
    const [selectedCnaeIndex, setSelectedCnaeIndex] = useState(null);
    const [selectedCnaeCatalogItem, setSelectedCnaeCatalogItem] = useState(null);
    const [isCnaeHierarchyOpen, setIsCnaeHierarchyOpen] = useState(false);
    const [isUsoHierarchyOpen, setIsUsoHierarchyOpen] = useState(false);
    const [debouncedCnaeSearchTerm, setDebouncedCnaeSearchTerm] = useState("");
    const [isCnaeLoading, setIsCnaeLoading] = useState(false);
    useEffect(() => {
        if (!useSearchTerm || useSearchTerm.trim().length < 2) {
            setDebouncedCnaeSearchTerm("");
            setIsCnaeLoading(false);
            return;
        }
        setIsCnaeLoading(true);
        const handler = setTimeout(() => {
            setDebouncedCnaeSearchTerm(useSearchTerm);
            setIsCnaeLoading(false);
        }, 350); // 350ms debounce time
        return () => {
            clearTimeout(handler);
        };
    }, [useSearchTerm]);
    const isAtividadeLoading = searchMode === "atividade" &&
        useSearchTerm.trim().length >= 2 &&
        useSearchTerm !== searchResults?.termoBuscado;
    const isSearchLoading = isCnaeLoading || isAtividadeLoading || isCnpjLoading;
    const getVal = (obj, possibleKeys) => {
        if (!obj)
            return "";
        for (const k of possibleKeys) {
            const foundKey = Object.keys(obj).find((key) => key.trim().toLowerCase() === k.toLowerCase());
            if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null) {
                return String(obj[foundKey]).trim();
            }
        }
        return "";
    };
    const hasCnaeMapping = useCallback((cnaeCode) => {
        if (!cnaeCode)
            return false;
        const cleanCode = cnaeCode
            .replace(/[.\-/]/g, "")
            .trim()
            .toLowerCase();
        return cnaeData.some((mapping) => {
            const subclassMapped = getVal(mapping, [
                "subclassesCnae2.2",
                "Subclasses (CNAE 2.2)",
            ])
                .replace(/[.\-/]/g, "")
                .trim()
                .toLowerCase();
            const classMapped = getVal(mapping, [
                "classeCnae2.2",
                "Classe (CNAE 2.2)",
            ])
                .replace(/[.\-/]/g, "")
                .trim()
                .toLowerCase();
            return subclassMapped === cleanCode || classMapped === cleanCode;
        });
    }, [cnaeData]);
    const getFullCnaeHierarchy = useCallback((item) => {
        if (!item)
            return {};
        const secao = getVal(item, ["Secao", "secao", "seção"]);
        const divisao = getVal(item, ["Divisao", "divisao", "divisão"]);
        const grupo = getVal(item, ["Grupo", "grupo"]);
        const classe = getVal(item, ["Classe", "classe"]);
        const subclasse = getVal(item, ["Subclasse", "subclasse"]);
        const hierarchy = {};
        if (secao) {
            const parent = cnaeCatalogData.find((c) => getVal(c, ["Nivel", "nivel", "nível"]).toLowerCase() === "seção" &&
                getVal(c, ["Secao", "secao", "seção"]) === secao);
            if (parent)
                hierarchy.secao = parent;
        }
        if (divisao) {
            const parent = cnaeCatalogData.find((c) => getVal(c, ["Nivel", "nivel", "nível"]).toLowerCase() ===
                "divisão" &&
                getVal(c, ["Divisao", "divisao", "divisão"]) === divisao);
            if (parent)
                hierarchy.divisao = parent;
        }
        if (grupo) {
            const parent = cnaeCatalogData.find((c) => getVal(c, ["Nivel", "nivel", "nível"]).toLowerCase() === "grupo" &&
                getVal(c, ["Grupo", "grupo"]) === grupo);
            if (parent)
                hierarchy.grupo = parent;
        }
        if (classe) {
            const parent = cnaeCatalogData.find((c) => getVal(c, ["Nivel", "nivel", "nível"]).toLowerCase() === "classe" &&
                getVal(c, ["Classe", "classe"]) === classe);
            if (parent)
                hierarchy.classe = parent;
        }
        if (subclasse) {
            hierarchy.subclasse = item;
        }
        return hierarchy;
    }, [cnaeCatalogData]);
    const renderCnaeHierarchyItems = useCallback((h, isSubclass) => {
        const classCode = h.classe
            ? getVal(h.classe, ["ID_Unificado", "id_unificado"])
            : "";
        const subclassCode = h.subclasse
            ? getVal(h.subclasse, ["ID_Unificado", "id_unificado"])
            : "";
        const classMapped = hasCnaeMapping(classCode);
        const subclassMapped = hasCnaeMapping(subclassCode);
        return (_jsxs("div", { className: "flex flex-col gap-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400", children: [h.secao && (_jsxs("div", { children: [_jsxs("span", { className: "font-semibold text-slate-450", children: ["Se\u00E7\u00E3o ", getVal(h.secao, ["ID_Unificado", "id_unificado"]), ":"] }), " ", getVal(h.secao, ["Denominacao", "denominacao"])] })), h.divisao && (_jsxs("div", { children: [_jsxs("span", { className: "font-semibold text-slate-450", children: ["Divis\u00E3o ", getVal(h.divisao, ["ID_Unificado", "id_unificado"]), ":"] }), " ", getVal(h.divisao, ["Denominacao", "denominacao"])] })), h.grupo && (_jsxs("div", { children: [_jsxs("span", { className: "font-semibold text-slate-450", children: ["Grupo ", getVal(h.grupo, ["ID_Unificado", "id_unificado"]), ":"] }), " ", getVal(h.grupo, ["Denominacao", "denominacao"])] })), h.classe && (_jsxs("div", { className: classMapped
                        ? "text-slate-600 dark:text-slate-350"
                        : "opacity-75 text-slate-450 dark:text-slate-500 italic", children: [_jsxs("span", { className: "font-semibold text-slate-405", children: ["Classe ", classCode, ":"] }), " ", getVal(h.classe, ["Denominacao", "denominacao"]), classMapped ? (_jsx("span", { className: "text-emerald-500 font-semibold ml-1.5", children: "(com correspond\u00EAncia nos usos municipais)" })) : (_jsx("span", { className: "text-rose-500 font-semibold ml-1.5", children: "(sem correspond\u00EAncia nos usos municipais)" }))] })), isSubclass && h.subclasse && (_jsxs("div", { className: subclassMapped
                        ? "text-slate-700 dark:text-slate-200 font-medium"
                        : "opacity-75 text-slate-450 dark:text-slate-500 italic", children: [_jsxs("span", { className: "font-semibold text-slate-405", children: ["Subclasse ", subclassCode, ":"] }), " ", getVal(h.subclasse, ["Denominacao", "denominacao"]), subclassMapped ? (_jsx("span", { className: "text-emerald-500 font-semibold ml-1.5", children: "(com correspond\u00EAncia nos usos municipais)" })) : (_jsx("span", { className: "text-rose-500 font-semibold ml-1.5", children: "(sem correspond\u00EAncia nos usos municipais)" }))] })), isSubclass && !subclassMapped && classMapped && (_jsx("p", { className: "mt-1.5 text-[9.5px] text-rose-500 font-medium bg-rose-500/5 p-2 rounded-lg border border-rose-500/10 leading-normal", children: "* Esta atividade de subclasse n\u00E3o possui uma regra direta na lei municipal. Por isso, usamos a regra geral da Classe correspondente (marcada em verde acima)." })), !classMapped && (isSubclass ? !subclassMapped : true) && (_jsx("p", { className: "mt-1.5 text-[9.5px] text-rose-500 font-medium bg-rose-500/5 p-2 rounded-lg border border-rose-500/10 leading-normal", children: "* Esta atividade n\u00E3o possui nenhuma rela\u00E7\u00E3o ou permiss\u00E3o cadastrada para funcionamento em nossa cidade." }))] }));
    }, [hasCnaeMapping]);
    const fetchCnpjData = async (cnpjInput) => {
        try {
            setIsCnpjLoading(true);
            setCnpjError(null);
            setCnpjData(null);
            const headers = await getAuthHeaders();
            const environment = import.meta.env.VITE_API_URL || "http://localhost:3000";
            const cleanCnpj = cnpjInput.replace(/[.\-/]/g, "").trim();
            const response = await axios.get(`${environment}/maps/open-cnpj/${cleanCnpj}`, { headers });
            const rawData = response.data;
            if (!rawData || response.status !== 200) {
                throw new Error("CNPJ não encontrado");
            }
            const cnaesArray = Array.isArray(rawData.cnaes) ? rawData.cnaes : [];
            const principalItem = cnaesArray.find((c) => c.is_principal);
            const secundariosItems = cnaesArray.filter((c) => !c.is_principal);
            const formattedData = {
                cnpj: rawData.cnpj || cleanCnpj,
                razao_social: rawData.razao_social || rawData.nome_fantasia || "",
                cnae_principal_formatted: principalItem
                    ? `${principalItem.codigo} - ${principalItem.descricao}`
                    : rawData.cnae_principal
                        ? `${rawData.cnae_principal} - (CNAE principal)`
                        : null,
                cnaes_secundarios_formatted: secundariosItems.length > 0
                    ? secundariosItems.map((c) => `${c.codigo} - ${c.descricao}`)
                    : Array.isArray(rawData.cnaes_secundarios)
                        ? rawData.cnaes_secundarios.map((code) => `${code} - (CNAE secundário)`)
                        : [],
            };
            setCnpjData(formattedData);
        }
        catch (err) {
            console.error("Erro CNPJ:", err);
            setCnpjError("CNPJ não encontrado ou instabilidade no serviço OpenCNPJ.");
        }
        finally {
            setIsCnpjLoading(false);
        }
    };
    const handleCnpjSelect = (cnaeString, index) => {
        setSelectedCnaeIndex(index);
        setActiveCnpj(cnpjData);
        const cleanCnae = cnaeString
            .split(" - ")[0]
            .replace(/[.\-/]/g, "")
            .trim();
        setSearchMode("cnae");
        setUseSearchTerm(cleanCnae);
        // Look up in CNAE catalog
        const catalogItem = cnaeCatalogData.find((c) => getVal(c, ["ID_Unificado", "id_unificado"])
            .replace(/[.\-/]/g, "")
            .trim() === cleanCnae);
        if (catalogItem) {
            setSelectedCnaeCatalogItem(catalogItem);
        }
    };
    const getCnaeHierarchy = (cnae) => {
        if (!cnae)
            return [];
        const hierarchy = [];
        const d = getVal(cnae, ["divisaoCnae2.2", "Divisão (CNAE 2.2)"]);
        if (d)
            hierarchy.push({ label: "Divisão", value: d });
        const g = getVal(cnae, ["grupoCnae2.2", "Grupo (CNAE 2.2)"]);
        if (g)
            hierarchy.push({ label: "Grupo", value: g });
        const c = getVal(cnae, ["classeCnae2.2", "Classe (CNAE 2.2)"]);
        if (c)
            hierarchy.push({ label: "Classe", value: c });
        const s = getVal(cnae, ["subclassesCnae2.2", "Subclasses (CNAE 2.2)"]);
        const sd = getVal(cnae, ["denominacaoCnae2.2", "Denominação (CNAE 2.2)"]);
        if (s) {
            hierarchy.push({
                label: "Subclasse",
                value: `${s}${sd ? ` - ${sd}` : ""}`,
            });
        }
        return hierarchy;
    };
    const CnaeHierarchy = ({ cnae }) => {
        const hierarchy = getCnaeHierarchy(cnae);
        return (_jsx("div", { className: "flex flex-col gap-1 text-[11px] leading-tight text-slate-600 dark:text-slate-300", children: hierarchy.map((h, i) => (_jsxs("div", { className: "flex items-start gap-1", children: [_jsxs("span", { className: "font-semibold text-slate-400 shrink-0", children: [h.label, ":"] }), _jsx("span", { className: "font-normal text-slate-700 dark:text-slate-200", children: h.value })] }, i))) }));
    };
    const DIVISAO_COLORS = {
        "Categoria de uso": "bg-blue-400",
        "Subcategoria de uso": "bg-indigo-400",
        Tipologia: "bg-emerald-400",
        "Grupo de atividades": "bg-amber-400",
        Atividade: "bg-sky-400",
        Subtipologia: "bg-purple-400",
    };
    // Search in "CNAE" Catalog Sheet (Federal levels)
    const searchedCnaeItems = useMemo(() => {
        if (searchMode !== "cnae" ||
            !debouncedCnaeSearchTerm ||
            debouncedCnaeSearchTerm.trim().length < 2) {
            return [];
        }
        const termNormalized = debouncedCnaeSearchTerm.trim().toLowerCase();
        const termCleaned = termNormalized.replace(/[^a-z0-9]/g, "");
        return cnaeCatalogData
            .filter((item) => {
            const nivel = getVal(item, ["Nivel", "nivel", "nível"])
                .toLowerCase()
                .trim();
            // Users map to either Class (Classe) or Subclass (Subclasse) levels
            if (nivel !== "classe" && nivel !== "subclasse")
                return false;
            const denominacao = getVal(item, [
                "Denominacao",
                "denominacao",
                "Denominação",
                "denominação",
            ]).toLowerCase();
            const code = getVal(item, [
                "ID_Unificado",
                "id_unificado",
                "Subclasse",
                "subclasse",
                "Classe",
                "classe",
            ]).toLowerCase();
            const codeClean = code.replace(/[^a-z0-9]/g, "");
            return (denominacao.includes(termNormalized) ||
                code.includes(termNormalized) ||
                codeClean.includes(termCleaned));
        })
            .slice(0, 50);
    }, [searchMode, debouncedCnaeSearchTerm, cnaeCatalogData]);
    // Find LPUOS municipal activities corresponding to the selected CNAE
    const equivalentUses = useMemo(() => {
        if (!selectedCnaeCatalogItem)
            return [];
        const selectedCnaeCode = getVal(selectedCnaeCatalogItem, [
            "ID_Unificado",
            "id_unificado",
        ])
            .replace(/[.\-/]/g, "")
            .trim()
            .toLowerCase();
        // Look up in mapped "CNAEs por Atividade"
        const mappedRows = cnaeData.filter((mapping) => {
            const subclassMapped = getVal(mapping, [
                "subclassesCnae2.2",
                "Subclasses (CNAE 2.2)",
            ])
                .replace(/[.\-/]/g, "")
                .trim()
                .toLowerCase();
            const classMapped = getVal(mapping, [
                "classeCnae2.2",
                "Classe (CNAE 2.2)",
            ])
                .replace(/[.\-/]/g, "")
                .trim()
                .toLowerCase();
            return (subclassMapped === selectedCnaeCode || classMapped === selectedCnaeCode);
        });
        const results = [];
        mappedRows.forEach((mapping) => {
            const targetCode = mapping.atividade ||
                mapping.grupoAtividades ||
                getVal(mapping, [
                    "atividade",
                    "grupoAtividades",
                    "Grupo de Atividades",
                ]);
            if (!targetCode)
                return;
            const usoRecord = usosData.find((u) => getVal(u, ["Código", "Codigo", "codigo"]) === targetCode);
            if (!usoRecord)
                return;
            results.push({
                codigo: targetCode,
                divisao: getVal(usoRecord, ["Divisão", "Divisao", "divisao"]),
                descricao: getVal(usoRecord, ["Descrição", "Descricao", "descricao"]),
                descricaoComplementar: getVal(mapping, [
                    "descricaoComplementarMunicipioSaoPauloOndeConstamRestricoesMunicipais",
                    "Descrição Complementar (Município de São Paulo, onde constam restrições municipais)",
                ]),
                usoSearchResult: {
                    item: usoRecord,
                    arvore: buildUsoHierarchy(targetCode, usosData),
                    cnaeOriginario: mapping,
                },
            });
        });
        return results;
    }, [selectedCnaeCatalogItem, cnaeData, usosData]);
    const selectedCnaeHierarchy = useMemo(() => {
        if (selectedUse && selectedUse.cnaeOriginario) {
            const subclassCode = getVal(selectedUse.cnaeOriginario, [
                "subclassesCnae2.2",
                "Subclasses (CNAE 2.2)",
            ]).trim();
            const catalogItem = cnaeCatalogData.find((c) => getVal(c, ["ID_Unificado", "id_unificado"]) === subclassCode ||
                getVal(c, ["Subclasse", "subclasse"]) === subclassCode);
            return catalogItem ? getFullCnaeHierarchy(catalogItem) : null;
        }
        return null;
    }, [selectedUse, cnaeCatalogData, getFullCnaeHierarchy]);
    if (selectedUse) {
        const { item, arvore, cnaeOriginario } = selectedUse;
        const codigo = getVal(item, ["Código", "Codigo", "codigo"]);
        const divisao = getVal(item, ["Divisão", "Divisao", "divisao"]);
        const descricao = getVal(item, ["Descrição", "descricao"]);
        const hierarchy = [
            {
                label: "Categoria",
                code: getVal(arvore.categoria, ["Código", "Codigo"]),
                text: getVal(arvore.categoria, ["Descrição", "descricao"]),
            },
            {
                label: "Subcategoria",
                code: getVal(arvore.subcategoria, ["Código", "Codigo"]),
                text: getVal(arvore.subcategoria, ["Descrição", "descricao"]),
            },
            {
                label: "Grupo / Tipologia",
                code: getVal(arvore.tipologiaOuGrupo, ["Código", "Codigo"]),
                text: getVal(arvore.tipologiaOuGrupo, ["Descrição", "descricao"]),
            },
        ].filter((h) => h.text || h.code);
        // Render 1: CNPJ Flow Selection Card
        if (activeCnpj) {
            return (_jsxs("div", { className: "bg-background rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-none animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden flex flex-col gap-2.5 pl-5", children: [_jsx("div", { className: `absolute top-0 left-0 w-1 h-full ${DIVISAO_COLORS[divisao] || "bg-muted"}` }), _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex flex-col gap-0.5 pr-8", children: [_jsx("div", { className: "text-[9px] font-semibold text-slate-400 uppercase tracking-wide", children: "CNPJ escolhido" }), _jsx("div", { className: "text-xs font-semibold text-slate-800 dark:text-slate-100", children: activeCnpj.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") }), _jsx("div", { className: "text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight", children: activeCnpj.razao_social ||
                                            activeCnpj.nome_fantasia ||
                                            "Sem nome" })] }), _jsx("button", { onClick: () => {
                                    clearSelection();
                                    setActiveCnpj(null);
                                    setSelectedCnaeCatalogItem(null);
                                    setIsCnaeHierarchyOpen(false);
                                }, className: "absolute top-3.5 right-3 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-muted-foreground transition-colors focus:outline-none", children: _jsx(X, { className: "h-3.5 h-3.5" }) })] }), selectedCnaeHierarchy && (_jsxs("div", { className: "pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-1 w-full", children: [_jsx("span", { className: "text-[9px] font-bold text-slate-400 uppercase tracking-wider", children: "Atividade federal (CNAE) confirmada" }), _jsx("div", { className: "text-[11px] font-semibold text-slate-800 dark:text-slate-100 mt-0.5", children: getVal(cnaeOriginario, [
                                    "subclassesCnae2.2",
                                    "Subclasses (CNAE 2.2)",
                                ]) ||
                                    getVal(cnaeOriginario, [
                                        "classeCnae2.2",
                                        "Classe (CNAE 2.2)",
                                    ]) }), _jsx("p", { className: "text-[11px] text-slate-500 font-medium leading-normal", children: getVal(cnaeOriginario, [
                                    "denominacaoCnae2.2",
                                    "Denominação (CNAE 2.2)",
                                ]) }), _jsxs("button", { type: "button", onClick: () => setIsCnaeHierarchyOpen(!isCnaeHierarchyOpen), className: "text-[10px] font-semibold text-primary hover:underline flex items-center gap-1 focus:outline-none mt-1", children: [isCnaeHierarchyOpen ? (_jsx(ChevronUp, { className: "w-3.5 h-3.5" })) : (_jsx(ChevronDown, { className: "w-3.5 h-3.5" })), _jsx("span", { children: isCnaeHierarchyOpen
                                            ? "Ocultar estrutura detalhada"
                                            : "Ver estrutura detalhada do CNAE" })] }), isCnaeHierarchyOpen && (_jsx("div", { className: "mt-1 animate-in fade-in duration-200", children: renderCnaeHierarchyItems(selectedCnaeHierarchy, true) }))] })), _jsxs("div", { className: "pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-1.5", children: [_jsx("div", { className: "text-[9px] font-bold uppercase tracking-wider text-slate-400", children: "Uso municipal selecionado" }), _jsx("div", { className: "flex items-center gap-1.5", children: _jsxs("span", { className: "text-xs font-semibold text-slate-800 dark:text-slate-200", children: [divisao, " ", _jsxs("span", { className: "text-slate-500 font-semibold", children: ["(", codigo, ")"] })] }) }), _jsx("h3", { className: "text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug", children: descricao })] })] }));
        }
        // Render 2: CNAE Flow Selection Card
        if (selectedCnaeHierarchy) {
            return (_jsxs("div", { className: "bg-background rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-none animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden flex flex-col gap-2.5 pl-5", children: [_jsx("div", { className: `absolute top-0 left-0 w-1 h-full ${DIVISAO_COLORS[divisao] || "bg-muted"}` }), _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex flex-col gap-0.5 pr-8 w-full", children: [_jsx("div", { className: "text-[9px] font-semibold text-primary uppercase tracking-wide", children: "Atividade federal (CNAE) escolhida" }), _jsx("div", { className: "text-[11px] font-semibold text-slate-800 dark:text-slate-100 mt-1", children: getVal(cnaeOriginario, [
                                            "subclassesCnae2.2",
                                            "Subclasses (CNAE 2.2)",
                                        ]) ||
                                            getVal(cnaeOriginario, [
                                                "classeCnae2.2",
                                                "Classe (CNAE 2.2)",
                                            ]) }), _jsx("p", { className: "text-[11px] text-slate-500 font-medium leading-normal mb-1", children: getVal(cnaeOriginario, [
                                            "denominacaoCnae2.2",
                                            "Denominação (CNAE 2.2)",
                                        ]) }), _jsxs("button", { type: "button", onClick: () => setIsCnaeHierarchyOpen(!isCnaeHierarchyOpen), className: "text-[10px] font-semibold text-primary hover:underline flex items-center gap-1 focus:outline-none self-start", children: [isCnaeHierarchyOpen ? (_jsx(ChevronUp, { className: "w-3.5 h-3.5" })) : (_jsx(ChevronDown, { className: "w-3.5 h-3.5" })), _jsx("span", { children: isCnaeHierarchyOpen
                                                    ? "Ocultar estrutura detalhada"
                                                    : "Ver estrutura detalhada do CNAE" })] }), isCnaeHierarchyOpen && (_jsx("div", { className: "mt-2 animate-in fade-in duration-200", children: renderCnaeHierarchyItems(selectedCnaeHierarchy, true) }))] }), _jsx("button", { onClick: () => {
                                    clearSelection();
                                    setActiveCnpj(null);
                                    setSelectedCnaeCatalogItem(null);
                                    setIsCnaeHierarchyOpen(false);
                                }, className: "absolute top-3.5 right-3 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-muted-foreground transition-colors focus:outline-none", children: _jsx(X, { className: "h-3.5 h-3.5" }) })] }), _jsxs("div", { className: "pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-1", children: [_jsx("div", { className: "text-[9px] font-bold uppercase tracking-wider text-slate-400", children: "Uso municipal selecionado" }), _jsx("div", { className: "flex items-center gap-1.5", children: _jsxs("span", { className: "text-xs font-semibold text-slate-800 dark:text-slate-200", children: [divisao, " ", _jsxs("span", { className: "text-slate-500 font-semibold", children: ["(", codigo, ")"] })] }) }), _jsx("h3", { className: "text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug", children: descricao })] })] }));
        }
        // Render 3: Uso Flow Selection Card (Direct selection)
        return (_jsxs("div", { className: "bg-background rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-none animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden flex flex-col gap-2.5 pl-5", children: [_jsx("div", { className: `absolute top-0 left-0 w-1 h-full ${DIVISAO_COLORS[divisao] || "bg-muted"}` }), _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex flex-col gap-0.5 pr-8", children: [_jsx("div", { className: "text-[9px] font-semibold text-primary uppercase tracking-wide", children: "Uso municipal selecionado" }), _jsx("div", { className: "flex items-center gap-1.5", children: _jsxs("span", { className: "text-xs font-semibold text-slate-800 dark:text-slate-200", children: [divisao, " ", _jsxs("span", { className: "text-slate-500 font-semibold", children: ["(", codigo, ")"] })] }) }), _jsx("h3", { className: "text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug", children: descricao })] }), _jsx("button", { onClick: () => {
                                clearSelection();
                                setActiveCnpj(null);
                                setSelectedCnaeCatalogItem(null);
                                setIsCnaeHierarchyOpen(false);
                            }, className: "absolute top-3.5 right-3 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-muted-foreground transition-colors focus:outline-none", children: _jsx(X, { className: "h-3.5 h-3.5" }) })] }), hierarchy.length > 0 && (_jsxs("div", { className: "pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-1 w-full", children: [_jsxs("button", { type: "button", onClick: () => setIsUsoHierarchyOpen(!isUsoHierarchyOpen), className: "text-[10px] font-semibold text-primary hover:underline flex items-center gap-1 focus:outline-none py-0.5", children: [isUsoHierarchyOpen ? (_jsx(ChevronUp, { className: "w-3.5 h-3.5" })) : (_jsx(ChevronDown, { className: "w-3.5 h-3.5" })), _jsx("span", { children: isUsoHierarchyOpen
                                        ? "Ocultar classificação completa"
                                        : "Ver classificação completa" })] }), isUsoHierarchyOpen && (_jsx("div", { className: "mt-1 flex flex-col gap-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400 animate-in fade-in duration-200", children: hierarchy.map((h, i) => (_jsxs("div", { className: "flex items-start gap-1", children: [_jsxs("span", { className: "font-semibold text-slate-400 shrink-0", children: [h.label, ":"] }), _jsxs("span", { className: "text-slate-650 dark:text-slate-200", children: [h.text, " ", h.code && (_jsxs("span", { className: "text-[9px] text-slate-450", children: ["(", h.code, ")"] }))] })] }, i))) }))] }))] }));
    }
    return (_jsxs("div", { className: "flex flex-col gap-3 relative w-full z-50 h-full", children: [!selectedCnaeCatalogItem && useSearchTerm.trim().length === 0 && (_jsx(Tabs, { value: searchMode, onValueChange: (v) => {
                    const nextMode = v;
                    setSearchMode(nextMode);
                    if (nextMode !== "cnpj") {
                        setCnpjData(null);
                        setSelectedCnaeIndex(null);
                    }
                    if (nextMode === "atividade")
                        setActiveCnpj(null);
                    setSelectedCnaeCatalogItem(null);
                    setIsCnaeHierarchyOpen(false);
                }, className: "w-full", children: _jsxs(TabsList, { className: "w-full bg-muted h-10 p-1 rounded-xl", children: [_jsx(TabsTrigger, { value: "atividade", className: "flex-1 text-xs font-medium rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none", children: "Uso" }), _jsx(TabsTrigger, { value: "cnae", className: "flex-1 text-xs font-medium rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none", children: "CNAE" }), _jsx(TabsTrigger, { value: "cnpj", className: "flex-1 text-xs font-medium rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none", children: "CNPJ" })] }) })), !selectedCnaeCatalogItem && (_jsxs("div", { className: "relative w-full flex items-center group", children: [_jsx(Input, { placeholder: searchMode === "atividade"
                            ? "Pesquise por código ou descrição..."
                            : searchMode === "cnae"
                                ? "Digite o código ou a descrição do CNAE..."
                                : "Digite o CNPJ da empresa...", value: useSearchTerm, onChange: (e) => setUseSearchTerm(e.target.value), onKeyDown: (e) => {
                            if (e.key === "Enter" && searchMode === "cnpj") {
                                fetchCnpjData(useSearchTerm);
                            }
                        }, className: "h-10 w-full rounded-2xl bg-background border-border focus:ring-primary/20 transition-all font-medium text-sm shadow-none pr-12 pl-4 text-foreground placeholder:text-muted-foreground" }), _jsxs("div", { className: "absolute right-3 flex items-center gap-1.5", children: [_jsx("button", { type: "button", onClick: () => onOpenInfo?.(searchMode === "atividade" ? "uso" : searchMode), className: "text-muted-foreground hover:text-primary transition-colors focus:outline-none p-1", title: "Mais informa\u00E7\u00F5es sobre este campo", children: _jsx(Info, { className: "w-3.5 h-3.5" }) }), searchMode === "cnpj" ? (_jsx("button", { onClick: () => fetchCnpjData(useSearchTerm), className: "w-7 h-7 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors focus:outline-none", children: isCnpjLoading ? (_jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" })) : (_jsx(Search, { className: "w-3.5 h-3.5" })) })) : (_jsx("div", { className: "text-muted-foreground pointer-events-none p-1 flex items-center justify-center", children: isSearchLoading ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin text-primary" })) : (_jsx(Search, { className: "h-4 w-4" })) }))] })] })), searchMode === "cnpj" && cnpjError && (_jsx("div", { className: "text-rose-500 text-xs font-medium px-2", children: cnpjError })), searchMode === "cnpj" && cnpjData && (_jsxs("div", { className: "self-stretch pr-1 flex flex-col justify-start items-start gap-3 mt-2 bg-background border border-border p-4 rounded-2xl shadow-none animate-in fade-in duration-200 w-full", children: [_jsxs("div", { className: "self-stretch flex flex-col justify-start items-start w-full", children: [_jsx("div", { className: "self-stretch text-muted-foreground text-[10px] font-semibold uppercase leading-4 mb-1", children: "CNPJ Escolhido" }), _jsxs("div", { className: "self-stretch p-2.5 flex flex-col justify-start items-start gap-1 bg-muted/40 rounded-xl w-full border border-border/40", children: [_jsx("div", { className: "text-[10px] font-mono text-slate-500 select-all", children: useSearchTerm }), _jsx("div", { className: "flex-1 opacity-90 text-foreground text-xs font-semibold leading-snug break-words whitespace-normal w-full", children: cnpjData.razao_social || cnpjData.nome_fantasia || "Sem nome" })] })] }), cnpjData.cnae_principal_formatted && (_jsxs("div", { className: "self-stretch flex flex-col justify-start items-start w-full", children: [_jsx("div", { className: "self-stretch text-muted-foreground text-[10px] font-semibold uppercase leading-4 mb-1", children: "Atividade federal (CNAE) confirmada" }), _jsxs("button", { onClick: () => handleCnpjSelect(cnpjData.cnae_principal_formatted, -1), className: `self-stretch p-2.5 flex items-center gap-2 rounded-xl text-left transition-colors border ${selectedCnaeIndex === -1 ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"} whitespace-normal break-words w-full`, children: [_jsx("div", { className: `w-4 h-4 rounded-xl flex justify-center items-center shrink-0 border ${selectedCnaeIndex === -1 ? "bg-primary border-primary" : "border-slate-300 dark:border-slate-600"}`, children: selectedCnaeIndex === -1 && (_jsx("div", { className: "w-2 h-2 bg-primary-foreground rounded-full" })) }), _jsx("div", { className: "flex-1 text-foreground text-xs font-semibold leading-snug break-words whitespace-normal w-full", children: cnpjData.cnae_principal_formatted })] })] })), cnpjData.cnaes_secundarios_formatted &&
                        cnpjData.cnaes_secundarios_formatted.length > 0 && (_jsxs("div", { className: "self-stretch flex flex-col justify-start items-start w-full", children: [_jsx("div", { className: "self-stretch text-muted-foreground text-[10px] font-semibold uppercase leading-4 mb-1", children: "Atividades federais (CNAE) secund\u00E1rias" }), _jsx("div", { className: "flex flex-col w-full gap-1", children: cnpjData.cnaes_secundarios_formatted.map((cnae, idx) => (_jsxs("button", { onClick: () => handleCnpjSelect(cnae, idx), className: `self-stretch p-2.5 flex items-center gap-2 rounded-xl text-left transition-colors border ${selectedCnaeIndex === idx ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"} whitespace-normal break-words w-full`, children: [_jsx("div", { className: `w-4 h-4 rounded-xl flex justify-center items-center shrink-0 border ${selectedCnaeIndex === idx ? "bg-primary border-primary" : "border-slate-300 dark:border-slate-600"}`, children: selectedCnaeIndex === idx && (_jsx("div", { className: "w-2 h-2 bg-primary-foreground rounded-full" })) }), _jsx("div", { className: "flex-1 text-foreground text-xs font-semibold leading-snug break-words whitespace-normal w-full", children: cnae })] }, idx))) })] }))] })), searchMode === "cnae" && selectedCnaeCatalogItem && (_jsxs("div", { className: "self-stretch pr-1 flex flex-col justify-start items-start gap-3 mt-2 bg-background border border-border p-3.5 rounded-2xl shadow-none animate-in fade-in duration-300 w-full", children: [_jsxs("div", { className: "self-stretch flex justify-between items-start w-full", children: [_jsxs("div", { className: "flex flex-col gap-0.5 pr-8 w-full", children: [_jsx("span", { className: "text-[10px] font-semibold text-primary uppercase tracking-wide", children: "Atividade federal (CNAE) confirmada" }), _jsxs("div", { className: "text-xs font-semibold text-slate-800 dark:text-slate-100 font-mono select-all", children: [getVal(selectedCnaeCatalogItem, ["Nivel", "nivel", "nível"]), " ", getVal(selectedCnaeCatalogItem, [
                                                "ID_Unificado",
                                                "id_unificado",
                                            ])] }), _jsx("p", { className: "text-[11px] text-slate-500 font-medium leading-snug break-words whitespace-normal w-full", children: getVal(selectedCnaeCatalogItem, [
                                            "Denominacao",
                                            "denominacao",
                                            "denominação",
                                            "Denominação",
                                        ]) })] }), _jsx("button", { onClick: () => {
                                    setSelectedCnaeCatalogItem(null);
                                    setIsCnaeHierarchyOpen(false);
                                }, className: "p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-muted-foreground transition-colors focus:outline-none", title: "Voltar para a busca", children: _jsx(X, { className: "h-4 w-4" }) })] }), (() => {
                        const h = getFullCnaeHierarchy(selectedCnaeCatalogItem);
                        const selectedNivel = getVal(selectedCnaeCatalogItem, [
                            "Nivel",
                            "nivel",
                            "nível",
                        ])
                            .toLowerCase()
                            .trim();
                        const isSubclass = selectedNivel === "subclasse";
                        return (_jsxs("div", { className: "self-stretch pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-1 w-full", children: [_jsxs("button", { type: "button", onClick: () => setIsCnaeHierarchyOpen(!isCnaeHierarchyOpen), className: "text-[10px] font-semibold text-primary hover:underline flex items-center gap-1 focus:outline-none py-0.5", children: [isCnaeHierarchyOpen ? (_jsx(ChevronUp, { className: "w-3.5 h-3.5" })) : (_jsx(ChevronDown, { className: "w-3.5 h-3.5" })), _jsx("span", { children: isCnaeHierarchyOpen
                                                ? "Ocultar estrutura detalhada"
                                                : "Ver estrutura detalhada do CNAE" })] }), isCnaeHierarchyOpen && (_jsx("div", { className: "mt-2 animate-in fade-in duration-200", children: renderCnaeHierarchyItems(h, isSubclass) }))] }));
                    })(), _jsxs("div", { className: "self-stretch flex flex-col justify-start items-start gap-2 pt-2 border-t border-border w-full", children: [_jsx("div", { className: "text-[10px] font-semibold text-slate-400 uppercase tracking-wider", children: "Uso municipal correspondente" }), equivalentUses.length === 0 ? (_jsx("p", { className: "w-full text-[11px] text-rose-700 bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/10 p-3 rounded-xl leading-relaxed italic break-words whitespace-normal", children: "N\u00E3o h\u00E1 regras de zoneamento cadastradas para esta atividade do CNAE no Decreto paulistano n\u00BA 57.378/2016." })) : (_jsxs("div", { className: "flex flex-col w-full gap-1.5", children: [_jsx("p", { className: "text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5 leading-snug", children: "Selecione uma atividade para prosseguir com a an\u00E1lise normativa no mapa:" }), _jsx("div", { className: "relative w-full bg-background border border-border rounded-2xl shadow-none overflow-hidden max-h-[410px] overflow-y-auto", children: _jsx("div", { className: "divide-y divide-border", children: equivalentUses.map((equiv, idx) => {
                                                const { arvore } = equiv.usoSearchResult;
                                                const breadcrumbs = [
                                                    {
                                                        label: "Categoria",
                                                        text: getVal(arvore?.categoria, [
                                                            "Descrição",
                                                            "descricao",
                                                        ]),
                                                    },
                                                    {
                                                        label: "Subcategoria",
                                                        text: getVal(arvore?.subcategoria, [
                                                            "Descrição",
                                                            "descricao",
                                                        ]),
                                                    },
                                                    {
                                                        label: "Grupo / Tipologia",
                                                        text: getVal(arvore?.tipologiaOuGrupo, [
                                                            "Descrição",
                                                            "descricao",
                                                        ]),
                                                    },
                                                ].filter((b) => b.text);
                                                return (_jsxs("button", { onClick: () => {
                                                        onSelectUse(equiv.usoSearchResult);
                                                        setSelectedCnaeCatalogItem(null);
                                                        setIsCnaeHierarchyOpen(false);
                                                    }, className: "w-full text-left px-4 py-3 hover:bg-muted focus:bg-muted focus:outline-none transition-all flex flex-col gap-1 border-b border-border/50 whitespace-normal break-words", children: [_jsxs("div", { className: "text-[10px] font-semibold text-slate-405 tracking-wide break-words whitespace-normal w-full", children: [_jsx("span", { className: "uppercase", children: equiv.divisao }), " ", _jsxs("span", { className: "text-slate-800 dark:text-slate-200 ml-1", children: ["(", equiv.codigo, ")"] })] }), _jsx("p", { className: "text-[12px] text-slate-800 dark:text-slate-200 font-semibold leading-snug break-words whitespace-normal w-full", children: equiv.descricao }), breadcrumbs.length > 0 && (_jsx("div", { className: "mt-1.5 text-[10px] leading-relaxed w-full break-words whitespace-normal text-slate-500 dark:text-slate-400", children: breadcrumbs.map((b, i) => (_jsxs("span", { className: "inline break-words whitespace-normal", children: [_jsxs("span", { className: "text-slate-400 font-medium", children: [b.label, ":", " "] }), _jsx("span", { className: "text-slate-650 dark:text-slate-300 font-normal italic", children: b.text }), i < breadcrumbs.length - 1 && (_jsx("span", { className: "text-slate-300 dark:text-slate-700 mx-1", children: "/" }))] }, i))) })), equiv.descricaoComplementar && (_jsxs("div", { className: "text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-lg italic w-full mt-2 break-words whitespace-normal", onClick: (e) => e.stopPropagation(), children: [_jsx("span", { className: "font-semibold text-amber-600 dark:text-amber-400 block mb-0.5 not-italic text-[9px] uppercase tracking-wider", children: "Restri\u00E7\u00E3o municipal complementar" }), equiv.descricaoComplementar] }))] }, idx));
                                            }) }) })] }))] })] })), searchMode === "cnae" &&
                searchedCnaeItems.length > 0 &&
                !selectedCnaeCatalogItem && (_jsx("div", { className: "relative mt-2 w-full bg-background border border-border rounded-2xl shadow-none overflow-hidden max-h-[490px] overflow-y-auto animate-in fade-in duration-200", children: _jsx("div", { className: "divide-y divide-border", children: searchedCnaeItems.map((cnaeItem, idx) => {
                        const nivel = getVal(cnaeItem, ["Nivel", "nivel", "nível"]);
                        const code = getVal(cnaeItem, ["ID_Unificado", "id_unificado"]);
                        const denominacao = getVal(cnaeItem, [
                            "Denominacao",
                            "denominacao",
                            "denominação",
                            "Denominação",
                        ]);
                        const h = getFullCnaeHierarchy(cnaeItem);
                        const classCode = h.classe
                            ? getVal(h.classe, ["ID_Unificado", "id_unificado"])
                            : "";
                        const subclassCode = h.subclasse
                            ? getVal(h.subclasse, ["ID_Unificado", "id_unificado"])
                            : "";
                        const classMapped = hasCnaeMapping(classCode);
                        const subclassMapped = hasCnaeMapping(subclassCode);
                        // It has correspondence if either the class or the subclass is mapped
                        const isSelectable = nivel.toLowerCase().trim() === "classe"
                            ? classMapped
                            : subclassMapped || classMapped;
                        return (_jsxs("button", { disabled: !isSelectable, className: `w-full text-left px-4 py-3.5 hover:bg-muted focus:bg-muted focus:outline-none transition-all flex flex-col gap-1 border-b border-border/50 whitespace-normal break-words ${isSelectable ? "" : "opacity-80 cursor-not-allowed bg-muted/20"}`, onClick: () => setSelectedCnaeCatalogItem(cnaeItem), children: [_jsxs("div", { className: "flex items-center gap-2 mb-0.5 flex-wrap", children: [_jsxs("span", { className: "text-[10px] font-bold text-primary tracking-wide uppercase", children: [nivel, " ", code] }), isSelectable ? (_jsxs("span", { className: "text-[9px] font-semibold text-emerald-500 ml-auto flex items-center gap-0.5", children: [_jsx("span", { className: "w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" }), " ", "com correspond\u00EAncia nos usos municipais"] })) : (_jsxs("span", { className: "text-[9px] font-semibold text-rose-500 ml-auto flex items-center gap-0.5", children: [_jsx("span", { className: "w-1.5 h-1.5 bg-rose-500 rounded-full inline-block" }), " ", "sem correspond\u00EAncia nos usos municipais"] }))] }), _jsx("p", { className: `text-[12px] font-semibold leading-snug ${isSelectable ? "text-slate-800 dark:text-slate-100" : "text-slate-400 line-through decoration-rose-500/40"}`, children: highlightTerm(denominacao, debouncedCnaeSearchTerm) }), _jsxs("div", { className: "flex flex-col gap-1 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl mt-1.5 border border-slate-100 dark:border-slate-800/60 leading-normal w-full", children: [_jsx("div", { className: "text-[9px] font-bold uppercase tracking-wider mb-1 text-slate-400", children: "Estrutura federal CNAE" }), renderCnaeHierarchyItems(h, nivel.toLowerCase().trim() === "subclasse")] })] }, idx));
                    }) }) })), searchMode === "cnae" &&
                searchedCnaeItems.length === 0 &&
                debouncedCnaeSearchTerm.trim().length >= 2 &&
                !selectedCnaeCatalogItem && (_jsx("div", { className: "relative mt-2 w-full bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl shadow-none animate-in fade-in duration-200", children: _jsxs("p", { className: "text-[12px] text-amber-800 dark:text-amber-200 font-medium leading-relaxed italic", children: ["N\u00E3o h\u00E1 correspond\u00EAncia entre o CNAE pesquisado e o Cat\u00E1logo Nacional de Atividades Econ\u00F4micas.", _jsx("span", { className: "block mt-1 font-normal opacity-80", children: "Verifique o c\u00F3digo ou a descri\u00E7\u00E3o digitada e tente novamente." })] }) })), searchMode !== "cnae" &&
                searchResults &&
                searchResults.resultados.length > 0 && (_jsx("div", { className: "relative mt-2 w-full bg-background border border-border rounded-2xl shadow-none overflow-hidden max-h-[490px] overflow-y-auto animate-in fade-in duration-200", children: _jsx("div", { className: "divide-y divide-border", children: searchResults.resultados
                        .filter((resultado) => {
                        if (searchMode !== "atividade")
                            return true;
                        const div = getVal(resultado.item, [
                            "Divisão",
                            "Divisao",
                            "divisao",
                        ])
                            .toLowerCase()
                            .trim();
                        const cod = getVal(resultado.item, [
                            "Código",
                            "Codigo",
                            "codigo",
                        ])
                            .toLowerCase()
                            .trim();
                        return ([
                            "atividade",
                            "grupo de atividades",
                            "subtipologia",
                            "tipologia",
                        ].includes(div) || cod === "r1");
                    })
                        .map((resultado, idx) => {
                        const { item, arvore } = resultado;
                        const codigo = getVal(item, ["Código", "Codigo", "codigo"]);
                        const descricao = getVal(item, [
                            "Descrição",
                            "Descricao",
                            "descricao",
                        ]);
                        const divisao = getVal(item, [
                            "Divisão",
                            "Divisao",
                            "divisao",
                        ]);
                        const breadcrumbs = [
                            {
                                label: "Categoria",
                                text: getVal(arvore?.categoria, [
                                    "Descrição",
                                    "descricao",
                                ]),
                            },
                            {
                                label: "Subcategoria",
                                text: getVal(arvore?.subcategoria, [
                                    "Descrição",
                                    "descricao",
                                ]),
                            },
                            {
                                label: "Grupo / Tipologia",
                                text: getVal(arvore?.tipologiaOuGrupo, [
                                    "Descrição",
                                    "descricao",
                                ]),
                            },
                        ].filter((b) => b.text);
                        return (_jsxs("button", { className: "w-full text-left px-4 py-3 hover:bg-muted focus:bg-muted focus:outline-none transition-all flex flex-col gap-1 border-b border-border/50 whitespace-normal break-words", onClick: () => onSelectUse(resultado), children: [_jsxs("div", { className: "text-[10px] font-semibold text-slate-405 tracking-wide", children: [_jsx("span", { className: "uppercase", children: divisao }), " ", _jsxs("span", { className: "text-slate-800 dark:text-slate-200 ml-1", children: ["(", codigo, ")"] })] }), _jsx("p", { className: "text-[12px] text-slate-800 dark:text-slate-200 font-semibold leading-snug", children: highlightTerm(descricao, useSearchTerm) }), breadcrumbs.length > 0 && (_jsx("div", { className: "mt-1.5 text-[10px] leading-relaxed w-full break-words text-slate-500 dark:text-slate-400", children: breadcrumbs.map((b, i) => (_jsxs("span", { className: "inline", children: [_jsxs("span", { className: "text-slate-400 font-medium", children: [b.label, ":", " "] }), _jsx("span", { className: "text-slate-650 dark:text-slate-300 font-normal italic", children: b.text }), i < breadcrumbs.length - 1 && (_jsx("span", { className: "text-slate-300 dark:text-slate-700 mx-1", children: "/" }))] }, i))) }))] }, idx));
                    }) }) }))] }));
}
