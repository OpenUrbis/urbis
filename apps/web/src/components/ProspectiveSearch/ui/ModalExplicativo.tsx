import React from "react";
import { createPortal } from "react-dom";
import { RegraZonamento, CondicaoInstalacao } from "../utils/types";
import { NOTAS_DICTIONARY, formatParameter } from "../utils/labels";
import { X, Check, Info, AlertTriangle, HelpCircle } from "lucide-react";
import { useTheme } from "../../ThemeProvider";
import { LIGHT_COLORS, DARK_COLORS } from "../utils/colors";

interface ModalExplicativoProps {
  isOpen: boolean;
  onClose: () => void;
  regrasZonamento: RegraZonamento | null;
  condicoesInstalacao: CondicaoInstalacao[];
  hasCnaeUsed?: boolean;
  hasUrbanFilters?: boolean;
  hasPqaFilters?: boolean;
  hasAreaFilter?: boolean;
}

export function ModalExplicativo({
  isOpen,
  onClose,
  regrasZonamento,
  condicoesInstalacao,
  hasCnaeUsed = false,
  hasUrbanFilters = false,
  hasPqaFilters = false,
  hasAreaFilter = false,
}: ModalExplicativoProps) {
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const palette = isDark ? DARK_COLORS : LIGHT_COLORS;

  if (!isOpen) return null;

  // Organize parameter notes
  const parameterNotesMap: Record<string, string[]> = {};
  condicoesInstalacao.forEach((cond) => {
    (cond.notas || []).forEach((nota) => {
      // Clean the note string if it comes with parentheses from the data
      const cleanNota = nota.replace(/[()]/g, "").trim();
      if (!parameterNotesMap[cleanNota]) parameterNotesMap[cleanNota] = [];
      parameterNotesMap[cleanNota].push(cond.parametro);
    });
  });

  const NoteItem = ({
    noteId,
    targets,
    context,
  }: {
    noteId: string;
    targets: string[];
    context: "zonas" | "params";
  }) => (
    <div className="py-2">
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

  const statusItems = [
    {
      label: "Permitido",
      color: palette.P.hex,
      icon: Check,
      desc: "Uso permitido sem restrições",
    },
    {
      label: "Permitido com Condições",
      color: palette.C.hex,
      icon: Info,
      desc: "Uso permitido com notas específicas",
    },
    {
      label: "Proibido com exceções",
      color: palette.E.hex,
      icon: AlertTriangle,
      desc: "Uso proibido com possíveis exceções",
    },
    {
      label: "Proibido",
      color: palette.V.hex,
      icon: X,
      desc: "Uso completamente proibido",
    },
    {
      label: "Regime Especial",
      color: palette.Z.hex,
      icon: HelpCircle,
      desc: "Consultar legislação específica",
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-xl md:max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 border border-border overflow-hidden">
        {/* Simple Header */}
        <div className="px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4 flex justify-between items-start shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-base md:text-lg">
              Diretrizes e legendas
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 font-normal">
              Referência técnica da LPUOS (Lei nº 16.402/2016)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-muted dark:hover:bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Minimal Scrollable Content */}
        <div className="px-4 pb-4 md:px-6 md:pb-6 bg-background overflow-y-auto flex-1 space-y-6 md:space-y-8 custom-scrollbar pt-2">
          {/* Explicativos Dinâmicos */}
          <div className="space-y-4">
            {/* 1. PARÂMETROS URBANÍSTICOS */}
            {(hasUrbanFilters || hasPqaFilters) && (
              <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col gap-2 animate-in fade-in duration-300">
                <span className="text-xs font-semibold text-foreground uppercase">
                  {hasUrbanFilters && hasPqaFilters
                    ? "Parâmetros urbanísticos e de qualificação ambiental :"
                    : hasPqaFilters
                      ? "Parâmetros de qualificação ambiental (PQA) :"
                      : "Parâmetros urbanísticos :"}
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {hasUrbanFilters && hasPqaFilters
                    ? "Os resultados em contorno preto-e-branco tracejado no mapa representam a interseção das áreas do Município que atendem simultaneamente aos parâmetros urbanísticos de Zonas e aos parâmetros de qualificação ambiental (PQA) informados, obtidos pelo processamento de dados dos Quadros nº 2A, 3, 3A, 3C e/ou 4B da Lei n° 16.402/2016 (Lei de Parcelamento, Uso e Ocupação do Solo - LPUOS ou “Zoneamento”)."
                    : hasPqaFilters
                      ? "Os resultados em contorno preto-e-branco tracejado no mapa representam as áreas do Município que atendem aos parâmetros de qualificação ambiental (PQA) informados, obtidos pelo processamento de dados dos Quadros nº 3C e/ou 4B da Lei n° 16.402/2016 (Lei de Parcelamento, Uso e Ocupação do Solo - LPUOS ou “Zoneamento”)."
                      : "Os resultados em contorno preto-e-branco tracejado no mapa representam as áreas do Município que atendem aos parâmetros urbanísticos de Zonas informados, obtidos pelo processamento de dados dos Quadros nº 2A, 3, 3A e/ou 3C da Lei n° 16.402/2016 (Lei de Parcelamento, Uso e Ocupação do Solo - LPUOS ou “Zoneamento”)."}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal mt-1">
                  Foram considerados apenas os valores em regra,
                  desconsiderando-se as exceções dadas pelas notas dos quadros.
                  Também foram omitidos da seleção os parâmetros que possuem os
                  mesmos valores em todas as Zonas.
                </p>
              </div>
            )}

            {/* 2. PARÂMETROS IMOBILIÁRIOS */}
            {hasAreaFilter && (
              <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col gap-2 animate-in fade-in duration-300">
                <span className="text-xs font-semibold text-foreground uppercase">
                  Parâmetros imobiliários :
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  Os resultados em ciano no mapa representam as áreas do
                  Município que atendem aos parâmetros imobiliários informados,
                  e foram obtidas dos dados cadastrais tributários.
                </p>
              </div>
            )}

            {/* 3. PARÂMETRO URBANÍSTICO (USO) */}
            {regrasZonamento && (
              <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col gap-2 animate-in fade-in duration-300">
                <span className="text-xs font-semibold text-foreground">
                  Parâmetro urbanístico (Uso)
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  Os resultados no mapa em fundo colorido representam as áreas
                  do Município onde o uso pretendido informado é permitido ou
                  proibido, em regra ou excepcionalmente, e foram obtidos pelo
                  processamento de dados do Quadro nº 4 da Lei n° 16.402/2016
                  (Lei de Parcelamento, Uso e Ocupação do Solo - LPUOS ou
                  “Zoneamento”) e do anexo do Decreto nº 57.378/2016, que
                  regulamenta a categorização de usos municipal, atualizado e
                  consolidado até janeiro de 2026.
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal mt-1">
                  As Condições de Instalação foram obtidas pelo processamento de
                  dados do Quadro nº 4A da Lei n° 16.402/2016.
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal mt-1">
                  Também se enquadram como uso regrado por regime especial as
                  Áreas Livres (AL), espaços livres oriundos de parcelamentos do
                  solo que não tenham sido afetados como áreas verdes públicas,
                  como as ruas e canteiros centrais.
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal mt-1 font-medium italic">
                  Para as Tipologias HIS1, HIS2 e HMP, conferir regulamentação
                  especial (Decreto nº 63.728/2024 ou a que a substituir).
                </p>
              </div>
            )}

            {/* 4. CNAE COMPLEMENTAR */}
            {hasCnaeUsed && (
              <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col gap-2 animate-in fade-in duration-300">
                <span className="text-xs font-semibold text-foreground">
                  Correlação CNAE e usos complementares
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  Também foram processados dados da base do CNAE, da Comissão
                  Nacional de Classificação - CONCLA, do Instituto Brasileiro de
                  Geografia e Estatística - IBGE.
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal mt-1">
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    ATENÇÃO:
                  </span>{" "}
                  Algumas atividades são enquadradas como auxiliares pela
                  sistematização da CONCLA (conferir Resolução CONCLA nº
                  1/2008), e por isso não possuem CNAE próprio (nem
                  correspondência com uma atividade específica na legislação
                  paulistana). Como consequência, as seguintes atividades da lei
                  paulistana podem ocorrer junto a qualquer CNAE:
                </p>

                {/* CNAE Auxiliares Table */}
                <div className="overflow-x-auto rounded-xl border border-border mt-3">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-muted dark:bg-slate-900 border-b border-border">
                        <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300 w-1/4">
                          Atividade
                        </th>
                        <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300 w-3/4">
                          Descrição
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="p-2.5 font-mono text-slate-900 dark:text-slate-200">
                          nR1-4-1
                        </td>
                        <td className="p-2.5">Ambulatório</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-slate-900 dark:text-slate-200">
                          nR1-6-3
                        </td>
                        <td className="p-2.5">
                          Escritórios em geral, incluindo espaços para Locação
                          de Uso Compartilhado e “Co-Working”
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-slate-900 dark:text-slate-200">
                          nR1-6-7
                        </td>
                        <td className="p-2.5">Showroom sem venda no local</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-slate-900 dark:text-slate-200">
                          nR1-15-1
                        </td>
                        <td className="p-2.5">
                          Depósitos de material em geral, exceto inflamáveis ou
                          explosivos
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-slate-900 dark:text-slate-200">
                          nR1-15-4
                        </td>
                        <td className="p-2.5">
                          Estacionamento e garagens de veículos com até 40 vagas
                          (inclusive no sistema de garagens subterrâneas),
                          admitindo em conjunto serviços de lavagem de carros
                          manual ou à seco sem serviços automotivos
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-slate-900 dark:text-slate-200">
                          nR2-5-1
                        </td>
                        <td className="p-2.5">Ambulatório</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-slate-900 dark:text-slate-200">
                          nR2-12-1
                        </td>
                        <td className="p-2.5">
                          Depósitos de material em geral, exceto explosivos
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-slate-900 dark:text-slate-200">
                          nR2-12-4
                        </td>
                        <td className="p-2.5">
                          Estacionamento e garagens de veículos com mais de 40 e
                          até 200 vagas de automóvel (inclusive no sistema de
                          garagens subterrâneas) admitindo em conjunto serviços
                          de lavagem de carros manual ou à seco sem serviços
                          automotivos
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-slate-900 dark:text-slate-200">
                          nR3-6-1
                        </td>
                        <td className="p-2.5">
                          Depósitos de material em geral, exceto inflamáveis
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-slate-900 dark:text-slate-200">
                          nR3-6-5
                        </td>
                        <td className="p-2.5">
                          Estacionamento e garagens de veículos com mais 200
                          vagas de automóvel (inclusive no sistema de garagens
                          subterrâneas) admitindo em conjunto serviços de
                          lavagem de carros manual ou à seco sem serviços
                          automotivos
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-slate-900 dark:text-slate-200">
                          nR3-8-1
                        </td>
                        <td className="p-2.5">Ambulatório</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Legend Section - Pure Text Style */}
          <section>
            <h4 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 mb-8 pb-2 border-b border-gray-50 dark:border-slate-800">
              Legenda de permissibilidade
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 row-gap-8 pb-2">
              {statusItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5"
                      style={{ backgroundColor: item.color }}
                    >
                      <Icon className="w-2.5 h-2.5" strokeWidth={4} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-900 dark:text-slate-200 leading-none block mb-1">
                        {item.label}
                      </span>
                      <p className="text-[11px] text-gray-400 dark:text-slate-400 font-normal leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Combined Notes Section */}
          <section>
            <h4 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 mb-4 pb-2 border-b border-gray-50 dark:border-slate-800">
              Notas
            </h4>

            <div className="space-y-4 divide-y divide-gray-50 dark:divide-slate-800">
              {regrasZonamento &&
                Object.entries(regrasZonamento.simComNota).map(
                  ([nota, zonas]) => (
                    <NoteItem
                      key={`sim-${nota}`}
                      noteId={nota}
                      targets={zonas}
                      context="zonas"
                    />
                  ),
                )}
              {regrasZonamento &&
                Object.entries(regrasZonamento.naoComNota).map(
                  ([nota, zonas]) => (
                    <NoteItem
                      key={`nao-${nota}`}
                      noteId={nota}
                      targets={zonas}
                      context="zonas"
                    />
                  ),
                )}
              {Object.entries(parameterNotesMap).map(([nota, params]) => (
                <NoteItem
                  key={`param-${nota}`}
                  noteId={nota}
                  targets={params}
                  context="params"
                />
              ))}

              {(!regrasZonamento ||
                (Object.keys(regrasZonamento.simComNota).length === 0 &&
                  Object.keys(regrasZonamento.naoComNota).length === 0)) &&
                Object.keys(parameterNotesMap).length === 0 && (
                  <p className="text-xs text-gray-400 italic py-4">
                    Nenhuma nota específica aplicável para este uso.
                  </p>
                )}
            </div>
          </section>
        </div>

        {/* Simple Footer */}
        <div className="px-4 py-3 md:px-6 md:py-4 border-t border-border flex justify-end shrink-0 bg-background">
          <button
            onClick={onClose}
            className="px-4 py-2 md:px-6 md:py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-slate-200 font-semibold text-xs transition-all active:scale-95"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
