import { signal, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import "preact/compat";
import { Button, UrbisIcon } from "@open-urbis/map-ui";
import { Input } from "@open-urbis/map-ui";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@open-urbis/map-ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@open-urbis/map-ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@open-urbis/map-ui";
import { Switch } from "@open-urbis/map-ui";
import { cn } from "@open-urbis/map-ui";
import { useMapContext } from "../../hooks/useMapContext";
import { exportGeoJson } from "../../integrations/map-integration";
import { getLayerNameFromConfig } from "../../utils/layer-utils";
import { LayerGroup } from "./LayerGroup";
import { LayerSortableList } from "./LayerSortableList";
import { AddLayerModal } from "./modals/AddLayerModal";
import { ShareModal } from "./modals/ShareModal";
import { ShareHistoryModal } from "./modals/ShareHistoryModal";
import { ExportOptionsModal } from "./modals/ExportOptionsModal";
import { AuthRequiredModal } from "../AuthRequiredModal";
import { useAuth } from "@open-urbis/map-auth";
import { enabledFeatureFlags } from "../../features/feature-flags";

const isCollapsed = signal<boolean>(false);

const environment = (import.meta.env.VITE_API_URL || "/api") + "/maps";

const MAP_STYLES = [
  { id: "openfreemap-liberty", label: "Mapa Urbano Vetorial", icon: "map" },
  { id: "openfreemap-positron", label: "Claro Minimalista", icon: "light_mode" },
  { id: "openfreemap-bright", label: "Colorido Urbano", icon: "palette" },
  { id: "standard", label: "OpenStreetMap", icon: "public" },
  { id: "outdoors", label: "Topográfico", icon: "forest" },
  { id: "satellite", label: "Satélite", icon: "satellite" },
  { id: "satellite-streets", label: "Satélite com Ruas", icon: "layers" },
] as const;

export const LayerController = ({
  hideManager = false,
  hideBaseMapSelector = false,
}: {
  hideManager?: boolean;
  hideBaseMapSelector?: boolean;
}) => {
  const {
    layerGroups,
    layerSchemas,
    boundingBox,
    zoom,
    selectedBaseMap,
    selectedBaseMaps,
    is3DActive,
  } = useMapContext();
  const auth = useAuth();
  const features = enabledFeatureFlags.value;
  const canManageLayers = features.manageLayers && !hideManager;
  const canUseBaseMaps = features.baseMaps && !hideBaseMapSelector;

  const activeTab = useSignal<"sources" | "visible">("sources");

  useEffect(() => {
    isCollapsed.value = true;
    const timeout = setTimeout(() => {
      isCollapsed.value = false;
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  const selectedStyle =
    MAP_STYLES.find((s) => s.id === selectedBaseMap.value) || MAP_STYLES[0];
  const searchValue = useSignal("");
  const isAddLayerOpen = useSignal(false);
  const isShareOpen = useSignal(false);
  const isShareHistoryOpen = useSignal(false);
  const isAuthModalOpen = useSignal(false);

  // Export states
  const isExporting = useSignal(false);
  const showExportResult = useSignal(false);
  const showErrorDialog = useSignal(false);
  const errorMessage = useSignal("");
  const exportUrl = useSignal<string | null>(null);
  const exportFilename = useSignal("exportacao.geojson");

  const isExportOptionsOpen = useSignal(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layersForExport = useSignal<any[]>([]);

  const handleExportGeoJSON = () => {
    const currentZoom = zoom.value;
    // Identify visible layers
    const layers = layerSchemas.value
      .filter((s) => s.isVisible)
      // Check zoom level (if minZoom is set, currentZoom must be >= minZoom)
      .filter((s) => !(s.minZoom && currentZoom < s.minZoom));

    if (layers.length === 0) {
      errorMessage.value =
        "Nenhuma camada visível ou disponível para o nível de zoom atual.";
      showErrorDialog.value = true;
      return;
    }

    layersForExport.value = layers;
    isExportOptionsOpen.value = true;
  };

  const handleActionWithAuth = (action: () => void) => {
    if (!auth.isAuthenticated) {
      isAuthModalOpen.value = true;
      return;
    }
    action();
  };

  const handleConfirmExport = async (format: "geojson" | "dwg") => {
    isExporting.value = true;
    exportUrl.value = null;
    showExportResult.value = false;
    showErrorDialog.value = false;

    try {
      const bounds = boundingBox.value;
      const currentZoom = zoom.value;

      const layerIds: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const externalLayers: any[] = [];

      layersForExport.value.forEach((layer: Record<string, any>) => {
        const layerProps = (layer.properties || {}) as Record<string, any>;
        // Check for WMS structure from WebLayer
        const wmsProps = (layerProps.wms || {}) as Record<string, any>;

        const wfsUrl = wmsProps.url || layer.origin;
        const typeName =
          wmsProps.layers ||
          layerProps.layers ||
          layerProps.typeName ||
          layerProps.type_name ||
          getLayerNameFromConfig(layer);

        if (wfsUrl && typeName) {
          const filter = layer.cqlFilter || layerProps.cql_filter || layerProps.cqlFilter;

          let finalWfsUrl = wfsUrl;
          // Ensure URL is absolute for backend reachability
          if (finalWfsUrl.startsWith("/")) {
            finalWfsUrl = `${environment.replace("/maps", "")}${finalWfsUrl}`;
          } else if (!finalWfsUrl.startsWith("http")) {
            // Handle cases like 'maps/...' without leading slash if any
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

          // Do not push to layerIds to avoid duplication (processing as both DB and External)
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
      const url = URL.createObjectURL(blob);
      exportUrl.value = url;

      // Determine filename extension
      const ext = format === "dwg" ? "dxf" : "geojson";
      exportFilename.value = `exportacao-${Date.now()}.${ext}`;

      showExportResult.value = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error("Export failed", e);
      let message = "Ocorreu um erro ao exportar os dados.";

      if (e.response && e.response.data instanceof Blob) {
        try {
          const text = await e.response.data.text();
          const json = JSON.parse(text);
          if (json.message) message = json.message;
        } catch {
          // ignore
        }
      }
      errorMessage.value = message;
      showErrorDialog.value = true;
    } finally {
      isExporting.value = false;
    }
  };

  return (
    <>
      {(canManageLayers || canUseBaseMaps) && (
        <div className="absolute top-4 right-4 z-[var(--urbis-z-app-menu,10090)] flex gap-2 items-center">
          {!isCollapsed.value && (
            <>
              {canUseBaseMaps && (
                <DropdownMenu>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            className="shadow-md rounded-full h-12 w-12 p-0"
                          >
                            <UrbisIcon
                              name={selectedStyle.icon}
                              className="text-xl"
                              aria-hidden="true"
                            />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{selectedStyle.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Mapa Base</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {MAP_STYLES.map((style) => {
                      const activeList = selectedBaseMaps?.value ?? [selectedBaseMap.value];
                      const isSelected = activeList.includes(style.id as any);
                      return (
                        <DropdownMenuItem
                          key={style.id}
                          onClick={() => {
                            if (selectedBaseMaps) {
                              const current = [...selectedBaseMaps.value];
                              const idx = current.indexOf(style.id as any);
                              if (idx >= 0 && current.length > 1) {
                                current.splice(idx, 1);
                              } else if (idx < 0) {
                                current.push(style.id as any);
                              }
                              selectedBaseMaps.value = current;
                              selectedBaseMap.value = current[0];
                            } else {
                              selectedBaseMap.value = style.id as any;
                            }
                          }}
                          className={cn(
                            "flex items-center justify-between cursor-pointer",
                            isSelected && "bg-accent font-semibold",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <UrbisIcon
                              name={style.icon}
                              className="text-lg"
                              aria-hidden="true"
                            />
                            {style.label}
                          </div>
                          {isSelected && (
                            <UrbisIcon
                              name="check"
                              className="text-sm text-primary"
                              aria-hidden="true"
                            />
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <div className="flex items-center justify-between px-2 py-1.5 text-sm select-none">
                      <span className="font-medium">Visualização 3D</span>
                      <Switch
                        checked={is3DActive.value}
                        disabled={!features.threeD}
                        onCheckedChange={(checked) => {
                          if (!features.threeD) return;
                          is3DActive.value = checked;
                        }}
                      />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {canManageLayers && (
                <Button
                  onClick={() => (isCollapsed.value = true)}
                  variant="outline"
                  className="shadow-md rounded-full h-12 px-5 text-base bg-background/80 backdrop-blur-md hover:bg-accent hover:text-accent-foreground"
                >
                  <UrbisIcon
                    name="layers"
                    className="mr-1 text-xl"
                    aria-hidden="true"
                  />
                  Gerenciar
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {canManageLayers && (
        <div
          className={cn(
            "fixed top-[82px] right-[46px] z-[var(--urbis-z-app-panel,10080)] w-[340px] max-w-[70vw] bg-background/80 backdrop-blur-md rounded-xl shadow-lg overflow-hidden max-h-[calc(100vh-100px)] border flex flex-col transition-all duration-300 ease-in-out",
            isCollapsed.value
              ? "translate-x-0 opacity-100 visible"
              : "translate-x-[120%] opacity-0 invisible",
          )}
        >
          <div className="flex items-center justify-between p-3 border-b bg-background/50">
            <h5 className="text-sm font-semibold m-0">Gerenciar Camadas</h5>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => (isCollapsed.value = false)}
              aria-label="Fechar"
            >
              <UrbisIcon
                name="close"
                className="text-base"
                aria-hidden="true"
              />
            </Button>
          </div>

          <div className="flex items-center border-b bg-background/30 px-2 pt-1">
            <button
              className={cn(
                "flex-1 pb-2 pt-2 text-xs font-medium transition-all border-b-2 focus-visible:outline-none",
                activeTab.value === "sources"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30",
              )}
              onClick={() => (activeTab.value = "sources")}
            >
              Fontes de Dados
            </button>
            <button
              className={cn(
                "flex-1 pb-2 pt-2 text-xs font-medium transition-all border-b-2 focus-visible:outline-none",
                activeTab.value === "visible"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30",
              )}
              onClick={() => (activeTab.value = "visible")}
            >
              Camadas Selecionadas
            </button>
          </div>

          {activeTab.value === "sources" && (
            <div className="p-2 border-b bg-background/30">
              <div className="relative">
                <UrbisIcon
                  name="search"
                  className="absolute left-2 top-1.5 text-base text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Buscar camadas..."
                  className="h-8 pl-8 text-sm bg-background/50"
                  value={searchValue.value}
                  onInput={(e) =>
                    (searchValue.value = (e.target as HTMLInputElement).value)
                  }
                />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {activeTab.value === "sources" ? (
              <div className="flex flex-col">
                {layerGroups.value.map((group, i) => (
                  <LayerGroup
                    key={`group-main-${i}`}
                    group={group}
                    searchValue={searchValue.value}
                  />
                ))}
              </div>
            ) : (
              <LayerSortableList />
            )}
          </div>

          <div className="p-3 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between gap-2 shrink-0">
            <Button
              variant="outline"
              className="flex-1 justify-start text-xs h-9 px-3"
              onClick={() =>
                handleActionWithAuth(() => (isShareOpen.value = true))
              }
            >
              <UrbisIcon
                name="save"
                className="text-base mr-2"
                aria-hidden="true"
              />
              Salvar Visualização
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                >
                  <UrbisIcon
                    name="more_horiz"
                    className=""
                    aria-hidden="true"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => (isAddLayerOpen.value = true)}>
                  <UrbisIcon
                    name="library_add"
                    className="mr-2 text-base"
                    aria-hidden="true"
                  />
                  Adicionar Camada
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleActionWithAuth(
                      () => (isShareHistoryOpen.value = true),
                    )
                  }
                >
                  <UrbisIcon
                    name="library"
                    className="mr-2 text-base"
                    aria-hidden="true"
                  />
                  Histórico de visualizações salvas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportGeoJSON}>
                  <span
                    className="mr-2 h-4 w-4 shrink-0"
                    style={{
                      backgroundColor: "currentColor",
                      mask: "url(/exportar_geometrias_tela.svg) no-repeat center / contain",
                      WebkitMask: "url(/exportar_geometrias_tela.svg) no-repeat center / contain",
                    }}
                  />
                  Exportar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      <AddLayerModal
        isOpen={isAddLayerOpen.value}
        onOpenChange={(v) => (isAddLayerOpen.value = v)}
      />
      <ShareModal
        isOpen={isShareOpen.value}
        onOpenChange={(v) => (isShareOpen.value = v)}
      />
      <ShareHistoryModal
        isOpen={isShareHistoryOpen.value}
        onOpenChange={(v) => (isShareHistoryOpen.value = v)}
      />
      <AuthRequiredModal
        isOpen={isAuthModalOpen.value}
        onOpenChange={(v) => (isAuthModalOpen.value = v)}
      />
      <ExportOptionsModal
        isOpen={isExportOptionsOpen.value}
        onOpenChange={(v) => (isExportOptionsOpen.value = v)}
        layers={layersForExport.value}
        bounds={boundingBox.value}
        onConfirm={handleConfirmExport}
      />

      {isExporting.value && (
        <div className="fixed bottom-4 left-1/2 z-[var(--urbis-z-app-toast,10100)] -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-md shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <UrbisIcon
            name="progress_activity"
            className="animate-spin text-sm"
            aria-hidden="true"
          />
          <span className="text-sm font-medium">Exportando...</span>
        </div>
      )}

      <Dialog
        open={showExportResult.value}
        onOpenChange={(v) => (showExportResult.value = v)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportação Concluída</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-3 text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-900">
              <UrbisIcon
                name="check_circle"
                className="text-2xl"
                aria-hidden="true"
              />
              <p className="text-sm font-medium">
                O arquivo foi gerado com sucesso.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <p className="text-xs text-yellow-800 dark:text-yellow-200 flex gap-2">
                <UrbisIcon
                  name="warning"
                  className="text-sm shrink-0"
                  aria-hidden="true"
                />
                Atenção: Apenas as camadas visíveis e dentro da área selecionada
                do mapa (bounds) estão inclusas neste arquivo.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => (showExportResult.value = false)}
            >
              Fechar
            </Button>
            {exportUrl.value && (
              <Button asChild>
                <a href={exportUrl.value} download={exportFilename.value}>
                  <UrbisIcon
                    name="download"
                    className="mr-2"
                    aria-hidden="true"
                  />
                  Baixar Arquivo
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showErrorDialog.value}
        onOpenChange={(v) => (showErrorDialog.value = v)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erro na Exportação</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200">
              <p className="text-sm font-medium flex gap-2 items-center">
                <UrbisIcon name="error" className="" aria-hidden="true" />
                {errorMessage.value}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => (showErrorDialog.value = false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
