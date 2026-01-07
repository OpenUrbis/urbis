import { useState } from "react";
import { useAuth } from "react-oidc-context";
import { useLocation } from "wouter";
import Header from "../Header";
import { cn } from "@/lib/utils";
import { Layers, Folder, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
                   variant={location.startsWith("/layer-manager") ? "secondary" : "ghost"}
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
               {isCollapsed && <TooltipContent side="right">Camadas</TooltipContent>}
             </Tooltip>
           </TooltipProvider>

           {/* Grupos */}
           <TooltipProvider delayDuration={0}>
             <Tooltip>
               <TooltipTrigger asChild>
                 <Button
                   variant={location.startsWith("/group-manager") ? "secondary" : "ghost"}
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
               {isCollapsed && <TooltipContent side="right">Grupos</TooltipContent>}
             </Tooltip>
           </TooltipProvider>
        </nav>

        <div className="p-2 border-t mt-auto space-y-2">
           {/* Alternar Tema */}
           <TooltipProvider delayDuration={0}>
             <Tooltip>
               <TooltipTrigger asChild>
                 <Button
                   variant="ghost"
                   className={cn(
                     "w-full justify-start",
                     isCollapsed ? "justify-center px-2" : "px-4"
                   )}
                   onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                 >
                   {theme === "dark" ? (
                     <Sun className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
                   ) : (
                     <Moon className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
                   )}
                   {!isCollapsed && <span>Alternar Tema</span>}
                 </Button>
               </TooltipTrigger>
               {isCollapsed && <TooltipContent side="right">Alternar Tema</TooltipContent>}
             </Tooltip>
           </TooltipProvider>

           {/* Logout */}
           <TooltipProvider delayDuration={0}>
             <Tooltip>
               <TooltipTrigger asChild>
                 <Button
                   variant="ghost"
                   className={cn(
                     "w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50",
                     isCollapsed ? "justify-center px-2" : "px-4"
                   )}
                   onClick={() => auth.removeUser()}
                 >
                   <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
                   {!isCollapsed && <span>Sair</span>}
                 </Button>
               </TooltipTrigger>
               {isCollapsed && <TooltipContent side="right">Sair</TooltipContent>}
             </Tooltip>
           </TooltipProvider>
        </div>
      </aside>

        {/* Main Content */}
        <main className="flex-1 relative flex flex-col min-w-0">
          <div className="flex-1 overflow-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
