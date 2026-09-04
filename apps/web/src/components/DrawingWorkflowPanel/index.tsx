import { useState, useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { Button, Input, UrbisIcon } from "@open-urbis/map-ui";
import {
  PenTool,
  UploadCloud,
  Layers,
  Search,
  CheckCircle2,
  Info,
  Image as ImageIcon,
} from "lucide-react";
import proj4 from "proj4";
import { useMapContext } from "../../hooks/useMapContext";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { useToast } from "../../hooks/useToast";
import { transformFileToJson } from "../../utils/transformFileToJson";
import { getGeoJsonBounds } from "../MapView/utils";
import { mapImageControl } from "../MapView/map-controls";

export const DrawingWorkflowPanel = () => {
  const file = useSignal<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const crs = useSignal<"EPSG:4674" | "EPSG:4326" | "EPSG:31983">("EPSG:31983");
  const error = useSignal("");
  const polygonEdit = usePolygonEditContext();
  const { flyTo } = useMapContext();
  const { clearCurrentPage } = useNavigationContext();
  const { toastSuccess } = useToast();

  const [mode, setMode] = useState<"options" | "import">("options");

  const startDrawing = () => {
    polygonEdit.reset();
    polygonEdit.setIsEditing(true);
    polygonEdit.drawRef.current?.deleteAll();
    polygonEdit.drawRef.current?.changeMode("draw_polygon");
    clearCurrentPage();
  };

  const handleImageSelect = async (e: any) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!mapImageControl.current) {
      error.value = "Controle de imagem do mapa não inicializado.";
      return;
    }

    try {
      const control = mapImageControl.current;
      const imageId = await control.addFile(selected);
      if (imageId) {
        control.selectRaster(imageId);
      }
      clearCurrentPage();
      toastSuccess(
        "Imagem inserida! Ajuste a posição no mapa e clique em 'Transformar em camada'.",
      );
    } catch (err) {
      console.error("Erro ao inserir imagem", err);
      error.value = "Falha ao carregar a imagem selecionada.";
    }
  };

  const selectedExample =
    crs.value === "EPSG:31983"
      ? {
          href: "/exemplo_sirgas_utm.geojson",
          label: "Baixar exemplo (SIRGAS 2000 UTM)",
        }
      : {
          href: "/exemplo_wgs84.geojson",
          label: "Baixar exemplo (WGS 84)",
        };

  const handleImport = async () => {
    if (!file.value) {
      error.value = "Selecione um arquivo GeoJSON válido.";
      return;
    }

    try {
      let object = await transformFileToJson(file.value);

      if (crs.value !== "EPSG:4326") {
        const transform = (coords: any): any => {
          if (typeof coords[0] === "number") {
            return proj4(crs.value, "EPSG:4326", coords);
          }
          return coords.map(transform);
        };

        const transformFeature = (feat: any) => {
          if (feat.geometry?.coordinates) {
            feat.geometry.coordinates = transform(
              feat.geometry.coordinates,
            );
          }
          return feat;
        };

        if (object.type === "FeatureCollection") {
          object.features = object.features.map(transformFeature);
        } else if (object.type === "Feature") {
          object = transformFeature(object);
        }
      }

      let featureToEdit = object;
      if (object.type === "FeatureCollection") {
        featureToEdit = object.features?.[0];
      }

      if (!featureToEdit) {
        error.value = "Não foi possível encontrar uma geometria no arquivo.";
        return;
      }

      delete featureToEdit.crs;
      polygonEdit.editFeature(featureToEdit);
      polygonEdit.fetchData(featureToEdit);
      clearCurrentPage();

      const geometry = featureToEdit.geometry;
      if (geometry?.coordinates) {
        flyTo({
          bounds: getGeoJsonBounds(geometry),
          bearing: 0,
        });
      }
    } catch (err: any) {
      error.value =
        typeof err === "string" ? err : "Erro ao carregar o arquivo GeoJSON.";
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-background/90 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b bg-background/70 p-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-primary mb-1">
            <PenTool className="h-4 w-4" />
            <h5 className="m-0 text-sm font-semibold">Desenhar no mapa</h5>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Desenhe uma área para analisar parâmetros territoriais ou salvar como uma nova camada personalizada.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-mr-1 -mt-1 h-7 w-7 shrink-0 rounded-full"
          aria-label="Fechar painel de desenho"
          onClick={clearCurrentPage}
        >
          <UrbisIcon name="close" className="text-base" aria-hidden="true" />
        </Button>
      </div>

      <div className="p-3 space-y-3">
        {mode === "options" ? (
          <>
            {/* Como funciona o desenho */}
            <div className="rounded-xl border bg-card p-3 space-y-2 text-xs shadow-2xs">
              <h6 className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Como desenhar uma área:
              </h6>
              <ol className="text-[11.5px] space-y-1.5 text-muted-foreground list-decimal list-inside leading-relaxed">
                <li>Clique no botão <strong>&ldquo;Começar desenho&rdquo;</strong> abaixo.</li>
                <li>Clique no mapa para marcar cada vértice do seu polígono.</li>
                <li>Para fechar o contorno, clique novamente sobre o <strong>primeiro ponto</strong>.</li>
              </ol>
            </div>

            {/* O que você pode fazer após desenhar */}
            <div className="rounded-xl border bg-muted/25 p-3 space-y-2.5 text-xs">
              <h6 className="font-semibold text-foreground flex items-center gap-1.5">
                <Info className="h-4 w-4 text-primary" />
                Duas possibilidades para o seu desenho:
              </h6>
              <div className="space-y-2">
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-background border">
                  <Search className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="text-[11px]">
                    <strong className="text-foreground block">1. Pesquisar e analisar dados</strong>
                    <span className="text-muted-foreground">
                      Consulte automaticamente as interseções com zoneamento, lotes fiscais e restrições na janela de dados e gere a FIU.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-background border">
                  <Layers className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="text-[11px]">
                    <strong className="text-foreground block">2. Criar camada no mapa</strong>
                    <span className="text-muted-foreground">
                      Salve o perímetro desenhado como uma camada vetorial permanente no seu gerenciador de camadas.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="space-y-2 pt-1">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />

              <Button
                className="w-full text-xs font-bold h-9 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                onClick={startDrawing}
              >
                <PenTool className="mr-2 h-4 w-4" />
                Começar desenho no mapa
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => imageInputRef.current?.click()}
                title="Inserir imagem sobre o mapa para transformar em camada"
              >
                <ImageIcon className="mr-2 h-3.5 w-3.5 text-primary" />
                Sobrepor imagem no mapa
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setMode("import")}
              >
                <UploadCloud className="mr-2 h-3.5 w-3.5" />
                Importar arquivo GeoJSON
              </Button>
            </div>
          </>
        ) : (
          /* Import Mode */
          <div className="space-y-3">
            <div className="rounded-xl border bg-card p-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <h6 className="font-semibold text-foreground flex items-center gap-1.5">
                  <UploadCloud className="h-4 w-4 text-primary" />
                  Enviar arquivo GeoJSON
                </h6>
                <button
                  type="button"
                  onClick={() => setMode("options")}
                  className="text-xs text-primary hover:underline"
                >
                  Voltar
                </button>
              </div>

              <div className="space-y-2 pt-1">
                <div className="grid gap-1">
                  <label htmlFor="drawing-geojson-crs" className="text-xs font-medium text-foreground">
                    Sistema de coordenadas:
                  </label>
                  <select
                    id="drawing-geojson-crs"
                    className="h-8 rounded-md border bg-background px-2.5 text-xs text-foreground"
                    value={crs.value}
                    onChange={(event) =>
                      (crs.value = event.currentTarget.value as typeof crs.value)
                    }
                  >
                    <option value="EPSG:31983">Metros — SIRGAS 2000 / UTM 23S</option>
                    <option value="EPSG:4674">Latitude/longitude — SIRGAS 2000</option>
                    <option value="EPSG:4326">Latitude/longitude — WGS 84</option>
                  </select>
                </div>

                <div className="grid gap-1">
                  <label htmlFor="drawing-geojson" className="text-xs font-medium text-foreground">
                    Arquivo GeoJSON
                  </label>
                  <Input
                    id="drawing-geojson"
                    className="h-8 text-xs"
                    type="file"
                    accept=".geojson,application/geo+json,application/json"
                    onChange={(event) => {
                      file.value = event.currentTarget.files?.[0] ?? null;
                      error.value = "";
                    }}
                  />
                </div>

                <a
                  href={selectedExample.href}
                  download
                  className="inline-flex items-center gap-1 text-[10.5px] text-primary hover:underline"
                >
                  <UrbisIcon name="download" className="text-[10px]" aria-hidden="true" />
                  {selectedExample.label}
                </a>

                {error.value && (
                  <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-2 text-xs text-destructive">
                    {error.value}
                  </p>
                )}

                <Button
                  className="w-full text-xs font-semibold mt-1"
                  onClick={handleImport}
                >
                  <UploadCloud className="mr-2 h-3.5 w-3.5" />
                  Usar arquivo no mapa
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
