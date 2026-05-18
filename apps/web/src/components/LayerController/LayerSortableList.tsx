import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IGetConfigLayerSchema } from "../../types/fetch-map-config-type";
import { useMapContext } from "../../hooks/useMapContext";
import { LayerItem } from "./LayerItem";
import { cn } from "@open-urbis/map-ui";

function SortableItem({ item }: { item: IGetConfigLayerSchema }) {
  const { handleVisibleLayer } = useMapContext();
  const {
    attributes,
    listeners,
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
        isDragging && "opacity-50 z-50 bg-muted"
      )}
    >
      <div {...attributes} {...listeners} className="p-3 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
         <span className="material-symbols-outlined text-xl">drag_indicator</span>
      </div>
      <div className="flex-1 min-w-0">
         <LayerItem 
             item={item} 
             className="border-none py-2 hover:bg-transparent pr-4" 
             indent={0} 
             onClick={handleVisibleLayer}
         />
      </div>
    </div>
  );
}

export const LayerSortableList = () => {
  const { layerSchemas } = useMapContext();
  
  const visibleLayers = layerSchemas.value.filter(l => l.isActive).reverse();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
       const oldIndex = layerSchemas.value.findIndex((item) => item.id === active.id);
       const newIndex = layerSchemas.value.findIndex((item) => item.id === over?.id);
       
       if (oldIndex !== -1 && newIndex !== -1) {
          layerSchemas.value = arrayMove(layerSchemas.value, oldIndex, newIndex);
       }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={visibleLayers.map(l => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="pb-20">
          {visibleLayers.length === 0 && (
            <div className="text-center text-muted-foreground text-sm p-4">
              Nenhuma camada selecionada no momento.
            </div>
          )}
          {visibleLayers.map((item) => (
            <SortableItem key={item.id} item={item} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
