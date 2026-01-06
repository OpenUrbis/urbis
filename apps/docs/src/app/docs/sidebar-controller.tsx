"use client";

import { useEffect } from "react";
import { useSidebar } from "fumadocs-ui/components/sidebar/base";

export function SidebarController() {
  const { setOpen } = useSidebar();

  useEffect(() => {
    const handleToggle = () => setOpen((prev) => !prev);
    window.addEventListener("urbis:toggle-sidebar", handleToggle);
    return () => window.removeEventListener("urbis:toggle-sidebar", handleToggle);
  }, [setOpen]);

  return null;
}
