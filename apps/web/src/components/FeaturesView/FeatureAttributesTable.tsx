import { useState, useMemo, useCallback, useEffect } from "preact/hooks";
import { Input, cn } from "@open-urbis/map-ui";
import { Copy, Check, Search, Layers, FileSpreadsheet, ExternalLink } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { useMapContext } from "../../hooks/useMapContext";
import { normalizeGeoJsonToWgs84 } from "../../utils/fiu";

export const formatAttributeLabel = (rawKey: string): string => {
  if (!rawKey) return "";

  // Remove workspace prefix if present (e.g. "geosampa:layer_name" -> "layer_name")
  const key = rawKey.includes(":") ? rawKey.split(":").slice(1).join(":") : rawKey;

  // Split by underscores, dashes, spaces or camelCase transitions
  const words = key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[-_\s]+/)
    .filter(Boolean);

  if (words.length === 0) return key;

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getBoundsFromFeature = (
  feat: any,
): [[number, number], [number, number]] | null => {
  const geom = feat?.geometry || feat;
  if (!geom?.coordinates) return null;

  try {
    if (geom.type === "Point" && typeof geom.coordinates[0] === "number") {
      const [lon, lat] = geom.coordinates;
      return [
        [lon - 0.001, lat - 0.001],
        [lon + 0.001, lat + 0.001],
      ];
    }

    if (geom.type === "Polygon" && Array.isArray(geom.coordinates[0])) {
      const ring = geom.coordinates[0];
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      ring.forEach(([x, y]: [number, number]) => {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      });
      if (Number.isFinite(minX) && Number.isFinite(maxX)) {
        return [
          [minX, minY],
          [maxX, maxY],
        ];
      }
    }

    if (geom.type === "MultiPolygon" && Array.isArray(geom.coordinates)) {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      geom.coordinates.forEach((poly: any) => {
        if (Array.isArray(poly[0])) {
          poly[0].forEach(([x, y]: [number, number]) => {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          });
        }
      });
      if (Number.isFinite(minX) && Number.isFinite(maxX)) {
        return [
          [minX, minY],
          [maxX, maxY],
        ];
      }
    }
  } catch (e) {
    console.error("Failed to calculate bounds from feature", e);
  }

  return null;
};

export const getFeatureDisplayLabel = (
  props: Record<string, unknown>,
  rawLayer?: string,
  schemas?: any[],
): string => {
  // 1. Se possuir nome de schema explícito
  if (props.layerSchemaName) {
    return String(props.layerSchemaName);
  }
  if (props.layer_name) {
    return String(props.layer_name);
  }

  const cleanLayer = (
    rawLayer?.includes(":") ? rawLayer.split(":").slice(1).join(":") : (rawLayer || "")
  ).trim().toLowerCase();

  // 2. Busca nome cadastrado no layer schema
  if (schemas && Array.isArray(schemas) && cleanLayer) {
    const matched = schemas.find((s) => {
      if (!s) return false;
      const sId = (s.id?.includes(":") ? s.id.split(":").slice(1).join(":") : (s.id || "")).toLowerCase().trim();
      const sName = (s.name || "").toLowerCase().trim();
      return sId === cleanLayer || sName === cleanLayer || cleanLayer.includes(sId) || (sId.length > 3 && sId.includes(cleanLayer));
    });
    if (matched?.name) {
      return matched.name;
    }
  }

  // 3. Formatação padrão a partir do nome da camada
  if (rawLayer && rawLayer !== "Geometria Selecionada" && rawLayer !== "local") {
    return formatAttributeLabel(rawLayer);
  }

  return "Dados da Geometria";
};

const formatAttributeValue = (value: unknown, key: string): { display: string; isUrl: boolean; isNumeric: boolean } => {
  if (value === null || value === undefined || value === "") {
    return { display: "—", isUrl: false, isNumeric: false };
  }

  if (typeof value === "boolean") {
    return { display: value ? "Sim" : "Não", isUrl: false, isNumeric: false };
  }

  if (typeof value === "number") {
    if (key.toLowerCase().includes("percentage") || key.toLowerCase().includes("percent")) {
      return {
        display: `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`,
        isUrl: false,
        isNumeric: true,
      };
    }
    if (key.toLowerCase().includes("area")) {
      return {
        display: `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} m²`,
        isUrl: false,
        isNumeric: true,
      };
    }
    return {
      display: value.toLocaleString("pt-BR"),
      isUrl: false,
      isNumeric: true,
    };
  }

  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return { display: value.map(v => typeof v === "object" ? JSON.stringify(v) : String(v)).join(", "), isUrl: false, isNumeric: false };
    }
    return { display: JSON.stringify(value), isUrl: false, isNumeric: false };
  }

  const strVal = String(value).trim();

  // Check URL
  if (strVal.startsWith("http://") || strVal.startsWith("https://")) {
    return { display: strVal, isUrl: true, isNumeric: false };
  }

  return { display: strVal, isUrl: false, isNumeric: false };
};

export interface FeatureAttributesTableProps {
  feature?: any;
  intersectingFeatures?: any[];
  selectedFeature?: any;
  title?: string;
  calculatedArea?: string | null;
  className?: string;
}

export const FeatureAttributesTable = ({
  feature,
  intersectingFeatures = [],
  selectedFeature,
  className,
}: FeatureAttributesTableProps) => {
  const { layerSchemas, activeHighlightFeature, flyTo } = useMapContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { toastSuccess } = useToast();

  // Helper to check if a layer matches any visible/active layer on the map
  const isLayerActiveOnMap = useCallback((layerName: string, schemaId?: string) => {
    if (!layerSchemas?.value || (!layerName && !schemaId)) return false;
    const clean = (layerName?.includes(":") ? layerName.split(":").slice(1).join(":") : (layerName || ""))
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .trim();

    return layerSchemas.value.some((s) => {
      if (!s.isVisible && !s.isSelected) return false;
      if (schemaId && String(s.id) === String(schemaId)) return true;
      const sId = (s.id?.includes(":") ? s.id.split(":").slice(1).join(":") : (s.id || ""))
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .trim();
      const sName = (s.name || "")
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .trim();
      if (sId === clean || sName === clean) return true;
      if (clean.length > 3 && (sId.includes(clean) || clean.includes(sId))) return true;
      if (clean.length > 3 && (sName.includes(clean) || clean.includes(sName))) return true;
      return false;
    });
  }, [layerSchemas?.value]);

  useEffect(() => {
    setSelectedLayerIndex(0);
    setSearchTerm("");
  }, [feature, intersectingFeatures]);

  const isPointGeometry = useMemo(() => {
    if (!feature) return false;
    const geom = feature.geometry || feature;
    return geom?.type === "Point" || Boolean(feature.properties?.isPointInspection);
  }, [feature]);

  // Clear highlighted selection geometry on unmount
  useEffect(() => {
    return () => {
      activeHighlightFeature.value = null;
    };
  }, [activeHighlightFeature]);

  // Combine and sort features: each feature is its own separate item
  const availableFeatures = useMemo(() => {
    const list: Array<{ label: string; rawLayer: string; isActiveOnMap: boolean; properties: Record<string, unknown>; rawFeature?: any }> = [];
    const seenFeatureKeys = new Set<string>();

    const buildFeatureKey = (
      feat: any,
      itemProps: Record<string, unknown>,
      rawLayer: string,
      index?: number,
    ): string => {
      const cleanLayer = String(rawLayer || "")
        .toLowerCase()
        .replace(/^([a-zA-Z0-9_-]+):/, "")
        .trim();

      const layerId = (feat?.properties?.layerSchemaId as string) || cleanLayer || "local";
      const rawId = feat?.id || itemProps?.id;
      if (rawId) {
        const cleanId = String(rawId).replace(/^([a-zA-Z0-9_-]+):/, "").trim();
        return `${layerId}::id-${cleanId}`;
      }
      return `${layerId}::feat-${index !== undefined ? index : JSON.stringify(itemProps)}`;
    };

    const isSyntheticPoint = (_feat: any, p: Record<string, unknown>) => {
      return Boolean(
        p.isPointInspection ||
        p.layer === "Ponto Consultado" ||
        p.layer === "Ponto de Inspeção"
      );
    };

    // 1. Process all intersecting features from spatial query (each feature is a separate item!)
    if (Array.isArray(intersectingFeatures) && intersectingFeatures.length > 0) {
      intersectingFeatures.forEach((feat, idx) => {
        const featureProps = (feat?.properties as Record<string, unknown>) ?? {};
        if (Object.keys(featureProps).length > 0) {
          if (isSyntheticPoint(feat, featureProps)) return;
          // Filter negligible sliver intersections (0.0%) for polygon queries
          const pct = Number(featureProps["totalAreaPercentage"]);
          if (!isPointGeometry && featureProps["totalAreaPercentage"] !== undefined && !isNaN(pct) && pct < 0.05) {
            return;
          }
          const rawLayer = String(featureProps["layer"] || featureProps["nm_tema_divisao_pde"] || featureProps["source"] || `Camada ${idx + 1}`);
          const featureKey = buildFeatureKey(feat, featureProps, rawLayer, idx);

          if (!seenFeatureKeys.has(featureKey)) {
            seenFeatureKeys.add(featureKey);
            const label = getFeatureDisplayLabel(featureProps, rawLayer, layerSchemas?.value);
            list.push({
              label,
              rawLayer,
              isActiveOnMap: isLayerActiveOnMap(rawLayer, featureProps?.layerSchemaId as string),
              properties: featureProps,
              rawFeature: feat,
            });
          }
        }
      });
    }

    // 2. If root feature is a distinct clicked feature not present in intersections
    if (feature?.properties && Object.keys(feature.properties).length > 0) {
      const p = feature.properties as Record<string, unknown>;
      if (!isSyntheticPoint(feature, p)) {
        const rawLayer = String(p["layer"] || p["source"] || "");
        const featureKey = buildFeatureKey(feature, p, rawLayer);
        if (!seenFeatureKeys.has(featureKey)) {
          seenFeatureKeys.add(featureKey);
          const label = getFeatureDisplayLabel(p, rawLayer, layerSchemas?.value);
          list.unshift({
            label,
            rawLayer: rawLayer || "local",
            isActiveOnMap: isLayerActiveOnMap(rawLayer, p?.layerSchemaId as string),
            properties: p,
            rawFeature: feature,
          });
        }
      }
    }

    // Fallback if empty properties but feature has top level info
    if (list.length === 0 && feature) {
      const fallbackProps: Record<string, unknown> = {};
      Object.entries(feature).forEach(([k, v]) => {
        if (k !== "geometry" && k !== "type" && typeof v !== "function") {
          fallbackProps[k] = v;
        }
      });
      if (Object.keys(fallbackProps).length > 0) {
        list.push({
          label: "Dados da Geometria",
          rawLayer: "local",
          isActiveOnMap: true,
          properties: fallbackProps,
          rawFeature: feature,
        });
      }
    }

    // Disambiguate duplicate labels only if multiple distinct features have the exact same label
    const labelCounts = new Map<string, number>();
    list.forEach((item) => {
      labelCounts.set(item.label, (labelCounts.get(item.label) || 0) + 1);
    });

    const labelIndices = new Map<string, number>();
    list.forEach((item) => {
      if ((labelCounts.get(item.label) || 0) > 1) {
        const currentIdx = (labelIndices.get(item.label) || 0) + 1;
        labelIndices.set(item.label, currentIdx);
        item.label = `${item.label} #${currentIdx}`;
      }
    });

    const isPrimaryFeature = (item: any) => {
      if (!feature) return false;
      if (item.rawFeature === feature) return true;
      if (feature.id && item.rawFeature?.id === feature.id) return true;
      const p = feature.properties || feature;
      const itemProps = item.properties || {};
      if (p.layerSchemaId && itemProps.layerSchemaId === p.layerSchemaId) return true;
      if (p.layer && itemProps.layer && p.layer === itemProps.layer) return true;
      const raw = String(p.layer || feature.id || "");
      if (raw && item.rawLayer && (item.rawLayer === raw || item.rawLayer.includes(raw) || raw.includes(item.rawLayer))) {
        return true;
      }
      return false;
    };

    // Ordenação consistente:
    // 1. Feição diretamente clicada/selecionada pelo usuário
    // 2. Demais camadas ativas no mapa
    // 3. Ordem alfabética por nome da camada
    return list.sort((a, b) => {
      const isPrimA = isPrimaryFeature(a);
      const isPrimB = isPrimaryFeature(b);
      if (isPrimA && !isPrimB) return -1;
      if (!isPrimA && isPrimB) return 1;

      if (a.isActiveOnMap && !b.isActiveOnMap) return -1;
      if (!a.isActiveOnMap && b.isActiveOnMap) return 1;
      return a.label.localeCompare(b.label);
    });
  }, [feature, intersectingFeatures, layerSchemas?.value, isLayerActiveOnMap, isPointGeometry]);

  // Sync selected layer when feature or selectedFeature changes
  useEffect(() => {
    const targetFeat = selectedFeature || feature;
    if (targetFeat && availableFeatures.length > 0) {
      const sProps = targetFeat.properties || targetFeat;
      const sLayer = String(sProps?.layer || targetFeat.id || targetFeat?.layer || "");
      const matchIdx = availableFeatures.findIndex((item) => {
        if (item.rawFeature === targetFeat) return true;
        if (item.properties === sProps) return true;
        if (targetFeat.id && item.rawFeature?.id === targetFeat.id) return true;
        const itemProps = item.properties || {};
        if (sProps.layerSchemaId && itemProps.layerSchemaId === sProps.layerSchemaId) return true;
        if (sProps.layer && itemProps.layer && sProps.layer === itemProps.layer) return true;
        if (item.rawLayer && sLayer && (item.rawLayer === sLayer || item.rawLayer.includes(sLayer) || sLayer.includes(item.rawLayer))) {
          return true;
        }
        return false;
      });
      if (matchIdx !== -1) {
        setSelectedLayerIndex(matchIdx);
        return;
      }
    }
    setSelectedLayerIndex(0);
    setSearchTerm("");
  }, [feature, selectedFeature, availableFeatures]);

  const safeLayerIndex = selectedLayerIndex >= availableFeatures.length ? 0 : selectedLayerIndex;

  const handleSelectFeature = (globalIndex: number, item: any) => {
    setSelectedLayerIndex(globalIndex);
    if (item.rawFeature) {
      try {
        const normalized = normalizeGeoJsonToWgs84(item.rawFeature);
        activeHighlightFeature.value = normalized || item.rawFeature;
        const bounds = getBoundsFromFeature(normalized || item.rawFeature);
        if (bounds) {
          flyTo({ bounds, padding: 120 });
        }
      } catch (err) {
        console.warn("Error highlighting feature on map:", err);
      }
    }
  };

  const activeProperties = useMemo(() => {
    const activeItem = availableFeatures[safeLayerIndex] || availableFeatures[0];
    return activeItem?.properties || {};
  }, [availableFeatures, safeLayerIndex]);

  const filteredEntries = useMemo(() => {
    const entries = Object.entries(activeProperties).filter(([key]) => {
      if (key === "geometry" || key === "coordinates" || key === "type" || key.startsWith("__")) return false;
      // When inspecting a point location, omit polygon-specific intersection area fields
      if (isPointGeometry && (key === "totalArea" || key === "totalAreaPercentage" || key === "smallerPolygonAreaPercentage")) return false;
      return true;
    });

    if (!searchTerm.trim()) return entries;

    const term = searchTerm.toLowerCase();
    return entries.filter(([key, value]) => {
      const label = formatAttributeLabel(key).toLowerCase();
      const valStr = String(value ?? "").toLowerCase();
      return label.includes(term) || key.toLowerCase().includes(term) || valStr.includes(term);
    });
  }, [activeProperties, searchTerm, isPointGeometry]);

  const handleCopy = (key: string, value: string) => {
    void navigator.clipboard.writeText(value);
    setCopiedKey(key);
    toastSuccess("Copiado!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (availableFeatures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <FileSpreadsheet className="h-10 w-10 opacity-40 mb-2" />
        <p className="text-sm font-medium">Nenhum atributo encontrado</p>
        <p className="text-xs mt-1">Selecione uma geometria no mapa para inspecionar seus dados.</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col w-full text-foreground space-y-3 p-3 select-text pointer-events-auto", className)}>
      {/* Feições identificadas - Chips compactos agrupados lado a lado */}
      {availableFeatures.length > 0 && (
        <div className="space-y-1.5 rounded-xl border bg-muted/15 p-2.5">
          <div className="flex items-center justify-between gap-2 px-0.5 text-[11px] font-semibold text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span>
                {availableFeatures.length === 1
                  ? "Camada selecionada (1 feição):"
                  : `Camadas no local (${availableFeatures.length}):`}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-normal hidden sm:inline">
              Clique para inspecionar no mapa e ver atributos
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {availableFeatures.map((item, idx) => (
              <button
                key={`${item.label}-${idx}`}
                type="button"
                onClick={() => handleSelectFeature(idx, item)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border flex items-center gap-1.5 shrink-0 shadow-2xs select-none cursor-pointer",
                  safeLayerIndex === idx
                    ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                    : "bg-background text-foreground border-border/80 hover:bg-muted/70 hover:border-primary/50"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    safeLayerIndex === idx
                      ? "bg-primary-foreground"
                      : item.isActiveOnMap
                        ? "bg-emerald-500"
                        : "bg-muted-foreground/40"
                  )}
                />
                <span>{item.label}</span>
                {item.isActiveOnMap && (
                  <span
                    className={cn(
                      "text-[9px] font-medium px-1.5 py-0.2 rounded-full",
                      safeLayerIndex === idx
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                    )}
                  >
                    Ativa no mapa
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar atributo ou valor nesta camada..."
          value={searchTerm}
          onInput={(e) => setSearchTerm(e.currentTarget.value)}
          className="h-8 pl-8 pr-3 text-xs bg-background"
        />
      </div>

      {/* Table content */}
      <div>
        {filteredEntries.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground rounded-xl border bg-card">
            Nenhum atributo encontrado para &ldquo;{searchTerm}&rdquo;.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-[40%] font-medium">Atributo</th>
                  <th className="py-2.5 px-3 w-[50%] font-medium">Valor</th>
                  <th className="py-2.5 px-2 w-[10%] text-center font-medium">Copiar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredEntries.map(([key, rawValue]) => {
                  const label = formatAttributeLabel(key);
                  const { display, isUrl, isNumeric } = formatAttributeValue(rawValue, key);
                  const isCopied = copiedKey === key;

                  return (
                    <tr
                      key={key}
                      className="group transition-colors hover:bg-muted/30 odd:bg-background even:bg-muted/10"
                    >
                      <td className="py-2.5 px-3 align-top font-medium text-foreground">
                        <div>
                          <span>{label}</span>
                          <span className="block text-[10px] font-mono font-normal text-muted-foreground/75 mt-0.5">
                            {key}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        {isUrl ? (
                          <a
                            href={display}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-medium break-all"
                          >
                            <span>Acessar link</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span
                            className={cn(
                              "text-foreground break-words leading-relaxed select-text",
                              isNumeric && "font-mono font-semibold"
                            )}
                          >
                            {display}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 align-top text-center">
                        <button
                          type="button"
                          onClick={() => handleCopy(key, display)}
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                            isCopied
                              ? "bg-emerald-500/15 text-emerald-600 font-semibold"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground opacity-60 group-hover:opacity-100"
                          )}
                          title="Copiar valor"
                        >
                          {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-1 flex items-center justify-between text-[11px] text-muted-foreground pt-1">
        <span>{filteredEntries.length} atributos listados</span>
        <span className="text-[10px]">Dados oficiais · Urbis</span>
      </div>
    </div>
  );
};
