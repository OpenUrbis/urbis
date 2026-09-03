import React from "react";
import {
  RegraZonamento,
  CondicaoInstalacao,
  UsoSearchResultItem,
} from "../utils/types";
import { formatParameter, NOTAS_DICTIONARY } from "../utils/labels";
import {
  ShieldCheck,
  AlertCircle,
  Info,
  Check,
  AlertTriangle,
  X,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@open-urbis/map-ui";
import { useTheme } from "../../ThemeProvider";
import { LIGHT_COLORS, DARK_COLORS } from "../utils/colors";

interface ResultsTableProps {
  regrasZonamento: RegraZonamento | null;
  condicoesInstalacao: CondicaoInstalacao[];
  selectedUse: UsoSearchResultItem | null;
  filteredZones?: string[];
  compatiblePqas?: string[];
  allPqaNames?: string[];
  hasPqaFilters?: boolean;
  hasUrbanFilters?: boolean;
  hasAreaFilter?: boolean;
  showInterpretationGuide?: boolean;
  setExplicativoOpen: (open: boolean) => void;
  setSelectedNoteId: (id: string | null) => void;
  onOpenInfo?: (
    type: "uso" | "cnae" | "cnpj" | "parametros" | "area" | "ver-prospeccao",
  ) => void;
}

export function ResultsTable({
  regrasZonamento,
  condicoesInstalacao,
  selectedUse,
  filteredZones,
  compatiblePqas = [],
  allPqaNames = [],
  hasPqaFilters = false,
  hasUrbanFilters = false,
  hasAreaFilter = false,
  showInterpretationGuide = true,
  setExplicativoOpen: _setExplicativoOpen,
  setSelectedNoteId,
  onOpenInfo,
}: ResultsTableProps) {
  const { theme } = useTheme();

  // Logic to determine if we should use dark colors based on design system
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const getVal = (obj: any, keys: string[]) => {
    if (!obj) return "";
    const foundKey = Object.keys(obj).find((k) =>
      keys.some((key) => key.toLowerCase() === k.trim().toLowerCase()),
    );
    return foundKey ? obj[foundKey] : "";
  };

  const codigoAlvo = selectedUse
    ? getVal(selectedUse.item, ["Código", "Codigo"])
    : "";

  // Organize parameter notes for inline display
  const parameterNotesMap: Record<string, string[]> = {};
  condicoesInstalacao.forEach((cond) => {
    (cond.notas || []).forEach((nota) => {
      const cleanNota = nota.replace(/[()]/g, "").trim();
      if (!parameterNotesMap[cleanNota]) parameterNotesMap[cleanNota] = [];
      parameterNotesMap[cleanNota].push(cond.parametro);
    });
  });

  const renderNoteItem = (
    noteId: string,
    targets: string[],
    context: "zonas" | "params",
  ) => (
    <div className="py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[11px] font-semibold text-gray-900 dark:text-slate-100 whitespace-nowrap">
          Nota ({noteId.replace(/[()]/g, "")})
        </span>
        <span className="text-[10px] text-gray-400 font-normal">
          {context === "zonas"
            ? "Aplicável às zonas"
            : "Aplicável aos parâmetros"}
          :{" "}
          {targets
            .map((t) => (context === "params" ? formatParameter(t) : t))
            .join(", ")}
        </span>
      </div>
      <p className="text-[12px] text-gray-600 dark:text-slate-300 leading-relaxed font-normal">
        {NOTAS_DICTIONARY[noteId.replace(/[()]/g, "")] ||
          NOTAS_DICTIONARY[noteId] ||
          "Texto da nota não encontrado."}
      </p>
    </div>
  );

  const getNoteDescription = (noteId: string) => {
    const cleanNoteId = noteId.replace(/[()]/g, "").trim();
    return (
      NOTAS_DICTIONARY[cleanNoteId] ||
      NOTAS_DICTIONARY[noteId] ||
      "Texto da nota não encontrado."
    );
  };

  const filterZones = (zones: string[]) => {
    if (!filteredZones) return zones;
    return zones.filter((z) => filteredZones.includes(z));
  };

  const hasRules = !!regrasZonamento;
  const hasFiltersOnly = !selectedUse && (hasUrbanFilters || hasPqaFilters);

  if (!hasRules && !hasFiltersOnly) {
    return (
      <div className="p-12 text-center bg-background rounded-xl border border-dashed border-border flex flex-col items-center animate-in fade-in duration-500">
        <AlertCircle className="w-8 h-8 text-muted-foreground mb-4" />
        <h4 className="text-lg font-semibold text-foreground mb-1">
          Sem diretrizes específicas
        </h4>
        <p className="text-xs text-muted-foreground max-w-sm font-normal">
          {selectedUse ? (
            <>
              O uso{" "}
              <span className="text-primary font-semibold">{codigoAlvo}</span>{" "}
              não possui restrições cadastradas.
            </>
          ) : (
            "Nenhum parâmetro urbanístico ou imobiliário está configurado."
          )}
        </p>
      </div>
    );
  }

  const filteredSimSemNota = regrasZonamento?.simSemNota
    ? filterZones(regrasZonamento.simSemNota)
    : [];
  const filteredSimComNota = regrasZonamento?.simComNota
    ? Object.entries(regrasZonamento.simComNota).reduce(
        (acc, [nota, zones]) => {
          const filtered = filterZones(zones);
          if (filtered.length > 0) acc[nota] = filtered;
          return acc;
        },
        {} as Record<string, string[]>,
      )
    : {};

  const filteredNaoComNota = regrasZonamento?.naoComNota
    ? Object.entries(regrasZonamento.naoComNota).reduce(
        (acc, [nota, zones]) => {
          const filtered = filterZones(zones);
          if (filtered.length > 0) acc[nota] = filtered;
          return acc;
        },
        {} as Record<string, string[]>,
      )
    : {};

  const filteredNaoSemNota = regrasZonamento?.naoSemNota
    ? filterZones(regrasZonamento.naoSemNota)
    : [];
  const filteredZoeZep = regrasZonamento?.zoeZep
    ? filterZones(regrasZonamento.zoeZep)
    : [];

  const palette = isDark ? DARK_COLORS : LIGHT_COLORS;

  const statusMap = {
    P: {
      label: "Permitido",
      color: palette.P.hex,
      icon: Check,
      desc: "Uso permitido sem restrições",
    },
    C: {
      label: "Permitido com Condições",
      color: palette.C.hex,
      icon: Info,
      desc: "Uso permitido com notas específicas",
    },
    E: {
      label: "Proibido com exceções",
      color: palette.E.hex,
      icon: AlertTriangle,
      desc: "Uso proibido com possíveis exceções",
    },
    V: {
      label: "Proibido",
      color: palette.V.hex,
      icon: X,
      desc: "Uso completamente proibido",
    },
    Z: {
      label: "Regime Especial",
      color: palette.Z.hex,
      icon: HelpCircle,
      desc: "Consultar legislação específica",
    },
  };

  const getStatusBadge = (key: keyof typeof statusMap) => {
    const item = statusMap[key];
    const StatusIcon = item.icon;
    // Map uses variable opacity (215-245), legend uses 100% for the icon and low opacity for the background
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm shrink-0"
          style={{ backgroundColor: item.color }}
        >
          <StatusIcon className="w-3.5 h-3.5" strokeWidth={3} />
        </div>
        <div
          className="px-3 py-1 rounded-md text-[10px] font-semibold border whitespace-nowrap"
          style={{
            backgroundColor: isDark ? `${item.color}26` : `${item.color}15`,
            color: item.color,
            borderColor: isDark ? `${item.color}40` : `${item.color}30`,
          }}
        >
          {item.label}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {(selectedUse || hasUrbanFilters || hasAreaFilter || hasPqaFilters) &&
        showInterpretationGuide && (
          <div className="rounded-2xl border border-border bg-muted/20 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="space-y-4 flex-1">
                <h4 className="text-sm font-semibold text-foreground">
                  Como interpretar estes resultados
                </h4>
                <div className="flex flex-col gap-4 divide-y divide-border/30">
                  {/* 1. PARÂMETROS URBANÍSTICOS (OUTROS) */}
                  {(hasUrbanFilters || hasPqaFilters) && (
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-foreground block uppercase">
                        Parâmetros urbanísticos (Outros)
                      </span>
                      <p className="text-[11px] leading-relaxed text-muted-foreground font-normal">
                        Os resultados em contorno preto-e-branco tracejado no mapa
                        representam as áreas do Município que atendem aos
                        parâmetros urbanísticos e imobiliários informados, e foram
                        obtidas pelo processamento de dados dos Quadros nº 2A, 3,
                        3A, 3C e/ou 4B da Lei n° 16.402/2016 (Lei de Parcelamento,
                        Uso e Ocupação do Solo - LPUOS ou “Zoneamento”), relativos
                        a parâmetros urbanísticos relacionados a Zonas e a
                        Perímetros de Qualificação Ambiental.
                      </p>
                      <p className="text-[11px] leading-relaxed text-muted-foreground font-normal mt-1">
                        Foram considerados apenas os valores em regra,
                        desconsiderando-se as exceções dadas pelas notas dos
                        quadros. Também foram omitidos da seleção os parâmetros
                        que possuem os mesmos valores em todas as Zonas.
                      </p>
                    </div>
                  )}

                  {/* 2. PARÂMETROS IMOBILIÁRIOS */}
                  {hasAreaFilter && (
                    <div className="space-y-1 pt-3">
                      <span className="text-xs font-semibold text-foreground block uppercase">
                        Parâmetros imobiliários
                      </span>
                      <p className="text-[11px] leading-relaxed text-muted-foreground font-normal">
                        Os resultados em ciano no mapa representam as áreas do
                        Município que atendem aos parâmetros imobiliários
                        informados, e foram obtidas dos dados cadastrais
                        tributários.
                      </p>
                    </div>
                  )}

                  {/* 3. PARÂMETRO URBANÍSTICO (USO) */}
                  {selectedUse && (
                    <div className="space-y-1 pt-3">
                      <span className="text-xs font-semibold text-foreground block">
                        Parâmetro urbanístico (Uso)
                      </span>
                      <p className="text-[11px] leading-relaxed text-muted-foreground font-normal">
                        Os resultados no mapa em fundo colorido representam as
                        áreas do Município onde o uso pretendido informado é
                        permitido ou proibido, em regra ou excepcionalmente, e
                        foram obtidos pelo processamento de dados do Quadro nº 4
                        da Lei n° 16.402/2016 (Lei de Parcelamento, Uso e Ocupação
                        do Solo - LPUOS ou “Zoneamento”) e do anexo do Decreto nº
                        57.378/2016, que regulamenta a categorização de usos
                        municipal, atualizado e consolidado até janeiro de 2026.
                      </p>
                      <p className="text-[11px] leading-relaxed text-muted-foreground font-normal mt-1">
                        As Condições de Instalação foram obtidas pelo
                        processamento de dados do Quadro nº 4A da Lei n°
                        16.402/2016.
                      </p>
                      <p className="text-[11px] leading-relaxed text-muted-foreground font-normal mt-1">
                        Também se enquadram como uso regrado por regime especial
                        as Áreas Livres (AL), espaços livres oriundos de
                        parcelamentos do solo que não tenham sido afetados como
                        áreas verdes públicas, como as ruas e canteiros centrais.
                      </p>
                      <p className="text-[11px] leading-relaxed text-muted-foreground font-normal mt-1 font-medium italic">
                        Para as Tipologias HIS1, HIS2 e HMP, conferir
                        regulamentação especial (Decreto nº 63.728/2024 ou a que a
                        substituir).
                      </p>
                    </div>
                  )}

                  {/* 4. CNAE FLOW COMPLEMENT */}
                  {selectedUse && selectedUse.cnaeOriginario && (
                    <div className="space-y-2 pt-3">
                      <span className="text-xs font-semibold text-foreground block">
                        Correlação CNAE e usos complementares
                      </span>
                      <p className="text-[11px] leading-relaxed text-muted-foreground font-normal">
                        Também foram processados dados da base do CNAE, da
                        Comissão Nacional de Classificação - CONCLA, do Instituto
                        Brasileiro de Geografia e Estatística - IBGE.{" "}
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          ATENÇÃO:
                        </span>{" "}
                        Algumas atividades são enquadradas como auxiliares pela
                        sistematização da CONCLA (conferir Resolução CONCLA nº
                        1/2008), e por isso não possuem CNAE próprio (nem
                        correspondência com uma atividade específica na legislação
                        paulistana). Para consultar a lista das atividades auxiliares,
                        veja as{" "}
                        <button
                          type="button"
                          onClick={() => onOpenInfo?.("cnae")}
                          className="font-semibold text-primary underline focus:outline-none"
                        >
                          informações sobre CNAE
                        </button>.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Legend Card - Always show when there is any active search filters */}
      {(selectedUse || hasUrbanFilters || hasAreaFilter || hasPqaFilters) && (
        <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-muted/30 border-b border-border">
            <span className="text-[12px] font-semibold ">Legendas</span>
          </div>
          <div className="px-6 pt-4 pb-4 flex flex-col gap-4">
            {selectedUse && (
              <div className="flex flex-wrap gap-x-12 gap-6 row-gap-2">
                {Object.entries(statusMap).map(([key, item]) => (
                  <div key={key} className="flex items-center gap-1">
                    {getStatusBadge(key as keyof typeof statusMap)}
                    <span className="text-[10px] text-muted-foreground font-normal leading-snug">
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {(hasAreaFilter || hasUrbanFilters || hasPqaFilters) && (
              <div
                className={`w-full flex flex-col gap-3 ${selectedUse ? "pt-4 border-t border-border/50" : ""}`}
              >
                {(hasUrbanFilters || hasPqaFilters) && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md border-2 border-dashed bg-transparent flex items-center justify-center shadow-sm shrink-0 border-slate-700 dark:border-slate-300"></div>
                      <div className="px-3 py-1 rounded-md text-[10px] font-semibold border border-border bg-muted/40 text-foreground whitespace-nowrap">
                        Parâmetros urbanísticos
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-normal leading-snug">
                      Zonas e Perímetros que atendem aos critérios e parâmetros
                      urbanísticos ou ambientais (PQA) informados (contorno
                      tracejado no mapa).
                    </span>
                  </div>
                )}

                {hasAreaFilter && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-md border-2 bg-transparent flex items-center justify-center shadow-sm shrink-0"
                        style={{ borderColor: "#00FFFF" }}
                      ></div>
                      <div className="px-3 py-1 rounded-md text-[10px] font-semibold border border-cyan-400/40 bg-cyan-400/10 text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                        Parâmetros imobiliários
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-normal leading-snug">
                      Imóveis que atendem às especificações de área selecionadas
                      (representados em ciano no mapa).
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Installation Conditions Card */}
      {condicoesInstalacao.length > 0 && (
        <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-5 py-4">
            <div className="rounded-xl bg-amber-500/10 p-1.5">
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground">
                Condições de instalação
              </h4>
            </div>
          </div>
          <div className="p-4 md:p-5">
            <div className="grid gap-3">
              {condicoesInstalacao.map((condicao, idx) => {
                const notes = Array.from(new Set(condicao.notas || []));

                return (
                  <div
                    key={idx}
                    className="group rounded-2xl border border-border/80 bg-gradient-to-br from-background to-muted/[0.35] px-4 py-3.5 shadow-sm transition-colors hover:border-border"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
                          <span className="text-xs font-semibold text-foreground break-words max-w-full">
                            {formatParameter(condicao.parametro)}
                          </span>
                          <span className="hidden h-1 w-1 rounded-full bg-border sm:block shrink-0 mt-2" />
                          <span className="text-sm font-semibold leading-6 text-foreground break-all">
                            {condicao.valor || "N/A"}
                          </span>
                        </div>
                      </div>

                      {notes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 lg:max-w-[320px] lg:justify-end">
                          {notes.map((note) => (
                            <TooltipProvider key={note} delayDuration={150}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedNoteId(note)}
                                    className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-all cursor-help"
                                  >
                                    Nota {note}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  className="max-w-[320px] p-2.5 bg-background border border-border shadow-md text-xs font-normal leading-relaxed text-foreground rounded-lg z-[10000]"
                                  side="top"
                                  sideOffset={5}
                                >
                                  <p className="font-semibold mb-1 text-[11px] text-slate-500">
                                    Nota {note.replace(/[()]/g, "")}
                                  </p>
                                  <p>{getNoteDescription(note)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Combined Notes Section - Moved here from ModalExplicativo */}
      {selectedUse && (regrasZonamento || condicoesInstalacao.length > 0) && (
        <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-muted/30 px-5 py-4 border-b border-border">
            <h4 className="text-[11px] font-semibold text-muted-foreground">
              Notas
            </h4>
          </div>
          <div className="p-6">
            <div className="space-y-1">
              {regrasZonamento &&
                Object.entries(regrasZonamento.simComNota).map(
                  ([nota, zonas]) => (
                    <div id={`note-${nota}`} key={`sim-${nota}`}>
                      {renderNoteItem(nota, zonas, "zonas")}
                    </div>
                  ),
                )}
              {regrasZonamento &&
                Object.entries(regrasZonamento.naoComNota).map(
                  ([nota, zonas]) => (
                    <div id={`note-${nota}`} key={`nao-${nota}`}>
                      {renderNoteItem(nota, zonas, "zonas")}
                    </div>
                  ),
                )}
              {Object.entries(parameterNotesMap).map(([nota, params]) => (
                <div id={`note-${nota}`} key={`param-${nota}`}>
                  {renderNoteItem(nota, params, "params")}
                </div>
              ))}

              {(!regrasZonamento ||
                (Object.keys(regrasZonamento.simComNota).length === 0 &&
                  Object.keys(regrasZonamento.naoComNota).length === 0)) &&
                Object.keys(parameterNotesMap).length === 0 && (
                  <p className="text-xs text-gray-400 italic py-2">
                    Nenhuma nota específica aplicável para este uso.
                  </p>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      {(selectedUse || hasUrbanFilters || hasPqaFilters) && (
        <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-muted/30 px-5 py-4 border-b border-border flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-bold text-foreground leading-none">
                  {selectedUse
                    ? "Detalhes da prospecção por uso"
                    : "Zonas e Perímetros de Qualificação Ambiental identificados"}
                </h4>

                {selectedUse ? (
                  <div className="flex flex-col gap-1.5 mt-1.5">
                    <div className="flex flex-wrap items-center gap-x-2 row-gap-2">
                      {[
                        {
                          label: "Categoria",
                          text: getVal(selectedUse.arvore.categoria, [
                            "Descrição",
                          ]),
                        },
                        {
                          label: "Subcategoria",
                          text: getVal(selectedUse.arvore.subcategoria, [
                            "Descrição",
                          ]),
                        },
                        {
                          label: "Grupo/Tipologia",
                          text: getVal(selectedUse.arvore.tipologiaOuGrupo, [
                            "Descrição",
                          ]),
                        },
                      ]
                        .filter((b) => b.text)
                        .map((item, idx) => (
                          <React.Fragment key={idx}>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-foreground/80 font-semibold">
                                {item.label}:
                              </span>
                              <span className="text-[10px] text-foreground font-semibold">
                                {item.text}
                              </span>
                            </div>
                            {idx < 2 && (
                              <ChevronRight className="w-3 h-3 text-border" />
                            )}
                          </React.Fragment>
                        ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground mt-1 font-normal">
                    Listagem de zonas que atendem aos filtros técnicos
                    selecionados.
                  </p>
                )}
              </div>
            </div>
            {/* Explicativo button removed as content is now inline */}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/10">
                  <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground w-44">
                    {selectedUse ? "Status" : "Tipo"}
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground">
                    {selectedUse
                      ? "Setores / Zonas"
                      : "Zonas / Perímetros de Qualificação Ambiental"}
                  </th>
                  {selectedUse && (
                    <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground text-right w-36">
                      Notas
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* If no use is selected but we have filtered zones, show one big category */}
                {!selectedUse && filteredZones && hasUrbanFilters && (
                  <tr className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-md border-2 border-dashed bg-transparent flex items-center justify-center shadow-sm shrink-0"
                          style={{ borderColor: palette.SELECTED.outline }}
                        ></div>
                        <span className="px-3 py-1 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200">
                          Zonas identificadas por parâmetros
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {filteredZones.map((z, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-semibold bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border"
                          >
                            {z}
                          </span>
                        ))}
                      </div>
                    </td>
                    {selectedUse && (
                      <td className="px-5 py-4 text-right text-muted-foreground font-semibold">
                        -
                      </td>
                    )}
                  </tr>
                )}

                {selectedUse && filteredSimSemNota.length > 0 && (
                  <tr className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4">{getStatusBadge("P")}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {filteredSimSemNota.map((z, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-semibold bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border"
                          >
                            {z}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-muted-foreground font-semibold">
                      -
                    </td>
                  </tr>
                )}

                {selectedUse &&
                  Object.entries(filteredSimComNota).map(
                    ([nota, zonas], idx) => (
                      <tr
                        key={`sim-${idx}`}
                        className="hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-5 py-4">{getStatusBadge("C")}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {zonas.map((z, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-semibold bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border"
                              >
                                {z}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => setSelectedNoteId(nota)}
                                  size="sm"
                                  className="h-8 px-3 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20 transition-all shadow-none"
                                >
                                  <span className="text-[10px] font-semibold">
                                    Nota {nota}
                                  </span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent
                                className="max-w-[320px] p-2.5 bg-background border border-border shadow-md text-xs font-normal leading-relaxed text-foreground rounded-lg z-[10000]"
                                side="top"
                                sideOffset={5}
                              >
                                <p className="font-semibold mb-1 text-[11px] text-slate-500">
                                  Nota {nota.replace(/[()]/g, "")}
                                </p>
                                <p>{getNoteDescription(nota)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                      </tr>
                    ),
                  )}

                {selectedUse &&
                  Object.entries(filteredNaoComNota).map(
                    ([nota, zonas], idx) => (
                      <tr
                        key={`nao-com-${idx}`}
                        className="hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-5 py-4">{getStatusBadge("E")}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {zonas.map((z, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-semibold bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border"
                              >
                                {z}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => setSelectedNoteId(nota)}
                                  size="sm"
                                  className="h-8 px-3 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500/20 transition-all shadow-none"
                                >
                                  <span className="text-[10px] font-semibold">
                                    Nota {nota}
                                  </span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent
                                className="max-w-[320px] p-2.5 bg-background border border-border shadow-md text-xs font-normal leading-relaxed text-foreground rounded-lg z-[10000]"
                                side="top"
                                sideOffset={5}
                              >
                                <p className="font-semibold mb-1 text-[11px] text-slate-500">
                                  Nota {nota.replace(/[()]/g, "")}
                                </p>
                                <p>{getNoteDescription(nota)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                      </tr>
                    ),
                  )}

                {selectedUse && filteredZoeZep.length > 0 && (
                  <tr
                    key={`zoe-zep`}
                    className="hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-5 py-4">{getStatusBadge("Z")}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {filteredZoeZep.map((z, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-semibold bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border"
                          >
                            {z}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-muted-foreground font-semibold">
                      -
                    </td>
                  </tr>
                )}

                {selectedUse &&
                  filteredNaoSemNota &&
                  filteredNaoSemNota.length > 0 && (
                    <tr className="opacity-75 bg-muted/5 hover:bg-muted/10 transition-colors">
                      <td className="px-5 py-4">{getStatusBadge("V")}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {filteredNaoSemNota.map((z, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-semibold bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border"
                            >
                              {z}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-muted-foreground font-semibold">
                        -
                      </td>
                    </tr>
                  )}

                {/* 2. PQA ROWS (Grouped for compatible ones, individual for incompatible ones) */}
                {hasPqaFilters && compatiblePqas.length > 0 && (
                  <tr className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm shrink-0"
                          style={{ backgroundColor: palette.P.hex }}
                        >
                          <Check className="w-2.5 h-2.5" strokeWidth={4} />
                        </div>
                        <span className="text-[10px] font-semibold text-foreground/80 whitespace-nowrap">
                          PQA compatível
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {compatiblePqas.map((name, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-semibold bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </td>
                    {selectedUse && (
                      <td className="px-5 py-4 text-right text-muted-foreground font-semibold">
                        -
                      </td>
                    )}
                  </tr>
                )}

                {hasPqaFilters && allPqaNames.length > 0 && (
                  <>
                    {allPqaNames
                      .filter((name) => !compatiblePqas.includes(name))
                      .map((name, idx) => {
                        const color = palette.V.hex;
                        return (
                          <tr
                            key={`pqa-inc-${idx}`}
                            className="hover:bg-muted/10 transition-colors opacity-60 bg-muted/5"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm shrink-0"
                                  style={{ backgroundColor: color }}
                                >
                                  <X className="w-2.5 h-2.5" strokeWidth={4} />
                                </div>
                                <span className="text-[10px] font-semibold text-foreground/80">
                                  PQA incompatível
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-[10px] font-semibold bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border">
                                {name}
                              </span>
                            </td>
                            {selectedUse && (
                              <td className="px-5 py-4 text-right text-muted-foreground font-semibold">
                                -
                              </td>
                            )}
                          </tr>
                        );
                      })}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
