import React from 'react';
import { createPortal } from 'react-dom';
import { NOTAS_DICTIONARY } from '../utils/labels';
import { X } from 'lucide-react';

interface NotesModalProps {
  notaId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function NotesModal({ notaId, isOpen, onClose }: NotesModalProps) {
  if (!isOpen) return null;

  // Cleanup the ID to ensure we don't show double parentheses like ((4 - a))
  const cleanId = notaId.replace(/[()]/g, '').trim();
  const content = NOTAS_DICTIONARY[cleanId] || NOTAS_DICTIONARY[notaId] || 'Conteúdo da nota não encontrado na base de dados para esta referência.';

  return createPortal(
    <div className="fixed inset-0 z-modal-max flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      <div className="bg-background rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-border">

        {/* Simple Header */}
        <div className="px-6 pt-6 pb-4 flex justify-between items-start shrink-0 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground text-lg">Nota explicativa</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-normal">LPUOS 2024 • Referência técnica</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full w-6 h-6 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Minimal Content */}
        <div className="px-6 pb-6 flex-1 overflow-y-auto flex flex-col gap-6">
          <div className="pt-2">
            <span className="text-xs font-semibold text-foreground">
              Nota ({cleanId})
            </span>
            <p className="text-muted-foreground leading-relaxed text-[13px] font-normal mt-3">
              {content}
            </p>
          </div>

          <div className="pb-6 text-[10px] text-muted-foreground font-normal">
            Fonte: Lei n° 16.402/2016 e atualizações
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
