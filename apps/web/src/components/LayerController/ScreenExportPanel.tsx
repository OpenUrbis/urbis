import { useSignal } from "@preact/signals";
import { useMemo } from "preact/hooks";
import { Button, cn, UrbisIcon } from "@open-urbis/map-ui";
import {
  Download,
  Layers,
  Info,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  FileText,
} from "lucide-react";
import { useMapContext } from "../../hooks/useMapContext";
import { exportGeoJson } from "../../integrations/map-integration";
import { getLayerNameFromConfig } from "../../utils/layer-utils";

const environment = (import.meta.env.VITE_API_URL || "/api") + "/maps";

interface ScreenExportPanelProps {
  onClose?: () => void;
}

export const ScreenExportPanel = ({ onClose }: ScreenExportPanelProps) => {
  const { layerSchemas, boundingBox, zoom } = useMapContext();

  const selectedFormat = useSignal<"geojson" | "dwg">("geojson");
  const isExporting = useSignal<boolean>(false);
  const errorMessage = useSignal<string | null>(null);
  const exportResult = useSignal<{ url: string; filename: string } | null>(null);

  const currentZoom = zoom?.value ?? 0;

  // Identify all active (visible) layers
  const activeLayers = useMemo(() => {
    return (layerSchemas?.value || []).filter((s) => s.isVisible);
  }, [layerSchemas?.value]);

  // Active layers ready for export (within minZoom threshold)
  const exportableLayers = useMemo(() => {
    return activeLayers.filter((s) => {
      const minZ = s.minZoom;
      return !(typeof minZ === "number" && minZ > 0 && currentZoom < minZ);
    });
  }, [activeLayers, currentZoom]);

  const hasActiveLayersRequiringZoom =
    activeLayers.length > exportableLayers.length;

  const handleExport = async () => {
    if (exportableLayers.length === 0 || isExporting.value) return;

    isExporting.value = true;
    errorMessage.value = null;

    try {
      const bounds = boundingBox?.value || [];
      const format = selectedFormat.value;

      const layerIds: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const externalLayers: any[] = [];

      exportableLayers.forEach((layer: any) => {
        const layerProps = layer.properties || {};
        const wmsProps = layerProps.wms || {};

        const wfsUrl = wmsProps.url || layer.origin;
        const typeName =
          wmsProps.layers ||
          layerProps.layers ||
          layerProps.typeName ||
          layerProps.type_name ||
          getLayerNameFromConfig(layer);

        if (wfsUrl && typeName) {
          const filter =
            layer.cqlFilter || layerProps.cql_filter || layerProps.cqlFilter;

          let finalWfsUrl = wfsUrl;
          if (finalWfsUrl.startsWith("/")) {
            finalWfsUrl = `${environment.replace("/maps", "")}${finalWfsUrl}`;
          } else if (!finalWfsUrl.startsWith("http")) {
            finalWfsUrl = `${environment.replace("/maps", "")}/${finalWfsUrl}`;
          }

          externalLayers.push({
            id: layer.id,
            wfsUrl: finalWfsUrl,
            typeName,
            cqlFilter: filter,
            cql_filter: filter,
            CQL_FILTER: filter,
            minZoom: layer.minZoom,
          });
        } else {
          layerIds.push(layer.id);
        }
      });

      const blob = await exportGeoJson(
        bounds,
        layerIds,
        currentZoom,
        format,
        externalLayers,
      );

      // Clean up previous object URL if any
      if (exportResult.value?.url) {
        URL.revokeObjectURL(exportResult.value.url);
      }

      const url = URL.createObjectURL(blob);
      const ext = format === "dwg" ? "dxf" : "geojson";
      const filename = `exportacao-urbis-${Date.now()}.${ext}`;

      exportResult.value = { url, filename };

      // Trigger automatic download
      try {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (dlErr) {
        console.warn("Auto-download triggered link fallback", dlErr);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error("Export failed", e);
      let message = "Ocorreu um erro ao exportar os dados das camadas.";

      if (e?.response?.data instanceof Blob) {
        try {
          const text = await e.response.data.text();
          const json = JSON.parse(text);
          if (json?.message) message = json.message;
        } catch {
          // ignore
        }
      } else if (e?.response?.data?.message) {
        message = e.response.data.message;
      } else if (e?.message) {
        message = e.message;
      }

      errorMessage.value = message;
    } finally {
      isExporting.value = false;
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col h-full">
      {/* Panel Header */}
      <div className="flex items-start justify-between gap-2 border-b bg-background/70 px-3 py-2.5 shrink-0">
        <div>
          <h2 className="m-0 text-sm font-semibold flex items-center gap-1.5 text-foreground">
            <Download className="h-4 w-4 text-primary" />
            Exportar geometrias da tela
          </h2>
          <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
            Baixe em GeoJSON ou DXF as geometrias das camadas ativas visíveis no mapa.
          </p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={onClose}
            aria-label="Fechar exportação"
          >
            <UrbisIcon name="close" className="text-base" aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* Panel Body (Scrollable if needed, but compact enough to fit without scrolling) */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 space-y-2.5">
        {/* Context Info Box */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-2.5 py-1.5 text-xs text-blue-950 dark:text-blue-200">
          <div className="flex gap-2 items-center">
            <Info className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
            <p className="text-[11px] leading-snug text-muted-foreground">
              Limite de até <strong className="font-medium text-foreground">1.000 feições</strong> por camada no enquadramento atual.
            </p>
          </div>
        </div>

        {/* Layers Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Camadas no enquadramento
            </h4>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {exportableLayers.length}{" "}
              {exportableLayers.length === 1 ? "pronta" : "prontas"}
            </span>
          </div>

          {activeLayers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 p-3 text-center text-xs text-muted-foreground space-y-1">
              <Layers className="h-4 w-4 mx-auto opacity-40 text-muted-foreground" />
              <p className="font-medium text-foreground text-xs">
                Nenhuma camada ativa
              </p>
              <p className="text-[10.5px] text-muted-foreground">
                Ative camadas na aba &ldquo;Camadas&rdquo; para incluí-las na exportação.
              </p>
            </div>
          ) : (
            <div className="max-h-[105px] overflow-y-auto rounded-lg border bg-muted/20 px-2.5 py-1 space-y-0.5 divide-y divide-border/20">
              {activeLayers.map((layer) => {
                const isReady =
                  !(layer.minZoom && currentZoom < layer.minZoom);
                const layerName =
                  layer.name ||
                  layer.properties?.name ||
                  getLayerNameFromConfig(layer) ||
                  layer.id;

                return (
                  <div
                    key={layer.id}
                    className="flex items-center justify-between gap-2 pt-1 first:pt-0 pb-1 last:pb-0 text-xs"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          isReady
                            ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                            : "bg-amber-500",
                        )}
                        title={
                          isReady
                            ? "Pronta para exportação"
                            : "Requer maior aproximação"
                        }
                      />
                      <span
                        className="truncate font-medium text-foreground text-xs"
                        title={layerName}
                      >
                        {layerName}
                      </span>
                    </div>
                    {!isReady && (
                      <span
                        className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
                        title={`Esta camada requer zoom mínimo de ${layer.minZoom} (zoom atual: ${currentZoom.toFixed(1)})`}
                      >
                        Zoom ≥ {layer.minZoom}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {hasActiveLayersRequiringZoom && exportableLayers.length === 0 && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-2 py-1.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <p className="text-[10.5px] leading-snug">
                Aproxime o mapa (zoom in) para desbloquear a exportação das camadas selecionadas.
              </p>
            </div>
          )}
        </div>

        {/* Format Selection (2 columns side by side for compact height) */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-foreground">
            Formato do arquivo
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {/* GeoJSON */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => (selectedFormat.value = "geojson")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  selectedFormat.value = "geojson";
                }
              }}
              className={cn(
                "cursor-pointer rounded-lg border p-2 transition-all text-left flex items-center gap-2 select-none",
                selectedFormat.value === "geojson"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border bg-card/40 hover:bg-muted/30",
              )}
            >
              <FileCode className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">GeoJSON</span>
                  <span className="text-[9px] font-mono text-muted-foreground font-medium">
                    .geojson
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">Web GIS / WGS84</p>
              </div>
            </div>

            {/* DWG / DXF */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => (selectedFormat.value = "dwg")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  selectedFormat.value = "dwg";
                }
              }}
              className={cn(
                "cursor-pointer rounded-lg border p-2 transition-all text-left flex items-center gap-2 select-none",
                selectedFormat.value === "dwg"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border bg-card/40 hover:bg-muted/30",
              )}
            >
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">DXF (CAD)</span>
                  <span className="text-[9px] font-mono text-muted-foreground font-medium">
                    .dxf
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">AutoCAD / UTM 23S</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Feedback */}
        {errorMessage.value && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-2 text-xs text-destructive space-y-0.5">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>Falha na exportação</span>
            </div>
            <p className="text-[10.5px] leading-relaxed opacity-90 pl-5">
              {errorMessage.value}
            </p>
          </div>
        )}

        {/* Success Feedback */}
        {exportResult.value && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-2 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Arquivo gerado com sucesso!</span>
            </div>
            <Button
              asChild
              className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm"
            >
              <a
                href={exportResult.value.url}
                download={exportResult.value.filename}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Baixar {exportResult.value.filename}
              </a>
            </Button>
          </div>
        )}
      </div>

      {/* Primary Action Button Fixed at Bottom (Always Visible) */}
      <div className="border-t bg-background/80 p-3 shrink-0">
        <Button
          className="w-full h-9 font-semibold text-xs shadow-sm"
          disabled={isExporting.value || exportableLayers.length === 0}
          onClick={handleExport}
        >
          {isExporting.value ? (
            <>
              <UrbisIcon
                name="progress_activity"
                className="animate-spin mr-2 text-base"
                aria-hidden="true"
              />
              Exportando geometrias...
            </>
          ) : (
            <>
              <Download className="mr-1.5 h-4 w-4" />
              {exportResult.value
                ? "Gerar nova exportação"
                : `Exportar ${selectedFormat.value === "geojson" ? "GeoJSON" : "DXF (CAD)"}`}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
