import { SidebarProvider } from "@open-urbis/map-ui";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DocsHeaderClient } from "../docs/docs-header.client";

export const metadata: Metadata = {
  title: "Urbis Docs • Central de Documentação Técnica",
  description:
    "Portal oficial de arquitetura, engenharia de dados, módulo legislativo e especificações da plataforma Urbis da Prefeitura de São Paulo.",
  other: {
    "dc:title": "Urbis",
    "dc:rights": "Copyright de 202x, Município de São Paulo",
    "dc:license": "https://creativecommons.org/licenses/by-sa/4.0/",
    "dc:source": "https://www.prefeitura.sp.gov.br",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex flex-col w-full min-h-screen">
        <DocsHeaderClient />
        <main className="flex-1">{children}</main>
      </div>
    </SidebarProvider>
  );
}
