"use client";

import { UrbisHeader } from "@open-urbis/map-ui";
import { useTheme } from "next-themes";
import type { ComponentProps } from "react";

export function UrbisHeaderWrapper(props: ComponentProps<typeof UrbisHeader>) {
  const { theme, setTheme } = useTheme();

  const onLogin = () => {
    location.href = "https://conta.urbis.sampa.br/";
  };

  return (
    <UrbisHeader
      {...props}
      theme={theme}
      setTheme={setTheme}
      showLogin={true}
      onLogin={onLogin}
      showMobileMenu={true}
      onMobileMenuClick={() => {
        window.dispatchEvent(new CustomEvent("urbis:toggle-sidebar"));
      }}
    />
  );
}
