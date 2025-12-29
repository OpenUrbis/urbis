import { computed, signal, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMapContext } from "../../hooks/useMapContext";
import {
  IGetConfigColor,
  IGetConfigLayerSchema,
} from "../../types/fetch-map-config-type";

const isCollapsed = signal<boolean>(false);

export const MapLegend = () => {
  const activedTab = useSignal<string>("");
  const { layerSchemas } = useMapContext();

  const layers = computed(() =>
    layerSchemas.value.filter(
      (schema: IGetConfigLayerSchema) =>
        schema.isVisible &&
        schema.colors.filter((cl) => cl.type === "fill").length > 1
    )
  );

  const activedLayer = computed(() => {
    const currentLayer = layers.value.find((layer) => layer.id === activedTab.value);
    // Return current or first if none selected
    return currentLayer || (layers.value.length > 0 ? layers.value[0] : undefined);
  });

  useEffect(() => {
      if (!activedTab.value && layers.value.length > 0) {
          activedTab.value = layers.value[0].id;
      }
  }, [layers.value]);

  const renderColorClass = (item: IGetConfigColor) => {
    let result = "w-5 h-5";

    if (item?.pattern) result += ` pattern ${item.pattern}`;

    return result;
  };

  const renderLegend = (item?: IGetConfigLayerSchema) => {
    if (!item || item.colors.length === 0) return null;

    return item.colors.map((itemColor) => (
      <section key={itemColor.id} className="flex items-center gap-2 py-1">
        <div
          style={{ backgroundColor: `rgba(${itemColor.color.join(",")})` }}
          className={renderColorClass(itemColor)}
        ></div>
        <span className="text-sm text-foreground">{itemColor.label}</span>
      </section>
    ));
  };

  if (!layers.value.length) return null;

  return (
    <>
      {!isCollapsed.value ? (
        <Button
          onClick={() => (isCollapsed.value = true)}
          className="absolute left-2 bottom-9 z-[8] shadow-md"
        >
          <span className="material-symbols-outlined mr-2 text-base">closed_caption</span>
          Legendas
        </Button>
      ) : null}

      {isCollapsed.value ? (
        <div className="absolute left-2 bottom-9 z-[1000] w-[324px] max-w-[calc(100%-12px)] max-h-[66vh] bg-background rounded-lg shadow-lg overflow-auto border">
          <div className="flex items-center justify-between p-2 pl-4 border-b bg-background sticky top-0">
            <h5 className="text-base font-semibold m-0">Legendas:</h5>
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

          <div className="p-3 grid gap-1">
            <Select
              value={activedTab.value || (layers.value[0]?.id || "")}
              onValueChange={(value) => (activedTab.value = value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma camada" />
              </SelectTrigger>
              <SelectContent>
                {layers.value.map((value) => (
                   <SelectItem key={value.id} value={value.id}>
                     {value.name}
                   </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="mt-2">
              {renderLegend(activedLayer.value)}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
