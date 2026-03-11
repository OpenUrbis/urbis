import React from 'react';
import { X, BookOpen, Layers } from 'lucide-react';

interface SynthesisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SynthesisModal({ isOpen, onClose }: SynthesisModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 overflow-hidden">

        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/20 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <Layers className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold  dark:text-white text-xl tracking-tight">Modo síntese</h3>
              <p className="text-xs font-medium   mt-1">Metodologia de cruzamento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="relative z-10  hover: dark:hover: hover:bg-white dark:hover:bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700 bg-transparent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 bg-white dark:bg-slate-900 overflow-y-auto">
          <div className="grid gap-4">
            <div className="flex flex-col p-5 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <span className="text-sm font-bold  dark:text-white">Uso permitido direto</span>
              </div>
              <p className="text-xs   font-medium pl-9 leading-relaxed">
                Zonas onde o uso selecionado é permitido sem notas e os parâmetros urbanísticos atendem aos critérios.
              </p>
            </div>

            <div className="flex flex-col p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <span className="text-sm font-bold  dark:text-white">Uso permitido com exceções</span>
              </div>
              <p className="text-xs   font-medium pl-9 leading-relaxed">
                Zonas onde o uso é permitido via notas explicativas e os parâmetros urbanísticos estão dentro do esperado.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm shrink-0 border border-slate-100 dark:border-slate-600">
              <BookOpen className="w-4 h-4  " />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold   uppercase tracking-wider">Explicação técnica</span>
              <p className="text-[11px]   leading-relaxed font-medium">
                Os resultados representam uma interseção lógica entre a viabilidade do zoneamento e o atendimento aos parâmetros. Para ver a lista completa de zonas e todas as notas de restrição, desative o Modo Síntese.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
