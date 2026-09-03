import { Button, cn } from "@open-urbis/map-ui";
import { Palette, X } from "lucide-react";
import { IGetConfigLayerSchema } from "../../types/fetch-map-config-type";
import { LayerVisualEditor } from "../LayerVisualEditor";

interface LayerVisualCustomizationPanelProps {
  layer: IGetConfigLayerSchema | null;
  originalLayer?: IGetConfigLayerSchema | null;
  open: boolean;
  className?: string;
  onClose: () => void;
  onPreview: (layer: IGetConfigLayerSchema) => void;
  onSave: (layer: IGetConfigLayerSchema) => void;
}

export const LayerVisualCustomizationPanel = ({
  layer,
  originalLayer,
  open,
  className,
  onClose,
  onPreview,
  onSave,
}: LayerVisualCustomizationPanelProps) => {
  if (!layer) return null;

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden bg-background/95 transition-all duration-300 ease-in-out",
        open
          ? "translate-x-0 opacity-100 visible"
          : "translate-x-[24px] opacity-0 invisible pointer-events-none",
        className,
      )}
      aria-label="Personalizar visualmente camada"
    >
      <div className="flex items-start justify-between gap-3 border-b bg-background/80 p-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Palette className="h-4 w-4 text-primary" />
            <span>Personalizar visualmente camada</span>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {layer.name}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onClose}
          aria-label="Fechar personalização visual"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="border-b bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        Ajuste visual, gere prévia e aplique quando estiver pronto. Use
        “Restaurar original” para desfazer alterações locais.
      </div>

      <LayerVisualEditor
        layer={layer}
        originalLayer={originalLayer}
        onPreview={onPreview}
        onSave={onSave}
      />
    </aside>
  );
};
