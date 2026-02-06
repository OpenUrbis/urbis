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
import { UrbisSettings, UrbisSettingsProps } from "./urbis-settings";
import { UrbisLogo } from "./urbis-logo";
import { User } from "lucide-react";

/* ================== helpers omitidos para foco ================== */

interface UrbisHeaderProps extends UrbisSettingsProps {
  logoSrc?: string;
  logoAlt?: string;
  logoHref?: string;
  badgeText?: string | null;
  menuItems?: { label: string; href: string; active?: boolean }[];
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
    sessionExpiresAt?: Date | number;
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
  badgeText = "",
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
        <div className="mr-2 flex items-center">{leftSlot}</div>

        {/* LOGO */}
        <div className="mr-4 flex items-center">
          <a className="mr-6 flex items-center space-x-2" href={logoHref}>
            <UrbisLogo alt={logoAlt} src={logoSrc} />

            {badgeText ? (
              <span className="hidden sm:inline-flex items-center gap-2 text-muted-foreground text-sm font-semibold">
                <span className="opacity-40">•</span>
                <span className="whitespace-nowrap">{badgeText}</span>
              </span>
            ) : null}
          </a>
        </div>

        {/* MENU DESKTOP */}
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
          <UrbisSettings theme={theme} setTheme={setTheme} />
          {rightSlot}

          {/* ================== AUTH ================== */}
          {isAuthenticated ? (
            /* avatar dropdown – inalterado */
            <span />
          ) : showLogin ? (
            <>
              {/* DESKTOP */}
              <Button
                variant="outline"
                size="sm"
                onClick={onLogin}
                className="gap-2 hidden md:inline-flex"
                aria-label="Entrar"
              >
                <User className="h-4 w-4" />
                Entrar
              </Button>

              {/* MOBILE / COLAPSADO */}
              <Button
                variant="outline"
                size="icon"
                onClick={onLogin}
                className="inline-flex md:hidden"
                aria-label="Entrar"
              >
                <User className="h-4 w-4" />
              </Button>
            </>
          ) : null}

          {/* ================== MENU MOBILE ================== */}
          {showMobileMenu && (
            <div className="md:hidden">
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Menu
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Menu</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4 flex flex-col gap-4">
                    {menuItems.map((item) => (
                      <a key={item.label} href={item.href} className="text-lg font-medium">
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
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
