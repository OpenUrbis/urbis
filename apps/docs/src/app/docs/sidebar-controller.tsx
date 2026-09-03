"use client";

import { useSidebar } from "fumadocs-ui/components/sidebar/base";
import { useEffect } from "react";

export function SidebarController() {
  const { setOpen } = useSidebar();

  useEffect(() => {
    const handleToggle = () => setOpen((prev) => !prev);
    window.addEventListener("urbis:toggle-sidebar", handleToggle);
    return () =>
      window.removeEventListener("urbis:toggle-sidebar", handleToggle);
  }, [setOpen]);

  return null;
}
