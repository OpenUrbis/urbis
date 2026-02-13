import { 
    Sidebar, 
    SidebarContent, 
    SidebarGroup, 
    SidebarGroupContent, 
    SidebarMenu, 
    SidebarMenuButton, 
    SidebarMenuItem, 
    SidebarFooter,
} from "../ui/sidebar";
import { Home, FileText, User } from "lucide-react";
import { useLocation, Link } from "wouter";
import { cn } from "@open-urbis/map-ui";
import { useAuth } from "@open-urbis/map-auth";

const menuItems = [
  {
    title: "Início",
    icon: Home,
    url: "/",
  },
  {
    title: "Páginas",
    icon: FileText,
    url: "/pages",
  }
];

export function AppSidebar({ className }: { className?: string }) {
  const [location] = useLocation();
  const auth = useAuth();
  const user = auth.user?.profile;
  // Attempt to find role in common claims or fallback
  const role = (user as any)?.role || (user as any)?.job_title || (user as any)?.position || "Membro";

  const isActive = (url: string) => {
    if (url === '/') return location === '/';
    return location.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon" className={cn("border-r", className)}>
      <SidebarContent>
        <SidebarGroup>
            <SidebarGroupContent>
                <SidebarMenu>
                    {menuItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                             <SidebarMenuButton 
                                asChild 
                                isActive={isActive(item.url)}
                                tooltip={item.title}
                             >
                                <Link href={item.url}>
                                    <item.icon />
                                    <span>{item.title}</span>
                                </Link>
                             </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton 
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                        <User className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{user?.name || "Usuário"}</span>
                        <span className="truncate text-xs">{role}</span>
                    </div>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
