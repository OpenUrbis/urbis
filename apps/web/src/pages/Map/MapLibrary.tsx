import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { shareService, SharedMapItem } from "../../integrations/share-service";
import { Button, Separator, Card, CardHeader, CardTitle, CardContent } from "@open-urbis/map-ui";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { useMapContext } from "../../hooks/useMapContext";
import { useSearchContext } from "../../hooks/useSearchContext";
import { Loader2, Map as MapIcon, Search as SearchIcon, ArrowLeft, Globe, History } from "lucide-react";
import { AuthRequiredModal } from "../../components/AuthRequiredModal";
import { ShareHistoryModal } from "../../components/LayerController/modals/ShareHistoryModal";
import { useSignal } from "@preact/signals";

export const MapLibrary = () => {
  const auth = useAuth();
  const { navigatePop } = useNavigationContext();
  
  const [publicMaps, setPublicMaps] = useState<SharedMapItem[]>([]);
  const [publicSearches, setPublicSearches] = useState<SharedMapItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isAuthModalOpen = useSignal(false);
  const isHistoryOpen = useSignal(false);
  const historyType = useSignal<"map" | "search">("map");

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const [maps, searches] = await Promise.all([
          shareService.findAllPublic(1, 50, "map"),
          shareService.findAllPublic(1, 50, "search"),
        ]);
        
        setPublicMaps(maps.items);
        setPublicSearches(searches.items);
      } catch (error) {
        console.error("Failed to fetch profiles", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const openHistory = (type: "map" | "search") => {
    if (!auth.isAuthenticated) {
      isAuthModalOpen.value = true;
      return;
    }
    historyType.value = type;
    isHistoryOpen.value = true;
  };

  const handleSelectProfile = (profile: SharedMapItem) => {
    window.location.href = `${window.location.origin}/?shareId=${profile.id}`;
  };

  return (
    <>
      <div className="grid gap-2">
        <div className="flex items-center gap-2 mb-1">
          <Button variant="ghost" size="icon" onClick={navigatePop} className="h-8 w-8 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold text-foreground">Biblioteca e Histórico</h2>
        </div>

        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Visualizações Públicas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {loading ? (
              <div className="flex justify-center py-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
              </div>
            ) : publicMaps.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {publicMaps.map((profile) => (
                  <Button
                    key={profile.id}
                    variant="secondary"
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => handleSelectProfile(profile)}
                  >
                    {profile.name}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Nenhuma visualização disponível.</p>
            )}
          </CardContent>

          <Separator className="opacity-50" />

          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <SearchIcon className="h-4 w-4 text-primary" />
              Buscas Públicas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {loading ? (
              <div className="flex justify-center py-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
              </div>
            ) : publicSearches.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {publicSearches.map((profile) => (
                  <Button
                    key={profile.id}
                    variant="secondary"
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => handleSelectProfile(profile)}
                  >
                    {profile.name}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Nenhuma busca disponível.</p>
            )}
          </CardContent>

          <Separator className="opacity-50" />

          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <History className="h-4 w-4" />
              <span className="text-sm font-semibold">Meu Histórico</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="justify-center gap-2 rounded-lg"
                onClick={() => openHistory("map")}
              >
                <MapIcon className="h-3.5 w-3.5" />
                Mapas
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="justify-center gap-2 rounded-lg"
                onClick={() => openHistory("search")}
              >
                <SearchIcon className="h-3.5 w-3.5" />
                Buscas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AuthRequiredModal 
        isOpen={isAuthModalOpen.value} 
        onOpenChange={(v) => isAuthModalOpen.value = v} 
        title="Acesso ao Histórico"
        description="Você precisa estar autenticado para acessar seu histórico pessoal de compartilhamentos."
      />
      
      <ShareHistoryModal 
        isOpen={isHistoryOpen.value} 
        onOpenChange={(v) => isHistoryOpen.value = v} 
        type={historyType.value} 
      />
    </>
  );
};
