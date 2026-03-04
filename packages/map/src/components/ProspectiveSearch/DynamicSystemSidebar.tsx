import React from 'react';
import { useProspectiveSearchContext } from './ProspectiveSearchContext';
import { UseSearchFilter } from './ui/UseSearchFilter';
import { UrbanParamsFilter } from './ui/UrbanParamsFilter';
import { LocalSlider } from './ui/LocalSlider';
import { HeaderWithInfo } from './ui/HeaderWithInfo';
import { ScrollArea, Label, Input } from '@open-urbis/map-ui';

export function DynamicSystemSidebar() {
  const state = useProspectiveSearchContext();

  return (
    <div className="w-full md:min-w-[400px] md:max-w-[400px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full z-20">
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

          {/* Área do Imóvel Input (Geral) */}
          <section className="mt-2 mb-6 space-y-3">
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
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
              <div className="space-y-3">
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
  );
}
