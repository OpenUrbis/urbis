import { useNavigationContext } from "../../hooks/useNavigationContext";
import { Search } from "../Search";
import { Drawer, DrawerContent, DrawerTitle } from "@open-urbis/map-ui";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@open-urbis/map-ui";


export const LeftNav = () => {
  const { drawerOpen, toggleDrawer, currentPage } = useNavigationContext();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    const open = drawerOpen.value;

    return (
      <div
        className={cn(
          "relative h-full transition-[width] duration-300 flex flex-col pt-16 overflow-hidden",
          open ? "w-[420px] border-r" : "w-0 border-r border-transparent",
          open
            ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            : "bg-transparent backdrop-blur-none",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 w-[420px]">
          {/* Search sempre clicável quando aberto */}
          <div className="pointer-events-auto">
            <Search />
          </div>

          {/* Página atual */}
          <div
            className={cn(
              "transition-all duration-300 ease-in-out origin-top",
              open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
            )}
          >
            {currentPage.value}
          </div>
        </div>

        {/* Footer fixo no bottom do painel */}
        <div
          className={cn(
            "w-[420px] border-t bg-background transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          
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

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <Search />
          {currentPage.value}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
