"use client";

import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "./ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "../lib/utils";
import React from "react";
import { CircleUser, Menu } from "lucide-react";
import { UrbisSettings, UrbisSettingsProps } from "./urbis-settings";

interface UrbisHeaderProps extends UrbisSettingsProps {
  logoSrc?: string;
  logoAlt?: string;
  logoHref?: string;
  badgeText?: string | null;
  menuItems?: { label: string; href: string; active?: boolean }[];
  user?: {
    name?: string;
    email?: string;
  };
  isAuthenticated?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  showMobileMenu?: boolean;
  showLogin?: boolean;
  onMobileMenuClick?: () => void;
}

export const UrbisHeader = ({
  logoSrc,
  logoAlt = "Urbis",
  logoHref = "/",
  badgeText = "DEMO",
  menuItems = [],
  user,
  isAuthenticated = false,
  onLogin,
  onLogout,
  leftSlot,
  rightSlot,
  showMobileMenu = true,
  showLogin = true,
  onMobileMenuClick,
  theme,
  setTheme,
}: UrbisHeaderProps) => {
  return (
    <header className="sticky top-0 z-[50] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 w-full">
        <div className="mr-2 flex items-center">
          {leftSlot}
        </div>
        {/* Logo */}
        <div className="mr-4 flex items-center">
          <a className="mr-6 flex items-center space-x-2" href={logoHref}>
            <img
              className="urbis-logo h-6 w-auto object-contain"
              alt={logoAlt}
              src="https://urbis.sampa.br/assets/images/logo.webp"
              style={logoSrc ? ({ '--app-logo': `url('${logoSrc}')` } as React.CSSProperties) : undefined}
            />
            {badgeText && (
              <span className="hidden font-bold sm:inline-block text-muted-foreground text-sm">
                {badgeText}
              </span>
            )}
          </a>
        </div>

        {/* Desktop Menu - NavigationMenu */}
        <div className="hidden md:flex items-center gap-2">
          <NavigationMenu>
            <NavigationMenuList>
              {menuItems.map((item) => (
                <NavigationMenuItem key={item.label}>
                  <NavigationMenuLink
                    href={item.href}
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "rounded-full border border-input h-8 px-4 bg-transparent hover:bg-accent",
                      item.active && "bg-accent text-accent-foreground"
                    )}
                  >
                    {item.label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="flex items-center gap-2">
             {/* Right Slot for Debugger, ModeToggle etc */}
             <UrbisSettings theme={theme} setTheme={setTheme} />
             {rightSlot}

             {/* User Menu */}
             {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full border">
                       <CircleUser className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name || "Usuário"}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout}>
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
             ) : showLogin ? (
                <Button variant="outline" size="sm" onClick={onLogin}>
                  Entrar
                </Button>
             ) : null}
             
             {/* Mobile Menu Drawer */}
             {showMobileMenu && (
               <div className="md:hidden">
                 {onMobileMenuClick ? (
                   <Button variant="ghost" size="icon" onClick={onMobileMenuClick}>
                     <Menu className="h-5 w-5" />
                     <span className="sr-only">Toggle Menu</span>
                   </Button>
                 ) : (
                   <Drawer>
                     <DrawerTrigger asChild>
                       <Button variant="ghost" size="icon">
                         <Menu className="h-5 w-5" />
                         <span className="sr-only">Toggle Menu</span>
                       </Button>
                     </DrawerTrigger>
                     <DrawerContent>
                       <DrawerHeader>
                         <DrawerTitle>Menu</DrawerTitle>
                       </DrawerHeader>
                       <div className="p-4 flex flex-col gap-4">
                       {menuItems.map((item) => (
                         <a
                           key={item.label}
                           href={item.href}
                           className={cn(
                             "text-lg font-medium hover:text-primary transition-colors",
                             item.active && "text-primary"
                           )}
                         >
                           {item.label}
                         </a>
                       ))}
                       </div>
                       <DrawerFooter>
                         <DrawerClose asChild>
                           <Button variant="outline">Fechar</Button>
                         </DrawerClose>
                       </DrawerFooter>
                     </DrawerContent>
                   </Drawer>
                 )}
               </div>
             )}
          </div>
        </div>
      </div>
    </header>
  );
};
