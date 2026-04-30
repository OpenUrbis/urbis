import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Folder, Layers, Search } from "lucide-react";
import { useState } from "react";
import { useAuth } from "react-oidc-context";
import { useLocation } from "wouter";
import Header from "../Header";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const auth = useAuth();
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <Header onMenuToggle={() => setIsCollapsed(!isCollapsed)} />
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside
          className={cn(
            "sticky top-0 h-[calc(100vh-64px)] flex flex-col border-r bg-card transition-all duration-300 ease-in-out z-20",
            isCollapsed ? "w-[60px]" : "w-[240px]"
          )}
        >
          <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
            {/* Camadas */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={
                      location.startsWith("/layer-manager")
                        ? "secondary"
                        : "ghost"
                    }
                    className={cn(
                      "w-full justify-start",
                      isCollapsed ? "justify-center px-2" : "px-4"
                    )}
                    onClick={() => setLocation("/layer-manager")}
                  >
                    <Layers className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
                    {!isCollapsed && <span>Camadas</span>}
                  </Button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">Camadas</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            {/* Grupos */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={
                      location.startsWith("/group-manager")
                        ? "secondary"
                        : "ghost"
                    }
                    className={cn(
                      "w-full justify-start",
                      isCollapsed ? "justify-center px-2" : "px-4"
                    )}
                    onClick={() => setLocation("/group-manager")}
                  >
                    <Folder className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
                    {!isCollapsed && <span>Grupos</span>}
                  </Button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">Grupos</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            {/* Pesquisas */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={
                      location.startsWith("/search-manager")
                        ? "secondary"
                        : "ghost"
                    }
                    className={cn(
                      "w-full justify-start",
                      isCollapsed ? "justify-center px-2" : "px-4"
                    )}
                    onClick={() => setLocation("/search-manager")}
                  >
                    <Search className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
                    {!isCollapsed && <span>Pesquisas</span>}
                  </Button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">Pesquisas</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 relative flex flex-col min-w-0">
          <div className="flex-1 overflow-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
