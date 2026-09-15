import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createPortal } from "react-dom";
import { NOTAS_DICTIONARY } from "../utils/labels";
import { X } from "lucide-react";
export function NotesModal({ notaId, isOpen, onClose }) {
    if (!isOpen)
        return null;
    // Cleanup the ID to ensure we don't show double parentheses like ((4 - a))
    const cleanId = notaId.replace(/[()]/g, "").trim();
    const content = NOTAS_DICTIONARY[cleanId] ||
        NOTAS_DICTIONARY[notaId] ||
        "Conteúdo da nota não encontrado na base de dados para esta referência.";
    return createPortal(_jsx("div", { className: "fixed inset-0 z-[10002] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 p-4", children: _jsxs("div", { className: "bg-background rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-border", children: [_jsxs("div", { className: "px-6 pt-6 pb-4 flex justify-between items-start shrink-0 border-b border-border", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-foreground text-lg", children: "Nota explicativa" }), _jsx("p", { className: "text-[11px] text-muted-foreground mt-0.5 font-normal", children: "LPUOS 2024 \u2022 Refer\u00EAncia t\u00E9cnica" })] }), _jsx("button", { onClick: onClose, className: "text-muted-foreground hover:text-foreground hover:bg-muted rounded-full w-6 h-6 flex items-center justify-center transition-all", children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "px-6 pb-6 flex-1 overflow-y-auto flex flex-col gap-6", children: [_jsxs("div", { className: "pt-2", children: [_jsxs("span", { className: "text-xs font-semibold text-foreground", children: ["Nota (", cleanId, ")"] }), _jsx("p", { className: "text-muted-foreground leading-relaxed text-[13px] font-normal mt-3", children: content })] }), _jsx("div", { className: "pb-6 text-[10px] text-muted-foreground font-normal", children: "Fonte: Lei n\u00B0 16.402/2016 e atualiza\u00E7\u00F5es" })] })] }) }), document.body);
}
