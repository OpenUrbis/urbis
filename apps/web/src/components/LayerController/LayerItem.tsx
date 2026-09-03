import { useSignal } from "@preact/signals";
import { useMapContext } from "../../hooks/useMapContext";
import {
  IGetConfigColor,
  IGetConfigLayerSchema,
} from "../../types/fetch-map-config-type";
import { LayerFilterModal } from "./modals/LayerFilterModal";
import { cn, UrbisIcon } from "@open-urbis/map-ui";
import { Button } from "@open-urbis/map-ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@open-urbis/map-ui";
import { useMemo } from "react";
import { getLayerNameFromConfig } from "../../utils/layer-utils";
import {
  Palette,
  MoreVertical,
  Trash2,
  Eye,
  EyeOff,
  Ellipsis,
  Filter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@open-urbis/map-ui";

export const LayerItem = ({
  item,
  indent,
  className,
  onClick,
  onCustomize,
  onShowMetadata,
  onRemove,
  highlightCustomize = false,
  highlightFilter = false,
}: {
  item: IGetConfigLayerSchema;
  indent?: number;
  className?: string;
  onClick?: (id: string) => void;
  onCustomize?: (id: string) => void;
  onShowMetadata?: (id: string) => void;
  onRemove?: (id: string) => void;
  highlightCustomize?: boolean;
  highlightFilter?: boolean;
}) => {
  const { zoom, handleActiveLayer } = useMapContext();
  const showFilter = useSignal(false);
  const isUserAddedLayer = useMemo(() => {
    const id = item.id.toString();
    return (
      id.startsWith("wms-") ||
      id.startsWith("wfs-") ||
      id.startsWith("file-") ||
      id.startsWith("upload-")
    );
  }, [item.id]);

  const canFilter = useMemo(() => {
    if (isUserAddedLayer) return false;

    const layerName = getLayerNameFromConfig(item);
    return !!layerName;
  }, [item, isUserAddedLayer]);

  const canCustomizeLayer = useMemo(() => {
    if (!onCustomize) return false;
    if (item.properties?.supportsVisualCustomization === false) return false;
    if (item.properties?.source === "geoserver-catalog") return false;
    return true;
  }, [item.properties, onCustomize]);

  const getColorKey = (color: IGetConfigColor) => color.value ?? color.label;

  const handleRemoveClick = () => {
    if (isUserAddedLayer && onRemove) {
      const confirmed = window.confirm(
        `Excluir a camada "${item.name}"? Esta ação remove a camada do mapa e do catálogo desta sessão.`,
      );
      if (confirmed) onRemove(item.id);
      return;
    }

    handleActiveLayer(item.id);
  };

  const formatRgba = (color: IGetConfigColor["color"]) =>
    `rgba(${color.join(",")})`;

  const renderColor = () => {
    const { colors } = item;
    const fillColors = colors.filter(
      (color) => color.type !== "line" && color.type !== "text",
    );
    const lineColorsByKey = new Map(
      colors
        .filter((color) => color.type === "line")
        .map((color) => [getColorKey(color), color]),
    );

    const colorArray =
      fillColors.length > 0
        ? fillColors
        : colors.filter((color) => color.type === "line");

    return (
      <div className="h-5 w-2 flex shrink-0 flex-col overflow-hidden rounded-sm border border-border/50">
        {colorArray.map((itemColor, index) => (
          <div
            key={index}
            className="w-full h-full border"
            style={{
              backgroundColor:
                itemColor.type === "line"
                  ? "transparent"
                  : formatRgba(itemColor.color),
              borderColor: formatRgba(
                lineColorsByKey.get(getColorKey(itemColor))?.color ??
                  itemColor.color,
              ),
            }}
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
      <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
    ) : !isVisibleByZoom ? (
      <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
    ) : (
      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
    );

    const button = (
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-full hover:bg-muted"
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
        "flex flex-nowrap items-center justify-between py-0.5 w-full cursor-pointer transition-colors hover:bg-muted/50 border-b border-border/30 group pr-2",
        className,
      )}
      style={{
        paddingLeft:
          indent !== undefined ? `${Math.max(indent - 4, 8)}px` : "12px",
      }}
      onClick={() => onClick && onClick(item.id)}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
        {renderColor()}
        <span
          className={cn(
            "truncate text-[11px] leading-5",
            item.isVisible
              ? "font-medium text-foreground"
              : "font-normal text-muted-foreground",
          )}
        >
          {item.name}
        </span>
      </div>

      <div className="ml-1 flex shrink-0 items-center gap-0">
        {renderVisibilityButton()}

        {canFilter && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 rounded-full shrink-0 text-primary hover:bg-primary/10 hover:text-primary",
                    item.cqlFilter &&
                      "text-blue-500 hover:bg-blue-500/10 hover:text-blue-600",
                    highlightFilter &&
                      "animate-pulse bg-blue-500/15 ring-1 ring-blue-500/40 text-blue-500",
                  )}
                  aria-label="Filtrar por atributos"
                  onClick={(e) => {
                    e.stopPropagation();
                    showFilter.value = true;
                  }}
                >
                  <Filter className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {item.cqlFilter
                    ? "Filtro por atributos ativo. Clique para gerenciar."
                    : "Filtrar por atributos"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {canCustomizeLayer && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 rounded-full text-primary hover:bg-primary/10 hover:text-primary",
                    highlightCustomize &&
                      "animate-pulse bg-primary/15 ring-1 ring-primary/40",
                  )}
                  aria-label="Personalizar visualmente"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCustomize?.(item.id);
                  }}
                >
                  <Palette className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Personalizar visualmente</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full hover:bg-muted"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
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
                <span>Filtrar por atributos</span>
              </DropdownMenuItem>
            )}
            {canCustomizeLayer && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onCustomize?.(item.id);
                }}
              >
                <Palette className="mr-2 h-4 w-4" />
                <span>Personalizar visualmente</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onShowMetadata?.(item.id);
              }}
            >
              <Ellipsis className="mr-2 h-4 w-4" />
              <span>Informações</span>
            </DropdownMenuItem>

            {item.properties?.layerActions?.map(
              ({ icon, action, label }: any, i: number) => (
                <DropdownMenuItem
                  key={`${icon}-${i}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const actionFn = (window as any).createFn(action, false);
                    actionFn();
                  }}
                >
                  <UrbisIcon
                    name={icon}
                    className="mr-2 text-base"
                    aria-hidden="true"
                  />
                  <span>{label || "Ação"}</span>
                </DropdownMenuItem>
              ),
            )}

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveClick();
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>
                {isUserAddedLayer ? "Excluir camada" : "Remover do mapa"}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <LayerFilterModal
        open={showFilter.value}
        onOpenChange={(v) => (showFilter.value = v)}
        layer={item}
      />
    </div>
  );
};
