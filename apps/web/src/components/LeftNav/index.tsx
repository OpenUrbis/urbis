import { useNavigationContext } from "../../hooks/useNavigationContext";
import { Search } from "../Search";
import { Drawer, DrawerContent, DrawerTitle } from "@open-urbis/map-ui";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn, UrbisFooter } from "@open-urbis/map-ui";

export const LeftNav = () => {
  const { drawerOpen, toggleDrawer, currentPage } = useNavigationContext();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <div
        className={cn(
          "relative h-full border-r transition-all duration-300 overflow-hidden flex flex-col pt-16 pointer-events-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          drawerOpen.value ? "w-[420px]" : "w-0 border-none"
        )}
      >
        <div className="flex-1 overflow-y-auto p-3 space-y-4 w-[420px]">
          <Search />
          {currentPage.value}
        </div>
        <div className="w-[420px] border-t bg-background">
          <UrbisFooter />
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
          <UrbisFooter />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
