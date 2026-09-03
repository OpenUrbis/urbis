import { RegraZonamento, CondicaoInstalacao, UsoSearchResultItem } from "../utils/types";
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
export declare function ResultsTable({ regrasZonamento, condicoesInstalacao, selectedUse, filteredZones, compatiblePqas, allPqaNames, hasPqaFilters, hasUrbanFilters, hasAreaFilter, setExplicativoOpen: _setExplicativoOpen, setSelectedNoteId, }: ResultsTableProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ResultsTable.d.ts.map