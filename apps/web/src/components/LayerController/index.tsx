import { signal, useSignal } from "@preact/signals";
import "preact/compat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useMapContext } from "../../hooks/useMapContext";
import { exportGeoJson } from "../../integrations/map-integration";
import { LayerGroup } from "./LayerGroup";
import { LayerSortableList } from "./LayerSortableList";
import { AddLayerModal } from "./modals/AddLayerModal";
import { ShareModal } from "./modals/ShareModal";
import { ShareHistoryModal } from "./modals/ShareHistoryModal";
import { ExportOptionsModal } from "./modals/ExportOptionsModal";

const isCollapsed = signal<boolean>(false);

export const LayerController = () => {
  const { layerGroups, layerSchemas, boundingBox, zoom } = useMapContext();
  
  const activeTab = useSignal<'sources' | 'visible'>('sources');
  const searchValue = useSignal('');
  const isAddLayerOpen = useSignal(false);
  const isShareOpen = useSignal(false);
  const isShareHistoryOpen = useSignal(false);
  
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

  const handleConfirmExport = async (format: "geojson" | "dwg") => {
    isExporting.value = true;
    exportUrl.value = null;
    showExportResult.value = false;
    showErrorDialog.value = false;

    try {
      const bounds = boundingBox.value;
      const currentZoom = zoom.value;
      // Use the IDs from the layers we identified for export
      const layerIds = layersForExport.value.map((l) => l.id);

      // Prepare external layers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const externalLayers = layersForExport.value.map((layer: any) => {
        const props = layer.properties || {};
        // Check for WMS structure from WebLayer
        const wmsProps = props.wms || {};

        const wfsUrl = wmsProps.url || layer.origin;
        const typeName =
          wmsProps.layers || props.layers || props.typeName || props.type_name;

        if (wfsUrl && typeName) {
          return {
            id: layer.id,
            wfsUrl,
            typeName,
            cqlFilter: props.cql_filter || props.cqlFilter,
            minZoom: layer.minZoom,
          };
        }
        return null;
      }).filter((l) => l !== null);

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
      const ext = format === 'dwg' ? 'dxf' : 'geojson';
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
      <div className="fixed bottom-9 right-2 z-[8] flex gap-2 items-center">
        {!isCollapsed.value && (
          <Button
            onClick={() => (isCollapsed.value = true)}
            variant="outline"
            className="shadow-md rounded-full h-12 px-5 text-base bg-background/80 backdrop-blur-md hover:bg-accent hover:text-accent-foreground"
          >
            <span className="material-symbols-outlined mr-1 text-xl">
              layers
            </span>
            Gerenciar
          </Button>
        )}
      </div>

      {isCollapsed.value && (
        <div className="fixed top-[74px] right-[46px] z-[10] w-[340px] max-w-[70vw] bg-background/80 backdrop-blur-md rounded-xl shadow-lg overflow-hidden max-h-[calc(100vh-100px)] border flex flex-col transition-all">
          <div className="flex items-center justify-between p-3 border-b bg-background/50">
            <h5 className="text-sm font-semibold m-0">Gerenciar Camadas</h5>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => (isCollapsed.value = false)}
              aria-label="Fechar"
            >
               <span className="material-symbols-outlined text-base">close</span>
            </Button>
          </div>
          
          <div className="flex items-center border-b bg-background/30 px-2 pt-1">
             <button 
                className={cn(
                  "flex-1 pb-2 pt-2 text-xs font-medium transition-all border-b-2 focus-visible:outline-none",
                  activeTab.value === 'sources' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                )}
                onClick={() => (activeTab.value = 'sources')}
             >
                Fontes de Dados
             </button>
             <button 
                className={cn(
                  "flex-1 pb-2 pt-2 text-xs font-medium transition-all border-b-2 focus-visible:outline-none",
                  activeTab.value === 'visible' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                )}
                onClick={() => (activeTab.value = 'visible')}
             >
                Camadas Selecionadas
             </button>
          </div>
          
          {activeTab.value === 'sources' && (
             <div className="p-2 border-b bg-background/30">
                <div className="relative">
                  <span className="absolute left-2 top-1.5 material-symbols-outlined text-base text-muted-foreground">search</span>
                  <Input 
                    placeholder="Buscar camadas..." 
                    className="h-8 pl-8 text-sm bg-background/50" 
                    value={searchValue.value}
                    onInput={(e) => (searchValue.value = (e.target as HTMLInputElement).value)}
                  />
                </div>
             </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {activeTab.value === 'sources' ? (
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
              onClick={() => (isShareOpen.value = true)}
            >
              <span className="material-symbols-outlined text-base mr-2">
                share
              </span>
              Compartilhar
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                >
                  <span className="material-symbols-outlined">more_horiz</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => (isAddLayerOpen.value = true)}>
                  <span className="material-symbols-outlined mr-2">
                    add_circle
                  </span>
                  Adicionar Nova Camada
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => (isShareHistoryOpen.value = true)}>
                  <span className="material-symbols-outlined mr-2">
                    history
                  </span>
                  Histórico de Compartilhamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportGeoJSON}>
                  <span className="material-symbols-outlined mr-2">
                    download
                  </span>
                  Exportar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      <AddLayerModal isOpen={isAddLayerOpen.value} onOpenChange={(v) => (isAddLayerOpen.value = v)} />
      <ShareModal isOpen={isShareOpen.value} onOpenChange={(v) => (isShareOpen.value = v)} />
      <ShareHistoryModal isOpen={isShareHistoryOpen.value} onOpenChange={(v) => (isShareHistoryOpen.value = v)} />
      <ExportOptionsModal
        isOpen={isExportOptionsOpen.value}
        onOpenChange={(v) => (isExportOptionsOpen.value = v)}
        layers={layersForExport.value}
        bounds={boundingBox.value}
        onConfirm={handleConfirmExport}
      />

      {isExporting.value && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-md shadow-lg z-[50] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined animate-spin text-sm">
            progress_activity
          </span>
          <span className="text-sm font-medium">Exportando...</span>
        </div>
      )}

      <Dialog open={showExportResult.value} onOpenChange={(v) => (showExportResult.value = v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportação Concluída</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-3 text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-900">
              <span className="material-symbols-outlined text-2xl">
                check_circle
              </span>
              <p className="text-sm font-medium">
                O arquivo foi gerado com sucesso.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <p className="text-xs text-yellow-800 dark:text-yellow-200 flex gap-2">
                <span className="material-symbols-outlined text-sm shrink-0">
                  warning
                </span>
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
                <a
                  href={exportUrl.value}
                  download={exportFilename.value}
                >
                  <span className="material-symbols-outlined mr-2">
                    download
                  </span>
                  Baixar Arquivo
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showErrorDialog.value} onOpenChange={(v) => (showErrorDialog.value = v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erro na Exportação</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200">
              <p className="text-sm font-medium flex gap-2 items-center">
                <span className="material-symbols-outlined">error</span>
                {errorMessage.value}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => (showErrorDialog.value = false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
