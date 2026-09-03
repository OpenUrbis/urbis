"use client";

import {
  Button,
  buildUrbisNav,
  HelpSidebarContent,
  useSidebar,
} from "@open-urbis/map-ui";
import * as React from "react";
import { UrbisHeaderWrapper } from "./urbis-header-wrapper";

export function DocsHeaderClient() {
  const { openSidebar } = useSidebar();

  const { menuItems, badgeText } = React.useMemo(() => {
    return buildUrbisNav({
      isAuthenticated: false,
      currentApp: "docs",
    });
  }, []);

  return (
    <UrbisHeaderWrapper
      menuItems={menuItems}
      badgeText={badgeText}
      showMobileMenu
      rightSlot={
        <Button
          variant="outline"
          size="sm"
          className="hidden md:inline-flex h-9 rounded-full px-4"
          onClick={() =>
            openSidebar(
              <div className="h-full min-h-0 flex flex-col">
                <div className="shrink-0 space-y-1">
                  <h3 className="text-base font-semibold">Central de ajuda</h3>
                  <p className="text-sm text-muted-foreground">
                    Encontre respostas rápidas, dúvidas frequentes e um espaço
                    para enviar sugestões sobre a documentação da plataforma
                    Urbis.
                  </p>
                </div>

                <div className="flex-1 min-h-0 pt-4">
                  <HelpSidebarContent
                    currentTabSlug="docs"
                    appFilter="docs"
                    faqEndpointBase="http://localhost:3000/support/question-tabs"
                    endpoint="http://localhost:3000/support/create-ticket"
                  />
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
  );
}
