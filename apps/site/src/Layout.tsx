import { Outlet } from "react-router-dom";
import { UrbisHeader } from "@open-urbis/map-ui/urbis-header";
import { Footer } from "./components/layout/Footer";
import { ScrollToTop } from "./components/ScrollToTop";
import { useEffect, useState } from "react";
import { HelpSidebarContent } from "@open-urbis/map-ui";

import { SidebarProvider, useSidebar } from "@open-urbis/map-ui";
import { Button } from "@open-urbis/map-ui/ui/button";

function LayoutInner() {
  const [theme, setTheme] = useState<string>("system");
  const [_isDark, setIsDark] = useState(false);
  const { openSidebar } = useSidebar();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "system";
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    const activeTheme =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    root.classList.add(activeTheme);
    setIsDark(activeTheme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const menuItems = [
    { label: "Início", href: "/" },
    { label: "Mapa", href: "https://mapa.urbis.sampa.br" },
    { label: "Viabiliza", href: "https://viabiliza.urbis.sampa.br" },
    { label: "Dados Abertos", href: "https://dadosabertos.urbis.sampa.br" },
    { label: "Doc. técnica", href: "/doc-tecnica" },
    { label: "Legis", href: "/info-urbis" },
    { label: "Data Lake", href: "https://datalake.urbis.sampa.br/" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-foreground">
      <ScrollToTop />

      <UrbisHeader
        logoAlt="Logotipo da Prefeitura de São Paulo"
        logoHref="https://www.prefeitura.sp.gov.br/"
        badgeText={null}
        menuItems={menuItems}
        showLogin={false}
        rightSlot={
          <div className="flex items-center gap-2">
            {/* ✅ AJUDA usando o sidebar global + HelpSidebarContent */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                openSidebar(
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold">Central de ajuda</h3>
                      <p className="text-sm text-muted-foreground">
                        Encontre respostas rápidas, dúvidas frequentes e um espaço para
                        enviar sugestões sobre a plataforma Urbis.
                      </p>
                    </div>

                    {/* Seções colapsáveis: FAQ, Dúvidas, Sugestões */}
                    <HelpSidebarContent />
                  </div>,
                  "Ajuda"
                )
              }
              className="hidden md:inline-flex"
            >
              Ajuda
            </Button>

          </div>
        }
        theme={theme}
        setTheme={setTheme}
      />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

// Layout exportado, já com SidebarProvider global
export default function Layout() {
  return (
    <SidebarProvider>
      <LayoutInner />
    </SidebarProvider>
  );
}
