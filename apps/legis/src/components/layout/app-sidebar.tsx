import { 
    Sidebar, 
    SidebarContent, 
    SidebarGroup, 
    SidebarGroupContent, 
    SidebarMenu, 
    SidebarMenuButton, 
    SidebarMenuItem, 
    SidebarRail,
} from "../ui/sidebar";
import { BookOpen, Home, Settings, Search, Files } from "lucide-react";
import { cn } from "@open-urbis/map-ui";
import { useSignals } from "@preact/signals-react/runtime";
import { useLocation, Link } from "wouter";

const activityItems = [
  {
    title: "Explorador",
    icon: Files,
    action: () => console.log("Open Explorer"), // Mock
    isActive: true,
  },
  {
    title: "Pesquisa",
    icon: Search,
    url: "/search",
  },
  {
    title: "Conceitos",
    icon: BookOpen,
    url: "/concepts",
  },
];

const bottomItems = [
    {
        title: "Configurações",
        icon: Settings,
        url: "/settings",
    }
]

import { Plus } from "lucide-react";
import { Button } from "@open-urbis/map-ui";

export function AppSidebar({ className }: { className?: string }) {
  useSignals();
  const [location] = useLocation();

  return (
    <Sidebar collapsible="none" className={cn("border-r bg-muted/30 w-[60px] flex flex-col items-center py-4 gap-4", className)}>
        {/* CTA for New Norm */}
        <div className="mb-2">
            <Button size="icon" className="rounded-full h-10 w-10 shadow-md bg-primary hover:bg-primary/90" title="Nova Norma">
                <Plus className="h-5 w-5" />
            </Button>
        </div>

      <SidebarContent className="flex flex-col items-center gap-2 w-full px-0 overflow-visible">
            {activityItems.map((item) => (
                <div key={item.title} className="w-full flex justify-center">
                    {item.url ? (
                        <Link href={item.url}>
                            <div className={cn(
                                "h-10 w-10 flex items-center justify-center rounded-md transition-colors hover:bg-background cursor-pointer",
                                (location === item.url || item.isActive) ? "text-foreground" : "text-muted-foreground"
                            )} title={item.title}>
                                <item.icon className="h-5 w-5" />
                            </div>
                        </Link>
                    ) : (
                        <div 
                            className={cn(
                                "h-10 w-10 flex items-center justify-center rounded-xl transition-all hover:bg-background/80 hover:shadow-sm cursor-pointer relative group",
                                item.isActive ? "text-primary bg-background shadow-sm" : "text-muted-foreground"
                            )} 
                            onClick={item.action}
                        >
                            <item.icon className="h-5 w-5" />
                            {/* Hover Label */}
                            <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                {item.title}
                            </div>
                        </div>
                    )}
                </div>
            ))}
      </SidebarContent>
      
      <div className="mt-auto w-full flex flex-col items-center gap-2 pb-2">
            {bottomItems.map((item) => (
                <Link key={item.title} href={item.url}>
                    <div className={cn(
                        "h-10 w-10 flex items-center justify-center rounded-md transition-colors hover:bg-background cursor-pointer text-muted-foreground"
                    )} title={item.title}>
                        <item.icon className="h-5 w-5" />
                    </div>
                </Link>
            ))}
      </div>
    </Sidebar>
  );
}
