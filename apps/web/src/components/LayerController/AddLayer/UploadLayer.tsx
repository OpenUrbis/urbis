// @ts-nocheck
import { useSignal, useComputed } from "@preact/signals";
import { createElement, useEffect } from "react";
import ReactJson from "react-json-view";
import { Button, UrbisIcon } from "@open-urbis/map-ui";
import { Input } from "@open-urbis/map-ui";
import { Label } from "@open-urbis/map-ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@open-urbis/map-ui";
import { useMapContext } from "../../../hooks/useMapContext";
import { transformFileToJson } from "../../../utils/transformFileToJson";
import {
  IGetConfigLayerSchema,
  IGetConfigLayerSchemaTypeEnum,
} from "../../../types/fetch-map-config-type";
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

  // Pre-select the first group (usually "Geral")
  useEffect(() => {
    if (flatGroups.value.length > 0 && !selectedGroupId.value) {
      selectedGroupId.value = flatGroups.value[0].id;
    }
  }, [flatGroups.value]);

  const MAX_FILE_SIZE = 400 * 1024 * 1024; // 400MB

  const handleFileChange = (e: any) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const selectedFile = target.files[0];

      if (selectedFile.size > MAX_FILE_SIZE) {
        error.value = `O arquivo selecionado é muito grande (${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB). O limite máximo permitido é 400MB.`;
        file.value = null;
        target.value = ""; // Clear input
        return;
      }

      file.value = selectedFile;
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

      const layerId = `upload-${Date.now()}`;
      const newLayer: IGetConfigLayerSchema = {
        id: layerId,
        name: file.value.name.replace(/\.[^/.]+$/, ""),
        origin: "local",
        isActive: true,
        isSelected: true,
        type: IGetConfigLayerSchemaTypeEnum.GeoJsonLayer,
        isVisible: true,
        groupId: selectedGroupId.value,
        colors: [
          {
            id: Date.now(),
            type: "fill",
            color: [59, 130, 246, 255],
            label: "Upload",
            value: "default",
            layerSchemaId: layerId,
            pattern: "full",
          },
        ],
        clickAction: { action: "info" as any, params: {} },
        properties: {
          metadata: { description: "Camada enviada pelo usuário" },
          data: geoJson,
        },
      };

      pendingSchema.value = newLayer;
    } catch (e) {
      console.error("Upload error", e);
      error.value =
        "Falha ao processar arquivo. Certifique-se de que é um GeoJSON válido.";
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
    <div className="space-y-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="h-7 w-fit gap-1 px-1 text-xs text-muted-foreground"
      >
        <UrbisIcon name="arrow_back" className="text-base" aria-hidden="true" />
        Voltar
      </Button>

      {!pendingSchema.value ? (
        <div className="grid w-full gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="geojson">Arquivo GeoJSON</Label>
            <Input
              id="geojson"
              type="file"
              accept=".geojson,.json"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              Formato suportado: .geojson ou .json, até 400MB.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label>Grupo no catálogo</Label>
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
                {flatGroups.value.map((group) => (
                  // @ts-ignore
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="space-y-2 animate-in fade-in slide-in-from-right-4 w-full relative">
          <Label>Revisar camada importada</Label>
          <div className="max-h-[400px] w-full overflow-auto border rounded-md bg-muted/20">
            <div className="min-w-full w-fit p-4">
              {createElement(ReactJson, {
                collapsed: 2,
                collapseStringsAfterLength: 60,
                src: pendingSchema.value,
                style: {
                  backgroundColor: "transparent",
                  wordBreak: "break-all",
                },
                name: false,
                displayDataTypes: false,
              })}
            </div>
          </div>
        </div>
      )}

      {error.value && <div className="text-red-500 text-sm">{error.value}</div>}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        {!pendingSchema.value ? (
          <Button
            onClick={handlePrepare}
            disabled={!file.value || !selectedGroupId.value || loading.value}
          >
            {loading.value ? "Processando..." : "Revisar camada"}
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={() => (pendingSchema.value = null)}
            >
              Voltar
            </Button>
            <Button onClick={handleConfirm}>Adicionar ao mapa</Button>
          </>
        )}
      </div>
    </div>
  );
};
