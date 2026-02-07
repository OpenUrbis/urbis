import { Outlet, useLocation } from "react-router-dom";
import { UrbisHeader } from "@open-urbis/map-ui/urbis-header";
import { ScrollToTop } from "./components/ScrollToTop";
import { useEffect, useMemo, useState } from "react";
import { HelpSidebarContent } from "@open-urbis/map-ui";

import { SidebarProvider, useSidebar } from "@open-urbis/map-ui";
import { Button } from "@open-urbis/map-ui/ui/button";
import { UrbisFooter } from "@open-urbis/map-ui";
import { userProfile } from "@open-urbis/map-auth";
import { useAuth } from "./hooks/useAuth";

type MenuItem = { label: string; href: string; active?: boolean };

function normalizePath(p: string) {
  if (!p) return "/";
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p;
}

function isInternalHref(href: string) {
  return href.startsWith("/");
}

function LayoutInner() {
  const [theme, setTheme] = useState<string>("system");
  const [_isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { openSidebar } = useSidebar();
  const location = useLocation();
  const auth = useAuth();
  const [user, setUser] = useState(userProfile.peek());

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") || "system";
    setTheme(savedTheme);

    // Subscribe to userProfile changes manually to ensure reactivity without babel transform (SSR safe)
    return userProfile.subscribe((v) => setUser(v));
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

  // ✅ base do menu (sem active)
  const baseMenuItems: MenuItem[] = useMemo(
    () => [
      { label: "Mosaico", href: "/" },
      { label: "Mapa", href: "https://mapa.urbis.prefeitura.sp.gov.br" },
      { label: "Viabiliza", href: "https://viabiliza.urbis.prefeitura.sp.gov.br" },
      { label: "Dados Abertos", href: "https://dadosabertos.urbis.prefeitura.sp.gov.br" },
      { label: "Doc. técnica", href: "/doc-tecnica" },
      { label: "Legis", href: "/info-urbis" }
    ],
    []
  );

  const currentPageLabel = useMemo(() => {
    const map: Record<string, string> = {
      "/": "Mosaico",
      "/doc-tecnica": "Documentação técnica",
      "/info-urbis": "Legis",
      "/licencas": "Licenças",
      "/carta-servicos": "Carta de Serviços",
      "/sobre": "Sobre",
    };

    return map[location.pathname] ?? "Urbis";
  }, [location.pathname]);

  // ✅ marca ativo (somente internos) e remove do menu
  const filteredMenuItems = useMemo(() => {
    const currentPath = normalizePath(location.pathname);

    const withActive = baseMenuItems.map((item) => {
      if (!isInternalHref(item.href)) return item;

      const itemPath = normalizePath(item.href);

      const active =
        currentPath === itemPath ||
        (itemPath !== "/" && currentPath.startsWith(itemPath + "/"));

      return { ...item, active };
    });

    return withActive.filter((i) => !i.active);
  }, [baseMenuItems, location.pathname]);

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-background font-sans text-foreground">
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-foreground">
      <ScrollToTop />

      <UrbisHeader
        logoAlt="Logotipo da Prefeitura de São Paulo"
        logoHref="https://www.prefeitura.sp.gov.br/"
        badgeText={currentPageLabel}
        menuItems={filteredMenuItems} // ✅ agora filtra o item atual
        isAuthenticated={auth.isAuthenticated}
        user={user ? { name: user.name, email: user.email } : undefined}
        onLogin={() => auth.signinRedirect()}
        onLogout={() => auth.signoutRedirect()}
        showLogin={true}
        rightSlot={
  <div className="flex items-center gap-2">
    {/* AJUDA — desktop */}
    <Button
      variant="outline"
      size="sm"
      onClick={() =>
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
          "Ajuda"
        )
      }
      className="hidden md:inline-flex h-9 rounded-full px-4"
      aria-label="Ajuda"
      title="Ajuda"
    >
      Ajuda
    </Button>

    {/* AJUDA — mobile (ícone ?) */}
    <Button
      variant="outline"
      size="icon"
      onClick={() =>
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
          "Ajuda"
        )
      }
      className="md:hidden inline-flex h-9 w-9 rounded-full"
      aria-label="Ajuda"
      title="Ajuda"
    >
      ?
    </Button>
  </div>
}
        theme={theme}
        setTheme={setTheme}
      />

      <main className="flex-1">
        <Outlet />
      </main>

      <UrbisFooter />
    </div>
  );
}

export default function Layout() {
  return (
    <SidebarProvider>
      <LayoutInner />
    </SidebarProvider>
  );
}
