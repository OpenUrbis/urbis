import "react";
import { cn } from "../lib/utils";

export function UrbisFooter({ className }: { className?: string }) {
  return (
    <div className={cn("text-[10px] text-center py-2 flex items-center justify-center flex-wrap gap-1", className)}>
      <span>Município de São Paulo</span>
      <span>©</span>
      <span className="underline">2025</span>
      <span className="mx-1">|</span>
      <span>©</span>
      <span className="underline">AGPL v3</span>
      <span>(software)</span>
      <span className="mx-1">|</span>
      <span className="font-sans text-xs" role="img" aria-label="info">ℹ</span>
      <span className="mx-1">|</span>
      <span className="underline">CC BY-SA 4.0</span>
      <span>(outros)</span>
    </div>
  );
}
