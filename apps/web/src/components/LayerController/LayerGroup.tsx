import { computed } from "@preact/signals";
import { useState, useEffect } from "preact/hooks";
import { useMapContext } from "../../hooks/useMapContext";
import { IGetConfigLayerGroup, IGetConfigLayerSchema } from "../../types/fetch-map-config-type";
import { LayerItem } from "./LayerItem";
import { cn } from "@/lib/utils";

// Helper to check if a group or its children has matches
const hasGroupMatches = (
  group: IGetConfigLayerGroup, 
  search: string, 
  allSchemas: IGetConfigLayerSchema[]
): boolean => {
  if (!search) return true;
  
  // Check direct layers
  const groupLayers = allSchemas.filter(l => l.groupId === group.id);
  const layerMatch = groupLayers.some(l => l.name.toLowerCase().includes(search.toLowerCase()));
  if (layerMatch) return true;
  
  // Check subgroups
  if (group.childGroups && group.childGroups.length > 0) {
    return group.childGroups.some(sub => hasGroupMatches(sub, search, allSchemas));
  }
  
  return false;
};

export const LayerGroup = ({
  group,
  isSubGroup,
  searchValue,
  level = 0,
}: {
  group: IGetConfigLayerGroup;
  isSubGroup?: boolean;
  searchValue?: string;
  level?: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { layerSchemas, handleActiveLayer } = useMapContext();

  const layers = computed(() =>
    layerSchemas.value.filter((value) => value.groupId === group.id)
  );
  
  const filteredLayers = computed(() => {
    if (!searchValue) return layers.value;
    return layers.value.filter(l => 
      l.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  });
  
  const shouldRender = computed(() => {
     if (!searchValue) return true;
     return hasGroupMatches(group, searchValue, layerSchemas.value);
  });
  
  const hasLayers = computed(() => filteredLayers.value.length > 0);

  // If there's a search value, expand automatically if we have matches.
  // If search value is cleared, collapse.
  useEffect(() => {
    if (searchValue) {
       if (shouldRender.value) {
         setIsOpen(true);
       }
    } else {
      setIsOpen(false);
    }
  }, [searchValue, shouldRender.value]);

  const renderContentClassName = computed(() =>
    hasLayers.value ? "bg-background" : "bg-muted/10"
  );

  const renderItems = computed(() => {
    if (!filteredLayers.value || !filteredLayers.value.length) return null;

    // Indent items one level deeper than the group header
    return filteredLayers.value.map((item) => (
       <LayerItem 
          key={item.id} 
          item={item} 
          indent={(level + 2) * 16} 
          onClick={handleActiveLayer}
       />
    ));
  });

  if (!shouldRender.value) return null;

  return (
    <div
      key={group.id}
      className={cn(
        "layer-group border-b border-border/40 last:border-0",
      )}
    >
      <section
        className={cn(
          "w-full flex justify-between items-center cursor-pointer hover:bg-muted/50 transition-colors py-3 pr-4",
        )}
        style={{ paddingLeft: `${(level + 1) * 16}px` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
           {level > 0 && <span className="material-symbols-outlined text-lg text-muted-foreground/70">subdirectory_arrow_right</span>}
           <h3 className={cn(isSubGroup ? "text-sm m-0 font-medium" : "text-sm m-0 font-semibold")}>
             {group.name}
           </h3>
        </div>
        <span className="material-symbols-outlined text-xl text-muted-foreground">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </section>
      {isOpen && (
        <div className={renderContentClassName.value}>
          {renderItems.value}
          {group.childGroups?.map((subGroup) => (
            <LayerGroup 
              key={subGroup.id} 
              group={subGroup} 
              isSubGroup={true} 
              searchValue={searchValue}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
