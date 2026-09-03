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
          <DocsLayout
            tree={source.pageTree}
            {...baseOptions()}
            sidebar={{
              defaultOpenLevel: 1,
              collapsible: true,
              footer: (
                <div className="px-2 py-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>Prefeitura de São Paulo</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted">
                    AGPL v3
                  </span>
                </div>
              ),
            }}
          >
            <SidebarController />
            {children}
          </DocsLayout>
        </div>
      </div>
    </SidebarProvider>
  );
}
