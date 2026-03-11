import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  cn,
  Drawer,
  DrawerContent,
  DrawerTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Button
} from "@open-urbis/map-ui";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { Search } from "../Search";
import { ArrowRight, FileJson, Filter, Library, FileSearch } from "lucide-react";
import { LocationSelectionCard } from "../LocationSelectionCard";
import { ConcatenatedSearchModal } from "../Search/ConcatenatedSearchModal";
import { MapLibrary } from "../../pages/Map/MapLibrary";
import { ProspectiveSearchPage } from "../../pages/Map/ProspectiveSearchPage";
import { userProfile } from "@open-urbis/map-auth";

export const LeftNav = () => {
  const { drawerOpen, toggleDrawer, currentPage, navigateTo, isProspectiveSearchActive } = useNavigationContext();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isAdmin = userProfile.value?.position?.toLowerCase().includes("admin");

  const handleNavigate = (component: React.ReactNode) => {
      toggleDrawer();
      // Small timeout to allow drawer animation to start/state to update before navigation content render if needed
      // But mainly to ensure drawer is open
      navigateTo(component);
  };

  const CollapsedMenuItem = ({ icon, label, onClick, trigger, disabled }: { icon: React.ReactNode, label: string, onClick?: () => void, trigger?: React.ReactNode, disabled?: boolean }) => {
      const content = (
          <Button
            variant="ghost"
            size="icon" 
            className={cn("h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm shadow-sm border hover:bg-accent", disabled && "opacity-50 cursor-not-allowed pointer-events-none")}
            onClick={onClick}
            disabled={disabled}
          >
              {icon}
          </Button>
      );

      return (
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    {trigger ? trigger : content}
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      );
  }

  if (isDesktop) {
    return (
      <div
        className={cn(
          "relative h-full transition-all duration-300 flex flex-col pt-16 w-[432px] pointer-events-none",
          drawerOpen.value
            ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r"
            : "bg-transparent backdrop-blur-none border-transparent",
        )}
      >
        <div
          className={cn(
            "flex-1 overflow-y-auto p-3 space-y-3 w-[432px] overflow-x-hidden",
            drawerOpen.value ? "pointer-events-auto" : "pointer-events-none",
          )}
        >
          <div className="pointer-events-auto">
            {!isProspectiveSearchActive.value && <Search />}
          </div>
          <div
            className={cn(
              "transition-all duration-500 ease-in-out origin-top",
              drawerOpen.value
                ? "opacity-100 translate-y-0 h-auto"
                : "opacity-0 -translate-y-4 h-0 overflow-hidden pointer-events-none",
            )}
          >
            {currentPage.value}
          </div>

          {!drawerOpen.value && (
              <div className="pointer-events-auto flex flex-col gap-3 items-start animate-in fade-in slide-in-from-left-4 duration-500 pl-1">
                  <CollapsedMenuItem 
                    label="Ir para" 
                    icon={<ArrowRight className="h-5 w-5" />} 
                    onClick={() => handleNavigate(<LocationSelectionCard key="nav-coords" initialOption="coordenadas" initialInputType="latlon" />)}
                  />
                  <CollapsedMenuItem 
                    label="O que é o Endereço Digital? Saiba como funciona." 
                    icon={<img src="/ed.png" alt="ED" className="h-5 w-5" />} 
                    onClick={() => handleNavigate(<LocationSelectionCard key="nav-digital" initialOption="coordenadas" initialInputType="digital" />)}
                  />
                  
                  <ConcatenatedSearchModal 
                    trigger={
                        <div className="pointer-events-auto">
                             <CollapsedMenuItem 
                                label="Filtros Multicamadas: Refine sua pesquisa por camadas de dados." 
                                icon={<Filter className="h-5 w-5" />} 
                            />
                        </div>
                    }
                  />

                  <CollapsedMenuItem 
                    label="Importar Geometria: Localize áreas via arquivo GeoJSON." 
                    icon={<FileJson className="h-5 w-5" />} 
                    onClick={() => handleNavigate(<LocationSelectionCard key="nav-geojson" initialOption="geoJson" />)}
                  />
                  {isAdmin && (
                    <CollapsedMenuItem 
                      label="Pesquisa Prospectiva" 
                      icon={<FileSearch className="h-5 w-5" />} 
                      onClick={() => handleNavigate(<ProspectiveSearchPage key="nav-prospective-search" />)}
                    />
                  )}
                  <CollapsedMenuItem 
                    label="Meu Painel: Histórico de buscas e itens salvos." 
                    icon={<Library className="h-5 w-5" />} 
                    onClick={() => handleNavigate(<MapLibrary key="nav-library" />)}
                  />
              </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Drawer
      open={drawerOpen.value}
      onOpenChange={(open: boolean) => {
        if (open !== drawerOpen.value) toggleDrawer();
      }}
    >
      <DrawerContent className="h-[80vh]">
        <DrawerTitle className="sr-only">Navegação</DrawerTitle>

        <div className="flex-1 overflow-y-auto p-4 3">
          {!isProspectiveSearchActive.value && <Search />}
          {currentPage.value}
        </div>
      </DrawerContent>
    </Drawer>
  );
};