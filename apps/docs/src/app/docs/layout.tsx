import { SidebarProvider } from "@open-urbis/map-ui";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";
import { DocsHeaderClient } from "./docs-header.client";
import { SidebarController } from "./sidebar-controller";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex flex-col w-full min-h-screen">
        <DocsHeaderClient />

        <div className="flex-1">
          <DocsLayout tree={source.pageTree} {...baseOptions()}>
            <SidebarController />
            {children}
          </DocsLayout>
        </div>
      </div>
    </SidebarProvider>
  );
}
