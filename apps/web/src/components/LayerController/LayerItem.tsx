import { computed, useSignal } from "@preact/signals";
import { useMapContext } from "../../hooks/useMapContext";
import { IGetConfigLayerSchema } from "../../types/fetch-map-config-type";
import { LayerItemAction } from "./LayerItemAction";
import { LayerMetadataModal } from "./modals/LayerMetadataModal";
import { LayerFilterModal } from "./modals/LayerFilterModal";
import { cn } from "@open-urbis/map-ui";
import { Button } from "@open-urbis/map-ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@open-urbis/map-ui";
import { useMemo } from "react";
import { getLayerNameFromConfig } from "../../utils/layer-utils";

export const LayerItem = ({ 
  item, 
  indent, 
  className,
  onClick
}: { 
  item: IGetConfigLayerSchema; 
  indent?: number; 
  className?: string;
  onClick?: (id: string) => void;
}) => {
  const { zoom } = useMapContext();
  const showMetadata = useSignal(false);
  const showFilter = useSignal(false);

  const canFilter = useMemo(() => {
      const id = item.id.toString();
      const isImported = id.startsWith('wms-') || 
                         id.startsWith('wfs-') || 
                         id.startsWith('file-') ||
                         id.startsWith('upload-');
      
      if (isImported) return false;

      const layerName = getLayerNameFromConfig(item);
      return !!layerName;
  }, [item]);

  const renderColor = () => {
    const { colors } = item;
    const colorArray = colors.filter((color) => color.type === "fill");

    return (
      <div className="w-[10px] h-6 flex flex-col rounded-sm overflow-hidden shrink-0 border border-border/50">
        {colorArray.map((itemColor, index) => (
          <div
            key={index}
            className="w-full h-full"
            style={{ backgroundColor: `rgba(${itemColor.color.join(",")})` }}
          ></div>
        ))}
      </div>
    );
  };

  const renderVisibilityIcon = computed(() => {
    const minZoom = item.minZoom;
    const maxZoom = item?.properties?.maxZoom;

    let isVisibleByZoom = true;
    let tooltipText = "";

    // Check visibility constraints based on zoom
    if (item.isVisible) {
      if (minZoom && zoom.value <= minZoom) {
        isVisibleByZoom = false;
        tooltipText = `Esta camada só é visível a partir do zoom nível ${minZoom}.`;
      } else if (maxZoom && zoom.value >= maxZoom) {
        isVisibleByZoom = false;
        tooltipText = `Esta camada só é visível até o zoom nível ${maxZoom}.`;
      }
    }

    if (!item.isVisible) {
      return (
        <span className="material-symbols-outlined text-base text-muted-foreground">
          visibility_off
        </span>
      );
    }

    if (!isVisibleByZoom) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className="material-symbols-outlined text-base text-muted-foreground opacity-50">
                visibility_off
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <span className="material-symbols-outlined text-base text-muted-foreground">
        visibility
      </span>
    );
  });

  const renderActions = () => {
    const { properties } = item;
    if (!properties?.layerActions || !properties?.layerActions.length)
      return null;

    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          properties.layerActions.map(({ icon, action }: any, i: number) => (
            <LayerItemAction key={`${icon}-${i}`} icon={icon} action={action} />
          ))
        }
      </div>
    );
  };

  return (
    <div
      key={item.id}
      className={cn(
        "flex flex-nowrap items-center justify-between py-2 w-full cursor-pointer transition-colors hover:bg-muted/50 border-b border-border/40 group pr-4",
        className
      )}
      style={{ paddingLeft: indent !== undefined ? `${indent}px` : '16px' }}
      onClick={() => onClick && onClick(item.id)}
    >
      <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
         {renderColor()}
         <span className={cn("text-sm truncate", item.isVisible ? "font-medium text-foreground" : "font-normal text-muted-foreground")}>{item.name}</span>
      </div>
      
      <div className="flex items-center shrink-0 ml-2 gap-2">
        {renderActions()}
        {canFilter && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-6 w-6 rounded-full hover:bg-muted", item.cqlFilter ? "text-primary bg-primary/10" : "")}
                onClick={(e) => {
                  e.stopPropagation();
                  showFilter.value = true;
                }}
              >
                <span className={cn("material-symbols-outlined text-base", item.cqlFilter ? "text-primary" : "text-muted-foreground")}>
                  filter_alt
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Filtrar Camada</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  showMetadata.value = true;
                }}
              >
                <span className="material-symbols-outlined text-base text-muted-foreground">
                  info
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Informações da Camada</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {renderVisibilityIcon.value}
      </div>

      <LayerMetadataModal
        open={showMetadata.value}
        onOpenChange={(v) => (showMetadata.value = v)}
        layer={item}
      />
      <LayerFilterModal
        open={showFilter.value}
        onOpenChange={(v) => (showFilter.value = v)}
        layer={item}
      />
    </div>
  );
};
