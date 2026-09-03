import {
  Button,
  cn,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  UrbisIcon,
} from "@open-urbis/map-ui";
import { Info, Layers, ListTree } from "lucide-react";
import type { DragEvent, MouseEvent } from "react";
import { useMemo, useState } from "react";
import { useMapContext } from "../../hooks/useMapContext";
import { IGetConfigLayerSchema } from "../../types/fetch-map-config-type";
import { LayerItem } from "./LayerItem";

type LayerId = string;

function moveItem<T>(items: T[], oldIndex: number, newIndex: number) {
  const nextItems = [...items];
  const [removedItem] = nextItems.splice(oldIndex, 1);

  if (!removedItem) return items;

  nextItems.splice(newIndex, 0, removedItem);
  return nextItems;
}

function SortableItem({
  item,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onCustomize,
  onShowMetadata,
  onRemove,
  highlightCustomize = false,
  highlightFilter = false,
}: {
  item: IGetConfigLayerSchema;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (event: DragEvent<HTMLButtonElement>, id: LayerId) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>, id: LayerId) => void;
  onDrop: (event: DragEvent<HTMLDivElement>, id: LayerId) => void;
  onDragEnd: () => void;
  onCustomize?: (id: string) => void;
  onShowMetadata?: (id: string) => void;
  onRemove?: (id: string) => void;
  highlightCustomize?: boolean;
  highlightFilter?: boolean;
}) {
  const { handleVisibleLayer } = useMapContext();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      onDragOver={(event) => onDragOver(event, String(item.id))}
      onDrop={(event) => onDrop(event, String(item.id))}
      className={cn(
        "relative flex items-center w-full border-b border-border/40 bg-background hover:bg-muted/50 transition-colors",
        isDragging && "opacity-50 z-50 bg-muted",
        isDragOver &&
          "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-primary",
      )}
    >
      <button
        type="button"
        draggable
        aria-label={`Reordenar camada ${item.name}`}
        className={cn(
          "flex self-stretch items-center justify-center touch-none select-none px-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
        onDragStart={(event) => onDragStart(event, String(item.id))}
        onDragEnd={onDragEnd}
        onClick={handleClick}
      >
        <UrbisIcon
          name="drag_indicator"
          className="text-lg"
          aria-hidden="true"
        />
      </button>
      <div className="flex-1 min-w-0">
        <LayerItem
          item={item}
          className="border-none py-1.5 hover:bg-transparent pr-3"
          indent={0}
          onClick={handleVisibleLayer}
          onCustomize={onCustomize}
          onShowMetadata={onShowMetadata}
          onRemove={onRemove}
          highlightCustomize={highlightCustomize}
          highlightFilter={highlightFilter}
        />
      </div>
    </div>
  );
}

export const LayerSortableList = ({
  onCustomize,
  onShowMetadata,
  onRemove,
  onOpenLegend,
  highlightCustomize = false,
  highlightFilter = false,
}: {
  onCustomize?: (id: string) => void;
  onShowMetadata?: (id: string) => void;
  onRemove?: (id: string) => void;
  onOpenLegend?: () => void;
  highlightCustomize?: boolean;
  highlightFilter?: boolean;
}) => {
  const { layerSchemas, zoom } = useMapContext();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isDragOverEnd, setIsDragOverEnd] = useState(false);

  const hasLayersRequiringZoom = useMemo(() => {
    const currentZoom = zoom?.value ?? 0;
    return (layerSchemas?.value || []).some((s) => {
      if (!s.isVisible && !s.isSelected) return false;
      const minZ = s.minZoom;
      return typeof minZ === "number" && minZ > 0 && currentZoom < minZ;
    });
  }, [layerSchemas?.value, zoom?.value]);

  // GIS standard: top layers in the list are rendered on top of the map.
  // The rendering stack follows the array order, so the last layer appears on top.
  // The UI therefore shows the selected layers in reverse order.
  const visibleLayers = useMemo(
    () =>
      [
        ...layerSchemas.value.filter((l) => l.isSelected || l.isVisible),
      ].reverse(),
    [layerSchemas.value],
  );

  const reorderLayersToIndex = (sourceId: LayerId, newVisualIndex: number) => {
    const currentVisibleLayers = layerSchemas.value
      .filter((layer) => layer.isSelected || layer.isVisible)
      .reverse();
    const oldVisualIndex = currentVisibleLayers.findIndex(
      (item) => String(item.id) === sourceId,
    );

    if (oldVisualIndex === -1 || newVisualIndex === -1) return;

    const reorderedVisibleLayers = moveItem(
      currentVisibleLayers,
      oldVisualIndex,
      newVisualIndex,
    );
    const reorderedSelectedLayers = [...reorderedVisibleLayers].reverse();
    let selectedLayerIndex = 0;

    layerSchemas.value = layerSchemas.value.map((layer) => {
      if (!layer.isSelected && !layer.isVisible) return layer;

      return reorderedSelectedLayers[selectedLayerIndex++] ?? layer;
    });
  };

  const reorderLayers = (sourceId: LayerId, targetId: LayerId) => {
    if (sourceId === targetId) return;

    const currentVisibleLayers = layerSchemas.value
      .filter((layer) => layer.isSelected || layer.isVisible)
      .reverse();
    const newVisualIndex = currentVisibleLayers.findIndex(
      (item) => String(item.id) === targetId,
    );

    reorderLayersToIndex(sourceId, newVisualIndex);
  };

  const handleDragStart = (
    event: DragEvent<HTMLButtonElement>,
    id: LayerId,
  ) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    setActiveId(id);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>, id: LayerId) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverId(id);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, targetId: LayerId) => {
    event.preventDefault();
    event.stopPropagation();

    const sourceId = activeId ?? event.dataTransfer.getData("text/plain");
    if (sourceId) reorderLayers(sourceId, targetId);

    setActiveId(null);
    setDragOverId(null);
    setIsDragOverEnd(false);
  };

  const handleEndDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverId(null);
    setIsDragOverEnd(true);
  };

  const handleEndDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const sourceId = activeId ?? event.dataTransfer.getData("text/plain");
    if (sourceId) reorderLayersToIndex(sourceId, visibleLayers.length - 1);

    setActiveId(null);
    setDragOverId(null);
    setIsDragOverEnd(false);
  };

  const handleDragEnd = () => {
    setActiveId(null);
    setDragOverId(null);
    setIsDragOverEnd(false);
  };

  return (
    <div className="flex flex-col h-full">
      {visibleLayers.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <Layers className="h-3 w-3" />
            <span>Ordem no mapa</span>
          </div>
          <div className="flex items-center gap-1">
            {onOpenLegend && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground relative transition-colors",
                  hasLayersRequiringZoom && "text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 hover:bg-amber-500/20",
                )}
                onClick={onOpenLegend}
                title={
                  hasLayersRequiringZoom
                    ? "Abrir legenda (há camadas aguardando aproximação do zoom)"
                    : "Abrir legenda"
                }
              >
                <ListTree className="h-3.5 w-3.5" />
                <span>Legenda</span>
                {hasLayersRequiringZoom && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                )}
              </Button>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help text-muted-foreground hover:text-primary transition-colors">
                    <Info className="h-3.5 w-3.5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px]">
                  <p className="text-xs">
                    Camadas no topo da lista aparecem acima das demais no mapa.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      <div className="pb-0">
        {visibleLayers.length === 0 && (
          <div className="text-center text-muted-foreground text-sm p-8 flex flex-col items-center gap-2">
            <Layers className="h-8 w-8 opacity-20" />
            <p>Nenhuma camada ativa no mapa.</p>
          </div>
        )}
        {visibleLayers.map((item) => {
          const itemId = String(item.id);

          return (
            <SortableItem
              key={item.id}
              item={item}
              isDragging={activeId === itemId}
              isDragOver={dragOverId === itemId && activeId !== itemId}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onCustomize={onCustomize}
              onShowMetadata={onShowMetadata}
              onRemove={onRemove}
              highlightCustomize={highlightCustomize}
            />
          );
        })}
        {visibleLayers.length > 1 && (
          <div
            className={cn(
              "relative h-5 border-b border-border/20 transition-colors",
              activeId && "bg-muted/30",
              isDragOverEnd &&
                "bg-primary/5 before:absolute before:inset-x-0 before:bottom-0 before:h-0.5 before:bg-primary",
            )}
            onDragOver={handleEndDragOver}
            onDragLeave={() => setIsDragOverEnd(false)}
            onDrop={handleEndDrop}
            aria-label="Soltar no fim da lista"
          />
        )}
      </div>
    </div>
  );
};
