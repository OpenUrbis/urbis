import { useEffect, useState } from "preact/compat";
import { 
  Button, 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@open-urbis/map-ui";
import { ChevronDown, Globe, Library, Layout } from "lucide-react";
import { shareService, SharedMapItem } from "../../integrations/share-service";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { MapLibrary } from "../../pages/Map/MapLibrary";

export const ViewSelector = () => {
  const { navigateTo } = useNavigationContext();
  const [publicMaps, setPublicMaps] = useState<SharedMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeViewName, setActiveViewName] = useState("Área construída de Lotes Tributários e Distritos");

  useEffect(() => {
    const fetchPublicViews = async () => {
      try {
        setLoading(true);
        const maps = await shareService.findAllPublic(1, 10, "map");
        setPublicMaps(maps.items);

        const params = new URLSearchParams(window.location.search);
        const shareId = params.get('shareId');
        if (shareId) {
          const active = maps.items.find(m => m.id === shareId);
          if (active) setActiveViewName(active.name);
        }
      } catch (error) {
        console.error("Failed to fetch public views", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicViews();
  }, []);

  const handleSelectView = (view: SharedMapItem) => {
    window.location.href = `${window.location.origin}/?shareId=${view.id}`;
  };

  return (
    <div className="absolute bottom-8 right-4 z-[10] flex items-center gap-2 px-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-8 rounded-full bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 border-none transition-all px-3 flex items-center gap-2 max-w-[340px] group shadow-sm"
          >
            <Layout className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-[11px] font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {activeViewName}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-data-[state=open]:rotate-180 transition-transform" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[300px] rounded-xl shadow-xl border">
          <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2 px-3 py-2">
            <Globe className="h-3 w-3" />
            Visualizações Públicas
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-[300px] overflow-y-auto p-1.5 space-y-1">
            {loading ? (
              <div className="flex justify-center py-4">
                <span className="material-symbols-outlined animate-spin text-muted-foreground/30">progress_activity</span>
              </div>
            ) : publicMaps.length > 0 ? (
              publicMaps.map((view) => (
                <DropdownMenuItem
                  key={view.id}
                  className="rounded-lg cursor-pointer focus:bg-primary/10 focus:text-primary py-2 px-3 flex flex-col items-start gap-0.5"
                  onClick={() => handleSelectView(view)}
                >
                  <span className="text-xs font-bold">{view.name}</span>
                  {view.description && (
                    <span className="text-[10px] opacity-70 line-clamp-1">{view.description}</span>
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-muted-foreground italic">Nenhuma sugestão encontrada.</div>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="rounded-lg cursor-pointer focus:bg-primary/10 focus:text-primary py-2 px-3 flex items-center gap-2"
            onClick={() => navigateTo(<MapLibrary />)}
          >
            <Library className="h-3.5 w-3.5" />
            <span className="text-xs font-bold">Ver Biblioteca Completa</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
