import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";
import { SidebarController } from "./sidebar-controller";
import { UrbisHeaderWrapper } from "./urbis-header-wrapper";

// ✅ novo
import { buildUrbisNav } from "@open-urbis/map-ui";

export default function Layout({ children }: { children: ReactNode }) {
  // Docs = Doc. técnica
  const { menuItems, badgeText } = buildUrbisNav({
    isAuthenticated: false,
    currentApp: "docs", // ✅ força Doc. técnica
  });

  return (
    <div className="flex flex-col w-full min-h-screen">
      <UrbisHeaderWrapper
        menuItems={menuItems}
        badgeText={badgeText}   // ✅ “Doc. técnica” ao lado da logo
        showMobileMenu
      />

      <div className="flex-1">
        <DocsLayout tree={source.pageTree} {...baseOptions()}>
          <SidebarController />
          {children}
        </DocsLayout>
      </div>
    </div>
  );
}
