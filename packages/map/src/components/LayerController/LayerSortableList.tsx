import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  cn,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  UrbisIcon,
} from "@open-urbis/map-ui";
import { Info, Layers } from "lucide-react";
import { useMapContext } from "../../hooks/useMapContext";
import { IGetConfigLayerSchema } from "../../types/fetch-map-config-type";
import { LayerItem } from "./LayerItem";

function SortableItem({
  item,
  highlightFilter = false,
}: {
  item: IGetConfigLayerSchema;
  highlightFilter?: boolean;
}) {
  const { handleVisibleLayer } = useMapContext();
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : "auto",
    position: "relative" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center w-full border-b border-border/40 bg-background hover:bg-muted/50 transition-colors",
        isDragging && "opacity-50 z-50 bg-muted",
      )}
    >
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="touch-none select-none p-3 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        onClick={(event) => event.stopPropagation()}
      >
        <UrbisIcon
          name="drag_indicator"
          className="text-xl"
          aria-hidden="true"
        />
      </div>
      <div className="flex-1 min-w-0">
        <LayerItem
          item={item}
          className="border-none py-2 hover:bg-transparent pr-4"
          indent={0}
          onClick={handleVisibleLayer}
          highlightFilter={highlightFilter}
        />
      </div>
    </div>
  );
}

export const LayerSortableList = ({
  highlightFilter = false,
}: {
  highlightFilter?: boolean;
}) => {
  const { layerSchemas } = useMapContext();

  // GIS standard: top layers in the list are rendered on top of the map.
  // The rendering stack follows the array order, so the last layer appears on top.
  // The UI therefore shows the selected layers in reverse order.
  const visibleLayers = layerSchemas.value
    .filter((l) => l.isSelected)
    .reverse();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      const oldVisualIndex = visibleLayers.findIndex(
        (item) => item.id === active.id,
      );
      const newVisualIndex = visibleLayers.findIndex(
        (item) => item.id === over.id,
      );

      if (oldVisualIndex !== -1 && newVisualIndex !== -1) {
        const reorderedVisibleLayers = arrayMove(
          visibleLayers,
          oldVisualIndex,
          newVisualIndex,
        );
        const reorderedSelectedLayers = [...reorderedVisibleLayers].reverse();
        let selectedLayerIndex = 0;

        layerSchemas.value = layerSchemas.value.map((layer) => {
          if (!layer.isSelected) return layer;

          return reorderedSelectedLayers[selectedLayerIndex++] ?? layer;
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {visibleLayers.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <Layers className="h-3 w-3" />
            <span>Ordem de Sobreposição</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help text-muted-foreground hover:text-primary transition-colors">
                  <Info className="h-3.5 w-3.5" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[200px]">
                <p className="text-xs">
                  Camadas no topo da lista são desenhadas sobre as camadas
                  abaixo no mapa.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleLayers.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="pb-0">
            {visibleLayers.length === 0 && (
              <div className="text-center text-muted-foreground text-sm p-8 flex flex-col items-center gap-2">
                <Layers className="h-8 w-8 opacity-20" />
                <p>Nenhuma camada selecionada.</p>
              </div>
            )}
            {visibleLayers.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                highlightFilter={highlightFilter}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
