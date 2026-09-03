import React from "react";
import { RegraZonamento, CondicaoInstalacao } from "../utils/types";
interface ModalExplicativoProps {
    isOpen: boolean;
    onClose: () => void;
    regrasZonamento: RegraZonamento | null;
    condicoesInstalacao: CondicaoInstalacao[];
    hasCnaeUsed?: boolean;
    hasUrbanFilters?: boolean;
    hasPqaFilters?: boolean;
    hasAreaFilter?: boolean;
}
export declare function ModalExplicativo({ isOpen, onClose, regrasZonamento, condicoesInstalacao, hasCnaeUsed, hasUrbanFilters, hasPqaFilters, hasAreaFilter, }: ModalExplicativoProps): React.ReactPortal | null;
export {};
//# sourceMappingURL=ModalExplicativo.d.ts.map