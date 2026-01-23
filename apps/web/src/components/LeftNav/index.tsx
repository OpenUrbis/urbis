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
          "relative h-full transition-all duration-300 flex flex-col pt-16 w-[420px] pointer-events-none",
          drawerOpen.value
            ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r"
            : "bg-transparent backdrop-blur-none border-transparent"
        )}
      >
        <div
          className={cn(
            "flex-1 overflow-y-auto p-3 space-y-4 w-[420px] overflow-x-hidden",
            drawerOpen.value ? "pointer-events-auto" : "pointer-events-none"
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
                : "opacity-0 -translate-y-4 h-0 overflow-hidden pointer-events-none"
            )}
          >
            {currentPage.value}
          </div>
        </div>
        <div
          className={cn(
            "w-[420px] transition-all duration-300",
            drawerOpen.value
              ? "border-t bg-background opacity-100 pointer-events-auto"
              : "border-transparent bg-transparent opacity-0 h-0 overflow-hidden pointer-events-none"
          )}
        >
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
