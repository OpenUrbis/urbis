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
import { ArrowRight, FileJson, Filter, Library } from "lucide-react";
import { LocationSelectionCard } from "../LocationSelectionCard";
import { ConcatenatedSearchModal } from "../Search/ConcatenatedSearchModal";
import { MapLibrary } from "../../pages/Map/MapLibrary";

export const LeftNav = () => {
  const { drawerOpen, toggleDrawer, currentPage, navigateTo } = useNavigationContext();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleNavigate = (component: React.ReactNode) => {
      toggleDrawer();
      // Small timeout to allow drawer animation to start/state to update before navigation content render if needed
      // But mainly to ensure drawer is open
      navigateTo(component);
  };

  const CollapsedMenuItem = ({ icon, label, onClick, trigger }: { icon: React.ReactNode, label: string, onClick?: () => void, trigger?: React.ReactNode }) => {
      const content = (
          <Button
            variant="ghost"
            size="icon" 
            className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm shadow-sm border hover:bg-accent"
            onClick={onClick}
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
          "relative h-full transition-all duration-300 flex flex-col pt-16 w-[420px] pointer-events-none",
          drawerOpen.value
            ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r"
            : "bg-transparent backdrop-blur-none border-transparent",
        )}
      >
        <div
          className={cn(
            "flex-1 overflow-y-auto p-3 space-y-3 w-[420px] overflow-x-hidden",
            drawerOpen.value ? "pointer-events-auto" : "pointer-events-none",
          )}
        >
          <div className="pointer-events-auto">
            <Search />
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
                    label="Endereço Digital" 
                    icon={<img src="/ed.png" alt="ED" className="h-5 w-5" />} 
                    onClick={() => handleNavigate(<LocationSelectionCard key="nav-digital" initialOption="coordenadas" initialInputType="digital" />)}
                  />
                  
                  <ConcatenatedSearchModal 
                    trigger={
                        <div className="pointer-events-auto">
                             <CollapsedMenuItem 
                                label="Busca Concatenada" 
                                icon={<Filter className="h-5 w-5" />} 
                            />
                        </div>
                    }
                  />

                  <CollapsedMenuItem 
                    label="Buscar com perímetro" 
                    icon={<FileJson className="h-5 w-5" />} 
                    onClick={() => handleNavigate(<LocationSelectionCard key="nav-geojson" initialOption="geoJson" />)}
                  />
                  <CollapsedMenuItem 
                    label="Biblioteca" 
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
          <Search />
          {currentPage.value}
        </div>
      </DrawerContent>
    </Drawer>
  );
};