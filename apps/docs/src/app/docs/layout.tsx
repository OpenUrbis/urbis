import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";
import { SidebarController } from "./sidebar-controller";
import { UrbisHeaderWrapper } from "./urbis-header-wrapper";

export default function Layout({ children }: { children: ReactNode }) {
  const menuItems = [
    { label: "Mosaico", href: "https://urbis.sampa.br" },
    { label: "Mapa", href: "https://mapa.urbis.sampa.br" },
    {
      label: "Dados Abertos",
      href: "https://dadosabertos.urbis.sampa.br",
    },
    {
      label: "Legis",
      href: "https://docs.urbis.sampa.br/docs/legis",
    },
    {
      label: "Viabiliza",
      href: "https://viabiliza.urbis.sampa.br/docs/legis",
    },
    {
      label: "Doc. técnica",
      href: "https://docs.urbis.sampa.br/",
      active: true,
    },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen">
      <UrbisHeaderWrapper menuItems={menuItems} showMobileMenu />
      <div className="flex-1">
        <DocsLayout tree={source.pageTree} {...baseOptions()}>
          <SidebarController />
          {children}
        </DocsLayout>
      </div>
    </div>
  );
}
