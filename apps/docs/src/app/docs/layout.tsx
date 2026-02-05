import { buildUrbisNav, Button, HelpSidebarContent, SidebarProvider, useSidebar } from "@open-urbis/map-ui";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";

import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";
import { SidebarController } from "./sidebar-controller";
import { UrbisHeaderWrapper } from "./urbis-header-wrapper";

function LayoutInner({ children }: { children: ReactNode }) {
  const { openSidebar } = useSidebar();

  const { menuItems, badgeText } = buildUrbisNav({
    isAuthenticated: false,
    currentApp: "docs",
  });

  return (
    <div className="flex flex-col w-full min-h-screen">
      <UrbisHeaderWrapper
        menuItems={menuItems}
        badgeText={badgeText}
        showMobileMenu
        rightSlot={
          <Button
            variant="outline"
            size="sm"
            className="hidden md:inline-flex"
            onClick={() =>
              openSidebar(
                <div className="h-full min-h-0 flex flex-col">
                  <div className="shrink-0 space-y-1">
                    <h3 className="text-base font-semibold">Central de ajuda</h3>
                    <p className="text-sm text-muted-foreground">
                      Encontre respostas rápidas, dúvidas frequentes e um espaço para enviar sugestões sobre a
                      documentação da plataforma Urbis.
                    </p>
                  </div>

                  <div className="flex-1 min-h-0 pt-4">
                    <HelpSidebarContent />
                  </div>
                </div>,
                "Ajuda",
              )
            }
          >
            Ajuda
          </Button>
        }
      />

      <div className="flex-1">
        <DocsLayout tree={source.pageTree} {...baseOptions()}>
          <SidebarController />
          {children}
        </DocsLayout>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutInner>{children}</LayoutInner>
    </SidebarProvider>
  );
}
