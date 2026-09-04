import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { UsoSearchResultItem } from "../utils/types";
import { pesquisarUsos } from "../utils/use-logic";
import { UseSearchFilter } from "./UseSearchFilter";
import { useProspectiveSearchContext } from "../ProspectiveSearchContext";
import { Button } from "@open-urbis/map-ui";
import { Search, X, Sparkles, Check, Building2, HelpCircle } from "lucide-react";

interface IntendedUseSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUse: UsoSearchResultItem | null;
  onSelectUse: (use: UsoSearchResultItem | null) => void;
  usosData?: any[];
  cnaeData?: any[];
  cnaeCatalogData?: any[];
}

export function IntendedUseSelectorModal({
  isOpen,
  onClose,
  selectedUse,
  onSelectUse,
  usosData: propUsosData,
  cnaeData: propCnaeData,
  cnaeCatalogData: propCnaeCatalogData,
}: IntendedUseSelectorModalProps) {
  let contextState: any = null;
  try {
    contextState = useProspectiveSearchContext();
  } catch {
    contextState = null;
  }

  const usosData = propUsosData || contextState?.usosData || [];
  const cnaeData = propCnaeData || contextState?.cnaeData || [];
  const cnaeCatalogData =
    propCnaeCatalogData || contextState?.cnaeCatalogData || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState<"atividade" | "cnae" | "cnpj">(
    "atividade",
  );
  const [debouncedTerm, setDebouncedTerm] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const searchResults = useMemo(() => {
    if (debouncedTerm.trim().length < 2) return null;
    if (searchMode === "cnpj") return null;
    return pesquisarUsos(debouncedTerm, usosData, cnaeData, searchMode as any);
  }, [debouncedTerm, usosData, cnaeData, searchMode]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 p-4">
      <div className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-border">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Selecionar Uso Pretendido
              </h3>
              <p className="text-xs text-muted-foreground">
                Consulte por atividade municipal (LPUOS), CNAE federal ou CNPJ
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Como funciona:</span>{" "}
            O uso selecionado será cruzado com a Lei de Zoneamento (Lei nº 16.402/2016) para verificar permissibilidade na zona do imóvel e calcular exigências de vagas, carga e descarga e condições de instalação.
          </div>

          <UseSearchFilter
            useSearchTerm={searchTerm}
            setUseSearchTerm={setSearchTerm}
            searchMode={searchMode}
            setSearchMode={setSearchMode}
            searchResults={searchResults}
            onSelectUse={(use) => {
              onSelectUse(use);
              onClose();
            }}
            selectedUse={selectedUse}
            clearSelection={() => onSelectUse(null)}
            usosData={usosData}
            cnaeData={cnaeData}
            cnaeCatalogData={cnaeCatalogData}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/10 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-muted-foreground">
            Base legal: Quadro nº 4 e 4A da Lei nº 16.402/2016 e Decreto nº 57.378/2016
          </div>
          <div className="flex items-center gap-2">
            {selectedUse && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  onSelectUse(null);
                }}
              >
                Limpar seleção
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="text-xs"
              onClick={onClose}
            >
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
