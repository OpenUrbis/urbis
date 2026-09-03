import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { shareService, SharedMapItem } from "../../integrations/share-service";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from "@open-urbis/map-ui";
import { Loader2, Library } from "lucide-react";
import { useSearchContext } from "../../hooks/useSearchContext";
import { batch } from "@preact/signals";
import { FilterGroup } from "../FilterBuilder/types";

interface PredefinedSearchSuggestionsProps {
  onSelect?: (filterTree: FilterGroup, layerId: string) => void;
  limit?: number;
  currentLayerId?: string;
}

export const PredefinedSearchSuggestions = ({
  onSelect,
  limit = 10,
  currentLayerId,
}: PredefinedSearchSuggestionsProps) => {
  const publicSearches = useSignal<SharedMapItem[]>([]);
  const loading = useSignal(false);
  const { concatenatedSearch } = useSearchContext();

  useEffect(() => {
    loadPublicSearches();
  }, []);

  const loadPublicSearches = async () => {
    loading.value = true;
    try {
      const result = await shareService.findAllPublic(1, 30, "search");

      if (currentLayerId) {
        publicSearches.value = result.items
          .filter(
            (item) =>
              item.state?.root?.searchContext?.concatenatedSearch
                ?.selectedLayerId === currentLayerId,
          )
          .slice(0, limit);
      } else {
        publicSearches.value = result.items.slice(0, limit);
      }
    } catch (e) {
      console.error("Failed to load predefined searches", e);
    } finally {
      loading.value = false;
    }
  };

  const handleApplySearch = (item: SharedMapItem) => {
    if (!item.state?.root?.searchContext?.concatenatedSearch) return;

    const restoredCS = item.state.root.searchContext.concatenatedSearch;

    if (onSelect) {
      onSelect(restoredCS.filterTree, restoredCS.selectedLayerId);
    } else {
      batch(() => {
        concatenatedSearch.value = {
          ...concatenatedSearch.peek(),
          ...restoredCS,
          isOpen: true,
        };
      });
    }
  };

  if (loading.value) {
    return (
      <div className="flex items-center gap-2 px-1 py-2">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
          Carregando filtros salvos...
        </span>
      </div>
    );
  }

  if (publicSearches.value.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-4">
      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
        <Library className="h-3 w-3" />
        <span>Salvos ({publicSearches.value.length})</span>
      </div>
      <div className="flex flex-wrap gap-2 px-1">
        {publicSearches.value.map((item) => (
          <TooltipProvider key={item.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "cursor-pointer transition-all h-8 px-4 flex items-center justify-center rounded-full border border-input bg-background/50 hover:bg-accent hover:text-accent-foreground text-sm font-medium whitespace-nowrap shadow-sm backdrop-blur-sm",
                    "hover:scale-105 active:scale-95",
                  )}
                  onClick={() => handleApplySearch(item)}
                >
                  {item.name}
                </div>
              </TooltipTrigger>
              {item.description && (
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">{item.description}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};
