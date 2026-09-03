"use client";

import React from "react";
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
import { cn } from "../lib/utils";
import { UrbisSettings, UrbisSettingsProps } from "./urbis-settings";
import { UrbisLogo } from "./urbis-logo";
import { Home, User } from "lucide-react";

interface UrbisHeaderProps extends UrbisSettingsProps {
  logoSrc?: string;
  logoAlt?: string;
  logoHref?: string;
  badgeText?: string | null;
  menuItems?: { label: string; href: string; active?: boolean }[];
  user?: {
    name?: string;
    socialName?: string;
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
  showLogin?: boolean; // <- controla se "Entrar" aparece quando não autenticado
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
  extraSettingsContent,
}: UrbisHeaderProps) => {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  const displayName =
    user?.socialName || user?.name || user?.email || "Usuário";

  const initials =
    (user?.socialName || user?.name || user?.email || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U";

  return (
    <header className="sticky top-0 z-[var(--urbis-z-app-header,10140)] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-2 sm:px-3 lg:px-4 w-full overflow-visible">
        {/* LEFT SLOT */}
        <div className="mr-1 flex items-center shrink-0 sm:mr-2">
          {leftSlot}
        </div>

        {/* LOGO */}
        <div className="mr-2 flex min-w-0 items-center shrink-0 lg:mr-4">
          <a
            className="mr-2 flex min-w-0 items-center space-x-2 sm:mr-3 lg:mr-6"
            href={logoHref}
          >
            <UrbisLogo alt={logoAlt} src={logoSrc} />

            {badgeText ? (
              <span className="hidden sm:inline-flex min-w-0 items-center gap-2 text-muted-foreground text-sm font-semibold">
                <span className="opacity-40" aria-hidden="true">
                  •
                </span>

                <span className="inline-flex max-w-[92px] items-center gap-2 truncate whitespace-nowrap lg:max-w-none">
                  {badgeText === "Mosaico" && (
                    <Home className="h-4 w-4" aria-hidden="true" />
                  )}
                  {badgeText}
                </span>
              </span>
            ) : null}
          </a>
        </div>

        {/* MENU DESKTOP */}
        <div className="hidden origin-left items-center gap-1 shrink-0 opacity-0 transition-all duration-200 ease-out lg:flex lg:gap-2 lg:opacity-100">
          <NavigationMenu>
            <NavigationMenuList>
              {menuItems.map((item) => (
                <NavigationMenuItem key={item.label}>
                  <NavigationMenuLink
                    href={item.href}
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "rounded-full border border-input h-8 px-3 bg-transparent hover:bg-accent xl:px-4",
                      item.active && "bg-accent text-accent-foreground",
                    )}
                  >
                    <span className="inline-flex items-center gap-2">
                      {item.label === "Mosaico" && badgeText === "Mosaico" && (
                        <Home className="h-4 w-4" aria-hidden="true" />
                      )}
                      {item.label}
                    </span>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex flex-1 min-w-0 items-center justify-end gap-1 sm:gap-2">
          {/* MENU MOBILE */}
          {showMobileMenu && (
            <div className="shrink-0 lg:hidden">
              {onMobileMenuClick ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="border border-input shrink-0"
                  onClick={onMobileMenuClick}
                >
                  Menu
                </Button>
              ) : (
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="border border-input shrink-0"
                    >
                      Menu
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
                          className="text-lg font-medium hover:text-primary transition-colors"
                        >
                          <span className="inline-flex items-center gap-2">
                            {item.label === "Mosaico" &&
                              badgeText === "Mosaico" && (
                                <Home className="h-5 w-5" aria-hidden="true" />
                              )}
                            {item.label}
                          </span>
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

          {/* SETTINGS */}
          <div className="shrink-0">
            <UrbisSettings
              theme={theme}
              setTheme={setTheme}
              extraSettingsContent={extraSettingsContent}
            />
          </div>

          {/* RIGHT SLOT */}
          {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}

          {/* AUTH — ÚLTIMO DA DIREITA */}
          {isAuthenticated ? (
            <div className="relative shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-full h-9 px-2 shrink-0 sm:px-3"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-label="Abrir menu do usuário"
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white text-[10px] font-bold">
                  {initials}
                </span>

                <span className="hidden lg:inline text-sm font-medium max-w-[120px] truncate xl:max-w-[140px]">
                  {displayName}
                </span>
              </Button>

              {userMenuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-[var(--urbis-z-app-panel,10080)] cursor-default"
                    onClick={() => setUserMenuOpen(false)}
                    aria-label="Fechar menu do usuário"
                  />

                  <div
                    className="absolute right-0 z-[var(--urbis-z-app-menu,10130)] mt-2 w-72 overflow-hidden rounded-xl border bg-background shadow-lg"
                    role="menu"
                  >
                    <div className="p-3 border-b">
                      <div className="text-sm font-semibold leading-tight">
                        {displayName}
                      </div>
                      {user?.email ? (
                        <div className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </div>
                      ) : null}
                    </div>

                    <div className="p-1">
                      <a
                        href="https://conta.urbis.prefeitura.sp.gov.br"
                        className="flex w-full items-center rounded-lg px-3 py-2 text-sm hover:bg-accent"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Minha conta
                      </a>

                      <button
                        type="button"
                        className="flex w-full items-center rounded-lg px-3 py-2 text-sm hover:bg-accent"
                        role="menuitem"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onLogout?.();
                        }}
                      >
                        Sair
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : showLogin ? (
            <>
              {/* DESKTOP */}
              <Button
                variant="outline"
                size="sm"
                onClick={onLogin}
                className="gap-2 hidden lg:flex items-center shrink-0 h-9 rounded-full px-4"
                aria-label="Entrar"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                Entrar
              </Button>

              {/* MOBILE */}
              <Button
                variant="outline"
                size="icon"
                onClick={onLogin}
                className="lg:hidden shrink-0 h-9 w-9 rounded-full"
                aria-label="Entrar"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Entrar</span>
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
};
