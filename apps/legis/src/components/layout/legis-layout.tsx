import React, { useState, useMemo } from 'react';
import { SidebarInset, SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import { UrbisHeader, Button, HelpSidebarContent, buildUrbisNav } from "@open-urbis/map-ui";
import { AppSidebar } from "./app-sidebar";
// import { WorkspaceExplorer } from "../../modules/viewer/components/WorkspaceExplorer";
import { useAuth } from "@open-urbis/map-auth";
import { CommandMenu } from "./command-menu";

interface LegisLayoutProps {
  children: React.ReactNode;
}

export function LegisLayout({ children }: LegisLayoutProps) {
  const auth = useAuth();
  const [helpOpen, setHelpOpen] = useState(false);
  
  const { menuItems, badgeText } = useMemo(() => {
    return buildUrbisNav({
      isAuthenticated: auth.isAuthenticated,
      currentApp: "legis",
    });
  }, [auth.isAuthenticated]);

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full bg-background overflow-hidden">
          <CommandMenu />
          <UrbisHeader 
            logoAlt="Legis.Urbis"
            badgeText="Legis"
            menuItems={[
                { label: "Mosaico", href: "/" },
                { label: "Legis", href: "/", active: true },
            ]}
            isAuthenticated={auth.isAuthenticated}
            user={{
                name: auth.user?.profile.name,
                email: auth.user?.profile.email,
            }}
            onLogin={() => auth.signinRedirect()}
            onLogout={() => auth.signoutRedirect()}
            leftSlot={<SidebarTrigger className="mr-2" />}
            rightSlot={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHelpOpen(true)}
                  className="hidden md:inline-flex h-9 rounded-full px-4 gap-2"
                >
                  Ajuda
                </Button>
            }
          />
          
          <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">
            <AppSidebar className="h-full" />
            
            <div className="flex flex-1 min-w-0 h-full">
                {/* Explorer Panel - Removed */}
                {/* <WorkspaceExplorer /> */}
                
                {/* Main Content Area */}
                <SidebarInset className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
                    <main className="flex-1 bg-muted/10 h-full overflow-hidden flex flex-col">
                        {children}
                    </main>
                </SidebarInset>
            </div>
          </div>

          {/* Help Overlay */}
          {helpOpen && (
            <div className="fixed inset-0 z-50 flex">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setHelpOpen(false)}
              />

              <div className="relative ml-auto h-full w-full max-w-[420px] bg-background shadow-xl overflow-y-auto animate-in slide-in-from-right">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-sm font-semibold">Ajuda</h2>
                  <button
                    type="button"
                    onClick={() => setHelpOpen(false)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3">
                  <HelpSidebarContent />
                </div>
              </div>
            </div>
          )}
      </div>
    </SidebarProvider>
  );
}
