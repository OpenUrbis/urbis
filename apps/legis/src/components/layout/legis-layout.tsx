import React, { useState, useMemo } from 'react';
import { SidebarInset, SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { UrbisHeader, Button, HelpSidebarContent, buildUrbisNav } from "@open-urbis/map-ui";
import { useAuth } from "@open-urbis/map-auth";
import { CommandMenu } from "./command-menu";
import { useLocation } from "wouter";
import { UrbisFooter } from "@open-urbis/map-ui/urbis-footer";
import { cn } from "@open-urbis/map-ui";

// Context to control layout features (like Help)
interface LegisLayoutContextType {
    setHelpOpen: (open: boolean) => void;
}

const LegisLayoutContext = React.createContext<LegisLayoutContextType>({
    setHelpOpen: () => {},
});

export const useLegisLayout = () => React.useContext(LegisLayoutContext);

interface LegisLayoutProps {
  children: React.ReactNode;
}

export function LegisLayout({ children }: LegisLayoutProps) {
  const auth = useAuth();
  const [helpOpen, setHelpOpen] = useState(false);
  const [location] = useLocation();
  
  // Header height constant for consistent spacing
  const HEADER_HEIGHT = "4rem"; // 64px

  const { menuItems, badgeText } = useMemo(() => {
    return buildUrbisNav({
      isAuthenticated: auth.isAuthenticated,
      currentApp: "legis",
    });
  }, [auth.isAuthenticated]);

  // isCustomLayout = true for Editor pages (Fixed viewport, internal scroll)
  // isCustomLayout = false for List/Home/View (Document scroll, footer at bottom)
  // Only Edit/New pages need the app-like fixed layout
  const isCustomLayout = location.includes('/edit') || location.includes('/new');

  return (
    <LegisLayoutContext.Provider value={{ setHelpOpen }}>
    <SidebarProvider defaultOpen={false} style={{ "--header-height": HEADER_HEIGHT } as React.CSSProperties}>
      <CommandMenu />
      <div className={cn(
          "flex flex-col w-full bg-background",
          isCustomLayout ? "h-screen overflow-hidden" : "min-h-screen"
      )}>
          <div className="z-50 relative sticky top-0">
            <UrbisHeader 
                badgeText={badgeText}
                menuItems={menuItems}
                isAuthenticated={auth.isAuthenticated}
                user={{
                    name: auth.user?.profile.name,
                    email: auth.user?.profile.email,
                }}
                onLogin={() => auth.signinRedirect()}
                onLogout={() => auth.signoutRedirect()}
                leftSlot={<SidebarTrigger className="mr-2" />}
                rightSlot={
                    <div className="flex items-center gap-2">
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHelpOpen(true)}
                        className="hidden md:inline-flex h-9 rounded-full px-4"
                        title="Ajuda"
                        aria-label="Ajuda"
                        >
                        Ajuda
                        </Button>
                        <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setHelpOpen(true)}
                        className="inline-flex md:hidden h-9 w-9 rounded-full"
                        title="Ajuda"
                        aria-label="Ajuda"
                        >
                        ?
                        </Button>
                    </div>
                }
            />
          </div>
          
          <div className={cn(
              "flex flex-1 relative",
              isCustomLayout ? "overflow-hidden" : "flex-col md:flex-row"
          )}>
            <AppSidebar className="md:fixed md:!top-[--header-height] md:!h-[calc(100svh-var(--header-height))]" />
            
            <SidebarInset className={cn(
                "flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out",
                isCustomLayout ? "h-full overflow-hidden" : ""
            )}>
                <main className={cn(
                    "flex-1 bg-muted/10 p-0 flex flex-col",
                    isCustomLayout ? "overflow-hidden" : ""
                )}>
                    {children}
                </main>
            </SidebarInset>
          </div>

          {/* Footer outside SidebarInset/Sidebar wrapper to span full width below them */}
          {!isCustomLayout && <UrbisFooter />}

          {/* Help Overlay */}
          {helpOpen && (
            <div className="fixed inset-0 z-50 flex">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setHelpOpen(false)}
            />
            <div className="relative ml-auto h-full w-full max-w-[420px] bg-background shadow-xl overflow-y-auto animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-sm font-semibold">Ajuda</h2>
                <button
                    type="button"
                    onClick={() => setHelpOpen(false)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                    aria-label="Fechar ajuda"
                >
                    ✕
                </button>
                </div>
                <div className="p-3">
                <HelpSidebarContent currentTabSlug="docs" />
                </div>
            </div>
            </div>
        )}
      </div>
    </SidebarProvider>
    </LegisLayoutContext.Provider>
  );
}
