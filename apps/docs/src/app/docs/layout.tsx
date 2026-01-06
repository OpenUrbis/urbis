import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";
import { UrbisHeaderWrapper } from "./urbis-header-wrapper";
import { SidebarController } from "./sidebar-controller";

export default function Layout({ children }: { children: ReactNode }) {
  const menuItems = [
    { label: "Início", href: "/" },
    { label: "Mapa", href: "#" },
    { label: "Viabiliza", href: "#" },
    { label: "Dados Abertos", href: "#" },
    { label: "GitHub", href: "https://github.com/atlas-cli/monorepo" },
    { label: "Documentação", href: "/docs" },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen">
      <UrbisHeaderWrapper menuItems={menuItems} showMobileMenu={true} />
      <div className="flex-1">
        <DocsLayout tree={source.pageTree} {...baseOptions()}>
          <SidebarController />
          {children}
        </DocsLayout>
      </div>
    </div>
  );
}
