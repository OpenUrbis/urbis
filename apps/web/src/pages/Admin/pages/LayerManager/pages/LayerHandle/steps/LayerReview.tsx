import { Button } from "@/components/ui/button";
import { ChevronLeft, Save } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { buildLayerSchema, LayerSchema } from "../utils";
import { IGetConfigLayerSchema } from "@/types/fetch-map-config-type";

interface LayerReviewProps {
  onBack?: () => void;
  originalData?: LayerSchema | null;
  previewSchema?: IGetConfigLayerSchema | null;
  hideNavigation?: boolean;
}

export const LayerReview = ({ onBack, originalData, previewSchema, hideNavigation = false }: LayerReviewProps) => {
  const { watch } = useFormContext();
  const values = watch();

  let finalJson: any = previewSchema;

  if (!finalJson) {
    const generatedSchema = buildLayerSchema(values as any);

    // Merge with original data to show complete object
    finalJson = {
      ...(originalData || {}),
      ...generatedSchema,
      properties: {
        ...(originalData?.properties || {}),
        ...(generatedSchema.properties || {}),
      },
    };
  }

  const ReviewItem = ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="flex flex-col space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm break-all">{value || "-"}</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 h-full flex flex-col">
      <div className="space-y-2 flex-shrink-0">
        <h3 className="text-lg font-medium">Revisão das Configurações</h3>
        <p className="text-sm text-muted-foreground">
          Confira os dados da nova camada antes de confirmar a criação.
        </p>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-2 gap-6">
        {/* Left Column: Summary */}
        <div className="overflow-y-auto pr-2">
          <div className="grid grid-cols-1 gap-4 border rounded-lg p-4 h-fit">
            <h4 className="text-sm font-medium border-b pb-2 mb-2">Resumo</h4>
            <ReviewItem label="Nome da Camada" value={values.layerName} />
            <ReviewItem label="Grupo" value={values.groupId} />
            <ReviewItem label="Método" value={values.loadingMethod} />
            <ReviewItem label="Versão" value={values.version} />
            <ReviewItem label="SRS/CRS" value={values.srs} />
            <ReviewItem
              label="Zoom"
              value={
                values.minZoom || values.maxZoom
                  ? `${values.minZoom || "0"} - ${values.maxZoom || "Max"}`
                  : "Padrão"
              }
            />
            <ReviewItem label="URL Base" value={values.url} />
            <ReviewItem
              label="Camada Selecionada"
              value={values.selectedLayer?.name}
            />
            <ReviewItem label="URL Final (Origin)" value={values.origin} />
          </div>
        </div>

        {/* Right Column: JSON */}
        <div className="flex flex-col min-h-0">
          <h4 className="text-sm font-medium mb-2 flex-shrink-0">Objeto Final (JSON)</h4>
          <div className="relative flex-1 min-h-0 border rounded-lg bg-muted overflow-hidden">
            <pre className="absolute inset-0 p-4 overflow-auto text-xs font-mono">
              {JSON.stringify(finalJson, null, 2)}
            </pre>
          </div>
        </div>
      </div>

    </div>
  );
};
