"use client";

import { UrbisHeader } from "@open-urbis/map-ui";
import { useTheme } from "next-themes";
import type { ComponentProps } from "react";

export function UrbisHeaderWrapper(props: ComponentProps<typeof UrbisHeader>) {
  const { theme, setTheme } = useTheme();

  return (
    <UrbisHeader
      {...props}
      theme={theme}
      setTheme={setTheme}
      showLogin={false}
      onMobileMenuClick={() => {
        window.dispatchEvent(new CustomEvent("urbis:toggle-sidebar"));
      }}
    />
  );
}
