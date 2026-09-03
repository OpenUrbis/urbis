"use client";

import { AlertCircle, Check, Code2, Copy, Eye } from "lucide-react";
import { useTheme } from "next-themes";
import {
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";

export interface MermaidProps extends HTMLAttributes<HTMLDivElement> {
  chart?: string;
  children?: ReactNode;
}

export function Mermaid({
  chart,
  children,
  className,
  ...props
}: MermaidProps) {
  const rawChart =
    typeof chart === "string"
      ? chart
      : typeof children === "string"
        ? children
        : "";
  const cleanChart = rawChart.trim();
  const rawId = useId();
  const id = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const { resolvedTheme } = useTheme();
  const [svgHtml, setSvgHtml] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = useCallback(() => {
    if (!cleanChart) return;
    navigator.clipboard.writeText(cleanChart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [cleanChart]);

  useEffect(() => {
    if (!cleanChart || !mounted) return;

    let isCancelled = false;

    async function renderChart() {
      try {
        setError(null);
        const mermaid = (await import("mermaid")).default;
        const isDark = resolvedTheme === "dark";

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          fontFamily: "var(--font-sans, Inter, system-ui, -apple-system, sans-serif)",
          theme: "base",
          themeVariables: isDark
            ? {
                darkMode: true,
                background: "transparent",
                mainBkg: "#0f172a",
                primaryColor: "#1e293b",
                primaryTextColor: "#f8fafc",
                primaryBorderColor: "#3b82f6",
                nodeBorder: "#3b82f6",
                nodeTextColor: "#f8fafc",
                lineColor: "#60a5fa",
                secondaryColor: "#1e293b",
                tertiaryColor: "#020817",
                clusterBkg: "#0f172a80",
                clusterBorder: "#334155",
                titleColor: "#93c5fd",
                edgeLabelBackground: "#0f172a",
                textColor: "#f8fafc",
                actorTextColor: "#f8fafc",
                actorBkg: "#1e293b",
                actorBorder: "#3b82f6",
                signalColor: "#60a5fa",
                signalTextColor: "#f8fafc",
                labelBoxBkgColor: "#1e293b",
                labelBoxBorderColor: "#3b82f6",
                labelTextColor: "#f8fafc",
                loopTextColor: "#f8fafc",
                noteBorderColor: "#3b82f6",
                noteBkgColor: "#1e293b",
                noteTextColor: "#f8fafc",
                fontSize: "13px",
              }
            : {
                darkMode: false,
                background: "transparent",
                mainBkg: "#ffffff",
                primaryColor: "#f0f9ff",
                primaryTextColor: "#0f172a",
                primaryBorderColor: "#2563eb",
                nodeBorder: "#3b82f6",
                nodeTextColor: "#0f172a",
                lineColor: "#2563eb",
                secondaryColor: "#f8fafc",
                tertiaryColor: "#ffffff",
                clusterBkg: "#f8fafc",
                clusterBorder: "#cbd5e1",
                titleColor: "#1e40af",
                edgeLabelBackground: "#ffffff",
                textColor: "#0f172a",
                actorTextColor: "#0f172a",
                actorBkg: "#f0f9ff",
                actorBorder: "#2563eb",
                signalColor: "#2563eb",
                signalTextColor: "#0f172a",
                labelBoxBkgColor: "#f0f9ff",
                labelBoxBorderColor: "#2563eb",
                labelTextColor: "#0f172a",
                loopTextColor: "#0f172a",
                noteBorderColor: "#2563eb",
                noteBkgColor: "#f0f9ff",
                noteTextColor: "#0f172a",
                fontSize: "13px",
              },
          flowchart: {
            htmlLabels: true,
            curve: "basis",
            padding: 16,
            nodeSpacing: 45,
            rankSpacing: 45,
          },
        });

        const renderId = `${id}-${Date.now()}`;
        const { svg } = await mermaid.render(renderId, cleanChart);

        if (!isCancelled) {
          const cleanSvg = svg
            .replace(/<svg\s+id="[^"]*"/, `<svg id="${id}"`)
            .replace(
              /style="max-width:[^"]*;"/,
              'style="max-width: 100%; height: auto;"',
            );
          setSvgHtml(cleanSvg);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Mermaid render error:", err);
          setError(err?.message || "Erro ao renderizar diagrama Mermaid");
        }
      }
    }

    renderChart();

    return () => {
      isCancelled = true;
    };
  }, [cleanChart, resolvedTheme, mounted, id]);

  return (
    <figure
      className={cn(
        "my-6 overflow-hidden rounded-xl border border-fd-border bg-fd-card shadow-sm transition-all",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between border-b border-fd-border bg-fd-muted/50 px-4 py-2 text-xs text-fd-muted-foreground">
        <span className="flex items-center gap-1.5 font-medium">
          <Eye className="size-3.5 text-fd-primary" /> Diagrama
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowSource((prev) => !prev)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-fd-accent hover:text-fd-accent-foreground transition-colors cursor-pointer"
            title={showSource ? "Ver Diagrama" : "Ver Código Fonte"}
          >
            {showSource ? (
              <>
                <Eye className="size-3.5" />
                <span>Visualizar</span>
              </>
            ) : (
              <>
                <Code2 className="size-3.5" />
                <span>Código</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-fd-accent hover:text-fd-accent-foreground transition-colors cursor-pointer"
            title="Copiar código Mermaid"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-green-500" />
                <span className="text-green-500">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        {showSource ? (
          <pre className="text-xs font-mono text-fd-foreground bg-fd-muted/30 p-3 rounded-lg overflow-x-auto">
            <code>{cleanChart}</code>
          </pre>
        ) : error ? (
          <div className="flex flex-col gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="size-4 shrink-0" />
              <span>Falha na renderização do diagrama</span>
            </div>
            <p className="font-mono text-[11px] opacity-90">{error}</p>
            <details className="mt-2 text-fd-muted-foreground">
              <summary className="cursor-pointer hover:underline">
                Ver código fonte do diagrama
              </summary>
              <pre className="mt-2 p-2 bg-fd-muted rounded text-[11px] font-mono text-fd-foreground">
                {cleanChart}
              </pre>
            </details>
          </div>
        ) : svgHtml ? (
          <div
            ref={containerRef}
            className="mermaid-wrapper flex justify-center items-center py-4 w-full transition-all overflow-x-auto"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Sanitized SVG output from Mermaid library
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        ) : (
          <div className="flex items-center justify-center py-8 text-xs text-fd-muted-foreground animate-pulse">
            <span>Carregando diagrama...</span>
          </div>
        )}
      </div>
    </figure>
  );
}
