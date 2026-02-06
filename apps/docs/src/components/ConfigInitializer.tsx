"use client";

import { setUrbisConfig } from "@open-urbis/map-ui";
import { useEffect } from "react";

export function ConfigInitializer() {
  useEffect(() => {
    setUrbisConfig({
      apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    });
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "logout") {
        sessionStorage.clear();
        window.location.href = "/";
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return null;
}
