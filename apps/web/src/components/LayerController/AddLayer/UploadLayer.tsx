// @ts-nocheck
import { useSignal, useComputed } from "@preact/signals";
import { createElement } from "react";
import ReactJson from "react-json-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMapContext } from "../../../hooks/useMapContext";
import { transformFileToJson } from "../../../utils/transformFileToJson";
import { IGetConfigLayerSchema, IGetConfigLayerSchemaTypeEnum } from "../../../types/fetch-map-config-type";
import { flattenLayerGroups } from "../../../utils/layer-utils";

interface UploadLayerProps {
  onBack: () => void;
  onClose: () => void;
}

export const UploadLayer = ({ onBack, onClose }: UploadLayerProps) => {
  const { layerSchemas, layerGroups } = useMapContext();
  const file = useSignal<File | null>(null);
  const loading = useSignal(false);
  const error = useSignal("");
  const selectedGroupId = useSignal<string>("");
  const pendingSchema = useSignal<IGetConfigLayerSchema | null>(null);

  const flatGroups = useComputed(() => flattenLayerGroups(layerGroups.value));

  const handleFileChange = (e: any) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      file.value = target.files[0];
      error.value = "";
    }
  };

  const handlePrepare = async () => {
    if (!file.value || !selectedGroupId.value) {
        error.value = "Por favor selecione um arquivo e um grupo.";
        return;
    }
    
    loading.value = true;
    error.value = "";

    try {
      const geoJson = await transformFileToJson(file.value);
      
      const newLayer: IGetConfigLayerSchema = {
        id: `upload-${Date.now()}`,
        name: file.value.name.replace(/\.[^/.]+$/, ""),
        origin: "local",
        isActive: true,
        type: IGetConfigLayerSchemaTypeEnum.GeoJsonLayer,
        isVisible: true,
        groupId: selectedGroupId.value,
        colors: [{ 
            id: Date.now(),
            type: "fill", 
            color: [59, 130, 246, 255], 
            label: "Upload", 
            value: "default", 
            layerSchemaId: `upload-${Date.now()}`,
            pattern: "full"
        }],
        clickAction: { action: "info" as any, params: {} },
        properties: {
           metadata: { description: "Camada enviada pelo usuário" },
           data: geoJson
        }
      };

      pendingSchema.value = newLayer;

    } catch (e) {
      console.error("Upload error", e);
      error.value = "Falha ao processar arquivo. Certifique-se de que é um GeoJSON válido.";
    } finally {
      loading.value = false;
    }
  };

  const handleConfirm = () => {
      if (pendingSchema.value) {
          layerSchemas.value = [...layerSchemas.value, pendingSchema.value];
          onClose();
      }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <span className="material-symbols-outlined">arrow_back</span>
        </Button>
        <h3 className="font-semibold text-lg">Upload de Dados</h3>
      </div>

      {!pendingSchema.value ? (
          <div className="grid w-full gap-4">
            <div className="grid gap-1.5">
                <Label htmlFor="geojson">Arquivo GeoJSON</Label>
                <Input id="geojson" type="file" accept=".geojson,.json" onChange={handleFileChange} />
                <p className="text-sm text-muted-foreground">Formatos suportados: GeoJSON</p>
            </div>

            <div className="grid gap-1.5">
                <Label>Selecionar Grupo</Label>
                {/* @ts-ignore */}
                <Select 
                    value={selectedGroupId.value} 
                    onValueChange={(val) => (selectedGroupId.value = val)}
                >
                    {/* @ts-ignore */}
                    <SelectTrigger>
                        {/* @ts-ignore */}
                        <SelectValue placeholder="Escolha um grupo para esta camada" />
                    </SelectTrigger>
                    {/* @ts-ignore */}
                    <SelectContent>
                        {flatGroups.value.map(group => (
                            // @ts-ignore
                            <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
      ) : (
          <div className="space-y-2 animate-in fade-in slide-in-from-right-4 w-full relative">
              <Label>Revisar Configuração</Label>
              <div className="max-h-[400px] w-full overflow-auto border rounded-md bg-muted/20">
                  <div className="min-w-full w-fit p-4">
                  {createElement(ReactJson, {
                    collapsed: 2,
                    collapseStringsAfterLength: 60,
                    src: pendingSchema.value,
                    style: { backgroundColor: 'transparent', wordBreak: 'break-all' },
                    name: false,
                    displayDataTypes: false
                  })}
                  </div>
              </div>
          </div>
      )}

      {error.value && (
        <div className="text-red-500 text-sm">{error.value}</div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        {!pendingSchema.value ? (
            <Button onClick={handlePrepare} disabled={!file.value || !selectedGroupId.value || loading.value}>
            {loading.value ? "Processando..." : "Próximo"}
            </Button>
        ) : (
            <>
                <Button variant="secondary" onClick={() => (pendingSchema.value = null)}>Voltar</Button>
                <Button onClick={handleConfirm}>Adicionar ao Mapa</Button>
            </>
        )}
      </div>
    </div>
  );
};
