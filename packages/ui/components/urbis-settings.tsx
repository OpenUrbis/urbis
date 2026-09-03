"use client";

import * as React from "react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import {
  SettingsIcon,
  LightModeIcon,
  DarkModeIcon,
  MonitorIcon,
  AddIcon,
  RemoveIcon,
} from "./icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { cn } from "../lib/utils";

export interface UrbisSettingsProps {
  theme?: string;
  setTheme?: (theme: string) => void;
  extraSettingsContent?: React.ReactNode;
}

export function UrbisSettings({
  theme: externalTheme,
  setTheme: externalSetTheme,
  extraSettingsContent,
}: UrbisSettingsProps) {
  const [internalTheme, setInternalTheme] = React.useState<string>("system");

  const theme = externalTheme ?? internalTheme;

  // Font Size Logic
  const [fontSize, setFontSize] = React.useState(100);
  const [highContrast, setHighContrast] = React.useState(false);

  React.useEffect(() => {
    // Load font size
    const savedFontSize = localStorage.getItem("urbis-ui-font-size");
    if (savedFontSize) {
      setFontSize(parseInt(savedFontSize));
    }

    // Load high contrast
    const savedHighContrast = localStorage.getItem("urbis-ui-high-contrast");
    if (savedHighContrast) {
      setHighContrast(savedHighContrast === "true");
    }

    // Only apply default logic if no external theme is provided
    // OR if we are managing the theme internally (which matches the fallback)
    if (!externalTheme) {
      const savedTheme = localStorage.getItem("urbis-ui-theme");
      if (savedTheme) {
        setInternalTheme(savedTheme);
      }
    }
  }, [externalTheme]);

  React.useEffect(() => {
    if (externalTheme) return; // Managed externally by a provider

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    const activeTheme =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    root.classList.add(activeTheme);
  }, [theme, externalTheme]);

  const handleSetTheme = (newTheme: string) => {
    if (externalSetTheme) {
      externalSetTheme(newTheme);
    } else {
      setInternalTheme(newTheme);
      localStorage.setItem("urbis-ui-theme", newTheme);
    }
  };

  React.useEffect(() => {
    // Using percentage on html element
    document.documentElement.style.fontSize = `${fontSize}%`;
    localStorage.setItem("urbis-ui-font-size", fontSize.toString());
  }, [fontSize]);

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
    localStorage.setItem("urbis-ui-high-contrast", highContrast.toString());
  }, [highContrast]);

  const increaseFont = () => setFontSize((prev) => Math.min(prev + 5, 125));
  const decreaseFont = () => setFontSize((prev) => Math.max(prev - 5, 85));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9 rounded-full shrink-0"
        >
          <SettingsIcon />
          <span className="sr-only">Configurações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Acessibilidade</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-2 py-1.5">
          <div className="text-sm text-muted-foreground mb-2">Tema</div>
          <TooltipProvider>
            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex-1 h-8 px-0 hover:bg-accent hover:text-accent-foreground",
                      theme === "light" && "bg-background shadow-sm",
                    )}
                    onClick={() => handleSetTheme("light")}
                  >
                    <LightModeIcon className="h-[18px] w-[18px]" />
                    <span className="sr-only">Modo Claro</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Modo Claro</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex-1 h-8 px-0 hover:bg-accent hover:text-accent-foreground",
                      theme === "dark" && "bg-background shadow-sm",
                    )}
                    onClick={() => handleSetTheme("dark")}
                  >
                    <DarkModeIcon className="h-[18px] w-[18px]" />
                    <span className="sr-only">Modo Escuro</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Modo Escuro</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex-1 h-8 px-0 hover:bg-accent hover:text-accent-foreground",
                      theme === "system" && "bg-background shadow-sm",
                    )}
                    onClick={() => handleSetTheme("system")}
                  >
                    <MonitorIcon className="h-[18px] w-[18px]" />
                    <span className="sr-only">Padrão do Sistema</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Padrão do Sistema</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        <DropdownMenuSeparator />

        <div className="px-2 py-1.5">
          <div className="text-sm text-muted-foreground mb-2">
            Tamanho da fonte
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={decreaseFont}
              disabled={fontSize <= 85}
            >
              <RemoveIcon className="h-[18px] w-[18px]" />
            </Button>
            <span className="text-sm w-12 text-center font-medium">
              {fontSize}%
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={increaseFont}
              disabled={fontSize >= 125}
            >
              <AddIcon className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="px-2 py-1.5 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Alto contraste</div>
          <Switch checked={highContrast} onCheckedChange={setHighContrast} />
        </div>

        {extraSettingsContent ? (
          <>
            <DropdownMenuSeparator />
            {extraSettingsContent}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
