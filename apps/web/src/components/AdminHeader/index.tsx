import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode; // Actions
  className?: string;
}

export const AdminHeader = ({ title, subtitle, children, className }: AdminHeaderProps) => {
  return (
    <div className={cn("flex items-center justify-between pb-6 border-b mb-6", className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  );
};
