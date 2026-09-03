import React from "react";
import { Button } from "@open-urbis/map-ui";
import { Link as LinkIcon, Edit, X, Search } from "lucide-react";

interface NormativeLinkInputProps {
  value: string;
  onChange?: (value: string) => void; // If undefined, read-only or handled via onOpen
  onOpen: () => void;
  label?: string; // Display label (from cache)
  placeholder?: string;
}

export function NormativeLinkInput({
  value,
  onChange,
  onOpen,
  label,
  placeholder = "Selecionar elemento",
}: NormativeLinkInputProps) {
  const displayLabel = label || value;
  const hasValue = !!value;

  if (hasValue) {
    return (
      <div className="flex items-center gap-2 border rounded-md px-2 py-1 h-8 text-xs w-full group relative">
        <LinkIcon className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="truncate flex-1">{displayLabel}</span>
        {/* Sits on top of the label, so it needs an opaque backdrop. */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 bg-background p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onOpen}
            title="Alterar Vínculo"
          >
            <Edit className="h-3 w-3" />
          </Button>
          {onChange && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:text-destructive"
              onClick={() => onChange("")}
              title="Remover Vínculo"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-start text-muted-foreground font-normal text-xs h-8"
      onClick={onOpen}
    >
      <Search className="mr-2 h-3 w-3" />
      {placeholder}
    </Button>
  );
}
