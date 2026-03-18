import React, { useState } from 'react';
import { RegraZonamento, CondicaoInstalacao, UsoSearchResultItem } from '../utils/types';
import { formatParameter, NOTAS_DICTIONARY } from '../utils/labels';
import { ShieldCheck, AlertCircle, Info, Check, AlertTriangle, X, HelpCircle, ChevronRight } from 'lucide-react';
import { Button } from '@open-urbis/map-ui';
import { useTheme } from '../../ThemeProvider';
import { LIGHT_COLORS, DARK_COLORS } from '../utils/colors';

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
  setExplicativoOpen: (open: boolean) => void;
  setSelectedNoteId: (id: string | null) => void;
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
  setExplicativoOpen,
  setSelectedNoteId
}: ResultsTableProps) {
  const { theme } = useTheme();
  
  // Logic to determine if we should use dark colors based on design system
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const getVal = (obj: any, keys: string[]) => {
    if (!obj) return '';
    const foundKey = Object.keys(obj).find(k => keys.some(key => key.toLowerCase() === k.trim().toLowerCase()));
    return foundKey ? obj[foundKey] : '';
  };

  const codigoAlvo = selectedUse ? getVal(selectedUse.item, ['Código', 'Codigo']) : '';

  // Organize parameter notes for inline display
  const parameterNotesMap: Record<string, string[]> = {};
  condicoesInstalacao.forEach(cond => {
    (cond.notas || []).forEach(nota => {
      const cleanNota = nota.replace(/[()]/g, '').trim();
      if (!parameterNotesMap[cleanNota]) parameterNotesMap[cleanNota] = [];
      parameterNotesMap[cleanNota].push(cond.parametro);
    });
  });

  const NoteItem = ({ noteId, targets, context }: { noteId: string, targets: string[], context: 'zonas' | 'params' }) => (
    <div className="py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[11px] font-semibold text-gray-900 whitespace-nowrap">
          Nota ({noteId.replace(/[()]/g, '')})
        </span>
        <span className="text-[10px] text-gray-400 font-normal">
          {context === 'zonas' ? 'Aplicável às zonas' : 'Aplicável aos parâmetros'}: {targets.map(t => context === 'params' ? formatParameter(t) : t).join(', ')}
        </span>
      </div>
      <p className="text-[12px] text-gray-600 leading-relaxed font-normal">
        {NOTAS_DICTIONARY[noteId.replace(/[()]/g, '')] || NOTAS_DICTIONARY[noteId] || 'Texto da nota não encontrado.'}
      </p>
    </div>
  );

  const filterZones = (zones: string[]) => {
    if (!filteredZones) return zones;
    return zones.filter(z => filteredZones.includes(z));
  };

  const hasRules = !!regrasZonamento;
  const hasFiltersOnly = !selectedUse && (hasUrbanFilters || hasPqaFilters);

  if (!hasRules && !hasFiltersOnly) {
    return (
      <div className="p-12 text-center bg-background rounded-xl border border-dashed border-border flex flex-col items-center animate-in fade-in duration-500">
        <AlertCircle className="w-8 h-8 text-muted-foreground mb-4" />
        <h4 className="text-lg font-semibold text-foreground mb-1">Sem diretrizes específicas</h4>
        <p className="text-xs text-muted-foreground max-w-sm font-normal">
          {selectedUse
            ? <>O uso <span className="text-primary font-semibold">{codigoAlvo}</span> não possui restrições cadastradas.</>
            : "Selecione um uso ou aplique filtros de parâmetros para ver os resultados."}
        </p>
      </div>
    );
  }

  const filteredSimSemNota = regrasZonamento?.simSemNota ? filterZones(regrasZonamento.simSemNota) : [];
  const filteredSimComNota = regrasZonamento?.simComNota ? Object.entries(regrasZonamento.simComNota).reduce((acc, [nota, zones]) => {
    const filtered = filterZones(zones);
    if (filtered.length > 0) acc[nota] = filtered;
    return acc;
  }, {} as Record<string, string[]>) : {};

  const filteredNaoComNota = regrasZonamento?.naoComNota ? Object.entries(regrasZonamento.naoComNota).reduce((acc, [nota, zones]) => {
    const filtered = filterZones(zones);
    if (filtered.length > 0) acc[nota] = filtered;
    return acc;
  }, {} as Record<string, string[]>) : {};

  const filteredNaoSemNota = regrasZonamento?.naoSemNota ? filterZones(regrasZonamento.naoSemNota) : [];
  const filteredZoeZep = regrasZonamento?.zoeZep ? filterZones(regrasZonamento.zoeZep) : [];

  const palette = isDark ? DARK_COLORS : LIGHT_COLORS;

  const statusMap = {
    P: { label: 'Permitido', color: palette.P.hex, icon: Check, desc: 'Uso permitido sem restrições' },
    C: { label: 'Permitido com Condições', color: palette.C.hex, icon: Info, desc: 'Uso permitido com notas específicas' },
    E: { label: 'Proibido com exceções', color: palette.E.hex, icon: AlertTriangle, desc: 'Uso proibido com possíveis exceções' },
    V: { label: 'Proibido', color: palette.V.hex, icon: X, desc: 'Uso completamente proibido' },
    Z: { label: 'Regime Especial', color: palette.Z.hex, icon: HelpCircle, desc: 'Consultar legislação específica' },
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
            borderColor: isDark ? `${item.color}40` : `${item.color}30`
          }}
        >
          {item.label}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Legend Card - Only show when we have a use (rules) */}
      {selectedUse && hasRules && (
        <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-muted/30 border-b border-border">
            <span className="text-[12px] font-semibold ">Legendas</span>
          </div>
          <div className="px-6 pt-4 pb-4 flex flex-wrap gap-x-12 gap-6 row-gap-2">
            {Object.entries(statusMap).map(([key, item]) => (
              <div key={key} className="flex items-center gap-1">
                {getStatusBadge(key as keyof typeof statusMap)}
                <span className="text-[10px] text-muted-foreground font-normal leading-snug">{item.desc}</span>
              </div>
            ))}
            
            {(hasAreaFilter || hasUrbanFilters || hasPqaFilters) && (
              <div className="w-full mt-4 pt-4 border-t border-border/50 flex flex-col gap-3">
                 {(hasUrbanFilters || hasPqaFilters) && (
                     <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div 
                                className="w-5 h-5 rounded-md border-2 border-dashed bg-transparent flex items-center justify-center shadow-sm shrink-0" 
                                style={{ borderColor: palette.SELECTED.outline }}
                            ></div>
                            <div className="px-3 py-1 rounded-md text-[10px] font-semibold border border-gray-200 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200 whitespace-nowrap">
                                Zonas Selecionadas
                            </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-normal leading-snug">
                            Zonas que atendem aos parâmetros urbanísticos ou PQA
                        </span>
                     </div>
                 )}

                 {hasAreaFilter && (
                     <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md border-2 bg-transparent flex items-center justify-center shadow-sm shrink-0" style={{ borderColor: '#00FFFF' }}></div>
                            <div className="px-3 py-1 rounded-md text-[10px] font-semibold border border-cyan-400/40 bg-cyan-400/10 text-cyan-600 whitespace-nowrap">
                                Perímetros tributários
                            </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-normal leading-snug">
                            Imóveis compatíveis com a área selecionada (disponível em níveis de zoom próximos)
                        </span>
                     </div>
                 )}
              </div>
            )}

            <div className="w-full pt-4 border-t border-gray-50 mt-4">
                <p className="text-[10px] text-gray-400 leading-relaxed font-normal">
                    Os dados representam os Quadros nº 4 e 4A da Lei n° 16.402/2016 e Decreto nº 57.378/2016.
                    <br/>Em casos de HIS1, HIS2 e HMP, consulte a regulamentação especial (Decreto nº 63.728/2024).
                </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      {(selectedUse || hasUrbanFilters) && (
        <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-muted/30 px-5 py-4 border-b border-border flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-bold text-foreground leading-none">
                  {selectedUse ? "Zoneamentos filtrados por uso e atividades" : "Zonas identificadas por parâmetros"}
                </h4>

                {selectedUse ? (
                  <div className="flex flex-col gap-1.5 mt-1.5">
                    {/* CNAE Display */}
                    {selectedUse.cnaeOriginario && (
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-2 py-1 rounded w-fit">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">CNAE:</span>
                            <span className="text-[10px] font-mono text-slate-700">{selectedUse.cnaeOriginario['Subclasses (CNAE 2.2)']} - {selectedUse.cnaeOriginario['Denominação (CNAE 2.2)']}</span>
                        </div>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-x-2 row-gap-2">
                        {[
                        { label: 'Categoria', text: getVal(selectedUse.arvore.categoria, ['Descrição']) },
                        { label: 'Subcategoria', text: getVal(selectedUse.arvore.subcategoria, ['Descrição']) },
                        { label: 'Grupo/Tipologia', text: getVal(selectedUse.arvore.tipologiaOuGrupo, ['Descrição']) },
                        ].filter(b => b.text).map((item, idx) => (
                        <React.Fragment key={idx}>
                            <div className="flex items-center gap-1">
                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight">{item.label}:</span>
                            <span className="text-[10px] text-foreground font-semibold">{item.text}</span>
                            </div>
                            {idx < 2 && <ChevronRight className="w-3 h-3 text-border" />}
                        </React.Fragment>
                        ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground mt-1 font-normal">
                    Listagem de zonas que atendem aos filtros técnicos selecionados.
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
                    {selectedUse ? "Status" : "Compatibilidade"}
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground">Setores / Zonas</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground text-right w-36">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* If no use is selected but we have filtered zones, show one big category */}
                {!selectedUse && filteredZones && (
                  <tr className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div 
                            className="w-5 h-5 rounded-md border-2 border-dashed bg-transparent flex items-center justify-center shadow-sm shrink-0"
                            style={{ borderColor: palette.SELECTED.outline }}
                        ></div>
                        <span className="px-3 py-1 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200">Zonas identificadas por parâmetros</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {filteredZones.map((z, i) => (
                          <span key={i} className="text-[10px] font-semibold bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border">{z}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-muted-foreground font-semibold">-</td>
                  </tr>
                )}

                {selectedUse && filteredSimSemNota.length > 0 && (
                  <tr className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4">
                      {getStatusBadge('P')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {filteredSimSemNota.map((z, i) => (
                          <span key={i} className="text-[10px] font-semibold bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border">{z}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-muted-foreground font-semibold">-</td>
                  </tr>
                )}

                {selectedUse && Object.entries(filteredSimComNota).map(([nota, zonas], idx) => (
                  <tr key={`sim-${idx}`} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4">
                      {getStatusBadge('C')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {zonas.map((z, i) => (
                          <span key={i} className="text-[10px] font-semibold bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border">{z}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        onClick={() => setSelectedNoteId(nota)}
                        size="sm"
                        className="h-8 px-3 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20 transition-all shadow-none"
                      >
                        <span className="text-[10px] font-semibold">Nota {nota}</span>
                      </Button>
                    </td>
                  </tr>
                ))}

                {selectedUse && Object.entries(filteredNaoComNota).map(([nota, zonas], idx) => (
                  <tr key={`nao-com-${idx}`} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4">
                      {getStatusBadge('E')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {zonas.map((z, i) => (
                          <span key={i} className="text-[10px] font-semibold bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border">{z}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        onClick={() => setSelectedNoteId(nota)}
                        size="sm"
                        className="h-8 px-3 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500/20 transition-all shadow-none"
                      >
                        <span className="text-[10px] font-semibold">Nota {nota}</span>
                      </Button>
                    </td>
                  </tr>
                ))}

                {selectedUse && filteredZoeZep.length > 0 && (
                  <tr key={`zoe-zep`} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4">
                      {getStatusBadge('Z')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {filteredZoeZep.map((z, i) => (
                          <span key={i} className="text-[10px] font-semibold bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border">{z}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-muted-foreground font-semibold">-</td>
                  </tr>
                )}

                {selectedUse && filteredNaoSemNota && filteredNaoSemNota.length > 0 && (
                  <tr className="opacity-75 bg-muted/5 hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4">
                      {getStatusBadge('V')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {filteredNaoSemNota.map((z, i) => (
                          <span key={i} className="text-[10px] font-semibold bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border">{z}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-muted-foreground font-semibold">-</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PQA Table Card */}
      {hasPqaFilters && allPqaNames.length > 0 && (
        <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-muted/30 px-5 py-4 border-b border-border flex items-center gap-3">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Perímetros de Qualificação Ambiental</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/10">
                  <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground w-44">Status</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground">Perímetro</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground text-right w-36">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allPqaNames.map((name, idx) => {
                  const isCompatible = compatiblePqas.includes(name);
                  const color = isCompatible ? palette.P.hex : palette.V.hex;
                  return (
                    <tr key={idx} className={`hover:bg-muted/10 transition-colors ${!isCompatible ? 'opacity-60 bg-muted/5' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm shrink-0"
                            style={{ backgroundColor: color }}
                          >
                            {isCompatible ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <X className="w-3.5 h-3.5" strokeWidth={3} />}
                          </div>
                          <span
                            className="px-3 py-1 rounded-md text-[10px] font-semibold border"
                            style={{
                              backgroundColor: `${color}26`,
                              color: color,
                              borderColor: `${color}40`
                            }}
                          >
                            {isCompatible ? 'Compatível' : 'Incompatível'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold text-foreground uppercase">{name}</span>
                      </td>
                      <td className="px-5 py-4 text-right text-muted-foreground font-semibold">-</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Installation Conditions Card */}
      {condicoesInstalacao.length > 0 && (
        <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-muted/30 px-5 py-4 border-b border-border flex items-center gap-3">
            <div className="p-1.5 bg-amber-500/10 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">Condições de instalação</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/10">
                  <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground w-1/4">Parâmetro</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground text-left min-w-[480px]">Requisito</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground text-right">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {condicoesInstalacao.map((condicao, idx) => (
                  <tr key={idx} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4 text-xs text-muted-foreground font-normal">
                      {formatParameter(condicao.parametro)}
                    </td>
                    <td className="px-5 py-4 text-left">
                      <span className="text-[11px] font-normal text-foreground leading-relaxed block">{condicao.valor || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {(condicao.notas || []).length > 0 && (
                        <div className="flex justify-end gap-1.5">
                          {condicao.notas.map(n => (
                            <Button
                              key={n}
                              onClick={() => setSelectedNoteId(n)}
                              size="sm"
                              className="h-8 px-3 rounded-lg bg-muted text-muted-foreground border border-border hover:bg-muted/80 transition-all shadow-none"
                            >
                              <span className="text-[10px] font-semibold">Nota {n}</span>
                            </Button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Combined Notes Section - Moved here from ModalExplicativo */}
      {selectedUse && (regrasZonamento || condicoesInstalacao.length > 0) && (
        <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-muted/30 px-5 py-4 border-b border-border">
                <h4 className="text-[11px] font-semibold text-muted-foreground">Notas explicativas consolidada</h4>
            </div>
            <div className="p-6">
                <div className="space-y-1">
                    {regrasZonamento && Object.entries(regrasZonamento.simComNota).map(([nota, zonas]) => (
                        <div id={`note-${nota}`} key={`sim-${nota}`}><NoteItem noteId={nota} targets={zonas} context="zonas" /></div>
                    ))}
                    {regrasZonamento && Object.entries(regrasZonamento.naoComNota).map(([nota, zonas]) => (
                        <div id={`note-${nota}`} key={`nao-${nota}`}><NoteItem noteId={nota} targets={zonas} context="zonas" /></div>
                    ))}
                    {Object.entries(parameterNotesMap).map(([nota, params]) => (
                        <div id={`note-${nota}`} key={`param-${nota}`}><NoteItem noteId={nota} targets={params} context="params" /></div>
                    ))}

                    {(!regrasZonamento || (Object.keys(regrasZonamento.simComNota).length === 0 && Object.keys(regrasZonamento.naoComNota).length === 0)) &&
                        Object.keys(parameterNotesMap).length === 0 && (
                        <p className="text-xs text-gray-400 italic py-2">Nenhuma nota específica aplicável para este uso.</p>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
