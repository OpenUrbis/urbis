import React from 'react';
import { RegraZonamento, CondicaoInstalacao } from '../utils/types';
import { NOTAS_DICTIONARY, formatParameter } from '../utils/labels';
import { X, Check, Info, AlertTriangle, HelpCircle } from 'lucide-react';

interface ModalExplicativoProps {
  isOpen: boolean;
  onClose: () => void;
  regrasZonamento: RegraZonamento;
  condicoesInstalacao: CondicaoInstalacao[];
}

export function ModalExplicativo({ isOpen, onClose, regrasZonamento, condicoesInstalacao }: ModalExplicativoProps) {
  if (!isOpen) return null;

  // Organize parameter notes
  const parameterNotesMap: Record<string, string[]> = {};
  condicoesInstalacao.forEach(cond => {
    (cond.notas || []).forEach(nota => {
      // Clean the note string if it comes with parentheses from the data
      const cleanNota = nota.replace(/[()]/g, '').trim();
      if (!parameterNotesMap[cleanNota]) parameterNotesMap[cleanNota] = [];
      parameterNotesMap[cleanNota].push(cond.parametro);
    });
  });

  const NoteItem = ({ noteId, targets, context }: { noteId: string, targets: string[], context: 'zonas' | 'params' }) => (
    <div className="py-2">
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

  const statusItems = [
    { label: 'Permitido', color: '#0D542B', icon: Check, desc: 'Uso permitido sem restrições' },
    { label: 'Permitido com Condições', color: '#1C398E', icon: Info, desc: 'Uso permitido com notas específicas' },
    { label: 'Restrito', color: '#7E2A0C', icon: AlertTriangle, desc: 'Uso proibido com possíveis exceções' },
    { label: 'Proibido', color: '#82181A', icon: X, desc: 'Uso completamente proibido' },
    { label: 'Regime Especial', color: '#0F172B', icon: HelpCircle, desc: 'Consultar legislação específica' },
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 border border-gray-100 overflow-hidden">

        {/* Simple Header */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-start shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">Diretrizes e legendas</h3>
            <p className="text-[11px] text-gray-500 mt-0.5 font-normal">Referência técnica da LPUOS (Lei nº 16.402/2016)</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full w-8 h-8 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Minimal Scrollable Content */}
        <div className="px-8 pb-4 bg-white overflow-y-auto flex-1 space-y-10 custom-scrollbar">

          {/* Legend Section - Pure Text Style */}
          <section>
            <h4 className="text-[11px] font-semibold text-gray-400 mb-8 pb-2 border-b border-gray-50">
              Legenda de permissibilidade
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5 pb-2">
              {statusItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5" style={{ backgroundColor: item.color }}>
                      <Icon className="w-2.5 h-2.5" strokeWidth={4} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-900 leading-none block mb-1">{item.label}</span>
                      <p className="text-[11px] text-gray-400 font-normal leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Combined Notes Section */}
          <section>
            <h4 className="text-[11px] font-semibold text-gray-400 mb-4 pb-2 border-b border-gray-50">
              Notas explicativas consolidada
            </h4>

            <div className="space-y-4 divide-y divide-gray-50">
              {Object.entries(regrasZonamento.simComNota).map(([nota, zonas]) => (
                <NoteItem key={`sim-${nota}`} noteId={nota} targets={zonas} context="zonas" />
              ))}
              {Object.entries(regrasZonamento.naoComNota).map(([nota, zonas]) => (
                <NoteItem key={`nao-${nota}`} noteId={nota} targets={zonas} context="zonas" />
              ))}
              {Object.entries(parameterNotesMap).map(([nota, params]) => (
                <NoteItem key={`param-${nota}`} noteId={nota} targets={params} context="params" />
              ))}

              {Object.keys(regrasZonamento.simComNota).length === 0 &&
                Object.keys(regrasZonamento.naoComNota).length === 0 &&
                Object.keys(parameterNotesMap).length === 0 && (
                  <p className="text-xs text-gray-400 italic py-4">Nenhuma nota específica aplicável para este uso.</p>
                )}
            </div>
          </section>

          {/* Legal Source Info */}
          <section className="pt-4 border-t border-gray-50">
            <p className="text-[10px] text-gray-400 leading-relaxed font-normal">
              Os dados representam os Quadros nº 4 e 4A da Lei n° 16.402/2016 e Decreto nº 57.378/2016.
              Em casos de HIS1, HIS2 e HMP, consulte a regulamentação especial (Decreto nº 63.728/2024).
            </p>
          </section>

        </div>

        {/* Simple Footer */}
        <div className="px-8 py-5 border-t border-gray-50 flex justify-end shrink-0 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-semibold text-xs transition-all active:scale-95"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
