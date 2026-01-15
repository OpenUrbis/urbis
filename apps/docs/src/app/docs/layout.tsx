import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";
import { UrbisHeaderWrapper } from "./urbis-header-wrapper";
import { SidebarController } from "./sidebar-controller";
import { UrbisFooter } from "@open-urbis/map-ui";

export default function Layout({ children }: { children: ReactNode }) {
  const menuItems = [
    { label: "Mosaico", href: "https://urbis.prefeitura.sp.gov.br" },
    { label: "Mapa", href: "https://mapa.urbis.prefeitura.sp.gov.br" },
    { label: "Dados Abertos", href: "https://dadosabertos.urbis.prefeitura.sp.gov.br" },
    { label: "Legis", href: "https://docs.urbis.prefeitura.sp.gov.br/docs/legis" },
    { label: "Viabiliza", href: "https://viabiliza.urbis.prefeitura.sp.gov.br/docs/legis" },
    { label: "Doc. técnica", href: "https://docs.urbis.prefeitura.sp.gov.br/", active: true },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen">
      <UrbisHeaderWrapper menuItems={menuItems} showMobileMenu={true} />
      <div className="flex-1">
        <DocsLayout
          tree={source.pageTree}
          {...baseOptions()}
          sidebar={{
            footer: <UrbisFooter className="pt-4 border-t mt-2" />,
          }}
        >
          <SidebarController />
          {children}
        </DocsLayout>
      </div>
    </div>
  );
}
