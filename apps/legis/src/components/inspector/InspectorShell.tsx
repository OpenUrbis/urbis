import React from "react";
import { Button, cn } from "@open-urbis/map-ui";
import { ChevronLeft, PanelRightClose, PanelRightOpen } from "lucide-react";
import {
  INSPECTOR_COLLAPSED_WIDTH,
  INSPECTOR_WIDTH,
  ui,
  type InspectorMode,
} from "./inspector-tokens";

interface InspectorShellProps {
  mode: InspectorMode;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Icons shown on the collapsed rail. */
  rail?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Outer frame of the inspector. Owns the width, which animates per mode so that
 * marking passages or picking a link gets room without opening a dialog.
 */
export function InspectorShell({
  mode,
  collapsed = false,
  onToggleCollapse,
  rail,
  children,
}: InspectorShellProps) {
  if (collapsed) {
    return (
      <div
        className={cn(
          ui.frame,
          INSPECTOR_COLLAPSED_WIDTH,
          "items-center gap-1 py-1",
        )}
        data-inspector-collapsed="true"
      >
        <Button
          variant="ghost"
          size="sm"
          className={ui.iconButton}
          onClick={onToggleCollapse}
          title="Expandir painel"
          aria-label="Expandir painel"
        >
          <PanelRightOpen className="h-3.5 w-3.5" />
        </Button>
        {rail}
      </div>
    );
  }

  return (
    <div
      className={cn(ui.frame, INSPECTOR_WIDTH[mode])}
      data-inspector-mode={mode}
    >
      {children}
    </div>
  );
}

interface InspectorViewProps {
  title: string;
  /** Short context shown next to the title, e.g. the element reference. */
  subtitle?: string;
  /** Renders the back affordance; omit for root views. */
  onBack?: () => void;
  backLabel?: string;
  actions?: React.ReactNode;
  onToggleCollapse?: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/** A single step inside the inspector: one-line header, scrolling body, footer. */
export function InspectorView({
  title,
  subtitle,
  onBack,
  backLabel = "Voltar",
  actions,
  onToggleCollapse,
  footer,
  children,
}: InspectorViewProps) {
  return (
    <>
      <div className={ui.header}>
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            className={ui.iconButton}
            onClick={onBack}
            title={backLabel}
            aria-label={backLabel}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
        )}
        <span
          className={ui.headerTitle}
          title={subtitle ? `${title} · ${subtitle}` : title}
        >
          {title}
          {subtitle && (
            <span className={cn(ui.headerSubtitle, "ml-1")}>{subtitle}</span>
          )}
        </span>
        {actions}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            className={ui.iconButton}
            onClick={onToggleCollapse}
            title="Recolher painel"
            aria-label="Recolher painel"
          >
            <PanelRightClose className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className={ui.body}>{children}</div>

      {footer && <div className={ui.footer}>{footer}</div>}
    </>
  );
}

export function InspectorSection({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(ui.section, className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-1">
          {title && <span className={ui.sectionTitle}>{title}</span>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function InspectorField({
  label,
  hint,
  action,
  children,
}: {
  label: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={ui.field}>
      <div className="flex items-center justify-between gap-1">
        <span className={cn(ui.label, "block")}>{label}</span>
        {action}
      </div>
      {children}
      {hint && <p className={ui.hint}>{hint}</p>}
    </div>
  );
}

export function InspectorEmpty({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={ui.emptyState}>
      {icon && <span className="opacity-30">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}
