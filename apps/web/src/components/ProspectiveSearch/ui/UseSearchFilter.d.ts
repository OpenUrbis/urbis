import { UsoSearchResultItem } from "../utils/types";
interface UseSearchFilterProps {
    useSearchTerm: string;
    setUseSearchTerm: (term: string) => void;
    searchMode: "atividade" | "cnae" | "cnpj";
    setSearchMode: (mode: "atividade" | "cnae" | "cnpj") => void;
    searchResults: any;
    onSelectUse: (use: UsoSearchResultItem) => void;
    selectedUse: UsoSearchResultItem | null;
    clearSelection: () => void;
    usosData: any[];
    cnaeData: any[];
    cnaeCatalogData: any[];
    onOpenInfo?: (type: "uso" | "cnae" | "cnpj" | "parametros" | "area" | "ver-prospeccao") => void;
}
export declare function UseSearchFilter({ useSearchTerm, setUseSearchTerm, searchMode, setSearchMode, searchResults, onSelectUse, selectedUse, clearSelection, usosData, cnaeData, cnaeCatalogData, onOpenInfo, }: UseSearchFilterProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=UseSearchFilter.d.ts.map