import { useNavigationContext } from "../../hooks/useNavigationContext";
import { Search } from "../Search";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

export const LeftNav = () => {
  const { drawerOpen, toggleDrawer, currentPage } = useNavigationContext();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <div
        className={cn(
          "relative h-full bg-background border-r transition-all duration-300 overflow-hidden",
          drawerOpen.value ? "w-[420px]" : "w-0 border-none"
        )}
      >
        <div className="h-full overflow-y-auto p-3 space-y-4 w-[420px]">
          <Search />
          {currentPage.value}
        </div>
      </div>
    );
  }

  return (
    <Drawer open={drawerOpen.value} onOpenChange={(open: boolean) => {
        if (open !== drawerOpen.value) toggleDrawer();
    }}>
      <DrawerContent className="h-[80vh]">
        <DrawerTitle className="sr-only">Navegação</DrawerTitle>
        <div className="h-full overflow-y-auto p-4 space-y-4">
          <Search />
          {currentPage.value}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
