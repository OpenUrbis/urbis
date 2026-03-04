import React from 'react';
import { useProspectiveSearch } from './hooks/useProspectiveSearch';
import { UseSearchFilter } from './ui/UseSearchFilter';
import { UrbanParamsFilter } from './ui/UrbanParamsFilter';
import { ResultsTable } from './ui/ResultsTable';
import { SynthesisModal } from './ui/SynthesisModal';
import { ModalExplicativo } from './ui/ModalExplicativo';
import { NotesModal } from './ui/NotesModal';
import { HeaderWithInfo } from './ui/HeaderWithInfo';
import { ScrollArea, Switch, Label, Input } from '@open-urbis/map-ui';
import { LocalSlider } from './ui/LocalSlider';
import { Layers, Info, Search, Check } from 'lucide-react';

interface SearchContainerProps {
  moduleData: Record<string, any[]>;
}

export function SearchContainer({ moduleData }: SearchContainerProps) {
  const state = useProspectiveSearch(moduleData);
  const {
    regrasZonamento,
    condicoesInstalacao,
    compatibleZones,
    compatiblePqas,
    allPqaNames,
    canSynthesize
  } = state;

  const [synthesisModalOpen, setSynthesisModalOpen] = React.useState(false);
  const [explicativoOpen, setExplicativoOpen] = React.useState(false);
  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (state.synthesisMode) {
      setSynthesisModalOpen(true);
    }
  }, [state.synthesisMode]);

  if (!state.usosData.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50/50">
        <p className=" text-sm font-medium animate-pulse">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-white dark:bg-slate-950 overflow-hidden text-foreground">
      {/* Sidebar */}
      <div className="w-full min-w-[400px] max-w-[400px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full z-20">

        <ScrollArea className="flex-1 w-full">
          <div className="px-4 pt-4 pb-1 shrink-0">
            <HeaderWithInfo 
              title="Pesquisa prospectiva" 
              tooltipText="Módulo para cruzar dados de atividades e zoneamento"
              isMainHeader={true}
              className="mb-1"
            />
            <p className="text-[11px]   leading-snug font-normal">
              Encontre usos permitidos por CNAE ou descrição, visualize zonas e notas da LPUOS. Descubra a permissibilidade do seu negócio por cores no mapa.
            </p>
          </div>
          <div className="px-4 py-1 flex flex-col">
            {/* Uso e Atividade */}
            <section className="mt-2 mb-4 space-y-4">
              <div className="flex items-center justify-between">
                <HeaderWithInfo 
                  title="Busca por uso e atividades" 
                  tooltipText="Pesquise por CNAE ou nome da atividade para verificar onde ela é permitida na cidade."
                  link="https://legis.urbis.sampa.br/"
                />
                {state.selectedUse && (
                  <button onClick={state.clearUseSearch} className="text-[10px] font-semibold text-primary hover:underline">Limpar</button>
                )}
              </div>
              <UseSearchFilter
                useSearchTerm={state.useSearchTerm}
                setUseSearchTerm={state.setUseSearchTerm}
                searchMode={state.searchMode}
                setSearchMode={state.setSearchMode}
                searchResults={state.useSearchResults}
                selectedUse={state.selectedUse}
                onSelectUse={state.setSelectedUse}
                clearSelection={state.clearUseSearch}
                cnaeData={state.cnaeData}
              />
            </section>

            {/* Área do Imóvel Slider (Geral) */}
            <section className="mt-0 mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <HeaderWithInfo 
                  title="Área do imóvel" 
                  tooltipText="A área total do terreno pode influenciar nas regras de ocupação e parâmetros exigidos."
                  link="https://legis.urbis.sampa.br/"
                />
                {state.areaImovel !== null && (
                  <button onClick={() => state.updateAreaImovel(null)} className="text-[10px] font-semibold text-primary hover:underline">Limpar</button>
                )}
              </div>
              <div className="group/slider bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col gap-0.5">
                    <Label className="text-[10px] font-bold  ">Faixa de área (m²)</Label>
                    <div className="text-sm flex items-baseline gap-1 mt-1">
                      {state.areaImovel ? (
                        <>
                          <span className="font-bold  whitespace-nowrap">{state.areaImovel[0]} <span className="text-[10px]  font-bold">m²</span></span>
                          <span className="mx-1 opacity-40">—</span>
                          <span className="font-bold  whitespace-nowrap">{state.areaImovel[1]} <span className="text-[10px]  font-bold">m²</span></span>
                        </>
                      ) : (
                        <span className="font-bold  text-xs">Qualquer área</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="px-1.5 pt-1">
                    <LocalSlider
                      key={state.areaImovel ? state.areaImovel.join(',') : 'default'}
                      min={0}
                      max={99999}
                      step={1}
                      defaultValue={state.areaImovel || [0, 99999]}
                      onValueCommit={(vals) => state.updateAreaImovel([vals[0], vals.length > 1 ? vals[1] : 99999])}
                      className="py-1"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <Label className="text-[9px] font-bold ">Mínimo</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          className="h-8 pr-6 text-xs font-bold rounded-lg border-slate-100 dark:border-slate-800 focus:ring-1" 
                          value={state.areaImovel ? state.areaImovel[0] : ''} 
                          placeholder="0"
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            const newMin = isNaN(val) ? 0 : val;
                            const currentMax = state.areaImovel ? state.areaImovel[1] : 99999;
                            if (e.target.value === '' && (!state.areaImovel || state.areaImovel[1] === 99999)) {
                              state.updateAreaImovel(null);
                            } else {
                              state.updateAreaImovel([newMin, Math.max(newMin, currentMax)]);
                            }
                          }} 
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold ">m²</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      <Label className="text-[9px] font-bold ">Máximo</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          className="h-8 pr-6 text-xs font-bold rounded-lg border-slate-100 dark:border-slate-800 focus:ring-1" 
                          value={state.areaImovel ? state.areaImovel[1] : ''} 
                          placeholder="99999"
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            const newMax = isNaN(val) ? 99999 : val;
                            const currentMin = state.areaImovel ? state.areaImovel[0] : 0;
                            if (e.target.value === '' && (!state.areaImovel || state.areaImovel[0] === 0)) {
                              state.updateAreaImovel(null);
                            } else {
                              state.updateAreaImovel([Math.min(currentMin, newMax), newMax]);
                            }
                          }} 
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold ">m²</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Parâmetros Urbanísticos */}
            <section className="mt-0 mb-4 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center justify-between">
                <HeaderWithInfo 
                  title="Buscar por parâmetro urbanístico" 
                  tooltipText="Filtre zonas da cidade baseado em critérios como Coeficiente de Aproveitamento, Gabarito, Recuos, etc."
                  link="https://legis.urbis.sampa.br/"
                />
                {Object.keys(state.urbanParams).length > 0 && (
                  <button onClick={state.clearUrbanParams} className="text-[10px] font-semibold text-primary hover:underline">Limpar</button>
                )}
              </div>
              <UrbanParamsFilter
                filters={state.urbanParams}
                options={state.availableOptions}
                disabledParams={state.disabledUrbanParams}
                updateFilter={state.updateUrbanParam}
                removeFilter={state.removeUrbanParam}
                clearFilters={state.clearUrbanParams}
                resultsCount={state.urbanParamsResults.length}
              />
            </section>

            {/* Parâmetros de Perímetros de Qualificação Ambiental (PQA) */}
            <section className="mt-0 mb-4 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center justify-between">
                <HeaderWithInfo 
                  title="Buscar por Parâmetros de Qualificação Ambiental" 
                  tooltipText="Consulte fatores e parâmetros relacionados à Quota Ambiental exigidos para os perímetros."
                  link="https://legis.urbis.sampa.br/"
                />
                {Object.keys(state.pqaParams).length > 0 && (
                  <button onClick={state.clearPqaParams} className="text-[10px] font-semibold text-primary hover:underline">Limpar</button>
                )}
              </div>

              <UrbanParamsFilter
                filters={state.pqaParams}
                disabledParams={state.disabledPqaParams}
                options={state.pqaOptions}
                availableParams={[
                  { id: 'Fatores de Drenagem Beta', label: 'Fatores de Drenagem Beta', unit: '', defaultMax: 1, step: 0.1 },
                  { id: 'Taxa de Permeabilidade Lote > 500', label: 'Tx Permeabilidade >500', unit: '', defaultMax: 1, step: 0.05 },
                  { id: 'Fatores Cobertura Vegetal Alfa', label: 'Fatores Cobertura Vegetal Alfa', unit: '', defaultMax: 1, step: 0.1 },
                  { id: 'Pontuação QA Mínimo Lote > 10000', label: 'Pt QA Mínimo >10000', unit: '', defaultMax: 2, step: 0.1 },
                  { id: 'Taxa de Permeabilidade Lote ≤ 500', label: 'Tx Permeabilidade ≤500', unit: '', defaultMax: 1, step: 0.05 },
                  { id: 'Pontuação QA Mínimo Lote > 500 ≤ 1000', label: 'Pt QA Mínimo >500≤1000', unit: '', defaultMax: 2, step: 0.1 },
                  { id: 'Pontuação QA Mínimo Lote > 1000 ≤ 2500', label: 'Pt QA Mínimo >1000≤2500', unit: '', defaultMax: 2, step: 0.1 },
                  { id: 'Pontuação QA Mínimo Lote > 2500 ≤ 5000', label: 'Pt QA Mínimo >2500≤5000', unit: '', defaultMax: 2, step: 0.1 },
                  { id: 'Pontuação QA Mínimo Lote > 5000 ≤ 10000', label: 'Pt QA Mínimo >5000≤10000', unit: '', defaultMax: 2, step: 0.1 },
                  { id: 'Fator Incentivo Quota Ambiental (Lote > 5000, Pontuação ≥ 4x Qamin)', label: 'Incentivo QA Lote >5000 (≥4x)', unit: 'R$', defaultMax: 100 },
                  { id: 'Fator Incentivo Quota Ambiental (Lote > 5000, Pontuação ≥ 2x e < 3x Qamin)', label: 'Incentivo QA Lote >5000 (2x a 3x)', unit: 'R$', defaultMax: 100 },
                  { id: 'Fator Incentivo Quota Ambiental (Lote > 5000, Pontuação ≥ 3x e < 4x Qamin)', label: 'Incentivo QA Lote >5000 (3x a 4x)', unit: 'R$', defaultMax: 100 },
                  { id: 'Fator Incentivo Quota Ambiental (Lote > 5000, Pontuação ≥ 1.5x e < 2x Qamin)', label: 'Incentivo QA Lote >5000 (1.5x a 2x)', unit: 'R$', defaultMax: 100 },
                  { id: 'Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 4x Qamin)', label: 'Incentivo QA Lote >500≤1000 (≥4x)', unit: 'R$', defaultMax: 100 },
                  { id: 'Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 4x Qamin)', label: 'Incentivo QA Lote >1000≤2500 (≥4x)', unit: 'R$', defaultMax: 100 },
                  { id: 'Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 4x Qamin)', label: 'Incentivo QA Lote >2500≤5000 (≥4x)', unit: 'R$', defaultMax: 100 },
                  { id: 'Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 2x e < 3x Qamin)', label: 'Incentivo QA Lote >500≤1000 (2x a 3x)', unit: 'R$', defaultMax: 100 },
                  { id: 'Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 3x e < 4x Qamin)', label: 'Incentivo QA Lote >500≤1000 (3x a 4x)', unit: 'R$', defaultMax: 100 },
                  { id: 'Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 2x e < 3x Qamin)', label: 'Incentivo QA Lote >1000≤2500 (2x a 3x)', unit: 'R$', defaultMax: 100 },
                  { id: 'Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 3x e < 4x Qamin)', label: 'Incentivo QA Lote >1000≤2500 (3x a 4x)', unit: 'R$', defaultMax: 100 },
                  { id: 'Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 2x e < 3x Qamin)', label: 'Incentivo QA Lote >2500≤5000 (2x a 3x)', unit: 'R$', defaultMax: 100 },
                  { id: 'Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 3x e < 4x Qamin)', label: 'Incentivo QA Lote >2500≤5000 (3x a 4x)', unit: 'R$', defaultMax: 100 },
                  { id: 'Fator Incentivo Quota Ambiental (Lote > 500 ≤ 1000, Pontuação ≥ 1.5x e < 2x Qamin)', label: 'Incentivo QA Lote >500≤1000 (1.5x a 2x)', unit: 'R$', defaultMax: 100 },
                  { id: 'Fator Incentivo Quota Ambiental (Lote > 1000 ≤ 2500, Pontuação ≥ 1.5x e < 2x Qamin)', label: 'Incentivo QA Lote >1000≤2500 (1.5x a 2x)', unit: 'R$', defaultMax: 100 },
                  { id: 'Fator Incentivo Quota Ambiental (Lote > 2500 ≤ 5000, Pontuação ≥ 1.5x e < 2x Qamin)', label: 'Incentivo QA Lote >2500≤5000 (1.5x a 2x)', unit: 'R$', defaultMax: 100 },
                ]}
                updateFilter={state.updatePqaParam}
                removeFilter={state.removePqaParam}
                clearFilters={state.clearPqaParams}
                resultsCount={state.urbanParamsPqaResults.length}
              />
            </section>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white dark:bg-slate-950 h-full overflow-hidden flex flex-col relative min-w-0 z-10">
        <ScrollArea className="h-full w-full">
          <div className="p-6 w-full max-w-6xl mx-auto h-full flex flex-col">
            {state.synthesisMode ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="mb-10 flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-semibold  dark:text-white flex items-center gap-3">
                      <Layers className="w-6 h-6 text-primary" />
                      Zonamento compatível
                    </h2>
                    <p className="  mt-2 text-sm font-medium">
                      Interseção entre atividades permitidas e parâmetros urbanísticos.
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
                      <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-400 tracking-tight">Uso permitido direto</h4>
                    </div>
                    <div className="p-6 flex-1 bg-white/50 dark:bg-slate-900/20">
                      <div className="flex flex-wrap gap-2">
                        {compatibleZones
                          .filter(z => !regrasZonamento || regrasZonamento.simSemNota.includes(z))
                          .map(z => (
                            <span key={z} className="bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold shadow-sm border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 rounded-lg">{z}</span>
                          ))
                        }
                        {compatibleZones.filter(z => !regrasZonamento || regrasZonamento.simSemNota.includes(z)).length === 0 && (
                          <span className="text-xs text-emerald-600/60 dark:text-emerald-500/50 font-medium">Nenhuma zona encontrada</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col h-full bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/50 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-blue-100 dark:border-blue-900/50 bg-blue-100/50 dark:bg-blue-900/20 flex items-center gap-3">
                      <div className="p-1.5 bg-blue-500 rounded-full text-white shadow-sm flex items-center justify-center">
                        <Info className="w-3 h-3" strokeWidth={3} />
                      </div>
                      <h4 className="text-sm font-bold text-blue-900 dark:text-blue-400 tracking-tight">Uso com restrições</h4>
                    </div>
                    <div className="p-6 flex-1 bg-white/50 dark:bg-slate-900/20">
                      <div className="flex flex-wrap gap-2">
                        {compatibleZones
                          .filter(z => regrasZonamento && Object.values(regrasZonamento.simComNota).flat().includes(z))
                          .map(z => (
                            <span key={z} className="bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold shadow-sm border border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 rounded-lg">{z}</span>
                          ))
                        }
                        {compatibleZones.filter(z => regrasZonamento && Object.values(regrasZonamento.simComNota).flat().includes(z)).length === 0 && (
                          <span className="text-xs text-blue-600/60 dark:text-blue-500/50 font-medium">Nenhuma zona encontrada</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (state.selectedUse || compatibleZones.length > 0 || compatiblePqas.length > 0 || Object.keys(state.pqaParams).length > 0 || Object.keys(state.urbanParams).length > 0) ? (
              <ResultsTable
                selectedUse={state.selectedUse}
                regrasZonamento={regrasZonamento}
                condicoesInstalacao={condicoesInstalacao}
                filteredZones={compatibleZones}
                compatiblePqas={compatiblePqas}
                allPqaNames={allPqaNames}
                hasPqaFilters={Object.keys(state.pqaParams).length > 0}
                hasUrbanFilters={Object.keys(state.urbanParams).length > 0}
                setExplicativoOpen={setExplicativoOpen}
                setSelectedNoteId={setSelectedNoteId}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full w-full py-24 text-center animate-in fade-in duration-700">
                <Search className="w-12 h-12   mb-6" strokeWidth={1} />
                <h3 className="text-gray-900  text-base font-semibold mb-2">
                  Nenhum uso selecionado
                </h3>
                <p className="text-sm font-normal text-gray-500  max-w-[280px] leading-relaxed">
                  Selecione uma atividade na barra lateral para ver a viabilidade e parâmetros técnicos nesta zona.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <SynthesisModal
        isOpen={synthesisModalOpen}
        onClose={() => setSynthesisModalOpen(false)}
      />

      {regrasZonamento && (
        <ModalExplicativo
          isOpen={explicativoOpen}
          onClose={() => setExplicativoOpen(false)}
          regrasZonamento={regrasZonamento}
          condicoesInstalacao={condicoesInstalacao}
        />
      )}

      <NotesModal
        notaId={selectedNoteId || ''}
        isOpen={!!selectedNoteId}
        onClose={() => setSelectedNoteId(null)}
      />
    </div>
  );
}
