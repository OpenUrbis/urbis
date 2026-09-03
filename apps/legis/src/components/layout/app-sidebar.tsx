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
import { useAuth, userProfile } from "@open-urbis/map-auth";
import { useEffect, useState } from "react";
import { effect } from "@preact/signals";

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
  },
];

export function AppSidebar({ className }: { className?: string }) {
  const [location] = useLocation();
  const auth = useAuth();
  const [profile, setProfile] = useState(userProfile.value);

  useEffect(() => {
    const dispose = effect(() => {
      setProfile(userProfile.value);
    });
    return () => dispose();
  }, []);

  const user = profile || auth.user?.profile;

  // Extract role name
  // 1. Check userRoleAssignments from API profile
  const apiRoles = (profile as any)?.userRoleAssignments
    ?.map((a: any) => a?.role?.name)
    .filter(Boolean);
  // 2. Check OIDC claims
  const oidcRole =
    (user as any)?.role || (user as any)?.job_title || (user as any)?.position;

  const displayRole = apiRoles?.[0] || oidcRole || "Membro";

  const isActive = (url: string) => {
    if (url === "/") return location === "/";
    return location.startsWith(url);
  };

  return (
    <Sidebar
      collapsible="offcanvas"
      variant="floating"
      className={cn("border-r bg-background md:z-40", className)}
    >
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

      {auth.isAuthenticated ? (
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
                  <span className="truncate font-semibold">
                    {user?.name || "Usuário"}
                  </span>
                  <span className="truncate text-xs">{displayRole}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      ) : (
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                onClick={() => auth.signinRedirect()}
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <User className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Entrar</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Fazer login
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
