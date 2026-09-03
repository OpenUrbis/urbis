import React, { useState, useMemo, useCallback, useEffect } from "react";
import { UsoSearchResultItem } from "../utils/types";
import { Search, X, Loader2, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Input, Tabs, TabsList, TabsTrigger } from "@open-urbis/map-ui";
import axios from "axios";
import { getAuthHeaders } from "../../../utils/auth-headers";
import { buildUsoHierarchy } from "../utils/use-logic";

const highlightTerm = (text: string, term: string) => {
  if (!term) return <span>{text}</span>;
  const parts = text.split(
    new RegExp(`(${term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")})`, "gi"),
  );
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === term.toLowerCase() ? (
          <span
            key={i}
            className="text-foreground font-semibold underline underline-offset-2"
          >
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
};

interface UseSearchFilterProps {
  useSearchTerm: string;
  setUseSearchTerm: (term: string) => void;
  searchMode: "atividade" | "cnae" | "cnpj";
  setSearchMode: (mode: "atividade" | "cnae" | "cnpj") => void;
  searchResults: any;
  onSelectUse: (use: UsoSearchResultItem) => void;
  selectedUse: UsoSearchResultItem | null;
  clearSelection: () => void;
  usosData: any[];
  cnaeData: any[];
  cnaeCatalogData: any[];
  onOpenInfo?: (
    type: "uso" | "cnae" | "cnpj" | "parametros" | "area" | "ver-prospeccao",
  ) => void;
}

export function UseSearchFilter({
  useSearchTerm,
  setUseSearchTerm,
  searchMode,
  setSearchMode,
  searchResults,
  onSelectUse,
  selectedUse,
  clearSelection,
  usosData,
  cnaeData,
  cnaeCatalogData,
  onOpenInfo,
}: UseSearchFilterProps) {
  const [cnpjData, setCnpjData] = useState<any>(null);
  const [activeCnpj, setActiveCnpj] = useState<any>(null);
  const [isCnpjLoading, setIsCnpjLoading] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [selectedCnaeIndex, setSelectedCnaeIndex] = useState<number | null>(
    null,
  );
  const [selectedCnaeCatalogItem, setSelectedCnaeCatalogItem] =
    useState<any>(null);
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

  const isAtividadeLoading =
    searchMode === "atividade" &&
    useSearchTerm.trim().length >= 2 &&
    useSearchTerm !== searchResults?.termoBuscado;
  const isSearchLoading = isCnaeLoading || isAtividadeLoading || isCnpjLoading;

  const getVal = (obj: any, possibleKeys: string[]) => {
    if (!obj) return "";
    for (const k of possibleKeys) {
      const foundKey = Object.keys(obj).find(
        (key) => key.trim().toLowerCase() === k.toLowerCase(),
      );
      if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null) {
        return String(obj[foundKey]).trim();
      }
    }
    return "";
  };

  const hasCnaeMapping = useCallback(
    (cnaeCode: string) => {
      if (!cnaeCode) return false;
      const cleanCode = cnaeCode
        .replace(/[.\-/]/g, "")
        .trim()
        .toLowerCase();
      return cnaeData.some((mapping: any) => {
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
    },
    [cnaeData],
  );

  const getFullCnaeHierarchy = useCallback(
    (item: any) => {
      if (!item) return {};
      const secao = getVal(item, ["Secao", "secao", "seção"]);
      const divisao = getVal(item, ["Divisao", "divisao", "divisão"]);
      const grupo = getVal(item, ["Grupo", "grupo"]);
      const classe = getVal(item, ["Classe", "classe"]);
      const subclasse = getVal(item, ["Subclasse", "subclasse"]);

      const hierarchy: any = {};

      if (secao) {
        const parent = cnaeCatalogData.find(
          (c) =>
            getVal(c, ["Nivel", "nivel", "nível"]).toLowerCase() === "seção" &&
            getVal(c, ["Secao", "secao", "seção"]) === secao,
        );
        if (parent) hierarchy.secao = parent;
      }
      if (divisao) {
        const parent = cnaeCatalogData.find(
          (c) =>
            getVal(c, ["Nivel", "nivel", "nível"]).toLowerCase() ===
              "divisão" &&
            getVal(c, ["Divisao", "divisao", "divisão"]) === divisao,
        );
        if (parent) hierarchy.divisao = parent;
      }
      if (grupo) {
        const parent = cnaeCatalogData.find(
          (c) =>
            getVal(c, ["Nivel", "nivel", "nível"]).toLowerCase() === "grupo" &&
            getVal(c, ["Grupo", "grupo"]) === grupo,
        );
        if (parent) hierarchy.grupo = parent;
      }
      if (classe) {
        const parent = cnaeCatalogData.find(
          (c) =>
            getVal(c, ["Nivel", "nivel", "nível"]).toLowerCase() === "classe" &&
            getVal(c, ["Classe", "classe"]) === classe,
        );
        if (parent) hierarchy.classe = parent;
      }
      if (subclasse) {
        hierarchy.subclasse = item;
      }

      return hierarchy;
    },
    [cnaeCatalogData],
  );

  const renderCnaeHierarchyItems = useCallback(
    (h: any, isSubclass: boolean) => {
      const classCode = h.classe
        ? getVal(h.classe, ["ID_Unificado", "id_unificado"])
        : "";
      const subclassCode = h.subclasse
        ? getVal(h.subclasse, ["ID_Unificado", "id_unificado"])
        : "";

      const classMapped = hasCnaeMapping(classCode);
      const subclassMapped = hasCnaeMapping(subclassCode);

      return (
        <div className="flex flex-col gap-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
          {h.secao && (
            <div>
              <span className="font-semibold text-slate-450">
                Seção {getVal(h.secao, ["ID_Unificado", "id_unificado"])}:
              </span>{" "}
              {getVal(h.secao, ["Denominacao", "denominacao"])}
            </div>
          )}
          {h.divisao && (
            <div>
              <span className="font-semibold text-slate-450">
                Divisão {getVal(h.divisao, ["ID_Unificado", "id_unificado"])}:
              </span>{" "}
              {getVal(h.divisao, ["Denominacao", "denominacao"])}
            </div>
          )}
          {h.grupo && (
            <div>
              <span className="font-semibold text-slate-450">
                Grupo {getVal(h.grupo, ["ID_Unificado", "id_unificado"])}:
              </span>{" "}
              {getVal(h.grupo, ["Denominacao", "denominacao"])}
            </div>
          )}
          {h.classe && (
            <div
              className={
                classMapped
                  ? "text-slate-600 dark:text-slate-350"
                  : "opacity-75 text-slate-450 dark:text-slate-500 italic"
              }
            >
              <span className="font-semibold text-slate-405">
                Classe {classCode}:
              </span>{" "}
              {getVal(h.classe, ["Denominacao", "denominacao"])}
              {classMapped ? (
                <span className="text-emerald-500 font-semibold ml-1.5">
                  (com correspondência nos usos municipais)
                </span>
              ) : (
                <span className="text-rose-500 font-semibold ml-1.5">
                  (sem correspondência nos usos municipais)
                </span>
              )}
            </div>
          )}
          {isSubclass && h.subclasse && (
            <div
              className={
                subclassMapped
                  ? "text-slate-700 dark:text-slate-200 font-medium"
                  : "opacity-75 text-slate-450 dark:text-slate-500 italic"
              }
            >
              <span className="font-semibold text-slate-405">
                Subclasse {subclassCode}:
              </span>{" "}
              {getVal(h.subclasse, ["Denominacao", "denominacao"])}
              {subclassMapped ? (
                <span className="text-emerald-500 font-semibold ml-1.5">
                  (com correspondência nos usos municipais)
                </span>
              ) : (
                <span className="text-rose-500 font-semibold ml-1.5">
                  (sem correspondência nos usos municipais)
                </span>
              )}
            </div>
          )}

          {/* Informative notes on fallbacks using Simple Language */}
          {isSubclass && !subclassMapped && classMapped && (
            <p className="mt-1.5 text-[9.5px] text-rose-500 font-medium bg-rose-500/5 p-2 rounded-lg border border-rose-500/10 leading-normal">
              * Esta atividade de subclasse não possui uma regra direta na lei
              municipal. Por isso, usamos a regra geral da Classe correspondente
              (marcada em verde acima).
            </p>
          )}
          {!classMapped && (isSubclass ? !subclassMapped : true) && (
            <p className="mt-1.5 text-[9.5px] text-rose-500 font-medium bg-rose-500/5 p-2 rounded-lg border border-rose-500/10 leading-normal">
              * Esta atividade não possui nenhuma relação ou permissão
              cadastrada para funcionamento em nossa cidade.
            </p>
          )}
        </div>
      );
    },
    [hasCnaeMapping],
  );

  const fetchCnpjData = async (cnpjInput: string) => {
    try {
      setIsCnpjLoading(true);
      setCnpjError(null);
      setCnpjData(null);

      const headers = await getAuthHeaders();
      const environment =
        import.meta.env.VITE_API_URL || "http://localhost:3000";
      const cleanCnpj = cnpjInput.replace(/[.\-/]/g, "").trim();
      const response = await axios.get(
        `${environment}/maps/open-cnpj/${cleanCnpj}`,
        { headers },
      );

      const rawData = response.data;
      if (!rawData || response.status !== 200) {
        throw new Error("CNPJ não encontrado");
      }

      const cnaesArray = Array.isArray(rawData.cnaes) ? rawData.cnaes : [];
      const principalItem = cnaesArray.find((c: any) => c.is_principal);
      const secundariosItems = cnaesArray.filter((c: any) => !c.is_principal);

      const formattedData = {
        cnpj: rawData.cnpj || cleanCnpj,
        razao_social: rawData.razao_social || rawData.nome_fantasia || "",
        cnae_principal_formatted: principalItem
          ? `${principalItem.codigo} - ${principalItem.descricao}`
          : rawData.cnae_principal
            ? `${rawData.cnae_principal} - (CNAE principal)`
            : null,
        cnaes_secundarios_formatted:
          secundariosItems.length > 0
            ? secundariosItems.map((c: any) => `${c.codigo} - ${c.descricao}`)
            : Array.isArray(rawData.cnaes_secundarios)
              ? rawData.cnaes_secundarios.map(
                  (code: string) => `${code} - (CNAE secundário)`,
                )
              : [],
      };

      setCnpjData(formattedData);
    } catch (err: any) {
      console.error("Erro CNPJ:", err);
      setCnpjError("CNPJ não encontrado ou instabilidade no serviço OpenCNPJ.");
    } finally {
      setIsCnpjLoading(false);
    }
  };

  const handleCnpjSelect = (cnaeString: string, index: number) => {
    setSelectedCnaeIndex(index);
    setActiveCnpj(cnpjData);

    const cleanCnae = cnaeString
      .split(" - ")[0]
      .replace(/[.\-/]/g, "")
      .trim();
    setSearchMode("cnae");
    setUseSearchTerm(cleanCnae);

    // Look up in CNAE catalog
    const catalogItem = cnaeCatalogData.find(
      (c) =>
        getVal(c, ["ID_Unificado", "id_unificado"])
          .replace(/[.\-/]/g, "")
          .trim() === cleanCnae,
    );
    if (catalogItem) {
      setSelectedCnaeCatalogItem(catalogItem);
    }
  };

  const getCnaeHierarchy = (cnae: any) => {
    if (!cnae) return [];
    const hierarchy = [];

    const d = getVal(cnae, ["divisaoCnae2.2", "Divisão (CNAE 2.2)"]);
    if (d) hierarchy.push({ label: "Divisão", value: d });

    const g = getVal(cnae, ["grupoCnae2.2", "Grupo (CNAE 2.2)"]);
    if (g) hierarchy.push({ label: "Grupo", value: g });

    const c = getVal(cnae, ["classeCnae2.2", "Classe (CNAE 2.2)"]);
    if (c) hierarchy.push({ label: "Classe", value: c });

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

  const CnaeHierarchy = ({ cnae }: { cnae: any }) => {
    const hierarchy = getCnaeHierarchy(cnae);
    return (
      <div className="flex flex-col gap-1 text-[11px] leading-tight text-slate-600 dark:text-slate-300">
        {hierarchy.map((h, i) => (
          <div key={i} className="flex items-start gap-1">
            <span className="font-semibold text-slate-400 shrink-0">
              {h.label}:
            </span>
            <span className="font-normal text-slate-700 dark:text-slate-200">
              {h.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const DIVISAO_COLORS: Record<string, string> = {
    "Categoria de uso": "bg-blue-400",
    "Subcategoria de uso": "bg-indigo-400",
    Tipologia: "bg-emerald-400",
    "Grupo de atividades": "bg-amber-400",
    Atividade: "bg-sky-400",
    Subtipologia: "bg-purple-400",
  };

  // Search in "CNAE" Catalog Sheet (Federal levels)
  const searchedCnaeItems = useMemo(() => {
    if (
      searchMode !== "cnae" ||
      !debouncedCnaeSearchTerm ||
      debouncedCnaeSearchTerm.trim().length < 2
    ) {
      return [];
    }

    const termNormalized = debouncedCnaeSearchTerm.trim().toLowerCase();
    const termCleaned = termNormalized.replace(/[^a-z0-9]/g, "");

    return cnaeCatalogData
      .filter((item: any) => {
        const nivel = getVal(item, ["Nivel", "nivel", "nível"])
          .toLowerCase()
          .trim();
        // Users map to either Class (Classe) or Subclass (Subclasse) levels
        if (nivel !== "classe" && nivel !== "subclasse") return false;

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

        return (
          denominacao.includes(termNormalized) ||
          code.includes(termNormalized) ||
          codeClean.includes(termCleaned)
        );
      })
      .slice(0, 50);
  }, [searchMode, debouncedCnaeSearchTerm, cnaeCatalogData]);

  // Find LPUOS municipal activities corresponding to the selected CNAE
  const equivalentUses = useMemo(() => {
    if (!selectedCnaeCatalogItem) return [];

    const selectedCnaeCode = getVal(selectedCnaeCatalogItem, [
      "ID_Unificado",
      "id_unificado",
    ])
      .replace(/[.\-/]/g, "")
      .trim()
      .toLowerCase();

    // Look up in mapped "CNAEs por Atividade"
    const mappedRows = cnaeData.filter((mapping: any) => {
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

      return (
        subclassMapped === selectedCnaeCode || classMapped === selectedCnaeCode
      );
    });

    const results: any[] = [];

    mappedRows.forEach((mapping: any) => {
      const targetCode =
        mapping.atividade ||
        mapping.grupoAtividades ||
        getVal(mapping, [
          "atividade",
          "grupoAtividades",
          "Grupo de Atividades",
        ]);

      if (!targetCode) return;

      const usoRecord = usosData.find(
        (u) => getVal(u, ["Código", "Codigo", "codigo"]) === targetCode,
      );

      if (!usoRecord) return;

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
      const catalogItem = cnaeCatalogData.find(
        (c) =>
          getVal(c, ["ID_Unificado", "id_unificado"]) === subclassCode ||
          getVal(c, ["Subclasse", "subclasse"]) === subclassCode,
      );
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
      return (
        <div className="bg-background rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-none animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden flex flex-col gap-2.5 pl-5">
          <div
            className={`absolute top-0 left-0 w-1 h-full ${DIVISAO_COLORS[divisao] || "bg-muted"}`}
          />
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-0.5 pr-8">
              <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
                CNPJ escolhido
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                {activeCnpj.cnpj.replace(
                  /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                  "$1.$2.$3/$4-$5",
                )}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                {activeCnpj.razao_social ||
                  activeCnpj.nome_fantasia ||
                  "Sem nome"}
              </div>
            </div>
            <button
              onClick={() => {
                clearSelection();
                setActiveCnpj(null);
                setSelectedCnaeCatalogItem(null);
                setIsCnaeHierarchyOpen(false);
              }}
              className="absolute top-3.5 right-3 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-muted-foreground transition-colors focus:outline-none"
            >
              <X className="h-3.5 h-3.5" />
            </button>
          </div>

          {selectedCnaeHierarchy && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-1 w-full">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Atividade federal (CNAE) confirmada
              </span>
              <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                {getVal(cnaeOriginario, [
                  "subclassesCnae2.2",
                  "Subclasses (CNAE 2.2)",
                ]) ||
                  getVal(cnaeOriginario, [
                    "classeCnae2.2",
                    "Classe (CNAE 2.2)",
                  ])}
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-normal">
                {getVal(cnaeOriginario, [
                  "denominacaoCnae2.2",
                  "Denominação (CNAE 2.2)",
                ])}
              </p>
              <button
                type="button"
                onClick={() => setIsCnaeHierarchyOpen(!isCnaeHierarchyOpen)}
                className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1 focus:outline-none mt-1"
              >
                {isCnaeHierarchyOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {isCnaeHierarchyOpen
                    ? "Ocultar estrutura detalhada"
                    : "Ver estrutura detalhada do CNAE"}
                </span>
              </button>
              {isCnaeHierarchyOpen && (
                <div className="mt-1 animate-in fade-in duration-200">
                  {renderCnaeHierarchyItems(selectedCnaeHierarchy, true)}
                </div>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-1.5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Uso municipal selecionado
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {divisao}{" "}
                <span className="text-slate-500 font-semibold">({codigo})</span>
              </span>
            </div>
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug">
              {descricao}
            </h3>
          </div>
        </div>
      );
    }

    // Render 2: CNAE Flow Selection Card
    if (selectedCnaeHierarchy) {
      return (
        <div className="bg-background rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-none animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden flex flex-col gap-2.5 pl-5">
          <div
            className={`absolute top-0 left-0 w-1 h-full ${DIVISAO_COLORS[divisao] || "bg-muted"}`}
          />
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-0.5 pr-8 w-full">
              <div className="text-[9px] font-semibold text-primary uppercase tracking-wide">
                Atividade federal (CNAE) escolhida
              </div>
              <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 mt-1">
                {getVal(cnaeOriginario, [
                  "subclassesCnae2.2",
                  "Subclasses (CNAE 2.2)",
                ]) ||
                  getVal(cnaeOriginario, [
                    "classeCnae2.2",
                    "Classe (CNAE 2.2)",
                  ])}
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-normal mb-1">
                {getVal(cnaeOriginario, [
                  "denominacaoCnae2.2",
                  "Denominação (CNAE 2.2)",
                ])}
              </p>
              <button
                type="button"
                onClick={() => setIsCnaeHierarchyOpen(!isCnaeHierarchyOpen)}
                className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1 focus:outline-none self-start"
              >
                {isCnaeHierarchyOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {isCnaeHierarchyOpen
                    ? "Ocultar estrutura detalhada"
                    : "Ver estrutura detalhada do CNAE"}
                </span>
              </button>
              {isCnaeHierarchyOpen && (
                <div className="mt-2 animate-in fade-in duration-200">
                  {renderCnaeHierarchyItems(selectedCnaeHierarchy, true)}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                clearSelection();
                setActiveCnpj(null);
                setSelectedCnaeCatalogItem(null);
                setIsCnaeHierarchyOpen(false);
              }}
              className="absolute top-3.5 right-3 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-muted-foreground transition-colors focus:outline-none"
            >
              <X className="h-3.5 h-3.5" />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-1">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Uso municipal selecionado
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {divisao}{" "}
                <span className="text-slate-500 font-semibold">({codigo})</span>
              </span>
            </div>
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug">
              {descricao}
            </h3>
          </div>
        </div>
      );
    }

    // Render 3: Uso Flow Selection Card (Direct selection)
    return (
      <div className="bg-background rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-none animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden flex flex-col gap-2.5 pl-5">
        <div
          className={`absolute top-0 left-0 w-1 h-full ${DIVISAO_COLORS[divisao] || "bg-muted"}`}
        />
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-0.5 pr-8">
            <div className="text-[9px] font-semibold text-primary uppercase tracking-wide">
              Uso municipal selecionado
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {divisao}{" "}
                <span className="text-slate-500 font-semibold">({codigo})</span>
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
              {descricao}
            </h3>
          </div>
          <button
            onClick={() => {
              clearSelection();
              setActiveCnpj(null);
              setSelectedCnaeCatalogItem(null);
              setIsCnaeHierarchyOpen(false);
            }}
            className="absolute top-3.5 right-3 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-muted-foreground transition-colors focus:outline-none"
          >
            <X className="h-3.5 h-3.5" />
          </button>
        </div>

        {hierarchy.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-1 w-full">
            <button
              type="button"
              onClick={() => setIsUsoHierarchyOpen(!isUsoHierarchyOpen)}
              className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1 focus:outline-none py-0.5"
            >
              {isUsoHierarchyOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              <span>
                {isUsoHierarchyOpen
                  ? "Ocultar classificação completa"
                  : "Ver classificação completa"}
              </span>
            </button>
            {isUsoHierarchyOpen && (
              <div className="mt-1 flex flex-col gap-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400 animate-in fade-in duration-200">
                {hierarchy.map((h, i) => (
                  <div key={i} className="flex items-start gap-1">
                    <span className="font-semibold text-slate-400 shrink-0">
                      {h.label}:
                    </span>
                    <span className="text-slate-650 dark:text-slate-200">
                      {h.text}{" "}
                      {h.code && (
                        <span className="text-[9px] text-slate-450">
                          ({h.code})
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 relative w-full z-50 h-full">
      {!selectedCnaeCatalogItem && useSearchTerm.trim().length === 0 && (
        <Tabs
          value={searchMode}
          onValueChange={(v) => {
            const nextMode = v as "atividade" | "cnae" | "cnpj";
            setSearchMode(nextMode);
            if (nextMode !== "cnpj") {
              setCnpjData(null);
              setSelectedCnaeIndex(null);
            }
            if (nextMode === "atividade") setActiveCnpj(null);
            setSelectedCnaeCatalogItem(null);
            setIsCnaeHierarchyOpen(false);
          }}
          className="w-full"
        >
          <TabsList className="w-full bg-muted h-10 p-1 rounded-xl">
            <TabsTrigger
              value="atividade"
              className="flex-1 text-xs font-medium rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Uso
            </TabsTrigger>
            <TabsTrigger
              value="cnae"
              className="flex-1 text-xs font-medium rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              CNAE
            </TabsTrigger>
            <TabsTrigger
              value="cnpj"
              className="flex-1 text-xs font-medium rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              CNPJ
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Main search text input */}
      {!selectedCnaeCatalogItem && (
        <div className="relative w-full flex items-center group">
          <Input
            placeholder={
              searchMode === "atividade"
                ? "Pesquise por código ou descrição..."
                : searchMode === "cnae"
                  ? "Digite o código ou a descrição do CNAE..."
                  : "Digite o CNPJ da empresa..."
            }
            value={useSearchTerm}
            onChange={(e) => setUseSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchMode === "cnpj") {
                fetchCnpjData(useSearchTerm);
              }
            }}
            className="h-10 w-full rounded-2xl bg-background border-border focus:ring-primary/20 transition-all font-medium text-sm shadow-none pr-12 pl-4 text-foreground placeholder:text-muted-foreground"
          />

          <div className="absolute right-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                onOpenInfo?.(searchMode === "atividade" ? "uso" : searchMode)
              }
              className="text-muted-foreground hover:text-primary transition-colors focus:outline-none p-1"
              title="Mais informações sobre este campo"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            {searchMode === "cnpj" ? (
              <button
                onClick={() => fetchCnpjData(useSearchTerm)}
                className="w-7 h-7 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors focus:outline-none"
              >
                {isCnpjLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <div className="text-muted-foreground pointer-events-none p-1 flex items-center justify-center">
                {isSearchLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {searchMode === "cnpj" && cnpjError && (
        <div className="text-rose-500 text-xs font-medium px-2">
          {cnpjError}
        </div>
      )}

      {/* CNPJ Selection flow details list */}
      {searchMode === "cnpj" && cnpjData && (
        <div className="self-stretch pr-1 flex flex-col justify-start items-start gap-3 mt-2 bg-background border border-border p-4 rounded-2xl shadow-none animate-in fade-in duration-200 w-full">
          <div className="self-stretch flex flex-col justify-start items-start w-full">
            <div className="self-stretch text-muted-foreground text-[10px] font-semibold uppercase leading-4 mb-1">
              CNPJ Escolhido
            </div>
            <div className="self-stretch p-2.5 flex flex-col justify-start items-start gap-1 bg-muted/40 rounded-xl w-full border border-border/40">
              <div className="text-[10px] font-mono text-slate-500 select-all">
                {useSearchTerm}
              </div>
              <div className="flex-1 opacity-90 text-foreground text-xs font-semibold leading-snug break-words whitespace-normal w-full">
                {cnpjData.razao_social || cnpjData.nome_fantasia || "Sem nome"}
              </div>
            </div>
          </div>

          {cnpjData.cnae_principal_formatted && (
            <div className="self-stretch flex flex-col justify-start items-start w-full">
              <div className="self-stretch text-muted-foreground text-[10px] font-semibold uppercase leading-4 mb-1">
                Atividade federal (CNAE) confirmada
              </div>
              <button
                onClick={() =>
                  handleCnpjSelect(cnpjData.cnae_principal_formatted, -1)
                }
                className={`self-stretch p-2.5 flex items-center gap-2 rounded-xl text-left transition-colors border ${selectedCnaeIndex === -1 ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"} whitespace-normal break-words w-full`}
              >
                <div
                  className={`w-4 h-4 rounded-xl flex justify-center items-center shrink-0 border ${selectedCnaeIndex === -1 ? "bg-primary border-primary" : "border-slate-300 dark:border-slate-600"}`}
                >
                  {selectedCnaeIndex === -1 && (
                    <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                  )}
                </div>
                <div className="flex-1 text-foreground text-xs font-semibold leading-snug break-words whitespace-normal w-full">
                  {cnpjData.cnae_principal_formatted}
                </div>
              </button>
            </div>
          )}

          {cnpjData.cnaes_secundarios_formatted &&
            cnpjData.cnaes_secundarios_formatted.length > 0 && (
              <div className="self-stretch flex flex-col justify-start items-start w-full">
                <div className="self-stretch text-muted-foreground text-[10px] font-semibold uppercase leading-4 mb-1">
                  Atividades federais (CNAE) secundárias
                </div>
                <div className="flex flex-col w-full gap-1">
                  {cnpjData.cnaes_secundarios_formatted.map(
                    (cnae: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => handleCnpjSelect(cnae, idx)}
                        className={`self-stretch p-2.5 flex items-center gap-2 rounded-xl text-left transition-colors border ${selectedCnaeIndex === idx ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"} whitespace-normal break-words w-full`}
                      >
                        <div
                          className={`w-4 h-4 rounded-xl flex justify-center items-center shrink-0 border ${selectedCnaeIndex === idx ? "bg-primary border-primary" : "border-slate-300 dark:border-slate-600"}`}
                        >
                          {selectedCnaeIndex === idx && (
                            <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 text-foreground text-xs font-semibold leading-snug break-words whitespace-normal w-full">
                          {cnae}
                        </div>
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      {/* CNAE Selection flow details (Active once a CNAE is chosen from search list) */}
      {searchMode === "cnae" && selectedCnaeCatalogItem && (
        <div className="self-stretch pr-1 flex flex-col justify-start items-start gap-3 mt-2 bg-background border border-border p-3.5 rounded-2xl shadow-none animate-in fade-in duration-300 w-full">
          <div className="self-stretch flex justify-between items-start w-full">
            <div className="flex flex-col gap-0.5 pr-8 w-full">
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">
                Atividade federal (CNAE) confirmada
              </span>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 font-mono select-all">
                {getVal(selectedCnaeCatalogItem, ["Nivel", "nivel", "nível"])}{" "}
                {getVal(selectedCnaeCatalogItem, [
                  "ID_Unificado",
                  "id_unificado",
                ])}
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-snug break-words whitespace-normal w-full">
                {getVal(selectedCnaeCatalogItem, [
                  "Denominacao",
                  "denominacao",
                  "denominação",
                  "Denominação",
                ])}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCnaeCatalogItem(null);
                setIsCnaeHierarchyOpen(false);
              }}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-muted-foreground transition-colors focus:outline-none"
              title="Voltar para a busca"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Full Structure of the selected CNAE with Collapsible block */}
          {(() => {
            const h = getFullCnaeHierarchy(selectedCnaeCatalogItem);
            const selectedNivel = getVal(selectedCnaeCatalogItem, [
              "Nivel",
              "nivel",
              "nível",
            ])
              .toLowerCase()
              .trim();
            const isSubclass = selectedNivel === "subclasse";
            return (
              <div className="self-stretch pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-1 w-full">
                <button
                  type="button"
                  onClick={() => setIsCnaeHierarchyOpen(!isCnaeHierarchyOpen)}
                  className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1 focus:outline-none py-0.5"
                >
                  {isCnaeHierarchyOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isCnaeHierarchyOpen
                      ? "Ocultar estrutura detalhada"
                      : "Ver estrutura detalhada do CNAE"}
                  </span>
                </button>
                {isCnaeHierarchyOpen && (
                  <div className="mt-2 animate-in fade-in duration-200">
                    {renderCnaeHierarchyItems(h, isSubclass)}
                  </div>
                )}
              </div>
            );
          })()}

          {/* List of Equivalent Municipal Uses */}
          <div className="self-stretch flex flex-col justify-start items-start gap-2 pt-2 border-t border-border w-full">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Uso municipal correspondente
            </div>
            {equivalentUses.length === 0 ? (
              <p className="w-full text-[11px] text-rose-700 bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/10 p-3 rounded-xl leading-relaxed italic break-words whitespace-normal">
                Não há regras de zoneamento cadastradas para esta atividade do
                CNAE no Decreto paulistano nº 57.378/2016.
              </p>
            ) : (
              <div className="flex flex-col w-full gap-1.5">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5 leading-snug">
                  Selecione uma atividade para prosseguir com a análise
                  normativa no mapa:
                </p>
                <div className="relative w-full bg-background border border-border rounded-2xl shadow-none overflow-hidden max-h-[410px] overflow-y-auto">
                  <div className="divide-y divide-border">
                    {equivalentUses.map((equiv: any, idx: number) => {
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

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            onSelectUse(equiv.usoSearchResult);
                            setSelectedCnaeCatalogItem(null);
                            setIsCnaeHierarchyOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-muted focus:bg-muted focus:outline-none transition-all flex flex-col gap-1 border-b border-border/50 whitespace-normal break-words"
                        >
                          <div className="text-[10px] font-semibold text-slate-405 tracking-wide break-words whitespace-normal w-full">
                            <span className="uppercase">{equiv.divisao}</span>{" "}
                            <span className="text-slate-800 dark:text-slate-200 ml-1">
                              ({equiv.codigo})
                            </span>
                          </div>

                          <p className="text-[12px] text-slate-800 dark:text-slate-200 font-semibold leading-snug break-words whitespace-normal w-full">
                            {equiv.descricao}
                          </p>

                          {breadcrumbs.length > 0 && (
                            <div className="mt-1.5 text-[10px] leading-relaxed w-full break-words whitespace-normal text-slate-500 dark:text-slate-400">
                              {breadcrumbs.map((b, i) => (
                                <span
                                  key={i}
                                  className="inline break-words whitespace-normal"
                                >
                                  <span className="text-slate-400 font-medium">
                                    {b.label}:{" "}
                                  </span>
                                  <span className="text-slate-650 dark:text-slate-300 font-normal italic">
                                    {b.text}
                                  </span>
                                  {i < breadcrumbs.length - 1 && (
                                    <span className="text-slate-300 dark:text-slate-700 mx-1">
                                      /
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}

                          {equiv.descricaoComplementar && (
                            <div
                              className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-lg italic w-full mt-2 break-words whitespace-normal"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="font-semibold text-amber-600 dark:text-amber-400 block mb-0.5 not-italic text-[9px] uppercase tracking-wider">
                                Restrição municipal complementar
                              </span>
                              {equiv.descricaoComplementar}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CNAE Search Results Catalog dropdown list (Active when searching and no CNAE chosen) */}
      {searchMode === "cnae" &&
        searchedCnaeItems.length > 0 &&
        !selectedCnaeCatalogItem && (
          <div className="relative mt-2 w-full bg-background border border-border rounded-2xl shadow-none overflow-hidden max-h-[490px] overflow-y-auto animate-in fade-in duration-200">
            <div className="divide-y divide-border">
              {searchedCnaeItems.map((cnaeItem: any, idx: number) => {
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
                const isSelectable =
                  nivel.toLowerCase().trim() === "classe"
                    ? classMapped
                    : subclassMapped || classMapped;

                return (
                  <button
                    key={idx}
                    disabled={!isSelectable}
                    className={`w-full text-left px-4 py-3.5 hover:bg-muted focus:bg-muted focus:outline-none transition-all flex flex-col gap-1 border-b border-border/50 whitespace-normal break-words ${isSelectable ? "" : "opacity-80 cursor-not-allowed bg-muted/20"}`}
                    onClick={() => setSelectedCnaeCatalogItem(cnaeItem)}
                  >
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-[10px] font-bold text-primary tracking-wide uppercase">
                        {nivel} {code}
                      </span>
                      {isSelectable ? (
                        <span className="text-[9px] font-semibold text-emerald-500 ml-auto flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />{" "}
                          com correspondência nos usos municipais
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-rose-500 ml-auto flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full inline-block" />{" "}
                          sem correspondência nos usos municipais
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-[12px] font-semibold leading-snug ${isSelectable ? "text-slate-800 dark:text-slate-100" : "text-slate-400 line-through decoration-rose-500/40"}`}
                    >
                      {highlightTerm(denominacao, debouncedCnaeSearchTerm)}
                    </p>

                    <div className="flex flex-col gap-1 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl mt-1.5 border border-slate-100 dark:border-slate-800/60 leading-normal w-full">
                      <div className="text-[9px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                        Estrutura federal CNAE
                      </div>
                      {renderCnaeHierarchyItems(
                        h,
                        nivel.toLowerCase().trim() === "subclasse",
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      {/* CNAE Search No results found */}
      {searchMode === "cnae" &&
        searchedCnaeItems.length === 0 &&
        debouncedCnaeSearchTerm.trim().length >= 2 &&
        !selectedCnaeCatalogItem && (
          <div className="relative mt-2 w-full bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl shadow-none animate-in fade-in duration-200">
            <p className="text-[12px] text-amber-800 dark:text-amber-200 font-medium leading-relaxed italic">
              Não há correspondência entre o CNAE pesquisado e o Catálogo
              Nacional de Atividades Econômicas.
              <span className="block mt-1 font-normal opacity-80">
                Verifique o código ou a descrição digitada e tente novamente.
              </span>
            </p>
          </div>
        )}

      {/* Uso and CNPJ raw search results lists */}
      {searchMode !== "cnae" &&
        searchResults &&
        searchResults.resultados.length > 0 && (
          <div className="relative mt-2 w-full bg-background border border-border rounded-2xl shadow-none overflow-hidden max-h-[490px] overflow-y-auto animate-in fade-in duration-200">
            <div className="divide-y divide-border">
              {searchResults.resultados
                .filter((resultado: any) => {
                  if (searchMode !== "atividade") return true;
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
                  return (
                    [
                      "atividade",
                      "grupo de atividades",
                      "subtipologia",
                      "tipologia",
                    ].includes(div) || cod === "r1"
                  );
                })
                .map((resultado: any, idx: number) => {
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

                  return (
                    <button
                      key={idx}
                      className="w-full text-left px-4 py-3 hover:bg-muted focus:bg-muted focus:outline-none transition-all flex flex-col gap-1 border-b border-border/50 whitespace-normal break-words"
                      onClick={() => onSelectUse(resultado)}
                    >
                      <div className="text-[10px] font-semibold text-slate-405 tracking-wide">
                        <span className="uppercase">{divisao}</span>{" "}
                        <span className="text-slate-800 dark:text-slate-200 ml-1">
                          ({codigo})
                        </span>
                      </div>

                      <p className="text-[12px] text-slate-800 dark:text-slate-200 font-semibold leading-snug">
                        {highlightTerm(descricao, useSearchTerm)}
                      </p>

                      {breadcrumbs.length > 0 && (
                        <div className="mt-1.5 text-[10px] leading-relaxed w-full break-words text-slate-500 dark:text-slate-400">
                          {breadcrumbs.map((b, i) => (
                            <span key={i} className="inline">
                              <span className="text-slate-400 font-medium">
                                {b.label}:{" "}
                              </span>
                              <span className="text-slate-650 dark:text-slate-300 font-normal italic">
                                {b.text}
                              </span>
                              {i < breadcrumbs.length - 1 && (
                                <span className="text-slate-300 dark:text-slate-700 mx-1">
                                  /
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        )}
    </div>
  );
}
