import { HasPermission } from "@/components/AccessControl/HasPermission";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { RolePermissionScopeEnum } from "@/utils/access-control";
import { Folder, Layers, Search, Settings2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import Header from "../Header";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [isCollapsed] = useState(false);

  const [location, setLocation] = useLocation();

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <Header />
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside
          className={cn(
            "sticky top-0 h-[calc(100vh-64px)] flex flex-col border-r bg-card transition-all duration-300 ease-in-out z-20",
            isCollapsed ? "w-[60px]" : "w-[240px]",
          )}
        >
          <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
            {/* Camadas */}
            <HasPermission
              permissions={[
                {
                  resource: "layer-schema",
                  action: "create",
                  scope: RolePermissionScopeEnum.ANY,
                  id: "layer-schema:create",
                },
                {
                  resource: "layer-schema",
                  action: "update",
                  scope: RolePermissionScopeEnum.ANY,
                  id: "layer-schema:update",
                },
                {
                  resource: "layer-schema",
                  action: "delete",
                  scope: RolePermissionScopeEnum.ANY,
                  id: "layer-schema:delete",
                },
              ]}
              mode="OR"
            >
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
                        isCollapsed ? "justify-center px-2" : "px-4",
                      )}
                      onClick={() => setLocation("/layer-manager")}
                    >
                      <Layers
                        className={cn("h-5 w-5", !isCollapsed && "mr-2")}
                      />
                      {!isCollapsed && <span>Camadas</span>}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">Camadas</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </HasPermission>

            {/* Grupos */}
            <HasPermission
              permissions={[
                {
                  resource: "layer-group",
                  action: "create",
                  scope: RolePermissionScopeEnum.ANY,
                  id: "layer-group:create",
                },
                {
                  resource: "layer-group",
                  action: "update",
                  scope: RolePermissionScopeEnum.ANY,
                  id: "layer-group:update",
                },
                {
                  resource: "layer-group",
                  action: "delete",
                  scope: RolePermissionScopeEnum.ANY,
                  id: "layer-group:delete",
                },
              ]}
              mode="OR"
            >
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
                        isCollapsed ? "justify-center px-2" : "px-4",
                      )}
                      onClick={() => setLocation("/group-manager")}
                    >
                      <Folder
                        className={cn("h-5 w-5", !isCollapsed && "mr-2")}
                      />
                      {!isCollapsed && <span>Grupos</span>}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">Grupos</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </HasPermission>

            {/* Pesquisas */}
            <HasPermission
              permissions={[
                {
                  resource: "search-config",
                  action: "create",
                  scope: RolePermissionScopeEnum.ANY,
                  id: "search-config:create",
                },
                {
                  resource: "search-config",
                  action: "update",
                  scope: RolePermissionScopeEnum.ANY,
                  id: "search-config:update",
                },
                {
                  resource: "search-config",
                  action: "delete",
                  scope: RolePermissionScopeEnum.ANY,
                  id: "search-config:delete",
                },
              ]}
              mode="OR"
            >
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
                        isCollapsed ? "justify-center px-2" : "px-4",
                      )}
                      onClick={() => setLocation("/search-manager")}
                    >
                      <Search
                        className={cn("h-5 w-5", !isCollapsed && "mr-2")}
                      />
                      {!isCollapsed && <span>Pesquisas</span>}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">Pesquisas</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </HasPermission>

            <HasPermission
              permissions={{
                resource: "map-config",
                action: "update",
                scope: RolePermissionScopeEnum.ANY,
                id: "map-config:update",
              }}
            >
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={
                        location.startsWith("/map-config-manager")
                          ? "secondary"
                          : "ghost"
                      }
                      className={cn(
                        "w-full justify-start",
                        isCollapsed ? "justify-center px-2" : "px-4",
                      )}
                      onClick={() => setLocation("/map-config-manager")}
                    >
                      <Settings2
                        className={cn("h-5 w-5", !isCollapsed && "mr-2")}
                      />
                      {!isCollapsed && <span>Parâmetros</span>}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">Parâmetros</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </HasPermission>
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
