import { SidebarInset, SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import { UrbisHeader } from "@open-urbis/map-ui";
import { AppSidebar } from "./app-sidebar";

interface LegisLayoutProps {
  children: React.ReactNode;
}

export function LegisLayout({ children }: LegisLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="h-6 w-px bg-border mx-2 hidden md:block" />
              <UrbisHeader />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
