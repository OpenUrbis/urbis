"use client";

import { UrbisHeader } from "@open-urbis/map-ui";
import { ComponentProps } from "react";

export function UrbisHeaderWrapper(props: ComponentProps<typeof UrbisHeader>) {
  return (
    <UrbisHeader
      {...props}
      showLogin={false}
      onMobileMenuClick={() => {
        window.dispatchEvent(new CustomEvent('urbis:toggle-sidebar'));
      }}
    />
  );
}
