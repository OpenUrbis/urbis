"use client";

import * as React from "react";
import { X, ChevronDown } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  side?: "right" | "left";
  maxWidthClassName?: string;
  faqItems?: FaqItem[];
}

export function Sidebar({
  open,
  onClose,
  title = "Ajuda",
  children,
  side = "right",
  maxWidthClassName = "max-w-[420px]",
  faqItems = [],
}: SidebarProps) {
  const closedTransform =
    side === "right"
      ? "translate-x-full right-0 border-l"
      : "-translate-x-full left-0 border-r";

  const openTransform =
    side === "right"
      ? "translate-x-0 right-0 border-l"
      : "translate-x-0 left-0 border-r";

  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={[
          "fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity duration-300",
          "z-[80]",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
      />

      {/* Painel lateral */}
      <aside
        className={[
          "fixed top-0 h-full w-full",
          maxWidthClassName,
          "bg-background text-foreground shadow-2xl",
          "transition-transform duration-300 ease-out",
          "z-[90]",
          open ? openTransform : closedTransform,
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        {/* HEADER */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md p-1.5
                       hover:bg-accent hover:text-accent-foreground
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                       focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Fechar painel lateral"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* BODY */}
        <div className="p-4 h-[calc(100vh-48px)] overflow-y-auto text-sm space-y-4">
          {/* FAQ */}
          {faqItems.length > 0 && (
            <div className="space-y-3">
              {faqItems.map((item, index) => {
                const isOpen = openIndex === index;

                return (
                  <div
                    key={index}
                    className="border border-border rounded-md bg-card text-card-foreground"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
                    >
                      <span className="text-xs font-medium">
                        {item.question}
                      </span>

                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          isOpen ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-3 pb-3 pt-1 text-xs text-muted-foreground">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* CHILDREN NORMAL */}
          {children}
        </div>
      </aside>
    </>
  );
}
