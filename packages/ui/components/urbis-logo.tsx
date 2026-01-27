"use client";

import React from "react";
import { cn } from "../lib/utils";

interface UrbisLogoProps {
  className?: string;
  alt?: string;
  src?: string;
}

export const UrbisLogo = ({
  className,
  alt = "Prefeitura de São Paulo",
  src,
}: UrbisLogoProps) => {
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const root = window.document.documentElement;
    
    const updateTheme = () => {
      const isDarkClass = root.classList.contains("dark");
      setResolvedTheme(isDarkClass ? "dark" : "light");
    };

    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    updateTheme();

    return () => observer.disconnect();
  }, []);

  const lightLogo = "/logo.png";
  const darkLogo = "/Fundo=Escuro.svg";

  const isDark = resolvedTheme === "dark";

  return (
    <img
      src={src || (isDark ? darkLogo : lightLogo)}
      alt={alt}
      className={cn("h-8 w-auto object-contain", className)}
      width="104"
      height="32"
    />
  );
};
