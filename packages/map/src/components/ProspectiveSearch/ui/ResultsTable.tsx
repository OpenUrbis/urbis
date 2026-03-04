import React, { useState } from 'react';
import { RegraZonamento, CondicaoInstalacao, UsoSearchResultItem } from '../utils/types';
import { formatParameter } from '../utils/labels';
import { ShieldCheck, AlertCircle, Info, Check, AlertTriangle, X, HelpCircle, ChevronRight } from 'lucide-react';
import { Button } from '@open-urbis/map-ui';

interface ResultsTableProps {
  regrasZonamento: RegraZonamento | null;
  condicoesInstalacao: CondicaoInstalacao[];
  selectedUse: UsoSearchResultItem | null;
  filteredZones?: string[];
  compatiblePqas?: string[];
  allPqaNames?: string[];
  hasPqaFilters?: boolean;
  hasUrbanFilters?: boolean;
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
  setExplicativoOpen,
  setSelectedNoteId
}: ResultsTableProps) {

  const getVal = (obj: any, keys: string[]) => {
    if (!obj) return '';
    const foundKey = Object.keys(obj).find(k => keys.some(key => key.toLowerCase() === k.trim().toLowerCase()));
    return foundKey ? obj[foundKey] : '';
  };

  const codigoAlvo = selectedUse ? getVal(selectedUse.item, ['Código', 'Codigo']) : '';

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

  const statusMap = {
    P: { label: 'Permitido', color: '#0D542B', icon: Check, desc: 'Uso permitido sem restrições' },
    C: { label: 'Permitido com Condições', color: '#1C398E', icon: Info, desc: 'Uso permitido com notas específicas' },
    E: { label: 'Restrito', color: '#7E2A0C', icon: AlertTriangle, desc: 'Uso proibido com possíveis exceções' },
    V: { label: 'Proibido', color: '#82181A', icon: X, desc: 'Uso completamente proibido' },
    Z: { label: 'Regime Especial', color: '#0F172B', icon: HelpCircle, desc: 'Consultar legislação específica' },
  };

  const getStatusBadge = (key: keyof typeof statusMap) => {
    const item = statusMap[key];
    const StatusIcon = item.icon;
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
            backgroundColor: `${item.color}26`,
            color: item.color,
            borderColor: `${item.color}40`
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
          <div className="px-5 py-4 bg-muted/30 border-b border-border">
            <span className="text-[11px] font-semibold text-muted-foreground">Legenda de permissibilidade</span>
          </div>
          <div className="px-8 pt-8 pb-10 flex flex-wrap gap-x-12 gap-y-6">
            {Object.entries(statusMap).map(([key, item]) => (
              <div key={key} className="flex items-center gap-3">
                {getStatusBadge(key as keyof typeof statusMap)}
                <span className="text-[10px] text-muted-foreground font-normal leading-none">{item.desc}</span>
              </div>
            ))}
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
                  {selectedUse ? "Diretrizes de zoneamento" : "Zonas identificadas por parâmetros"}
                </h4>

                {selectedUse ? (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
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
                ) : (
                  <p className="text-[11px] text-muted-foreground mt-1 font-normal">
                    Listagem de zonas que atendem aos filtros técnicos selecionados.
                  </p>
                )}
              </div>
            </div>
            {selectedUse && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExplicativoOpen(true)}
                className="text-[11px] font-semibold h-8 px-3 rounded-lg flex items-center gap-2"
              >
                <Info className="w-3.5 h-3.5" />
                Explicativo
              </Button>
            )}
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
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white shadow-sm shrink-0">
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        </div>
                        <span className="px-3 py-1 rounded-md text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">Identificada</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {filteredZones.map((z, i) => (
                          <span key={i} className="text-[10px] font-semibold bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border uppercase">{z}</span>
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
                          <span key={i} className="text-[10px] font-semibold bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border uppercase">{z}</span>
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
                          <span key={i} className="text-[10px] font-semibold bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border uppercase">{z}</span>
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
                          <span key={i} className="text-[10px] font-semibold bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border uppercase">{z}</span>
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
                          <span key={i} className="text-[10px] font-semibold bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border uppercase">{z}</span>
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
                          <span key={i} className="text-[10px] font-medium text-muted-foreground uppercase">{z}</span>
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
                  const color = isCompatible ? '#0D542B' : '#82181A';
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
    </div>
  );
}
