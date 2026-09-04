import { computed, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { useMapContext } from "../../hooks/useMapContext";
import {
  IGetConfigLayerGroup,
  IGetConfigLayerSchema,
} from "../../types/fetch-map-config-type";
import { LayerItem } from "./LayerItem";
import { cn, UrbisIcon, Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@open-urbis/map-ui";
import { CheckCheck } from "lucide-react";

// Helper to recursively collect all layers matching search (or all layers) for a group and its subgroups
const getGroupLayers = (
  group: IGetConfigLayerGroup,
  allSchemas: IGetConfigLayerSchema[],
  searchValue?: string,
): IGetConfigLayerSchema[] => {
  const directLayers = allSchemas.filter((l) => l.groupId === group.id);
  const matchingDirect = searchValue
    ? directLayers.filter((l) =>
        l.name.toLowerCase().includes(searchValue.toLowerCase()),
      )
    : directLayers;

  let childLayers: IGetConfigLayerSchema[] = [];
  if (group.childGroups && group.childGroups.length > 0) {
    for (const sub of group.childGroups) {
      childLayers = childLayers.concat(
        getGroupLayers(sub, allSchemas, searchValue),
      );
    }
  }

  return [...matchingDirect, ...childLayers];
};

export const LayerGroup = ({
  group,
  isSubGroup,
  searchValue,
  level = 0,
  onRemove,
  onShowMetadata,
  onCustomize,
  highlightCustomize = false,
  highlightFilter = false,
}: {
  group: IGetConfigLayerGroup;
  isSubGroup?: boolean;
  searchValue?: string;
  level?: number;
  onRemove?: (id: string) => void;
  onShowMetadata?: (id: string) => void;
  onCustomize?: (id: string) => void;
  highlightCustomize?: boolean;
  highlightFilter?: boolean;
}) => {
  const isOpen = useSignal(true);
  const { layerSchemas, handleActiveLayer } = useMapContext();

  const allGroupLayers = computed(() =>
    getGroupLayers(group, layerSchemas.value, searchValue),
  );

  const shouldRender = computed(() => allGroupLayers.value.length > 0);

  const allSelected = computed(
    () =>
      allGroupLayers.value.length > 0 &&
      allGroupLayers.value.every((l) => l.isSelected),
  );

  const layers = computed(() =>
    layerSchemas.value.filter((value) => value.groupId === group.id),
  );

  const filteredLayers = computed(() => {
    if (!searchValue) return layers.value;
    return layers.value.filter((l) =>
      l.name.toLowerCase().includes(searchValue.toLowerCase()),
    );
  });

  const hasLayers = computed(() => filteredLayers.value.length > 0);

  // If there's a search value, expand automatically if we have matches.
  // If search value is cleared, collapse.
  useEffect(() => {
    if (searchValue) {
      if (shouldRender.value) {
        isOpen.value = true;
      }
    } else {
      isOpen.value = true;
    }
  }, [searchValue, shouldRender.value]);

  const handleToggleAll = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    const targetIds = new Set(allGroupLayers.value.map((l) => l.id));
    const newSelectedState = !allSelected.value;

    layerSchemas.value = layerSchemas.value.map((layer) => {
      if (targetIds.has(layer.id)) {
        return {
          ...layer,
          isSelected: newSelectedState,
          isVisible: newSelectedState,
        };
      }
      return layer;
    });
  };

  const renderContentClassName = computed(() =>
    hasLayers.value ? "bg-background" : "bg-muted/10",
  );

  const renderItems = computed(() => {
    if (!filteredLayers.value || !filteredLayers.value.length) return null;

    // Indent items one level deeper than the group header
    return filteredLayers.value.map((item) => (
      <LayerItem
        key={item.id}
        item={item}
        indent={(level + 2) * 8}
        onClick={handleActiveLayer}
        onRemove={onRemove}
        onShowMetadata={onShowMetadata}
        onCustomize={onCustomize}
        highlightCustomize={highlightCustomize}
        highlightFilter={highlightFilter}
      />
    ));
  });

  if (!shouldRender.value) return null;

  return (
    <div
      key={group.id}
      className={cn("layer-group border-b border-border/40 last:border-0")}
    >
      <section
        className={cn(
          "flex w-full cursor-pointer items-center justify-between py-1 pr-2 transition-colors hover:bg-muted/50",
        )}
        style={{ paddingLeft: `${(level + 1) * 8}px` }}
        onClick={() => (isOpen.value = !isOpen.value)}
      >
        <div className="flex min-w-0 items-center gap-1">
          {level > 0 && (
            <UrbisIcon
              name="subdirectory_arrow_right"
              className="text-sm text-muted-foreground/70"
              aria-hidden="true"
            />
          )}
          <h3
            className={cn(
              "truncate",
              isSubGroup
                ? "m-0 text-[11px] font-medium"
                : "m-0 text-xs font-semibold",
            )}
          >
            {group.name}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-5 w-5 rounded p-0 text-muted-foreground/70 hover:bg-muted hover:text-foreground",
                    allSelected.value &&
                      "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary",
                  )}
                  onClick={handleToggleAll}
                  aria-label={
                    allSelected.value
                      ? "Desmarcar todas do grupo"
                      : "Selecionar todas do grupo"
                  }
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">
                  {allSelected.value
                    ? "Desmarcar todas do grupo"
                    : "Selecionar todas do grupo"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <UrbisIcon
            name={isOpen.value ? "expand_less" : "expand_more"}
            className="text-base text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      </section>
      {isOpen.value && (
        <div className={renderContentClassName.value}>
          {renderItems.value}
          {group.childGroups?.map((subGroup) => (
            <LayerGroup
              key={subGroup.id}
              group={subGroup}
              isSubGroup={true}
              searchValue={searchValue}
              level={level + 1}
              onRemove={onRemove}
              onShowMetadata={onShowMetadata}
              onCustomize={onCustomize}
              highlightCustomize={highlightCustomize}
              highlightFilter={highlightFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
};
