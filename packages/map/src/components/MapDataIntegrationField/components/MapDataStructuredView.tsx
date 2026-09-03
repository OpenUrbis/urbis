import React from "react";
import {
  ChevronRight,
  Globe as GlobeIcon,
  MinusCircle as ValueNoneIcon,
  Database,
  Copy,
  Terminal,
} from "lucide-react";
import {
  cn,
  ScrollArea,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@open-urbis/map-ui";
import { unwrapDwgData } from "../utils/dwg-unwrap";

interface MapDataStructuredViewProps {
  data: any;
}

interface JsonNodeProps {
  label: string;
  value: any;
  path?: string;
  isRoot?: boolean;
  depth: number;
  stripeIndex?: number;
}

const CLICKABLE_ROW_CLASS = "rounded-lg border-transparent shadow-none";
const SKIP_VALUE = Symbol("SKIP_VALUE");

const HIDDEN_KEYS = new Set(["coordinates", "nome", "name", "s3_metadata"]);
const GENERIC_SINGLE_VALUE_KEYS = new Set([
  "area",
  "área",
  "valor",
  "value",
  "tipo",
  "numeracao",
  "numeração",
  "numero",
  "número",
  "identificacao",
  "identificação",
  "nome",
  "name",
]);

export function MapDataStructuredView({ data }: MapDataStructuredViewProps) {
  const rawData = React.useMemo(
    () => (data ? unwrapDwgData(data) : null),
    [data],
  );
  const principal = React.useMemo(
    () => sanitizeStructuredData(extractStructuredData(rawData)),
    [rawData],
  );

  if (!data) {
    return (
      <div className="p-10 text-center text-gray-400 dark:text-zinc-500 italic text-xs">
        Aguardando processamento...
      </div>
    );
  }

  if (!principal) {
    return (
      <div className="p-10 text-center text-gray-400 dark:text-zinc-500 italic text-xs">
        Sem parâmetros disponíveis.
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen min-h-0 w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.07),_transparent_34%),linear-gradient(to_bottom,_#f8fafc,_#ffffff)] font-sans text-sm transition-colors dark:bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.10),_transparent_24%),linear-gradient(to_bottom,_#020617,_#0f172a)]">
        <div className="shrink-0 bg-transparent px-4 py-3 transition-colors dark:bg-transparent">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition-colors dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20">
                <Database size={14} />
              </span>
              <h3 className="truncate text-sm font-semibold tracking-tight text-slate-950 transition-colors dark:text-slate-50">
                Ficha de parâmetros do Projeto
              </h3>
            </div>
            <p className="text-[11px] leading-4 text-slate-500 transition-colors dark:text-slate-300">
              Visualização técnica compacta para leitura de parâmetros
              urbanísticos, quadro de áreas e diagnóstico DWG.
            </p>
          </div>
        </div>

        <ScrollArea className="w-full h-screen min-h-0 flex-1">
          <div className="min-h-0 w-full px-3 pb-6 md:px-4">
            <JsonNode
              label="Diagnóstico"
              value={principal}
              path="root"
              isRoot
              depth={0}
              stripeIndex={0}
            />
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}

export function FeatureModalView({
  data,
  title,
}: {
  data: any;
  title?: string;
}) {
  const principal = React.useMemo(
    () =>
      sanitizeStructuredData(
        extractStructuredData(data ? unwrapDwgData(data) : null),
      ),
    [data],
  );

  if (!data || !principal) return null;

  return (
    <TooltipProvider>
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-transparent font-sans text-sm transition-colors">
        <ScrollArea className="flex-1 min-h-0 max-h-[60vh] overflow-x-hidden">
          <div className="min-h-0 overflow-x-hidden px-3 md:px-4">
            <JsonNode
              label={title || "Detalhes"}
              value={principal}
              path="root"
              isRoot
              depth={0}
              stripeIndex={0}
            />
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}

function JsonNode({
  label,
  value,
  path = "",
  isRoot = false,
  depth,
  stripeIndex = 0,
}: JsonNodeProps) {
  const [copied, setCopied] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(true);

  let rawLabel = label;
  let effectiveValue = value;
  let effectivePath = path;

  const hasNome =
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value.nome || value.name);

  const directValueKey = getValueKey(value);
  const directGeometryKey = getGeometryKey(value);
  const directRenderableEntries =
    value && typeof value === "object" && !Array.isArray(value)
      ? getRenderableEntries(value)
      : [];

  if (hasNome && directValueKey && directRenderableEntries.length === 1) {
    rawLabel = String(value.nome || value.name);
    effectiveValue = value[directValueKey];
    effectivePath = appendPath(path, directValueKey);
  } else if (
    hasNome &&
    directGeometryKey &&
    directRenderableEntries.length === 1
  ) {
    rawLabel = String(value.nome || value.name);
    effectiveValue = value[directGeometryKey];
    effectivePath = appendPath(path, directGeometryKey);
  } else if (hasNome && !isRoot) {
    rawLabel = String(value.nome || value.name);
  }

  const { formattedLabel: effectiveLabel, unit } =
    extractUnitAndFormatLabel(rawLabel);

  if (shouldHideScalarValue(effectiveValue)) {
    return null;
  }

  if (isGeometryValue(effectiveValue)) {
    const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(JSON.stringify(effectiveValue, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div
        className={cn(
          "group flex w-full min-w-0 items-center gap-3 px-3 py-2 transition-colors hover:!bg-sky-50 dark:hover:!bg-sky-950/40",
          getStripedRowClass(stripeIndex),
        )}
        style={getIndentStyle(depth)}
      >
        <div className="flex min-w-0 max-w-[58%] flex-1 items-center gap-2 overflow-hidden">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/90 text-sky-600 ring-1 ring-sky-100 dark:bg-slate-900 dark:text-sky-200 dark:ring-sky-500/20">
            <GlobeIcon size={14} />
          </span>

          <span className="truncate whitespace-nowrap text-[12px] font-medium tracking-tight text-slate-950 dark:text-white">
            {effectiveLabel}
          </span>
        </div>

        <div className="flex min-w-0 max-w-[42%] shrink items-center justify-end gap-1 overflow-hidden pl-2">
          <span
            className="max-w-full truncate whitespace-nowrap text-right text-[11px] font-semibold tracking-tight text-sky-700 dark:text-sky-200 md:text-[12px]"
            title={effectiveValue.type}
          >
            {effectiveValue.type}
          </span>
          <ParamInfo path={effectivePath} />
          <button
            onClick={handleCopy}
            type="button"
            aria-label="Copiar geometry"
            title="Copiar geometry"
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-xl border border-sky-200/80 bg-white/90 px-2 text-[11px] font-semibold text-sky-700 transition-colors hover:bg-sky-50 hover:text-sky-800 dark:border-sky-500/20 dark:bg-slate-900 dark:text-sky-200 dark:hover:bg-sky-950/40 dark:hover:text-sky-100"
          >
            <Copy size={12} />
            <span>{copied ? "copiado" : "copiar"}</span>
          </button>
        </div>
      </div>
    );
  }

  if (
    effectiveValue &&
    typeof effectiveValue === "object" &&
    !Array.isArray(effectiveValue)
  ) {
    const flattenedNode = flattenSingleEntryNode({
      label: effectiveLabel,
      value: effectiveValue,
      path: effectivePath,
      depth,
      isRoot,
      stripeIndex,
    });

    if (flattenedNode) return flattenedNode;
  }

  if (isPrimitiveValue(effectiveValue)) {
    const {
      value: displayValue,
      valueClassName,
      toneClassName,
    } = formatScalarValue(effectiveValue, unit, effectiveLabel);

    return (
      <div
        className={cn(
          "group flex w-full min-w-0 items-center gap-3 px-3 py-2 transition-colors",
          getStripedRowClass(stripeIndex),
          toneClassName,
        )}
        style={getIndentStyle(depth)}
      >
        <div className="flex min-w-0 max-w-[56%] flex-1 items-center gap-2 overflow-hidden">
          <span className="block max-w-full truncate whitespace-nowrap text-[11px] font-medium tracking-tight text-slate-950 dark:text-white md:text-[12px]">
            {effectiveLabel}
          </span>
          <ParamInfo path={effectivePath} />
        </div>

        <span
          className={cn(
            "block min-w-0 max-w-[44%] flex-1 shrink truncate overflow-hidden whitespace-nowrap pl-2 text-right text-[11px] font-semibold tracking-tight tabular-nums md:text-[12px]",
            valueClassName,
          )}
          title={displayValue}
        >
          {displayValue}
        </span>
      </div>
    );
  }

  const isArray = Array.isArray(effectiveValue);
  const entries = getRenderableEntries(effectiveValue);

  if (!isArray && entries.length === 0) {
    return null;
  }

  if (isArray && effectiveValue.length === 0) {
    return (
      <div
        className={cn(
          "flex w-full min-w-0 items-center gap-3 px-3 py-2 transition-colors",
          getStripedRowClass(stripeIndex),
        )}
        style={getIndentStyle(depth)}
      >
        <div className="flex min-w-0 max-w-[56%] flex-1 items-center gap-2 overflow-hidden">
          <ValueNoneIcon
            size={12}
            className="shrink-0 text-slate-400 dark:text-slate-500"
          />
          <span className="block max-w-full truncate whitespace-nowrap text-[11px] font-medium tracking-tight text-slate-950/70 dark:text-white/75 md:text-[12px]">
            {effectiveLabel}
          </span>
          <ParamInfo path={effectivePath} />
        </div>
        <span className="block min-w-0 max-w-[44%] flex-1 shrink truncate overflow-hidden whitespace-nowrap pl-2 text-right text-[11px] font-medium italic text-slate-950/60 dark:text-white/70 md:text-[12px]">
          vazio
        </span>
      </div>
    );
  }

  const children = isArray
    ? effectiveValue.map((item: any, idx: number) => (
        <JsonNode
          key={`${path}[${idx}]`}
          label={resolveArrayItemLabel(item, idx, effectiveLabel)}
          value={item}
          path={`${effectivePath}[${idx}]`}
          depth={depth + 1}
          stripeIndex={idx}
        />
      ))
    : entries.map(([key, itemValue], idx) => {
        const subLabel =
          itemValue?.nome && typeof itemValue.nome === "string"
            ? itemValue.nome
            : key;
        return (
          <JsonNode
            key={`${effectivePath}.${key}`}
            label={subLabel}
            value={itemValue}
            path={appendPath(effectivePath, key)}
            depth={depth + 1}
            stripeIndex={idx}
          />
        );
      });

  return (
    <div
      className="w-full min-w-0 overflow-hidden transition-colors"
      style={getIndentStyle(depth)}
    >
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={cn(
          "flex w-full items-center py-2 pl-3 pr-3 text-left text-slate-950 transition-colors dark:text-white",
          CLICKABLE_ROW_CLASS,
          getStripedRowClass(stripeIndex),
          isRoot
            ? "hover:!bg-slate-100/95 dark:hover:!bg-slate-800/90"
            : "hover:!bg-slate-100/95 dark:hover:!bg-slate-800/90",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <span className="ml-1 inline-flex h-5 w-5 shrink-0 items-center justify-center text-slate-950 transition-colors dark:text-white">
            <ChevronRight
              size={11}
              className={cn(
                "transition-transform duration-200",
                isOpen && "rotate-90",
              )}
            />
          </span>

          <div className="flex min-w-0 max-w-full flex-1 items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className="block max-w-full truncate whitespace-nowrap text-[11px] font-semibold tracking-tight text-slate-950 dark:text-white md:text-[12px]">
              {effectiveLabel}
            </span>
            <ParamInfo path={effectivePath} />
          </div>
        </div>
      </button>

      {isOpen && (
        <div className={cn("pt-1")}>
          <div className={cn("flex flex-col gap-1", !isRoot && "pl-2")}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

function getStripedRowClass(stripeIndex: number) {
  return stripeIndex % 2 === 0
    ? "bg-slate-100 ring-1 ring-inset ring-slate-200/70 dark:bg-slate-800 dark:ring-white/5"
    : "bg-slate-50 ring-1 ring-inset ring-slate-200/60 dark:bg-slate-900 dark:ring-white/[0.04]";
}

function getIndentStyle(depth: number) {
  if (depth <= 0) return undefined;

  return {
    paddingLeft: `${Math.min(depth * 8, 24)}px`,
  };
}

function extractStructuredData(rawData: any) {
  if (!rawData) return null;

  if (Array.isArray(rawData?.dados)) {
    if (rawData.dados.length === 1) {
      const entry = rawData.dados[0];
      return extractPreferredPayload(entry?.value ?? entry?.valor ?? entry);
    }

    return rawData.dados.reduce(
      (acc: Record<string, any>, entry: any, index: number) => {
        const label =
          entry?.nome ||
          entry?.name ||
          entry?.label ||
          entry?.titulo ||
          entry?.title ||
          `Item ${index + 1}`;

        const preferredKey = formatLabel(String(label));
        const nextKey =
          acc[preferredKey] === undefined
            ? preferredKey
            : `${preferredKey} ${index + 1}`;
        acc[nextKey] = extractPreferredPayload(
          entry?.value ?? entry?.valor ?? entry,
        );
        return acc;
      },
      {},
    );
  }

  return extractPreferredPayload(rawData);
}

function sanitizeStructuredData(value: any) {
  const sanitized = pruneInvisibleValue(value);
  return sanitized === SKIP_VALUE ? null : sanitized;
}

function pruneInvisibleValue(value: any): any {
  if (value === null || value === undefined) return SKIP_VALUE;

  if (typeof value === "string") {
    const normalized = value.trim();

    if (!normalized) return SKIP_VALUE;

    const comparable = normalizeComparableLabel(normalized);
    if (
      comparable === "n d" ||
      comparable === "nao disponivel" ||
      comparable === "nao informado"
    ) {
      return SKIP_VALUE;
    }

    return normalized;
  }

  if (typeof value === "number" || typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    const items = value
      .map((item) => pruneInvisibleValue(item))
      .filter((item) => item !== SKIP_VALUE);

    return items;
  }

  if (isGeometryValue(value)) return value;

  if (typeof value !== "object") return value;

  const sanitizedEntries = Object.entries(value).reduce<Record<string, any>>(
    (acc, [key, itemValue]) => {
      const nextValue = pruneInvisibleValue(itemValue);
      if (nextValue !== SKIP_VALUE) {
        acc[key] = nextValue;
      }
      return acc;
    },
    {},
  );

  if (getRenderableEntries(sanitizedEntries).length === 0) {
    return SKIP_VALUE;
  }

  return sanitizedEntries;
}

function extractPreferredPayload(value: any): any {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  if (isPureValueWrapper(value))
    return value.valor !== undefined ? value.valor : value.value;
  return value;
}

function isPureValueWrapper(value: any): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const keys = Object.keys(value);
  const allowedKeys = new Set(["name", "nome", "value", "valor"]);

  return (
    keys.length > 0 &&
    keys.every((key) => allowedKeys.has(key)) &&
    ("value" in value || "valor" in value)
  );
}

function appendPath(basePath: string, key: string) {
  if (!basePath) return key;
  if (basePath === "root") return `root.${key}`;
  return `${basePath}.${key}`;
}

function getValueKey(value: any): "valor" | "value" | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (value.valor !== undefined) return "valor";
  if (value.value !== undefined) return "value";
  return null;
}

function getGeometryKey(value: any): "geometria" | "geometry" | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (value.geometria) return "geometria";
  if (value.geometry) return "geometry";
  return null;
}

function ParamInfo({ path }: { path: string }) {
  if (!path || path === "root") return null;

  return (
    <Tooltip delayDuration={80}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300"
        >
          <Terminal size={10} />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={10}
        collisionPadding={16}
        className="z-[9999] max-w-[320px] rounded-xl border border-slate-700/80 bg-slate-950/98 px-3 py-2 text-left text-[11px] text-slate-50 shadow-[0_20px_60px_-20px_rgba(2,6,23,0.9)] backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/92 dark:border-slate-700 dark:bg-slate-900/98 dark:text-slate-50 dark:supports-[backdrop-filter]:bg-slate-900/94"
      >
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
            Caminho da propriedade
          </span>
          <span className="break-words rounded-lg bg-white/5 px-2 py-1 font-mono text-[11px] leading-4 text-amber-300 ring-1 ring-white/10 dark:bg-black/20 dark:text-amber-300">
            {path.replace("root.", "")}
          </span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function flattenSingleEntryNode({
  label,
  value,
  path,
  depth,
  isRoot,
  stripeIndex,
}: {
  label: string;
  value: Record<string, any>;
  path: string;
  depth: number;
  isRoot: boolean;
  stripeIndex: number;
}) {
  if (isGeometryValue(value)) return null;

  const entries = getRenderableEntries(value);
  if (entries.length !== 1) return null;

  const [childKey, childValue] = entries[0];
  if (!isPrimitiveValue(childValue) && !isGeometryValue(childValue))
    return null;

  const childLabel = extractUnitAndFormatLabel(childKey).formattedLabel;
  const normalizedParent = normalizeComparableLabel(label);
  const normalizedChild = normalizeComparableLabel(childLabel);
  const childKeyLower = childKey.toLowerCase();
  const useParentOnly =
    GENERIC_SINGLE_VALUE_KEYS.has(childKeyLower) ||
    normalizedParent === normalizedChild;

  return (
    <JsonNode
      label={useParentOnly ? label : `${label} · ${childLabel}`}
      value={childValue}
      path={`${path}.${childKey}`}
      depth={depth}
      isRoot={isRoot}
      stripeIndex={stripeIndex}
    />
  );
}

function getRenderableEntries(value: any): Array<[string, any]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value).filter(([key]) => !HIDDEN_KEYS.has(key));
}

function isPrimitiveValue(value: any): boolean {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null ||
    value === undefined
  );
}

function isGeometryValue(value: any): boolean {
  return !!(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    value.type &&
    [
      "Polygon",
      "Point",
      "MultiPolygon",
      "LineString",
      "MultiLineString",
    ].includes(value.type)
  );
}

function formatScalarValue(value: any, unit: string | null, label: string) {
  let displayValue = value;
  let valueClassName = "text-slate-950 dark:text-white";
  let toneClassName = "hover:!bg-slate-200/85 dark:hover:!bg-slate-800/90";

  if (typeof value === "number") {
    displayValue = value.toLocaleString("pt-BR", {
      minimumFractionDigits: value % 1 !== 0 ? 2 : 0,
      maximumFractionDigits: 3,
    });
    if (unit) displayValue += ` ${unit}`;

    if (isAreaMetric(label)) {
      valueClassName = "text-slate-950 dark:text-white";
      toneClassName = "hover:!bg-blue-100/95 dark:hover:!bg-blue-950/45";
    } else if (isHeightMetric(label)) {
      valueClassName = "text-slate-950 dark:text-white";
      toneClassName = "hover:!bg-violet-100/95 dark:hover:!bg-violet-950/45";
    } else {
      valueClassName = "font-mono text-slate-950 dark:text-white";
    }
  } else if (typeof value === "boolean") {
    displayValue = value ? "sim" : "não";
    valueClassName = "text-slate-950 dark:text-white";
    toneClassName = value
      ? "hover:!bg-emerald-100/95 dark:hover:!bg-emerald-950/45"
      : "hover:!bg-rose-100/95 dark:hover:!bg-rose-950/45";
  } else {
    displayValue = value ?? "";
    if (value && unit) displayValue += ` ${unit}`;
    if (!value) valueClassName = "italic text-slate-950/60 dark:text-white/70";
  }

  return {
    value: String(displayValue),
    valueClassName,
    toneClassName,
  };
}

function resolveArrayItemLabel(
  item: any,
  idx: number,
  parentLabel: string,
): string {
  if (isPrimitiveValue(item)) return `#${idx + 1}`;
  if (!item || typeof item !== "object") return `#${idx + 1}`;

  const identification =
    item.identificacao?.valor ||
    item.identificacao?.value ||
    item.identificação?.valor ||
    item.identificação?.value ||
    item.identificacao ||
    item.identificação;

  if (identification) return String(identification);
  if (item.numeracao ?? item.numeração ?? item.numero ?? item.número) {
    return `Nº ${String(item.numeracao ?? item.numeração ?? item.numero ?? item.número)}`;
  }
  if (item.nome || item.name) return String(item.nome || item.name);

  const entries = getRenderableEntries(item);
  if (entries.length === 1 && isPrimitiveValue(entries[0][1])) {
    return `${formatLabel(parentLabel)} ${idx + 1}`;
  }

  return `#${idx + 1}`;
}

function isAreaMetric(label: string): boolean {
  const comparable = normalizeComparableLabel(label);
  return comparable.includes("area") || comparable.includes("ocupada");
}

function isHeightMetric(label: string): boolean {
  const comparable = normalizeComparableLabel(label);
  return (
    comparable.includes("altura") ||
    comparable.includes("altitude") ||
    comparable.includes("gabarito")
  );
}

function normalizeComparableLabel(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function shouldHideScalarValue(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== "string") return false;

  const comparable = normalizeComparableLabel(value);
  return (
    !comparable ||
    comparable === "n d" ||
    comparable === "nao disponivel" ||
    comparable === "nao informado"
  );
}

export function extractUnitAndFormatLabel(label: string): {
  formattedLabel: string;
  unit: string | null;
} {
  if (!label) return { formattedLabel: "", unit: null };

  let unit: string | null = null;
  let cleanLabel = label;

  const match = label.match(/(.*)\s*\[(.*?)\]\s*$/);
  if (match) {
    cleanLabel = match[1].trim();
    unit = match[2].trim();
  }

  return { formattedLabel: formatLabel(cleanLabel), unit };
}

function formatLabel(label: string): string {
  if (!label) return "";
  if (label === "root" || label === "Projeto") return label;

  if (label.includes(" ")) {
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  const looksLikeCode =
    /^[A-Za-z0-9_-]+$/.test(label) &&
    (/[0-9]/.test(label) || /[A-Z]{2,}/.test(label));
  if (looksLikeCode) return label.toUpperCase();

  const clean = label
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();

  return clean.charAt(0).toUpperCase() + clean.slice(1);
}
