import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button, cn } from "@open-urbis/map-ui";
import axios from "axios";
import { useAuth } from "@open-urbis/map-auth";
import {
  Group,
  Panel,
  Separator,
  type PanelImperativeHandle,
} from "react-resizable-panels";
import { MapDataStructuredView } from "./components/MapDataStructuredView";
import { MapPreview } from "./components/MapPreview";
import { parseDataToFeatureCollection } from "./utils/parseDataToFeatureCollection";

export interface MapDataIntegrationFieldProps {
  mode: "view" | "edit";
  initialData?: any;
  onChange?: (data: any) => void;
}

/**
 * MapDataIntegrationField - VERSÃO FINAL ESTÁVEL.
 * Ajustada para Dark Mode e Layout Industrial.
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@open-urbis/map-ui";
import { FeatureModalView } from "./components/MapDataStructuredView";

export function MapDataIntegrationField({
  mode,
  initialData,
  onChange,
}: MapDataIntegrationFieldProps) {
  const MIN_PANEL_SIZE = 32;
  const MAX_PANEL_SIZE = 68;
  const auth = useAuth();
  const [data, setData] = useState<any>(initialData || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [collapsedPanel, setCollapsedPanel] = useState<
    "map" | "details" | null
  >(null);
  const mapPanelRef = React.useRef<PanelImperativeHandle | null>(null);
  const detailsPanelRef = React.useRef<PanelImperativeHandle | null>(null);

  // State for feature properties modal
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);

  useEffect(() => {
    if (initialData) setData(initialData);
  }, [initialData]);

  useEffect(() => {
    const handleOpenFeatureModal = (event: any) => {
      if (event.detail) {
        setSelectedFeature(event.detail);
      }
    };

    window.addEventListener("openFeatureModal", handleOpenFeatureModal);
    return () =>
      window.removeEventListener("openFeatureModal", handleOpenFeatureModal);
  }, []);

  useEffect(() => {
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    const handlePointerRelease = () => setIsResizing(false);

    if (isResizing) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointerup", handlePointerRelease);
      window.addEventListener("pointercancel", handlePointerRelease);
    }

    return () => {
      window.removeEventListener("pointerup", handlePointerRelease);
      window.removeEventListener("pointercancel", handlePointerRelease);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [isResizing]);

  const handlePanelLayout = (layout: Record<string, number>) => {
    const mapSize = layout.map;
    const detailsSize = layout.details;

    if ((mapSize ?? 0) <= 0) {
      setCollapsedPanel("map");
      return;
    }

    if ((detailsSize ?? 0) <= 0) {
      setCollapsedPanel("details");
      return;
    }

    setCollapsedPanel(null);
  };

  const togglePanelCollapse = (panel: "map" | "details") => {
    const currentPanel =
      panel === "map" ? mapPanelRef.current : detailsPanelRef.current;
    const oppositePanel =
      panel === "map" ? detailsPanelRef.current : mapPanelRef.current;

    if (!currentPanel) {
      return;
    }

    if (currentPanel.isCollapsed()) {
      currentPanel.expand();
      return;
    }

    if (oppositePanel?.isCollapsed()) {
      oppositePanel.expand();
    }

    currentPanel.collapse();
  };

  const handleFileSelection = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith(".dwg")) {
      setError("Por favor, envie apenas arquivos .dwg");
      return;
    }
    setIsProcessing(true);
    setProgressText("Processando arquivo...");

    try {
      const environment =
        import.meta.env.VITE_API_URL ||
        "https://api.mapa.urbis.prefeitura.sp.gov.br";
      const {
        data: { uploadURL, key },
      } = await axios.post(
        `${environment}/files/upload-url`,
        {
          contentType: "image/vnd.dwg",
          folderPath: "",
        },
        {
          headers: {
            Authorization: auth.user?.access_token
              ? `Bearer ${auth.user.access_token}`
              : undefined,
          },
        },
      );

      await fetch(uploadURL, {
        method: "PUT",
        body: selectedFile,
        headers: { "Content-Type": "image/vnd.dwg" },
      });
      await axios.post(
        `${environment}/maps/mapdata/file/${encodeURIComponent(key)}`,
        {},
        {
          headers: {
            Authorization: auth.user?.access_token
              ? `Bearer ${auth.user.access_token}`
              : undefined,
          },
        },
      );

      const poll = setInterval(async () => {
        try {
          const { data: mapData } = await axios.get(
            `${environment}/maps/mapdata/file/${encodeURIComponent(key)}`,
            {
              headers: {
                Authorization: auth.user?.access_token
                  ? `Bearer ${auth.user.access_token}`
                  : undefined,
              },
            },
          );
          if (
            mapData.status === "Concluido" ||
            (mapData.status !== "Erro" && mapData.data)
          ) {
            clearInterval(poll);
            const final = {
              ...(mapData.data || mapData),
              s3_metadata: { key },
            };
            setData(final);
            setIsProcessing(false);
            if (onChange) onChange(final);
          } else if (mapData.status === "Erro") {
            clearInterval(poll);
            setIsProcessing(false);

            const errorList = mapData.description?.erros;
            if (Array.isArray(errorList) && errorList.length > 0) {
              setError(errorList.join("\n"));
            } else {
              setError(
                mapData.description?.mensagem ||
                  "Erro no processamento do arquivo.",
              );
            }
          }
        } catch (e) {
          clearInterval(poll);
          setIsProcessing(false);
          setError("Erro ao verificar o status do processamento.");
        }
      }, 5000);
    } catch (err) {
      setIsProcessing(false);
      setError("Erro no envio.");
    }
  };

  if (isProcessing) {
    return (
      <div className="w-full h-[400px] py-4 border-2 border-dashed border-blue-500/20 dark:border-blue-500/20 rounded-2xl bg-blue-500/5 dark:bg-blue-500/5 flex flex-col items-center justify-center gap-4 transition-colors">
        <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-500 animate-spin" />
        <p className="text-sm font-normal text-blue-600 dark:text-blue-500">
          {progressText}
        </p>
      </div>
    );
  }

  if (data) {
    const featureCollection = parseDataToFeatureCollection(data);
    const mainGeometry = featureCollection?.features?.[0]?.geometry;
    const mapIsCollapsed = collapsedPanel === "map";
    const detailsIsCollapsed = collapsedPanel === "details";

    return (
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-bold text-xs uppercase tracking-tighter transition-colors">
            <CheckCircle2 size={16} /> Leitura inteligente de dados projetuais
          </div>
          {mode === "edit" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs uppercase font-black"
              onClick={() => setData(null)}
            >
              Novo Projeto
            </Button>
          )}
        </div>

        <div className="flex h-[600px] min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-zinc-950/40 md:hidden">
          <div className="relative min-h-[300px] overflow-hidden border-b border-gray-200 bg-gray-50 transition-colors dark:border-zinc-800 dark:bg-zinc-900">
            {featureCollection ? (
              <MapPreview
                featureCollection={featureCollection}
                mainGeometry={mainGeometry}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gray-50 text-xs italic text-gray-400 transition-colors dark:bg-zinc-900 dark:text-zinc-500">
                Sem geometria
              </div>
            )}
          </div>

          <div className="flex min-h-[300px] min-w-0 flex-1 flex-col overflow-hidden bg-white transition-colors dark:bg-zinc-950">
            <MapDataStructuredView data={data} />
          </div>
        </div>

        <Group
          orientation="horizontal"
          onLayoutChange={handlePanelLayout}
          className="hidden h-[600px] min-h-0 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-zinc-950/40 md:flex"
        >
          <Panel
            id="map"
            panelRef={mapPanelRef}
            defaultSize={50}
            minSize={MIN_PANEL_SIZE}
            maxSize={MAX_PANEL_SIZE}
            collapsible
            collapsedSize={0}
            className={cn(
              "relative min-h-0 overflow-hidden border-r border-gray-200 bg-gray-50 transition-all dark:border-zinc-800 dark:bg-zinc-900",
              mapIsCollapsed ? "pointer-events-none opacity-0" : "opacity-100",
            )}
          >
            {featureCollection ? (
              <MapPreview
                featureCollection={featureCollection}
                mainGeometry={mainGeometry}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gray-50 text-xs italic text-gray-400 transition-colors dark:bg-zinc-900 dark:text-zinc-500">
                Sem geometria
              </div>
            )}
          </Panel>

          <Separator
            onPointerDown={() => setIsResizing(true)}
            onPointerUp={() => setIsResizing(false)}
            onPointerCancel={() => setIsResizing(false)}
            className="group relative flex w-10 shrink-0 items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50 transition-colors hover:from-blue-50 hover:to-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:from-zinc-900 dark:to-zinc-950 dark:hover:from-blue-950/40 dark:hover:to-blue-900/30"
          >
            <div className="relative flex h-full w-full items-center justify-center">
              <div
                className={cn(
                  "h-full w-px bg-gray-200 transition-colors dark:bg-zinc-800",
                  isResizing && "bg-blue-500 dark:bg-blue-400",
                )}
              />

              <div
                className={cn(
                  "absolute flex min-h-20 w-7 flex-col items-center justify-center gap-1 rounded-full border border-gray-200 bg-white px-1 py-2 shadow-sm transition-all dark:border-zinc-700 dark:bg-zinc-900",
                  isResizing
                    ? "border-blue-500 bg-blue-50 shadow-blue-500/20 dark:border-blue-400 dark:bg-blue-950/50"
                    : "group-hover:border-blue-300 group-hover:bg-blue-50 dark:group-hover:border-blue-500/50 dark:group-hover:bg-blue-950/40",
                )}
              >
                <button
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    togglePanelCollapse("map");
                  }}
                  className="z-10 inline-flex h-5 w-5 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-zinc-800 dark:hover:text-blue-300"
                  aria-label={
                    mapIsCollapsed ? "Expandir mapa" : "Colapsar mapa"
                  }
                  title={mapIsCollapsed ? "Expandir mapa" : "Colapsar mapa"}
                >
                  {mapIsCollapsed ? (
                    <ChevronRight size={12} />
                  ) : (
                    <ChevronLeft size={12} />
                  )}
                </button>

                <div className="h-6 w-[2px] rounded-full bg-gray-300 dark:bg-zinc-600" />

                <button
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    togglePanelCollapse("details");
                  }}
                  className="z-10 inline-flex h-5 w-5 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-zinc-800 dark:hover:text-blue-300"
                  aria-label={
                    detailsIsCollapsed
                      ? "Expandir ficha de parâmetros"
                      : "Colapsar ficha de parâmetros"
                  }
                  title={
                    detailsIsCollapsed
                      ? "Expandir ficha de parâmetros"
                      : "Colapsar ficha de parâmetros"
                  }
                >
                  {detailsIsCollapsed ? (
                    <ChevronLeft size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                </button>
              </div>
            </div>
          </Separator>

          <Panel
            id="details"
            panelRef={detailsPanelRef}
            defaultSize={50}
            minSize={MIN_PANEL_SIZE}
            maxSize={MAX_PANEL_SIZE}
            collapsible
            collapsedSize={0}
            className={cn(
              "flex min-h-0 min-w-0 flex-col overflow-hidden bg-white transition-all dark:bg-zinc-950",
              detailsIsCollapsed
                ? "pointer-events-none opacity-0"
                : "opacity-100",
            )}
          >
            <MapDataStructuredView data={data} />
          </Panel>
        </Group>

        {/* Modal for feature properties */}
        <Dialog
          open={!!selectedFeature}
          onOpenChange={(open) => !open && setSelectedFeature(null)}
        >
          <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-0 overflow-hidden transition-colors">
            <DialogHeader className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 m-0 transition-colors">
              <DialogTitle className="text-gray-900 dark:text-zinc-100 uppercase tracking-tighter text-sm transition-colors">
                Detalhes:{" "}
                {selectedFeature?.name || selectedFeature?.type || "Elemento"}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto">
              {selectedFeature && (
                <FeatureModalView
                  data={
                    selectedFeature.rawMetadata
                      ? JSON.parse(selectedFeature.rawMetadata)
                      : selectedFeature
                  }
                  title={
                    selectedFeature.type === "bloco"
                      ? "Bloco - visão geral"
                      : selectedFeature.type === "pavimento"
                        ? "Pavimento - visão detalhada"
                        : selectedFeature.type === "area_individual"
                          ? "Área individual ou comum - visão detalhada"
                          : selectedFeature.name ||
                            selectedFeature.type ||
                            "Propriedades"
                  }
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full min-h-[400px] px-4 py-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer",
        isDragging
          ? "border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-500/10"
          : "border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 hover:bg-gray-100 dark:hover:bg-zinc-900",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0])
          handleFileSelection(e.dataTransfer.files[0]);
      }}
      onClick={() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".dwg";
        input.onchange = (e: any) => {
          if (e.target.files?.[0]) handleFileSelection(e.target.files[0]);
        };
        input.click();
      }}
    >
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-full shadow-sm dark:shadow-zinc-950/40 mb-4 border border-gray-200 dark:border-zinc-800 transition-colors">
        <UploadCloud size={40} className="text-blue-600 dark:text-blue-500" />
      </div>
      <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-100 transition-colors">
        Arraste seu projeto .DWG
      </h4>
      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 transition-colors">
        ou clique para selecionar
      </p>
      {error && (
        <div className="mt-4 text-xs text-rose-600 dark:text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-4 py-3 rounded-lg border border-rose-200 dark:border-rose-500/20 transition-colors w-full max-w-[80%] text-left max-h-[200px] overflow-y-auto">
          <p className="font-bold mb-2">
            Foram encontrados erros no seu projeto:
          </p>
          <ul className="list-disc pl-4 space-y-2 font-normal leading-relaxed">
            {error.split("\n").map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
