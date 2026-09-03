import React from "react";
import { useProspectiveSearchContext } from "./ProspectiveSearchContext";
import { ResultsTable } from "./ui/ResultsTable";
import { SynthesisModal } from "./ui/SynthesisModal";
import { ModalExplicativo } from "./ui/ModalExplicativo";
import { NotesModal } from "./ui/NotesModal";
import { ScrollArea } from "@open-urbis/map-ui";
import { Layers, Info, Search, Check } from "lucide-react";

export function DynamicSystemResults() {
  const state = useProspectiveSearchContext();

  const [synthesisModalOpen, setSynthesisModalOpen] = React.useState(false);
  const [explicativoOpen, setExplicativoOpen] = React.useState(false);
  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    if (state.synthesisMode) {
      setSynthesisModalOpen(true);
    }
  }, [state.synthesisMode]);

  const {
    regrasZonamento,
    condicoesInstalacao,
    compatibleZones,
    compatiblePqas,
    allPqaNames,
  } = state;

  return (
    <div className="flex-1 bg-background h-full overflow-hidden flex flex-col relative min-w-0 z-10">
      <ScrollArea className="h-full w-full">
        <div className="mx-auto flex h-full w-full max-w-[860px] flex-col p-4 md:p-6 lg:p-7">
          {state.synthesisMode ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="mb-10 flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-semibold  dark:text-white flex items-center gap-3">
                    <Layers className="w-6 h-6 text-primary" />
                    Zonamento compatível
                  </h2>
                  <p className="  mt-2 text-sm font-medium">
                    Interseção entre atividades permitidas e parâmetros
                    urbanísticos.
                  </p>
                </div>
                <button
                  onClick={() => setSynthesisModalOpen(true)}
                  className="flex items-center gap-2 text-xs  hover:text-primary transition-colors font-semibold"
                >
                  <Info className="w-4 h-4" />
                  Metodologia
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col h-full bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-emerald-100 dark:border-emerald-900/50 bg-emerald-100/50 dark:bg-emerald-900/20 flex items-center gap-3">
                    <div className="p-1.5 bg-emerald-500 rounded-full text-white shadow-sm flex items-center justify-center">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </div>
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-400 tracking-tight">
                      Uso permitido direto
                    </h4>
                  </div>
                  <div className="p-6 flex-1 bg-white/50 dark:bg-slate-900/20">
                    <div className="flex flex-wrap gap-2">
                      {compatibleZones
                        .filter(
                          (z: string) =>
                            !regrasZonamento ||
                            regrasZonamento.simSemNota.includes(z),
                        )
                        .map((z: string) => (
                          <span
                            key={z}
                            className="dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold shadow-sm border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 rounded-lg"
                          >
                            {z}
                          </span>
                        ))}
                      {compatibleZones.filter(
                        (z: string) =>
                          !regrasZonamento ||
                          regrasZonamento.simSemNota.includes(z),
                      ).length === 0 && (
                        <span className="text-xs text-emerald-600/60 dark:text-emerald-500/50 font-medium">
                          Nenhuma zona encontrada
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col h-full bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/50 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-blue-100 dark:border-blue-900/50 bg-blue-100/50 dark:bg-blue-900/20 flex items-center gap-3">
                    <div className="p-1.5 bg-blue-500 rounded-full text-white shadow-sm flex items-center justify-center">
                      <Info className="w-3 h-3" strokeWidth={3} />
                    </div>
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-400 tracking-tight">
                      Uso com restrições
                    </h4>
                  </div>
                  <div className="p-6 flex-1 bg-white/50 dark:bg-slate-900/20">
                    <div className="flex flex-wrap gap-2">
                      {compatibleZones
                        .filter(
                          (z: string) =>
                            regrasZonamento &&
                            Object.values(regrasZonamento.simComNota)
                              .flat()
                              .includes(z),
                        )
                        .map((z: string) => (
                          <span
                            key={z}
                            className="bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold shadow-sm border border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 rounded-lg"
                          >
                            {z}
                          </span>
                        ))}
                      {compatibleZones.filter(
                        (z: string) =>
                          regrasZonamento &&
                          Object.values(regrasZonamento.simComNota)
                            .flat()
                            .includes(z),
                      ).length === 0 && (
                        <span className="text-xs text-blue-600/60 dark:text-blue-500/50 font-medium">
                          Nenhuma zona encontrada
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : state.selectedUse ||
            Object.keys(state.urbanParams).length > 0 ||
            Object.keys(state.pqaParams).length > 0 ? (
            <div className="flex flex-col gap-6 pb-8">
              {/* Table 1: Use Permissions (Filtered ONLY by Use) */}
              {state.selectedUse && (
                <ResultsTable
                  selectedUse={state.selectedUse}
                  regrasZonamento={regrasZonamento}
                  condicoesInstalacao={condicoesInstalacao}
                  // Do not filter by urban params here, show all zones relevant to the use
                  filteredZones={undefined}
                  compatiblePqas={[]}
                  allPqaNames={[]}
                  hasPqaFilters={Object.keys(state.pqaParams).length > 0}
                  hasUrbanFilters={Object.keys(state.urbanParams).length > 0}
                  hasAreaFilter={state.areaImovel !== null}
                  setExplicativoOpen={setExplicativoOpen}
                  setSelectedNoteId={setSelectedNoteId}
                />
              )}

              {/* Table 2: Urban Params (Filtered by Params) */}
              {(Object.keys(state.urbanParams).length > 0 ||
                Object.keys(state.pqaParams).length > 0) && (
                <ResultsTable
                  selectedUse={null} // Force "Params Mode" layout
                  regrasZonamento={null}
                  condicoesInstalacao={[]}
                  filteredZones={state.matchingZones} // Show zones matching params
                  compatiblePqas={compatiblePqas}
                  allPqaNames={allPqaNames}
                  hasPqaFilters={Object.keys(state.pqaParams).length > 0}
                  hasUrbanFilters={Object.keys(state.urbanParams).length > 0}
                  hasAreaFilter={state.areaImovel !== null}
                  setExplicativoOpen={setExplicativoOpen}
                  setSelectedNoteId={setSelectedNoteId}
                />
              )}
            </div>
          ) : (
            <div className="flex h-full w-full animate-in fade-in duration-700 items-center justify-center py-20 text-center">
              <div className="max-w-sm rounded-[28px] border border-slate-200/80 bg-white/90 px-8 py-10 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
                <Search
                  className="mx-auto mb-6 h-12 w-12 text-slate-400"
                  strokeWidth={1.2}
                />
                <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-slate-100">
                  Nenhum uso selecionado
                </h3>
                <p className="max-w-[280px] text-sm font-normal leading-relaxed text-gray-500 dark:text-slate-400">
                  Selecione uma atividade na barra lateral para ver a
                  viabilidade, os parâmetros técnicos e as notas aplicáveis
                  nesta zona.
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <SynthesisModal
        isOpen={synthesisModalOpen}
        onClose={() => setSynthesisModalOpen(false)}
      />

      <ModalExplicativo
        isOpen={explicativoOpen}
        onClose={() => setExplicativoOpen(false)}
        regrasZonamento={regrasZonamento}
        condicoesInstalacao={condicoesInstalacao}
        hasCnaeUsed={
          state.searchMode === "cnae" || !!state.selectedUse?.cnaeOriginario
        }
        hasUrbanFilters={Object.keys(state.urbanParams).length > 0}
        hasPqaFilters={Object.keys(state.pqaParams).length > 0}
        hasAreaFilter={state.areaImovel !== null}
      />

      <NotesModal
        notaId={selectedNoteId || ""}
        isOpen={!!selectedNoteId}
        onClose={() => setSelectedNoteId(null)}
      />
    </div>
  );
}
