import React from "react";
interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: "uso" | "cnae" | "cnpj" | "parametros" | "area" | "ver-prospeccao" | null;
}
export declare function InfoModal({ isOpen, onClose, type }: InfoModalProps): React.ReactPortal | null;
export {};
//# sourceMappingURL=InfoModal.d.ts.map