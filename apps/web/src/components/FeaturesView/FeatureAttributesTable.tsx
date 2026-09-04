import { useState, useMemo, useCallback, useEffect, useRef } from "preact/hooks";
import { Input, cn } from "@open-urbis/map-ui";
import { Copy, Check, Search, Layers, FileSpreadsheet, ExternalLink, X, Info } from "lucide-react";
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

export const getBoundsFromFeature = (
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
  onSelectFeature?: (rawFeature: any, item: any) => void;
  title?: string;
  calculatedArea?: string | null;
  className?: string;
}

export const FeatureAttributesTable = ({
  feature,
  intersectingFeatures = [],
  selectedFeature,
  onSelectFeature,
  className,
}: FeatureAttributesTableProps) => {
  const { layerSchemas, activeHighlightFeature, flyTo, layerWithRootEditTemplate } = useMapContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
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
    const list: Array<{
      label: string;
      rawLayer: string;
      isActiveOnMap: boolean;
      isBaseEditLayer: boolean;
      isTaxLot: boolean;
      percentage: string | null;
      percentageNum: number;
      isPrimary: boolean;
      properties: Record<string, unknown>;
      rawFeature?: any;
    }> = [];
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

    const isPerimeterOrSynthetic = (feat: any, p: Record<string, unknown>) => {
      const layerStr = String(p.layer || p.source || p.layer_name || p.layerSchemaName || feat?.id || "").toLowerCase();
      return Boolean(
        p.isPointInspection ||
        p.origem_perimetro ||
        layerStr.includes("perímetro") ||
        layerStr.includes("perimetro") ||
        layerStr.includes("geometria selecionada") ||
        layerStr.includes("ponto consultado") ||
        layerStr.includes("ponto de inspeção") ||
        layerStr.includes("consulta pontual") ||
        layerStr.includes("consulta territorial") ||
        String(feat?.id || "").startsWith("perimeter-") ||
        String(feat?.id || "").startsWith("query-point-")
      );
    };

    const isTaxLot = (feat: any, p: Record<string, unknown>, rawLayer: string) => {
      if (
        (p.cd_setor_fiscal !== undefined && p.cd_quadra_fiscal !== undefined) ||
        (p.setor !== undefined && p.quadra !== undefined && p.lote !== undefined) ||
        p.sql !== undefined ||
        p.sql_formatado !== undefined ||
        p.nr_sql !== undefined ||
        p.codigo_lote !== undefined
      ) {
        return true;
      }
      const s = String(p.layer || rawLayer || p.layerSchemaName || feat?.id || "").toLowerCase();
      return s.includes("lote_fiscal") || s.includes("lotes_fiscais") || s.includes("lote fiscal") || s.includes("lotes fiscais") || s === "lotes" || s === "lote";
    };

    const isBaseEditLayer = (feat: any, p: Record<string, unknown>, rawLayer: string) => {
      const rootId = (layerWithRootEditTemplate?.value || "").trim().toLowerCase();
      if (!rootId) return false;
      const layerId = String(p.layerSchemaId || p.layer || rawLayer || feat?.id || "").toLowerCase().trim();
      return layerId === rootId || layerId.includes(rootId) || rootId.includes(layerId);
    };

    const extractPercentage = (props: Record<string, unknown>): { str: string | null; num: number } => {
      const raw = props.totalAreaPercentage ?? props.smallerPolygonAreaPercentage ?? props.percentage;
      if (raw !== undefined && raw !== null && raw !== "") {
        const num = Number(raw);
        if (!isNaN(num) && num > 0.01) {
          return {
            str: num >= 99.95 ? "100%" : `${num.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`,
            num,
          };
        }
      }
      return { str: null, num: 0 };
    };

    const isItemPrimary = (itemFeat: any, itemProps: Record<string, unknown>, rawLayer: string) => {
      if (!feature) return false;
      if (itemFeat && (itemFeat === feature || itemFeat === selectedFeature)) return true;
      if (feature.id && (itemFeat?.id === feature.id || itemProps?.id === feature.id)) return true;
      const p = feature.properties || feature;
      if (p.cd_setor_fiscal && p.cd_quadra_fiscal && p.cd_lote) {
        if (
          itemProps.cd_setor_fiscal === p.cd_setor_fiscal &&
          itemProps.cd_quadra_fiscal === p.cd_quadra_fiscal &&
          itemProps.cd_lote === p.cd_lote
        ) {
          return true;
        }
      }
      if (p.layerSchemaId && itemProps.layerSchemaId === p.layerSchemaId) return true;
      if (p.layer && itemProps.layer && p.layer === itemProps.layer) return true;
      const raw = String(p.layer || feature.id || "");
      if (raw && rawLayer && (rawLayer === raw || rawLayer.includes(raw) || raw.includes(rawLayer))) {
        return true;
      }
      return false;
    };

    // 1. Process intersecting features first (real catalog layers)
    if (Array.isArray(intersectingFeatures) && intersectingFeatures.length > 0) {
      intersectingFeatures.forEach((feat, idx) => {
        const featureProps = (feat?.properties as Record<string, unknown>) ?? {};
        if (Object.keys(featureProps).length > 0) {
          // Discard synthetic point inspection or analysis perimeter features
          if (isPerimeterOrSynthetic(feat, featureProps)) return;

          const pct = Number(featureProps["totalAreaPercentage"]);
          if (!isPointGeometry && featureProps["totalAreaPercentage"] !== undefined && !isNaN(pct) && pct < 0.05) {
            return;
          }
          const rawLayer = String(featureProps["layer"] || featureProps["nm_tema_divisao_pde"] || featureProps["source"] || `Camada ${idx + 1}`);
          const featureKey = buildFeatureKey(feat, featureProps, rawLayer, idx);

          if (!seenFeatureKeys.has(featureKey)) {
            seenFeatureKeys.add(featureKey);
            const label = getFeatureDisplayLabel(featureProps, rawLayer, layerSchemas?.value);
            const isPrim = isItemPrimary(feat, featureProps, rawLayer);
            const isBase = isBaseEditLayer(feat, featureProps, rawLayer);
            const isLot = isTaxLot(feat, featureProps, rawLayer);
            const { str: pctStr, num: pctNum } = extractPercentage(featureProps);

            list.push({
              label,
              rawLayer,
              isActiveOnMap: isLayerActiveOnMap(rawLayer, featureProps?.layerSchemaId as string),
              isBaseEditLayer: isBase,
              isTaxLot: isLot,
              percentage: pctStr,
              percentageNum: pctNum,
              isPrimary: isPrim,
              properties: featureProps,
              rawFeature: feat,
            });
          }
        }
      });
    }

    // 2. If root feature is a real layer feature (not perimeter/synthetic) and not already in list, add it
    if (feature?.properties && Object.keys(feature.properties).length > 0) {
      const p = feature.properties as Record<string, unknown>;
      if (!isPerimeterOrSynthetic(feature, p)) {
        const rawLayer = String(p["layer"] || p["source"] || "");
        const featureKey = buildFeatureKey(feature, p, rawLayer);
        if (!seenFeatureKeys.has(featureKey)) {
          seenFeatureKeys.add(featureKey);
          const label = getFeatureDisplayLabel(p, rawLayer, layerSchemas?.value);
          const isBase = isBaseEditLayer(feature, p, rawLayer);
          const isLot = isTaxLot(feature, p, rawLayer);
          const { str: pctStr, num: pctNum } = extractPercentage(p);

          list.push({
            label,
            rawLayer: rawLayer || "local",
            isActiveOnMap: isLayerActiveOnMap(rawLayer, p?.layerSchemaId as string),
            isBaseEditLayer: isBase,
            isTaxLot: isLot,
            percentage: pctStr,
            percentageNum: pctNum,
            isPrimary: true,
            properties: p,
            rawFeature: feature,
          });
        }
      }
    }

    // Fallback only if no real intersecting features were found at all
    if (list.length === 0 && feature) {
      const fallbackProps: Record<string, unknown> = {};
      Object.entries(feature).forEach(([k, v]) => {
        if (k !== "geometry" && k !== "type" && typeof v !== "function" && k !== "origem_perimetro") {
          fallbackProps[k] = v;
        }
      });
      if (Object.keys(fallbackProps).length > 0) {
        list.push({
          label: "Dados da Geometria",
          rawLayer: "local",
          isActiveOnMap: true,
          isBaseEditLayer: false,
          isTaxLot: false,
          percentage: null,
          percentageNum: 0,
          isPrimary: true,
          properties: fallbackProps,
          rawFeature: feature,
        });
      }
    }

    // Disambiguate duplicate labels only if multiple distinct features have the exact same label: "Lote Fiscal 1", "Lote Fiscal 2"
    const labelCounts = new Map<string, number>();
    list.forEach((item) => {
      const base = item.label.replace(/\s+\d+$/, "").trim();
      labelCounts.set(base, (labelCounts.get(base) || 0) + 1);
    });

    const labelIndices = new Map<string, number>();
    list.forEach((item) => {
      const base = item.label.replace(/\s+\d+$/, "").trim();
      if ((labelCounts.get(base) || 0) > 1) {
        const currentIdx = (labelIndices.get(base) || 0) + 1;
        labelIndices.set(base, currentIdx);
        item.label = `${base} ${currentIdx}`;
      }
    });

    // Ordenação estrita por prioridade:
    // 1º: Camada base de edição configurada (layerWithRootEditTemplate)
    // 2º: Primeiro lote fiscal disponível
    // 3º: Feição primária clicada
    // 4º: Camadas ativas/visíveis no mapa
    // 5º: Maior sobreposição e ordem alfabética
    return list.sort((a, b) => {
      if (a.isBaseEditLayer && !b.isBaseEditLayer) return -1;
      if (!a.isBaseEditLayer && b.isBaseEditLayer) return 1;

      if (a.isTaxLot && !b.isTaxLot) return -1;
      if (!a.isTaxLot && b.isTaxLot) return 1;

      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;

      if (a.isActiveOnMap && !b.isActiveOnMap) return -1;
      if (!a.isActiveOnMap && b.isActiveOnMap) return 1;

      if (Math.abs(a.percentageNum - b.percentageNum) > 0.1) {
        return b.percentageNum - a.percentageNum;
      }

      return a.label.localeCompare(b.label);
    });
  }, [
    feature,
    selectedFeature,
    intersectingFeatures,
    layerSchemas?.value,
    layerWithRootEditTemplate?.value,
    isLayerActiveOnMap,
    isPointGeometry,
  ]);

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
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
    if (onSelectFeature && item.rawFeature) {
      onSelectFeature(item.rawFeature, item);
    }
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

  const handleChipKeyDown = (e: any, currentIndex: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % availableFeatures.length;
      handleSelectFeature(nextIndex, availableFeatures[nextIndex]);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + availableFeatures.length) % availableFeatures.length;
      handleSelectFeature(prevIndex, availableFeatures[prevIndex]);
    }
  };

  const activeProperties = useMemo(() => {
    const activeItem = availableFeatures[safeLayerIndex] || availableFeatures[0];
    return activeItem?.properties || {};
  }, [availableFeatures, safeLayerIndex]);

  const filteredEntries = useMemo(() => {
    const ignoredKeys = new Set([
      "geometry",
      "coordinates",
      "type",
      "layer",
      "layerschemaid",
      "layerschemaname",
      "layer_name",
      "layer_schema_id",
      "layer_schema_name",
      "_layerid",
      "_initialtab",
      "ispointinspection",
      "source",
      "origem_perimetro",
      "origem_fiu",
      "totalarea",
      "totalareapercentage",
      "smallerpolygonareapercentage",
    ]);

    const entries = Object.entries(activeProperties).filter(([key]) => {
      if (key.startsWith("__")) return false;
      const lowerKey = key.toLowerCase().replace(/[-_\s]+/g, "");
      if (ignoredKeys.has(key) || ignoredKeys.has(lowerKey)) return false;
      return true;
    });

    if (!searchTerm.trim()) return entries;

    const term = searchTerm.toLowerCase();
    return entries.filter(([key, value]) => {
      const label = formatAttributeLabel(key).toLowerCase();
      const valStr = String(value ?? "").toLowerCase();
      return label.includes(term) || key.toLowerCase().includes(term) || valStr.includes(term);
    });
  }, [activeProperties, searchTerm]);

  const handleCopy = (key: string, value: string, displayLabel: string) => {
    void navigator.clipboard.writeText(value);
    setCopiedKey(key);
    toastSuccess(`Copiado: ${displayLabel}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const activeItem = availableFeatures[safeLayerIndex] || availableFeatures[0];

  if (availableFeatures.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <FileSpreadsheet className="h-10 w-10 opacity-40 mb-2 text-primary" aria-hidden="true" />
        <p className="text-sm font-semibold text-foreground">Nenhum atributo encontrado</p>
        <p className="text-xs mt-1 max-w-xs text-muted-foreground">
          Clique em um elemento ou desenhe uma geometria no mapa para consultar seus dados cadastrais.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={tableContainerRef}
      className={cn("flex flex-col w-full text-foreground space-y-3 p-3 select-text pointer-events-auto", className)}
      role="region"
      aria-label="Tabela de atributos da geometria consultada"
    >
      {/* Feições identificadas - Chips ultra-compactos agrupados lado a lado */}
      {availableFeatures.length > 0 && (
        <div className="space-y-1 rounded-lg border border-border/70 bg-muted/10 p-2 shadow-2xs">
          <div className="flex items-center justify-between gap-1.5 px-0.5 text-[10.5px] font-semibold text-muted-foreground">
            <div className="flex items-center gap-1">
              <Layers className="h-3 w-3 text-primary" aria-hidden="true" />
              <span>
                {availableFeatures.length === 1
                  ? "Feição selecionada (1 feição):"
                  : `Feições das camadas (${availableFeatures.length}):`}
              </span>
            </div>
            <span className="text-[9.5px] text-muted-foreground/80 font-normal hidden sm:inline">
              Clique para alternar a feição
            </span>
          </div>

          <div
            className="flex items-center gap-1 flex-wrap"
            role="tablist"
            aria-label="Lista de feições das camadas identificadas"
          >
            {availableFeatures.map((item, idx) => {
              const isSelected = safeLayerIndex === idx;
              return (
                <button
                  key={`${item.label}-${idx}`}
                  type="button"
                  role="tab"
                  id={`tab-layer-${idx}`}
                  aria-selected={isSelected}
                  aria-controls={`panel-layer-${idx}`}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => handleSelectFeature(idx, item)}
                  onKeyDown={(e) => handleChipKeyDown(e, idx)}
                  className={cn(
                    "h-6 px-2 rounded-md text-[10.5px] font-medium transition-all border flex items-center gap-1 shrink-0 select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-2xs font-semibold"
                      : "bg-background text-foreground border-border/70 hover:bg-muted/60 hover:border-primary/40"
                  )}
                  aria-label={`${item.label}${item.percentage ? `, sobreposição de ${item.percentage}` : ""}${item.isActiveOnMap ? ", camada visível no mapa" : ""}`}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      isSelected
                        ? "bg-primary-foreground"
                        : item.isActiveOnMap
                          ? "bg-emerald-500"
                          : "bg-muted-foreground/40"
                    )}
                    aria-hidden="true"
                  />
                  <span className="truncate max-w-[150px] leading-none">{item.label}</span>

                  {/* Porcentagem de Intersecção no Chip */}
                  {item.percentage && (
                    <span
                      className={cn(
                        "text-[8.5px] font-bold px-1 py-0.2 rounded-xs leading-none shrink-0",
                        isSelected
                          ? "bg-primary-foreground/25 text-primary-foreground"
                          : "bg-primary/10 text-primary border border-primary/20"
                      )}
                      title={`Sobreposição territorial de ${item.percentage}`}
                    >
                      {item.percentage}
                    </span>
                  )}

                  {/* Tag de Ativa no mapa */}
                  {item.isActiveOnMap && (
                    <span
                      className={cn(
                        "text-[8px] font-semibold px-1 py-0.2 rounded-xs leading-none shrink-0",
                        isSelected
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      )}
                      title="Esta camada está ligada e visível no mapa"
                    >
                      Ativa
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Input with Clear Button */}
      <div className="relative">
        <label htmlFor="search-attributes-input" className="sr-only">
          Buscar atributo ou valor nesta camada
        </label>
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          id="search-attributes-input"
          type="text"
          placeholder="Buscar atributo ou valor nesta camada..."
          value={searchTerm}
          onInput={(e) => setSearchTerm(e.currentTarget.value)}
          className="h-8 pl-8 pr-8 text-xs bg-background focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Buscar atributo ou valor na camada selecionada"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            title="Limpar busca"
            aria-label="Limpar termo de busca"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Table content */}
      <div
        id={`panel-layer-${safeLayerIndex}`}
        role="tabpanel"
        aria-labelledby={`tab-layer-${safeLayerIndex}`}
      >
        {filteredEntries.length === 0 ? (
          <div
            className="p-6 text-center text-xs text-muted-foreground rounded-xl border border-border bg-card space-y-1"
            role="status"
            aria-live="polite"
          >
            <p className="font-semibold text-foreground">Nenhum atributo encontrado para &ldquo;{searchTerm}&rdquo;</p>
            <p className="text-[11px]">Tente buscar por outro termo ou limpe o campo de busca.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <table
              className="w-full text-left text-xs border-collapse"
              aria-label={`Tabela de atributos de ${activeItem?.label || "camada selecionada"}`}
            >
              <caption className="sr-only">
                Atributos cadastrais e valores da camada {activeItem?.label || "selecionada"}
              </caption>
              <thead>
                <tr className="border-b border-border bg-muted/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
                  <th scope="col" className="py-2.5 px-3.5 w-[42%] font-medium border-r border-border/50">
                    Atributo
                  </th>
                  <th scope="col" className="py-2.5 px-3.5 w-[48%] font-medium">
                    Valor
                  </th>
                  <th scope="col" className="py-2.5 px-2 w-[10%] text-center font-medium border-l border-border/50">
                    Copiar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredEntries.map(([key, rawValue], rowIdx) => {
                  const label = formatAttributeLabel(key);
                  const displayLabel = label || key;
                  const { display, isUrl, isNumeric } = formatAttributeValue(rawValue, key);
                  const isCopied = copiedKey === key;
                  const isEvenRow = rowIdx % 2 === 1;

                  return (
                    <tr
                      key={key}
                      className={cn(
                        "group transition-colors",
                        isEvenRow
                          ? "bg-muted/35 dark:bg-muted/15 hover:bg-primary/[0.08]"
                          : "bg-background hover:bg-primary/[0.05]"
                      )}
                    >
                      {/* Coluna Atributo */}
                      <th
                        scope="row"
                        className="py-2.5 px-3.5 align-top font-semibold text-foreground border-r border-border/40 select-text text-left w-[42%]"
                      >
                        <span className="font-semibold text-foreground">{displayLabel}</span>
                      </th>

                      {/* Coluna Valor */}
                      <td className="py-2.5 px-3.5 align-top select-text w-[48%]">
                        {isUrl ? (
                          <a
                            href={display}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-medium break-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-xs"
                            aria-label={`Acessar link externo: ${displayLabel}`}
                          >
                            <span>Acessar link</span>
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        ) : typeof rawValue === "boolean" ? (
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
                              rawValue
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {display}
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "text-foreground break-words leading-relaxed select-text",
                              isNumeric && "font-mono font-medium text-foreground/95"
                            )}
                          >
                            {display}
                          </span>
                        )}
                      </td>

                      {/* Coluna Copiar */}
                      <td className="py-2 px-2 align-middle text-center border-l border-border/40 w-[10%]">
                        <button
                          type="button"
                          onClick={() => handleCopy(key, display, displayLabel)}
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-md transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                            isCopied
                              ? "bg-emerald-500/15 text-emerald-600 font-semibold"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground opacity-60 group-hover:opacity-100"
                          )}
                          title={`Copiar valor de ${displayLabel}`}
                          aria-label={`Copiar valor de ${displayLabel}: ${display}`}
                        >
                          {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
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
      <div
        className="px-1 flex items-center justify-between text-[11px] text-muted-foreground pt-1"
        aria-live="polite"
      >
        <span>
          {filteredEntries.length === 1
            ? "1 atributo listado"
            : `${filteredEntries.length} atributos listados`}
          {searchTerm && ` (filtrado de ${Object.keys(activeProperties).length})`}
        </span>
        <span className="text-[10px] text-muted-foreground/80">Dados oficiais · Urbis</span>
      </div>
    </div>
  );
};
