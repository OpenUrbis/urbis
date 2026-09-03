"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Sidebar } from "./sidebar"; // 👈 ajusta o caminho se seu Sidebar estiver em outro lugar

type SidebarContextValue = {
  openSidebar: (content: ReactNode, title?: ReactNode) => void;
  closeSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | undefined>(
  undefined,
);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [content, setContent] = React.useState<ReactNode>(null);
  const [title, setTitle] = React.useState<ReactNode>("Ajuda");

  const openSidebar = (node: ReactNode, newTitle?: ReactNode) => {
    setContent(node);
    if (newTitle !== undefined) {
      setTitle(newTitle);
    }
    setIsOpen(true);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const value: SidebarContextValue = {
    openSidebar,
    closeSidebar,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}

      {/* 👇 AQUI é onde o Sidebar GLOBAL é desenhado */}
      <Sidebar open={isOpen} onClose={closeSidebar} title={title}>
        {content}
      </Sidebar>
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return ctx;
}
