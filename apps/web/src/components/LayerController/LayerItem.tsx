import { useSignal } from "@preact/signals";
import { useMapContext } from "../../hooks/useMapContext";
import { IGetConfigLayerSchema } from "../../types/fetch-map-config-type";
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
import { useMemo, useState } from "react";
import { getLayerNameFromConfig } from "../../utils/layer-utils";
import { Pencil, MoreVertical, Trash2, Eye, EyeOff, Info, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@open-urbis/map-ui";
import { LayerEditModal } from "@/pages/Admin/pages/LayerManager/pages/LayerHandle/steps/LayerEditModal";
import { buildLayerSchema, LayerSchemaFormValues, parseLayerSchemaToForm } from "@/pages/Admin/pages/LayerManager/pages/LayerHandle/utils";

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
  const { zoom, layerSchemas, handleActiveLayer } = useMapContext();
  const showMetadata = useSignal(false);
  const showFilter = useSignal(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleSaveConfig = (formValues: LayerSchemaFormValues) => {
    const schema = buildLayerSchema(formValues);
    
    // Merge updates into the existing layer
    const updatedLayer = {
      ...item,
      ...schema,
      // Preserve properties that might be lost or handled differently
      properties: {
        ...(item.properties || {}),
        ...(schema.properties || {}),
      },
    };

    layerSchemas.value = layerSchemas.value.map((l) =>
      l.id === item.id ? (updatedLayer as unknown as IGetConfigLayerSchema) : l
    );
  };

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

  const renderVisibilityButton = () => {
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

    const icon = !item.isVisible ? (
      <EyeOff className="h-4 w-4 text-muted-foreground" />
    ) : !isVisibleByZoom ? (
      <EyeOff className="h-4 w-4 text-muted-foreground opacity-50" />
    ) : (
      <Eye className="h-4 w-4 text-muted-foreground" />
    );

    const button = (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full hover:bg-muted"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(item.id);
        }}
      >
        {icon}
      </Button>
    );

    if (item.isVisible && !isVisibleByZoom) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent>
              <p>{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{item.isVisible ? "Ocultar Camada" : "Mostrar Camada"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
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
      
      <div className="flex items-center shrink-0 ml-2 gap-1">
        {renderVisibilityButton()}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {canFilter && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  showFilter.value = true;
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                <span>Filtrar Camada</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setShowEditModal(true);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              <span>Editar Camada</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                showMetadata.value = true;
              }}
            >
              <Info className="mr-2 h-4 w-4" />
              <span>Informações</span>
            </DropdownMenuItem>

            {item.properties?.layerActions?.map(({ icon, action, label }: any, i: number) => (
              <DropdownMenuItem
                key={`${icon}-${i}`}
                onClick={(e) => {
                  e.stopPropagation();
                  const actionFn = (window as any).createFn(action, false);
                  actionFn();
                }}
              >
                <span className="material-symbols-outlined mr-2 text-base">{icon}</span>
                <span>{label || 'Ação'}</span>
              </DropdownMenuItem>
            ))}

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleActiveLayer(item.id);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Remover</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

      {showEditModal && (
        <LayerEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          layer={{
            name: item.name,
            title: item.name,
          }}
          url={item.origin}
          initialConfig={parseLayerSchemaToForm(item as any)}
          onSave={handleSaveConfig}
        />
      )}
    </div>
  );
};
