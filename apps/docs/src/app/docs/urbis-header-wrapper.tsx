"use client";

import {
  HelpSidebarContent,
  SidebarProvider,
  UrbisHeader,
  useSidebar,
} from "@open-urbis/map-ui";
import { Button } from "@open-urbis/map-ui/ui/button";
import { useTheme } from "next-themes";
import type { ComponentProps } from "react";

export function UrbisHeaderWrapper(props: ComponentProps<typeof UrbisHeader>) {
  const { theme, setTheme } = useTheme();
  const { openSidebar } = useSidebar();

  const onLogin = () => {
    location.href = "https://conta.urbis.sampa.br/";
  };

  const openHelp = () => {
    openSidebar(
      <div className="h-full min-h-0 flex flex-col">
        <div className="shrink-0 space-y-1">
          <h3 className="text-base font-semibold">Central de ajuda</h3>
          <p className="text-sm text-muted-foreground">
            Encontre respostas rápidas, dúvidas frequentes e um espaço para
            enviar sugestões sobre a plataforma Urbis.
          </p>
        </div>

        <div className="flex-1 min-h-0 pt-4">
          <HelpSidebarContent />
        </div>
      </div>,
      "Ajuda",
    );
  };

  return (
    <SidebarProvider>
      <UrbisHeader
        {...props}
        theme={theme}
        setTheme={setTheme}
        showLogin={true}
        onLogin={onLogin}
        showMobileMenu={true}
        onMobileMenuClick={() => {
          window.dispatchEvent(new CustomEvent("urbis:toggle-sidebar"));
        }}
        rightSlot={
          <div className="flex items-center gap-2">
            {/* AJUDA — desktop */}
            <Button
              variant="outline"
              size="sm"
              onClick={openHelp}
              className="hidden md:inline-flex h-9 rounded-full px-4"
              aria-label="Ajuda"
              title="Ajuda"
            >
              Ajuda
            </Button>

            {/* AJUDA — mobile */}
            <Button
              variant="outline"
              size="icon"
              onClick={openHelp}
              className="inline-flex md:hidden h-9 w-9 rounded-full"
              aria-label="Ajuda"
              title="Ajuda"
            >
              ?
            </Button>
          </div>
        }
      />
    </SidebarProvider>
  );
}
