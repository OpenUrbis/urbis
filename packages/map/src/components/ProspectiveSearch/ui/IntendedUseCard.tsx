import React, { useState } from "react";
import { UsoSearchResultItem } from "../utils/types";
import { IntendedUseSelectorModal } from "./IntendedUseSelectorModal";
import { Button } from "@open-urbis/map-ui";
import {
  Building2,
  Search,
  X,
  Edit2,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";

interface IntendedUseCardProps {
  selectedUse: UsoSearchResultItem | null;
  onSelectUse: (use: UsoSearchResultItem | null) => void;
  className?: string;
  isCompact?: boolean;
}

const DIVISAO_COLORS: Record<string, string> = {
  "Categoria de uso": "bg-blue-500 text-blue-500",
  "Subcategoria de uso": "bg-indigo-500 text-indigo-500",
  Tipologia: "bg-emerald-500 text-emerald-500",
  "Grupo de atividades": "bg-amber-500 text-amber-500",
  Atividade: "bg-sky-500 text-sky-500",
  Subtipologia: "bg-purple-500 text-purple-500",
};

export function IntendedUseCard({
  selectedUse,
  onSelectUse,
  className = "",
  isCompact = false,
}: IntendedUseCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getVal = (obj: any, keys: string[]) => {
    if (!obj) return "";
    const foundKey = Object.keys(obj).find((k) =>
      keys.some((key) => key.toLowerCase() === k.trim().toLowerCase()),
    );
    return foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null
      ? String(obj[foundKey]).trim()
      : "";
  };

  if (!selectedUse) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsModalOpen(true)}
          className={`w-full justify-between rounded-xl border-dashed border-primary/40 bg-primary/[0.03] hover:bg-primary/[0.08] hover:border-primary transition-all text-left group ${
            isCompact ? "h-9 px-3 text-xs" : "h-auto p-3.5"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform shrink-0">
              <Search className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-foreground text-xs block truncate">
                Selecionar uso pretendido...
              </span>
              {!isCompact && (
                <span className="text-[10px] text-muted-foreground block truncate">
                  Busque por atividade, CNAE ou CNPJ para verificar regras da LPUOS
                </span>
              )}
            </div>
          </div>
          <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
            Opcional
          </span>
        </Button>

        <IntendedUseSelectorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedUse={selectedUse}
          onSelectUse={onSelectUse}
        />
      </div>
    );
  }

  const { item, arvore, cnaeOriginario } = selectedUse;
  const codigo = getVal(item, ["Código", "Codigo", "codigo"]);
  const divisao = getVal(item, ["Divisão", "Divisao", "divisao"]) || "Uso";
  const descricao = getVal(item, ["Descrição", "Descricao", "descricao"]);

  const hierarchyParts = [
    getVal(arvore?.categoria, ["Descrição", "Descricao", "descricao"]),
    getVal(arvore?.subcategoria, ["Descrição", "Descricao", "descricao"]),
    getVal(arvore?.tipologiaOuGrupo, ["Descrição", "Descricao", "descricao"]),
  ].filter(Boolean);

  const cnaeCode =
    getVal(cnaeOriginario, ["subclassesCnae2.2", "Subclasses (CNAE 2.2)"]) ||
    getVal(cnaeOriginario, ["classeCnae2.2", "Classe (CNAE 2.2)"]);
  const cnaeDesc = getVal(cnaeOriginario, [
    "denominacaoCnae2.2",
    "Denominação (CNAE 2.2)",
  ]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="rounded-xl border border-border bg-card p-3 shadow-xs relative overflow-hidden flex flex-col gap-2">
        {/* Left vertical color bar */}
        <div
          className={`absolute top-0 left-0 w-1.5 h-full ${
            DIVISAO_COLORS[divisao]?.split(" ")[0] || "bg-primary"
          }`}
        />

        <div className="flex items-start justify-between gap-2 pl-1.5">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-muted text-foreground">
                {divisao}
              </span>
              {codigo && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                  {codigo}
                </span>
              )}
              {cnaeCode && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  CNAE {cnaeCode}
                </span>
              )}
            </div>

            <h4 className="text-xs font-semibold text-foreground leading-snug">
              {descricao}
            </h4>

            {hierarchyParts.length > 0 && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 flex-wrap">
                <span>{hierarchyParts.join(" › ")}</span>
              </p>
            )}

            {cnaeDesc && (
              <p className="text-[10px] text-muted-foreground pt-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Atividade CNAE:
                </span>{" "}
                {cnaeDesc}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 -mt-1 -mr-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => setIsModalOpen(true)}
              title="Alterar uso selecionado"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
              onClick={() => onSelectUse(null)}
              title="Remover uso"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <IntendedUseSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedUse={selectedUse}
        onSelectUse={onSelectUse}
      />
    </div>
  );
}
