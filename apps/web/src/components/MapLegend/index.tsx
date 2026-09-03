import { computed, signal } from "@preact/signals";
import { useMemo } from "preact/hooks";
import { Button, cn, UrbisIcon } from "@open-urbis/map-ui";
import { Scale, ZoomIn } from "lucide-react";
import { MAP_CONFIGS } from "../../application-configs";
import { useMapContext } from "../../hooks/useMapContext";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  IGetConfigFillPattern,
  IGetConfigLayerSchema,
} from "../../types/fetch-map-config-type";
import { normalizeLayerPattern } from "@/lib/layer-patterns";

export const mapLegendOpen = signal<boolean>(false);

const normalizeColor = (
  color?: [number, number, number, number] | number[],
): [number, number, number, number] => {
  const fallback = MAP_CONFIGS.DEFAULT_LAYER_COLOR;
  if (!color || color.length < 3) return fallback;

  const alpha = color[3] ?? 255;
  return [
    color[0] ?? fallback[0],
    color[1] ?? fallback[1],
    color[2] ?? fallback[2],
    alpha <= 1 ? Math.round(alpha * 255) : alpha,
  ];
};

const toRgba = (color?: [number, number, number, number] | number[]) =>
  `rgba(${normalizeColor(color).join(",")})`;

export const getNormalizedLegisUrl = (raw?: string | null): string | null => {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: string | null = null;

  const hrefMatch = trimmed.match(/href=["']([^"']+)["']/i);
  if (hrefMatch) {
    url = hrefMatch[1].trim();
  } else {
    const urlMatch = trimmed.match(/https?:\/\/[^\s<"']+/i);
    if (urlMatch) {
      url = urlMatch[0].trim();
    } else if (trimmed.startsWith("/pages/") || trimmed.startsWith("/p/")) {
      url = `https://legis.urbis.prefeitura.sp.gov.br${trimmed}`;
    } else if (
      trimmed.startsWith("legislacao.prefeitura.sp.gov.br") ||
      trimmed.startsWith("legis.urbis.prefeitura.sp.gov.br")
    ) {
      url = `https://${trimmed}`;
    } else if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      url = `https://legis.urbis.prefeitura.sp.gov.br/pages/${trimmed}`;
    }
  }

  if (!url) return null;

  return url.replace(
    /^https?:\/\/legislacao\.prefeitura\.sp\.gov\.br/i,
    "https://legis.urbis.prefeitura.sp.gov.br",
  );
};

type LegendItem = {
  key: string;
  label: string;
  value: string;
  fillColor?: [number, number, number, number] | number[];
  lineColor?: [number, number, number, number] | number[];
  pattern?: IGetConfigFillPattern;
  patternBackgroundColor?: [number, number, number, number] | number[];
  legisUrl?: string | null;
};

const buildLegendItems = (layer: IGetConfigLayerSchema): LegendItem[] => {
  const visibleColors = layer.colors.filter((color) => color.type !== "text");

  if (!visibleColors.length) {
    const layerLegis = getNormalizedLegisUrl(
      layer.properties?.metadata?.legisLinks ||
      layer.properties?.metadata?.legisUrl ||
      layer.properties?.legisLinks ||
      (layer as any).legisUrl,
    );

    return [
      {
        key: `${layer.id}-default`,
        label: layer.name,
        value: "default",
        fillColor: MAP_CONFIGS.DEFAULT_LAYER_COLOR,
        lineColor: MAP_CONFIGS.DEFAULT_LAYER_COLOR,
        pattern: "full",
        legisUrl: layerLegis,
      },
    ];
  }

  const grouped = new Map<string, LegendItem>();

  visibleColors.forEach((color) => {
    const key = color.value || color.label || "default";
    const current = grouped.get(key) ?? {
      key: `${layer.id}-${key}`,
      label:
        color.label && color.label !== "default"
          ? color.label
          : color.value && color.value !== "default"
            ? color.value
            : layer.name,
      value: key,
      pattern: normalizeLayerPattern(color.pattern),
      patternBackgroundColor: color.patternConfig?.backgroundColor,
      legisUrl: getNormalizedLegisUrl(color.legisUrl),
    };

    if (color.legisUrl && !current.legisUrl) {
      current.legisUrl = getNormalizedLegisUrl(color.legisUrl);
    }

    if (color.type === "line") {
      current.lineColor = color.color;
    } else {
      current.fillColor = color.color;
      current.pattern = normalizeLayerPattern(color.pattern);
      current.patternBackgroundColor = color.patternConfig?.backgroundColor;
    }

    grouped.set(key, current);
  });

  return Array.from(grouped.values()).map((item) => ({
    ...item,
    fillColor:
      item.fillColor ?? item.lineColor ?? MAP_CONFIGS.DEFAULT_LAYER_COLOR,
    lineColor:
      item.lineColor ?? item.fillColor ?? MAP_CONFIGS.DEFAULT_LAYER_COLOR,
  }));
};

const getSwatchStyle = (item: LegendItem) => ({
  backgroundColor: toRgba(item.patternBackgroundColor ?? item.fillColor),
  borderColor: toRgba(item.lineColor),
});

const Swatch = ({ item }: { item: LegendItem }) => (
  <span
    className={cn(
      "relative inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border shadow-sm",
      item.pattern && item.pattern !== "full" && `pattern ${item.pattern}`,
    )}
    style={getSwatchStyle(item)}
    aria-hidden="true"
  />
);

const LayerLegisButton = ({
  url,
  title,
}: {
  url?: string | null;
  title?: string;
}) => {
  if (!url) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        window.open(url, "_blank", "noopener,noreferrer");
      }}
      aria-label={`Legislação de ${title || "Legis"}`}
      title={`Abrir legislação no Legis (${title || "Legis"})`}
    >
      <Scale className="h-3.5 w-3.5" aria-hidden="true" />
    </Button>
  );
};

const LayerInfoButton = ({
  layer,
  onShowMetadata,
}: {
  layer: IGetConfigLayerSchema;
  onShowMetadata?: (id: string) => void;
}) => {
  if (!onShowMetadata) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
      onClick={() => onShowMetadata(layer.id)}
      aria-label={`Informações da camada ${layer.name}`}
      title="Informações da camada"
    >
      <UrbisIcon name="info" className="text-[16px]" aria-hidden="true" />
    </Button>
  );
};

const LegendRow = ({ item }: { item: LegendItem }) => (
  <li className="group flex min-w-0 items-center justify-between gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-muted/60">
    <div className="flex min-w-0 items-center gap-2 flex-1">
      <Swatch item={item} />
      <span className="min-w-0 flex-1 truncate text-xs text-foreground">
        {item.label}
      </span>
    </div>
    {item.legisUrl && (
      <LayerLegisButton url={item.legisUrl} title={item.label} />
    )}
  </li>
);

const LayerLegendSection = ({
  layer,
  onShowMetadata,
  currentZoom,
  onZoomIn,
}: {
  layer: IGetConfigLayerSchema;
  onShowMetadata?: (id: string) => void;
  currentZoom: number;
  onZoomIn?: (minZoom: number) => void;
}) => {
  const items = buildLegendItems(layer);
  const hasMultipleItems = items.length > 1;
  const isZoomRequired =
    typeof layer.minZoom === "number" &&
    layer.minZoom > 0 &&
    currentZoom < layer.minZoom;

  const layerLegisUrl = getNormalizedLegisUrl(
    layer.properties?.metadata?.legisLinks ||
    layer.properties?.metadata?.legisUrl ||
    layer.properties?.legisLinks ||
    (layer as any).legisUrl,
  );

  return (
    <section className="rounded-xl border bg-background/65 border-border p-2">
      {!hasMultipleItems ? (
        <div className="flex min-w-0 items-center gap-2">
          <ul className="min-w-0 flex-1">
            <LegendRow item={{ ...items[0], label: layer.name, legisUrl: undefined }} />
          </ul>
          <div className="flex items-center gap-0.5 shrink-0">
            {(items[0]?.legisUrl || layerLegisUrl) && (
              <LayerLegisButton
                url={items[0]?.legisUrl || layerLegisUrl}
                title={layer.name}
              />
            )}
            <LayerInfoButton layer={layer} onShowMetadata={onShowMetadata} />
          </div>
        </div>
      ) : (
        <>
          <div className="mb-1.5 flex min-w-0 items-center gap-2 px-1">
            <UrbisIcon
              name="layers"
              className="text-[15px] text-muted-foreground"
              aria-hidden="true"
            />
            <h6 className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">
              {layer.name}
            </h6>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {items.length}
            </span>
            <div className="flex items-center gap-0.5 shrink-0">
              {layerLegisUrl && (
                <LayerLegisButton url={layerLegisUrl} title={layer.name} />
              )}
              <LayerInfoButton layer={layer} onShowMetadata={onShowMetadata} />
            </div>
          </div>
          <ul className="space-y-0.5">
            {items.map((item) => (
              <LegendRow key={item.key} item={item} />
            ))}
          </ul>
        </>
      )}

      {isZoomRequired && (
        <div className="mt-1.5 flex items-center justify-between gap-2 px-1.5 py-1 text-[10px] text-muted-foreground bg-muted/30 rounded-md border border-border/40">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <ZoomIn className="h-3 w-3 shrink-0 text-amber-500/80" />
            <span className="truncate">
              Exige zoom mín. {layer.minZoom} (atual: {currentZoom.toFixed(1)})
            </span>
          </div>
          {onZoomIn && (
            <button
              type="button"
              onClick={() => onZoomIn(layer.minZoom!)}
              className="text-[10px] font-medium text-primary hover:underline shrink-0 px-1 py-0.5 rounded cursor-pointer"
              title={`Aproximar mapa para nível ${layer.minZoom}`}
            >
              Aproximar
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export const MapLegendContent = ({
  compact = false,
  onShowMetadata,
}: {
  compact?: boolean;
  onShowMetadata?: (id: string) => void;
}) => {
  const { layerSchemas, zoom, flyTo } = useMapContext();
  const currentZoom = zoom?.value ?? 0;

  const handleZoomIn = (minZoom: number) => {
    flyTo?.({ zoom: Math.max(Number(minZoom) + 0.15, currentZoom + 1) });
  };

  const layers = computed(() =>
    [...layerSchemas.value]
      .filter((schema: IGetConfigLayerSchema) => schema.isVisible)
      .reverse(),
  );

  const layersRequiringZoom = useMemo(() => {
    return layers.value.filter((s) => {
      const minZ = s.minZoom;
      return typeof minZ === "number" && minZ > 0 && currentZoom < minZ;
    }).length;
  }, [layers.value, currentZoom]);

  if (!layers.value.length) {
    return (
      <div className="rounded-xl border border-dashed p-4 text-center">
        <UrbisIcon
          name="layers_clear"
          className="text-2xl text-muted-foreground"
          aria-hidden="true"
        />
        <p className="mt-2 text-sm font-medium">Nenhuma camada ativa</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Ative camadas no mapa para ver suas legendas aqui.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", compact && "space-y-1.5")}>
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Camadas ativas no mapa
          </p>
          {layersRequiringZoom > 0 && (
            <span className="text-[10px] text-amber-600/90 dark:text-amber-400/90 font-normal">
              · {layersRequiringZoom} {layersRequiringZoom === 1 ? "exige zoom" : "exigem zoom"}
            </span>
          )}
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          {layers.value.length}
        </span>
      </div>

      <div className={cn("space-y-2", compact && "space-y-1.5")}>
        {layers.value.map((layer) => (
          <LayerLegendSection
            key={layer.id}
            layer={layer}
            currentZoom={currentZoom}
            onZoomIn={handleZoomIn}
            onShowMetadata={onShowMetadata}
          />
        ))}
      </div>
    </div>
  );
};

export const MapLegend = () => {
  const { drawerOpen, isProspectiveSearchActive } = useNavigationContext();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isOverlapping = useMediaQuery("(min-height: 1000px)");

  const leftOffset =
    isDesktop && drawerOpen.value
      ? "left-[440px]"
      : isOverlapping
        ? "left-3"
        : "left-[64px]";

  if (!mapLegendOpen.value || isProspectiveSearchActive.value) return null;

  return (
    <div
      className={cn(
        "urbis-app-panel-layer absolute bottom-10 w-[300px] max-w-[calc(100%-12px)] max-h-[66vh] overflow-hidden rounded-2xl border bg-background/95 shadow-xl backdrop-blur transition-all duration-300 supports-[backdrop-filter]:bg-background/85",
        leftOffset,
      )}
    >
      <div className="sticky top-0 flex items-center justify-between border-b bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex min-w-0 items-center gap-2">
          <UrbisIcon
            name="list_alt"
            className="text-[18px] text-primary"
            aria-hidden="true"
          />
          <h5 className="m-0 truncate text-sm font-semibold">Legenda</h5>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => (mapLegendOpen.value = false)}
          aria-label="Fechar legenda"
        >
          <UrbisIcon name="close" className="text-base" aria-hidden="true" />
        </Button>
      </div>

      <div className="max-h-[calc(66vh-56px)] overflow-y-auto p-3">
        <MapLegendContent compact />
      </div>
    </div>
  );
};
