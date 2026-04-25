import { Outlet } from "react-router-dom";
import { UrbisHeader } from "@open-urbis/map-ui/urbis-header";
import { Footer } from "./components/layout/Footer";
import { ScrollToTop } from "./components/ScrollToTop";
import { ModeToggle } from "./components/mode-toggle";
import { useEffect, useState } from "react";
import { HelpSidebarContent } from "@open-urbis/map-ui";

import { SidebarProvider, useSidebar } from "@open-urbis/map-ui";
import { Button } from "@open-urbis/map-ui/ui/button";

function LayoutInner() {
  const [isDark, setIsDark] = useState(false);
  const { openSidebar } = useSidebar();

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });

    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    setIsDark(root.classList.contains("dark"));

    return () => observer.disconnect();
  }, []);

  const lightLogo =
    "https://cdn.prod.website-files.com/67865f11fa887f4b5ad6611a/67939d8b8a93192ceb8c26d0_LOGOTIPO_PREFEITURA_HORIZONTAL_FUNDO_CLARO-p-1080.png";

  const darkLogo = "/Fundo=Escuro.svg";

  const menuItems = [
    { label: "Início", href: "/" },
    { label: "Mapa", href: "https://mapa.urbis.sampa.br" },
    { label: "Viabiliza", href: "https://viabiliza.urbis.sampa.br" },
    { label: "Dados Abertos", href: "https://dadosabertos.urbis.sampa.br" },
    { label: "Doc. técnica", href: "/doc-tecnica" },
    { label: "+Info", href: "/info-urbis" },
    { label: "Data Lake", href: "https://datalake.urbis.sampa.br/" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-foreground">
      <ScrollToTop />

      <UrbisHeader
        logoSrc={isDark ? darkLogo : lightLogo}
        logoAlt="Prefeitura de São Paulo"
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

            <ModeToggle />
          </div>
        }
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
