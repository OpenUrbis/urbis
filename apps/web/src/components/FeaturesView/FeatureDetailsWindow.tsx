import { useState, useEffect, useMemo, useRef } from "preact/hooks";
import { Button, cn, Tabs, TabsList, TabsTrigger, TabsContent } from "@open-urbis/map-ui";
import {
  FileSpreadsheet,
  Maximize2,
  Minus,
  X,
  Eye,
  Edit3,
  Sparkles,
  MapPin,
  SquarePen,
  Download,
  ExternalLink,
  Loader2,
  TableProperties,
} from "lucide-react";
import { useMapContext } from "../../hooks/useMapContext";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import {
  canOpenFiuFromGeometry,
  getFeatureAreaSquareMeters,
  buildGeometryFiuUrl,
  buildTaxLotFiuUrl,
  hasTaxLotFiuParams,
  normalizeGeoJsonToWgs84,
} from "../../utils/fiu";
import { FiuDisclaimerModal } from "../FiuDisclaimerModal";
import { ViewTemplate } from "../ViewTemplate";
import {
  FeatureAttributesTable,
  getFeatureDisplayLabel,
  findLayerSchema,
  getBoundsFromFeature,
} from "./FeatureAttributesTable";
import { exportAttributesToCsv } from "../../utils/exportSpreadsheet";
import { LegisInformationBlock } from "../LayerController/LayerMetadataPanel";

const createMicroPointFeature = (lat: number, lon: number) => {
  const sideMeters = 0.01; // micro-geometry for point query
  const halfMeters = sideMeters / 2;
  const deltaLat = halfMeters / 111320;
  const deltaLon = halfMeters / (111320 * Math.cos((lat * Math.PI) / 180));

  const minLat = lat - deltaLat;
  const maxLat = lat + deltaLat;
  const minLon = lon - deltaLon;
  const maxLon = lon + deltaLon;

  return {
    type: "Feature" as const,
    id: `point-inspection-${Date.now()}`,
    properties: {
      layer: "Consulta de Atributos Pontual",
      latitude: lat,
      longitude: lon,
      isPointInspection: true,
    },
    geometry: {
      type: "Polygon" as const,
      coordinates: [
        [
          [minLon, minLat],
          [maxLon, minLat],
          [maxLon, maxLat],
          [minLon, maxLat],
          [minLon, minLat],
        ],
      ],
    },
  };
};

export const FeatureDetailsWindow = () => {
  const { selectedFeatures, flyTo, zoom, layerSchemas, activeHighlightFeature, layerWithRootEditTemplate } = useMapContext();
  const polygonEdit = usePolygonEditContext();
  const { isEditing, data: polygonData, feature: polygonFeature, editFeature, setIsEditing, loading: polygonLoading } = polygonEdit;
  const { isProspectiveSearchActive, drawerOpen } = useNavigationContext();

  const isEditingPolygon = Boolean(isEditing.value);
  const currentSelection = selectedFeatures.value?.[0];
  const hasSelectedFeature = Boolean(currentSelection?.feature && Object.keys(currentSelection.feature).length > 0);
  const hasPolygonData = Boolean(polygonData);
  const isPolygonLoading = Boolean(polygonLoading);
  const isPointInspection = Boolean(
    polygonFeature.value?.properties?.isPointInspection ||
    polygonFeature.value?.geometry?.type === "Point"
  );

  const hasActiveContent =
    !isEditingPolygon &&
    (hasSelectedFeature || hasPolygonData || isPointInspection || isPolygonLoading) &&
    !isProspectiveSearchActive.value;

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<"template" | "table">("table");
  const [selectedInspectFeature, setSelectedInspectFeature] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFiuDisclaimer, setShowFiuDisclaimer] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
      activeHighlightFeature.value = null;
    };
  }, [activeHighlightFeature]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Root feature representing the query or selection on the map
  const rootFeature = useMemo(() => {
    if (currentSelection?.feature) {
      return {
        ...currentSelection.feature,
        ...(polygonData ? { response: polygonData } : {}),
      };
    }
    if (polygonFeature.value) {
      return {
        ...polygonFeature.value,
        ...(polygonData ? { response: polygonData } : {}),
      };
    }
    if (polygonData) {
      return polygonData;
    }
    return null;
  }, [currentSelection?.feature, polygonFeature.value, polygonData]);

  // Main active feature for the window
  const activeFeature = rootFeature;

  // Check if active selection/query is a point geometry
  const isPoint = useMemo(() => {
    if (!activeFeature && !polygonFeature.value) return false;
    const feat = (activeFeature || polygonFeature.value) as any;
    const geom = feat?.geometry || feat;
    const isPointGeom = geom?.type === "Point";
    const isPointInspect = Boolean(
      feat?.properties?.isPointInspection ||
      (polygonFeature.value as any)?.properties?.isPointInspection ||
      (currentSelection?.feature as any)?.properties?.isPointInspection
    );
    return isPointGeom || isPointInspect;
  }, [activeFeature, polygonFeature.value, currentSelection?.feature]);

  // Intersecting features list if from polygon analysis
  const intersectingFeatures = useMemo(() => {
    if (polygonData && Array.isArray(polygonData.features)) {
      return polygonData.features.filter((feat: any) => {
        if (isPoint) return true;
        const p = feat?.properties || {};
        const pct = Number(p.totalAreaPercentage);
        if (p.totalAreaPercentage !== undefined && !isNaN(pct) && pct < 0.05) {
          return false;
        }
        return true;
      });
    }
    return [];
  }, [polygonData, isPoint]);

  // Effective feature currently inspected (if a layer chip is selected, use it, otherwise pick in priority order)
  const effectiveFeature = useMemo(() => {
    if (selectedInspectFeature) return selectedInspectFeature;

    // If rootFeature is a real layer feature (not synthetic point/perimeter), use it
    if (rootFeature) {
      const p = (rootFeature.properties as Record<string, unknown>) || {};
      const layerStr = String(p.layer || p.source || rootFeature.id || "").toLowerCase();
      const isPerimOrSynthetic =
        Boolean(p.isPointInspection) ||
        Boolean(p.origem_perimetro) ||
        layerStr.includes("perímetro") ||
        layerStr.includes("perimetro") ||
        layerStr.includes("geometria selecionada") ||
        layerStr.includes("ponto consultado") ||
        layerStr.includes("ponto de inspeção") ||
        layerStr.includes("consulta pontual") ||
        String(rootFeature.id || "").startsWith("perimeter-");

      if (!isPerimOrSynthetic) {
        return rootFeature;
      }
    }

    // Priority 1: Base layer configured for editing (layerWithRootEditTemplate)
    if (intersectingFeatures && intersectingFeatures.length > 0) {
      const rootEditId = (layerWithRootEditTemplate?.value || "").trim().toLowerCase();
      if (rootEditId) {
        const baseMatch = intersectingFeatures.find((f: any) => {
          const fp = f?.properties || {};
          const lId = String(fp.layerSchemaId || fp.layer || f.id || "").toLowerCase().trim();
          return lId === rootEditId || lId.includes(rootEditId) || rootEditId.includes(lId);
        });
        if (baseMatch) return baseMatch;
      }

      // Priority 2: First Tax Lot (Lote Fiscal)
      const lotMatch = intersectingFeatures.find((f: any) => {
        if (hasTaxLotFiuParams(f)) return true;
        const fp = f?.properties || {};
        const lId = String(fp.layer || fp.source || fp.layerSchemaName || f.id || "").toLowerCase();
        return lId.includes("lote_fiscal") || lId.includes("lotes_fiscais") || lId.includes("lote fiscal") || lId.includes("lotes fiscais") || lId === "lotes" || lId === "lote";
      });
      if (lotMatch) return lotMatch;

      // Priority 3: First intersecting layer feature
      return intersectingFeatures[0];
    }

    return rootFeature;
  }, [selectedInspectFeature, rootFeature, intersectingFeatures, layerWithRootEditTemplate?.value]);

  // Check if effective inspected feature is purely a point without polygon or tax lot
  const isEffectivePoint = useMemo(() => {
    if (!effectiveFeature) return false;
    const geom = effectiveFeature.geometry || effectiveFeature;
    const isPointGeom = geom?.type === "Point";
    const isPointInspect = Boolean(effectiveFeature.properties?.isPointInspection);
    const hasLotParams = hasTaxLotFiuParams(effectiveFeature);
    return (isPointGeom || isPointInspect) && !hasLotParams;
  }, [effectiveFeature]);

  // Derive template for active feature (only when explicitly configured on the layer schema)
  const activeTemplate = useMemo(() => {
    if (
      currentSelection?.feature &&
      Array.isArray(currentSelection.template) &&
      currentSelection.template.length > 0
    ) {
      return currentSelection.template;
    }
    return [];
  }, [
    currentSelection?.feature,
    currentSelection?.template,
  ]);

  // Matching Legis URL for this feature or its dynamic color value
  const matchingLegisUrl = useMemo(() => {
    if (!activeFeature) return null;
    const feat = activeFeature as any;
    const featureProps: Record<string, unknown> = feat?.properties || {};

    const schema = layerSchemas?.value?.find(
      (s) =>
        s.id === featureProps["layer"] ||
        s.id === feat?.id ||
        (s.colors &&
          s.colors.some(
            (c) =>
              c.value &&
              String(
                featureProps[s.getFillColorPropName || ""] ||
                  featureProps["tx_zoneamento_perimetro"] ||
                  featureProps["cd_zoneamento_perimetro"] ||
                  "",
              ).toLowerCase() === String(c.value).toLowerCase(),
          )),
    );

    if (schema?.colors) {
      for (const col of schema.colors) {
        if (col.legisUrl && col.value) {
          const propVal =
            featureProps[schema.getFillColorPropName || ""] ||
            featureProps["tx_zoneamento_perimetro"] ||
            featureProps["cd_zoneamento_perimetro"] ||
            featureProps["value"];
          if (
            propVal &&
            String(propVal).trim().toLowerCase() ===
              String(col.value).trim().toLowerCase()
          ) {
            return col.legisUrl;
          }
        }
      }
    }

    if (schema?.properties?.metadata?.legisLinks) {
      return schema.properties.metadata.legisLinks;
    }

    return null;
  }, [activeFeature, layerSchemas?.value]);
  const hasAdminVisualTemplate = useMemo(() => {
    return Boolean(activeTemplate && activeTemplate.length > 0);
  }, [activeTemplate]);

  const hasVisualTemplate = useMemo(() => {
    return hasAdminVisualTemplate || (Boolean(polygonData) && !isPoint);
  }, [hasAdminVisualTemplate, polygonData, isPoint]);

  // When new selection or analysis query occurs, open window immediately with appropriate default tab
  useEffect(() => {
    if (hasActiveContent) {
      setIsOpen(true);
      setIsMinimized(false);
      const isInitialTableRequested = (currentSelection?.feature as any)?._initialTab === "table";
      if (isInitialTableRequested) {
        setActiveTab("table");
      } else if (hasAdminVisualTemplate) {
        setActiveTab("template");
      } else {
        setActiveTab("table");
      }
    }
  }, [hasActiveContent, currentSelection?.feature, polygonData, polygonFeature.value, isPolygonLoading, hasAdminVisualTemplate]);

  // Auto-fetch intersecting layers for rootFeature
  const lastFetchedFeatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (!rootFeature) {
      lastFetchedFeatureRef.current = null;
      return;
    }

    const p = (rootFeature.properties as Record<string, unknown>) || {};
    const featureKey =
      rootFeature.id ||
      p.id ||
      (p.cd_setor_fiscal && p.cd_quadra_fiscal && p.cd_lote
        ? `${p.cd_setor_fiscal}.${p.cd_quadra_fiscal}.${p.cd_lote}`
        : null) ||
      p.cd_sql ||
      (p.latitude !== undefined && p.longitude !== undefined ? `${p.latitude},${p.longitude}` : null) ||
      JSON.stringify(rootFeature.geometry?.coordinates?.[0]?.[0] || rootFeature.geometry?.coordinates || p);

    const stringKey = String(featureKey);
    if (lastFetchedFeatureRef.current === stringKey) {
      return;
    }

    const geom = rootFeature.geometry || rootFeature;
    const isPolygon = geom?.type === "Polygon" || geom?.type === "MultiPolygon";
    const isPointGeom = geom?.type === "Point" || Boolean(p.isPointInspection);

    let queryGeom: any = null;

    if (isPolygon) {
      queryGeom = rootFeature;
    } else if (isPointGeom || (p.latitude !== undefined && p.longitude !== undefined)) {
      let lat = Number(p.latitude);
      let lon = Number(p.longitude);
      if (isNaN(lat) && geom?.coordinates && typeof geom.coordinates[0] === "number") {
        lon = Number(geom.coordinates[0]);
        lat = Number(geom.coordinates[1]);
      }
      if (!isNaN(lat) && !isNaN(lon)) {
        queryGeom = createMicroPointFeature(lat, lon);
      }
    } else if (geom?.coordinates && Array.isArray(geom.coordinates)) {
      try {
        if (typeof geom.coordinates[0] === "number" && typeof geom.coordinates[1] === "number") {
          queryGeom = createMicroPointFeature(Number(geom.coordinates[1]), Number(geom.coordinates[0]));
        }
      } catch (e) {
        console.warn("Could not create query geometry for rootFeature", e);
      }
    }

    if (queryGeom) {
      lastFetchedFeatureRef.current = stringKey;
      polygonEdit.fetchData(queryGeom);
    }
  }, [rootFeature]);

  // Calculate area (only relevant for polygons)
  const areaSquareMeters = useMemo(() => {
    if (!effectiveFeature || isEffectivePoint) return 0;
    return getFeatureAreaSquareMeters(effectiveFeature);
  }, [effectiveFeature, isEffectivePoint]);

  const formattedArea = useMemo(() => {
    if (isEffectivePoint || !areaSquareMeters || areaSquareMeters <= 0) return null;
    return `${areaSquareMeters.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} m²`;
  }, [areaSquareMeters, isEffectivePoint]);

  // Feature com geometria de perímetro real (para emissão de FIU ou edição)
  const perimeterFeature = useMemo(() => {
    if (isPoint) return null;

    if (polygonFeature.value) {
      const g = (polygonFeature.value as any).geometry || polygonFeature.value;
      if (g?.type === "Polygon" || g?.type === "MultiPolygon") {
        return polygonFeature.value;
      }
    }
    if (rootFeature) {
      const g = (rootFeature as any).geometry || rootFeature;
      if (g?.type === "Polygon" || g?.type === "MultiPolygon") {
        return rootFeature;
      }
    }
    if (currentSelection?.feature) {
      const g = (currentSelection.feature as any).geometry || currentSelection.feature;
      if (g?.type === "Polygon" || g?.type === "MultiPolygon") {
        return currentSelection.feature;
      }
    }
    if (selectedInspectFeature) {
      const g = (selectedInspectFeature as any).geometry || selectedInspectFeature;
      if (g?.type === "Polygon" || g?.type === "MultiPolygon") {
        return selectedInspectFeature;
      }
    }
    return null;
  }, [isPoint, polygonFeature.value, rootFeature, currentSelection?.feature, selectedInspectFeature]);

  // Target feature to evaluate FIU generation:
  // Available whenever an inspected item, root feature, or intersecting layer is a polygon / tax lot
  const targetForFiu = useMemo(() => {
    if (selectedInspectFeature) {
      if (
        hasTaxLotFiuParams(selectedInspectFeature) ||
        canOpenFiuFromGeometry(selectedInspectFeature).ok
      ) {
        return selectedInspectFeature;
      }
    }
    if (perimeterFeature) return perimeterFeature;
    if (rootFeature) {
      if (
        hasTaxLotFiuParams(rootFeature) ||
        canOpenFiuFromGeometry(rootFeature).ok
      ) {
        return rootFeature;
      }
    }
    if (polygonFeature.value && canOpenFiuFromGeometry(polygonFeature.value).ok) {
      return polygonFeature.value;
    }
    if (intersectingFeatures && intersectingFeatures.length > 0) {
      const withTaxLot = intersectingFeatures.find((f: any) =>
        hasTaxLotFiuParams(f),
      );
      if (withTaxLot) return withTaxLot;
      const withGeom = intersectingFeatures.find(
        (f: any) => canOpenFiuFromGeometry(f).ok,
      );
      if (withGeom) return withGeom;
    }
    return null;
  }, [
    selectedInspectFeature,
    perimeterFeature,
    rootFeature,
    polygonFeature.value,
    intersectingFeatures,
  ]);

  // Check if FIU can be generated
  const fiuCheck = useMemo(() => {
    if (!targetForFiu) {
      return { ok: false, reason: "A FIU pode ser gerada a partir de perímetros poligonais ou lotes fiscais." };
    }
    if (hasTaxLotFiuParams(targetForFiu)) {
      return { ok: true };
    }
    return canOpenFiuFromGeometry(targetForFiu);
  }, [targetForFiu]);

  // Derive header title - representing the primary selected item
  const headerTitle = useMemo(() => {
    const feat = effectiveFeature;
    if (feat?.properties && Object.keys(feat.properties).length > 0) {
      const p = feat.properties as Record<string, unknown>;
      const rawLayer = String(p["layer"] || p["source"] || "");
      const label = getFeatureDisplayLabel(p, rawLayer, layerSchemas?.value);
      if (label && label !== "Dados da Geometria") {
        return label;
      }
    }
    if (hasPolygonData) {
      return isPoint ? "Consulta Territorial no Ponto" : "Análise Territorial";
    }
    if (isPoint) {
      const lat = rootFeature?.properties?.latitude;
      const lon = rootFeature?.properties?.longitude;
      if (lat !== undefined && lon !== undefined) {
        return `Ponto (${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)})`;
      }
      return "Ponto Consultado no Mapa";
    }
    return "Dados da Geometria";
  }, [effectiveFeature, hasPolygonData, rootFeature, isPoint, layerSchemas?.value]);

  // Handle creating perimeter based on actual geometry (or point location if no polygon)
  const handleCreateOrEditPerimeter = () => {
    const target = selectedInspectFeature || effectiveFeature || currentSelection?.feature;
    if (!target) return;

    const normalized = normalizeGeoJsonToWgs84(target);
    const targetGeom = normalized?.geometry || target?.geometry || target;

    // If target has real polygon/multipolygon geometry, use it as perimeter!
    if (targetGeom && (targetGeom.type === "Polygon" || targetGeom.type === "MultiPolygon")) {
      const p = (target.properties as Record<string, unknown>) || {};
      const perimeterFeature = {
        type: "Feature" as const,
        id: `perimeter-${Date.now()}`,
        properties: {
          ...p,
          layer: "Perímetro de Análise",
          origem_perimetro: getFeatureDisplayLabel(p, String(p.layer || p.source || ""), layerSchemas?.value),
        },
        geometry: targetGeom,
      };

      editFeature(perimeterFeature);
      setIsEditing(true);
      setIsOpen(false);

      const bounds = getBoundsFromFeature(perimeterFeature);
      if (bounds) {
        flyTo?.({ bounds, padding: 120 });
      }
      return;
    }

    // Fallback: create 50m initial square at point coordinates
    let lat = target.properties?.latitude;
    let lon = target.properties?.longitude;

    if (lat === undefined || lon === undefined) {
      if (targetGeom?.type === "Point" && Array.isArray(targetGeom.coordinates) && typeof targetGeom.coordinates[0] === "number") {
        lon = targetGeom.coordinates[0];
        lat = targetGeom.coordinates[1];
      }
    }

    if (lat === undefined || lon === undefined) {
      lat = -23.5505;
      lon = -46.6333;
    }

    const sideMeters = 50;
    const halfMeters = sideMeters / 2;
    const deltaLat = halfMeters / 111320;
    const deltaLon = halfMeters / (111320 * Math.cos((lat * Math.PI) / 180));

    const minLat = lat - deltaLat;
    const maxLat = lat + deltaLat;
    const minLon = lon - deltaLon;
    const maxLon = lon + deltaLon;

    const squareFeature = {
      type: "Feature" as const,
      id: `perimeter-${Date.now()}`,
      properties: {
        layer: "Perímetro de Análise",
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [minLon, minLat],
            [maxLon, minLat],
            [maxLon, maxLat],
            [minLon, maxLat],
            [minLon, minLat],
          ],
        ],
      },
    };

    editFeature(squareFeature);
    setIsEditing(true);
    setIsOpen(false);

    if (flyTo) {
      flyTo({
        center: [lon, lat],
        zoom: Math.max(zoom?.value || 10, 16.5),
      });
    }
  };

  const openInNewTab = (url: string) => {
    try {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => {
        if (anchor.parentNode) {
          document.body.removeChild(anchor);
        }
      }, 150);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Open FIU directly on external page (in new tab)
  const handleOpenFiu = () => {
    const targetFeature = targetForFiu || perimeterFeature || rootFeature || polygonFeature.value;
    if (!targetFeature) return;

    if (hasTaxLotFiuParams(targetFeature)) {
      const url = buildTaxLotFiuUrl(targetFeature);
      if (url) {
        openInNewTab(url);
        return;
      }
    }

    const geom = targetFeature.geometry || targetFeature;
    const hasPolygonGeom = geom?.type === "Polygon" || geom?.type === "MultiPolygon";

    if (hasPolygonGeom) {
      const url = buildGeometryFiuUrl({
        feature: targetFeature,
        response: polygonData || targetFeature,
        template: activeTemplate?.length ? activeTemplate : [],
      });
      openInNewTab(url);
      return;
    }

    const url = buildGeometryFiuUrl({
      feature: targetFeature,
      response: polygonData || targetFeature,
      template: activeTemplate?.length ? activeTemplate : [],
    });
    openInNewTab(url);
  };

  const handleOpenFiuClick = () => {
    if (!fiuCheck.ok) return;
    setShowFiuDisclaimer(true);
  };

  const handleEditGeometry = () => {
    handleCreateOrEditPerimeter();
  };

  const handleInspectFeatureOnMap = (feat: any) => {
    if (!feat) return;
    try {
      const normalized = normalizeGeoJsonToWgs84(feat);
      activeHighlightFeature.value = normalized || feat;
      const geom = feat?.geometry || feat;
      if (geom?.coordinates) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const coords = geom.type === "Point"
          ? [[geom.coordinates[0], geom.coordinates[1]]]
          : geom.type === "Polygon"
            ? geom.coordinates[0]
            : Array.isArray(geom.coordinates?.[0]?.[0])
              ? geom.coordinates.flat(2)
              : geom.coordinates;

        if (Array.isArray(coords)) {
          coords.forEach((pt: any) => {
            if (Array.isArray(pt) && typeof pt[0] === "number" && typeof pt[1] === "number") {
              if (pt[0] < minX) minX = pt[0];
              if (pt[1] < minY) minY = pt[1];
              if (pt[0] > maxX) maxX = pt[0];
              if (pt[1] > maxY) maxY = pt[1];
            }
          });
        }
        if (Number.isFinite(minX) && Number.isFinite(maxX)) {
          if (minX === maxX && minY === maxY) {
            flyTo?.({ center: [minX, minY], zoom: Math.max(zoom?.value || 10, 16.5) });
          } else {
            flyTo?.({ bounds: [[minX, minY], [maxX, maxY]], padding: 120 });
          }
        }
      }
    } catch (e) {
      console.warn("Could not highlight feature from summary", e);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedInspectFeature(null);
    lastFetchedFeatureRef.current = null;
    selectedFeatures.value = [];
    activeHighlightFeature.value = null;
    polygonEdit.reset();
    polygonEdit.setFeature(null);
    polygonEdit.drawRef?.current?.deleteAll();
  };

  const handleExportAll = () => {
    const list = [
      {
        label: headerTitle,
        layerSchema: findLayerSchema(
          activeFeature?.properties || {},
          undefined,
          layerSchemas?.value,
          activeFeature,
        ),
        properties: activeFeature?.properties || {},
      },
    ];

    if (Array.isArray(intersectingFeatures)) {
      intersectingFeatures.forEach((f, idx) => {
        if (f?.properties) {
          const rawLayer = String(
            f.properties.layer || f.properties.source || `Camada ${idx + 1}`,
          );
          const label = getFeatureDisplayLabel(
            f.properties,
            rawLayer,
            layerSchemas?.value,
            f,
          );
          const layerSchema = findLayerSchema(
            f.properties,
            rawLayer,
            layerSchemas?.value,
            f,
          );
          list.push({
            label,
            layerSchema,
            properties: f.properties,
          });
        }
      });
    }

    exportAttributesToCsv({
      title: headerTitle,
      calculatedArea: formattedArea,
      features: list,
    });
  };

  if (!hasActiveContent) {
    return null;
  }

  return (
    <>
      {/* Floating Details Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Janela de detalhes e atributos da geometria"
          className={cn(
            "pointer-events-auto fixed bottom-0 right-0 md:right-4 lg:right-14 z-[10090] bg-background rounded-t-2xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] border border-border flex flex-col transition-all duration-300 ease-in-out",
            isMinimized
              ? "w-full md:w-[340px] h-[50px]"
              : "w-full md:w-[76vw] lg:w-[740px] xl:w-[810px] h-[75vh] md:h-[535px] max-h-[75vh]"
          )}
          style={{
            ...(!isMinimized && !isMobile
              ? { maxWidth: drawerOpen.value ? "calc(100% - 460px)" : "calc(100% - 32px)" }
              : {}),
            zIndex: 10090,
            pointerEvents: "auto",
          }}
        >
          {/* Window Header */}
          <div
            role="button"
            tabIndex={0}
            aria-expanded={!isMinimized}
            aria-label={isMinimized ? "Maximizar janela de atributos" : "Minimizar janela de atributos"}
            className="bg-card text-foreground px-4 py-2.5 flex flex-col rounded-t-2xl select-none border-b border-border shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            onClick={() => setIsMinimized(!isMinimized)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsMinimized(!isMinimized);
              }
            }}
          >
            {isMobile && (
              <div className="w-8 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-1.5 shrink-0" aria-hidden="true" />
            )}
            <div className="flex justify-between items-center gap-3 w-full">
              {/* Left Section: Window Name & Current Query */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
                  {polygonLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <TableProperties className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs md:text-sm font-bold tracking-tight truncate">
                    {hasAdminVisualTemplate
                      ? "Tabela de Atributos e Visualização Avançada"
                      : Boolean(polygonData) && !isPoint
                        ? "Tabela de Atributos e Resumo Territorial"
                        : "Tabela de Atributos"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground truncate" aria-live="polite">
                    {polygonLoading ? "Consultando dados e camadas no local..." : headerTitle}
                  </p>
                </div>
              </div>

              {/* Right Section: Window Controls */}
              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                {/* Quick Export Spreadsheet */}
                <button
                  type="button"
                  onClick={handleExportAll}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors hidden sm:inline-flex focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  title="Exportar dados para planilha (.csv)"
                  aria-label="Exportar todos os atributos desta consulta para planilha CSV"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                </button>

                {/* Minimize / Maximize */}
                <button
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  title={isMinimized ? "Maximizar janela" : "Minimizar janela"}
                  aria-label={isMinimized ? "Maximizar janela de atributos" : "Minimizar janela de atributos"}
                >
                  {isMinimized ? (
                    <Maximize2 className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:ring-2 focus-visible:ring-destructive focus-visible:outline-none"
                  title="Fechar janela (Esc)"
                  aria-label="Fechar janela de atributos e limpar seleção"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Window Body - Single Unified Scroll */}
          <div
            className={cn(
              "flex-1 overflow-y-auto bg-background text-foreground flex flex-col min-h-0 pointer-events-auto select-text",
              isMinimized ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
            style={{ pointerEvents: "auto", WebkitOverflowScrolling: "touch" }}
          >
            {polygonLoading ? (
              <div className="p-8 flex flex-col items-center justify-center gap-3 text-center min-h-[260px] animate-in fade-in duration-300">
                <div className="p-3 bg-primary/10 rounded-full text-primary shadow-xs">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">Consultando dados no local</h4>
                  <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                    Verificando zoneamento, lotes fiscais e camadas urbanísticas incidentes...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Caixa "Seleção" - Informações e ações diretas da feição ativa */}
                <div className="mx-3 mt-3 rounded-xl border border-border bg-card p-3 shadow-xs space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
                        {isPoint ? <MapPin className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-foreground truncate">
                            {headerTitle}
                          </span>
                          {formattedArea && (
                            <span className="shrink-0 rounded-full bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 text-[10px] font-semibold flex items-center gap-1">
                              <span className="text-muted-foreground font-normal">Área:</span>
                              <strong>{formattedArea}</strong>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {isPoint
                            ? intersectingFeatures.length > 0
                              ? `${intersectingFeatures.length} ${intersectingFeatures.length === 1 ? "feição identificada neste ponto" : "feições das camadas identificadas"}`
                              : "Ponto consultado no mapa"
                            : intersectingFeatures.length > 0
                              ? `${intersectingFeatures.length} ${intersectingFeatures.length === 1 ? "feição incidente identificada" : "feições das camadas identificadas"}`
                              : "Perímetro selecionado no mapa"}
                        </p>
                      </div>
                    </div>

                    {/* Ações da Seleção */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {/* Criar perímetro (com base na geometria real da feição ou no ponto) */}
                      {!polygonLoading && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCreateOrEditPerimeter}
                          className="h-8 px-3 text-xs font-medium rounded-lg gap-1.5 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary"
                          title={
                            isEffectivePoint
                              ? "Criar uma área de 50 metros ao redor deste ponto para análise urbanística e FIU"
                              : "Carregar o contorno desta geometria para editar no mapa ou emitir FIU"
                          }
                          aria-label={
                            isEffectivePoint
                              ? "Criar perímetro de 50 metros neste ponto"
                              : `Criar perímetro a partir da feição ${headerTitle}`
                          }
                        >
                          <SquarePen className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                          <span>
                            {isEffectivePoint
                              ? "Criar perímetro de 50m"
                              : "Criar perímetro da feição"}
                          </span>
                        </Button>
                      )}

                      {/* Iniciar FIU */}
                      {fiuCheck.ok && !polygonLoading && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={handleOpenFiuClick}
                          className="h-8 px-3.5 text-xs font-semibold rounded-lg gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs focus-visible:ring-2 focus-visible:ring-primary"
                          title="Abrir Ficha de Informações Urbanísticas oficial em nova aba"
                          aria-label={`Abrir Ficha de Informações Urbanísticas para ${headerTitle}`}
                        >
                          <span
                            className="h-3.5 w-3.5 shrink-0"
                            style={{
                              backgroundColor: "currentColor",
                              mask: "url(/capivara-icone.svg) no-repeat center / contain",
                              WebkitMask: "url(/capivara-icone.svg) no-repeat center / contain",
                            }}
                            aria-hidden="true"
                          />
                          <span>Iniciar FIU</span>
                          <ExternalLink className="h-3 w-3 opacity-80" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* If visual template or summary is available, show Tabs */}
                {hasVisualTemplate ? (
                  <Tabs
                    value={activeTab}
                    onValueChange={(val: string) => setActiveTab(val as "template" | "table")}
                    className="flex-1 flex flex-col min-h-0 mt-1"
                  >
                    <div className="px-4 py-1.5 border-b bg-muted/10 flex items-center justify-between">
                      <TabsList className="h-8 bg-muted/60 p-0.5 rounded-lg">
                        {hasAdminVisualTemplate && (
                          <TabsTrigger
                            value="template"
                            className="h-7 px-3 text-xs font-medium rounded-md gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Visualização avançada</span>
                          </TabsTrigger>
                        )}
                        <TabsTrigger
                          value="table"
                          className="h-7 px-3 text-xs font-medium rounded-md gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          <span>Tabela de atributos</span>
                        </TabsTrigger>
                        {!hasAdminVisualTemplate && Boolean(polygonData) && !isPoint && (
                          <TabsTrigger
                            value="template"
                            className="h-7 px-3 text-xs font-medium rounded-md gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Resumo territorial</span>
                          </TabsTrigger>
                        )}
                      </TabsList>
                    </div>

                    {/* Tab 1: Attribute Table (Default First) */}
                    <TabsContent value="table" className="m-0 p-0 focus-visible:outline-none">
                      <FeatureAttributesTable
                        feature={rootFeature}
                        intersectingFeatures={intersectingFeatures}
                        selectedFeature={selectedInspectFeature}
                        onSelectFeature={(feat) => setSelectedInspectFeature(feat)}
                        title={headerTitle}
                        calculatedArea={formattedArea}
                        canOpenFiu={fiuCheck.ok && !polygonLoading}
                        onOpenFiu={handleOpenFiuClick}
                      />
                    </TabsContent>

                    {/* Tab 2: Template View */}
                    <TabsContent value="template" className="m-0 p-3 space-y-3 focus-visible:outline-none">
                      {activeTemplate.length > 0 ? (
                        <>
                          <ViewTemplate
                            templates={activeTemplate}
                            data={activeFeature || {}}
                            rootTemplate={activeTemplate}
                          />
                          {matchingLegisUrl && (
                            <div className="pt-2">
                              <LegisInformationBlock
                                rawLegisLinks={matchingLegisUrl}
                                apiBaseUrl={import.meta.env.VITE_API_URL || "/api"}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-4 max-w-3xl mx-auto">
                          <div className="rounded-xl border bg-card p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                {isPoint ? "Camadas Incidentes no Ponto" : "Resultado da Análise Territorial"}
                              </h4>
                              {!isPoint && formattedArea && (
                                <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-bold">
                                  {formattedArea}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Foram identificadas {intersectingFeatures.length} feições das camadas sobre esta localização.
                              Consulte os parâmetros detalhados na aba <strong>Tabela de atributos</strong>.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {intersectingFeatures.slice(0, 10).map((feat: any, idx: number) => {
                              const featureProps = (feat?.properties as Record<string, unknown>) || {};
                              const rawLayer = String(featureProps["layer"] || featureProps["nm_tema_divisao_pde"] || `Camada ${idx + 1}`);
                              const title = getFeatureDisplayLabel(featureProps, rawLayer, layerSchemas?.value);
                              const clean = String(rawLayer || "")
                                .toLowerCase()
                                .replace(/^([a-zA-Z0-9_-]+):/, "")
                                .replace(/[_-]+/g, " ")
                                .trim();
                              const isLayerActive = layerSchemas?.value?.some((s) => {
                                if (!s.isVisible && !s.isSelected) return false;
                                if (featureProps?.layerSchemaId && String(s.id) === String(featureProps.layerSchemaId)) return true;
                                const sId = (s.id || "")
                                  .toLowerCase()
                                  .replace(/^([a-zA-Z0-9_-]+):/, "")
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

                              const percentage = isPoint
                                ? null
                                : featureProps["totalAreaPercentage"]
                                  ? `${Number(featureProps["totalAreaPercentage"]).toFixed(1)}%`
                                  : null;
                              const area = isPoint
                                ? null
                                : featureProps["totalArea"] && Number(featureProps["totalArea"]) > 1
                                  ? `${Number(featureProps["totalArea"]).toFixed(0)} m²`
                                  : null;

                              return (
                                <div
                                  key={idx}
                                  onClick={() => handleInspectFeatureOnMap(feat)}
                                  className="rounded-xl border bg-card p-3 space-y-2 shadow-2xs hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer group"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-xs font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                                      {title}
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {isLayerActive && (
                                        <span className="text-[9px] font-semibold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 border border-emerald-500/20">
                                          Ativa no mapa
                                        </span>
                                      )}
                                      {isPoint ? (
                                        <span className="text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5">
                                          Incidente no ponto
                                        </span>
                                      ) : (
                                        percentage && (
                                          <span className="text-[10px] font-bold rounded-full bg-primary/10 text-primary px-2 py-0.5">
                                            {percentage}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  </div>
                                  {!isPoint && area && (
                                    <p className="text-[11px] text-muted-foreground">
                                      Área incidente: <strong className="text-foreground">{area}</strong>
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1 group-hover:text-primary transition-colors font-medium">
                                      <MapPin className="h-3 w-3" />
                                      Ver no mapa
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleInspectFeatureOnMap(feat);
                                        setSelectedInspectFeature(feat);
                                        setActiveTab("table");
                                      }}
                                      className="flex items-center gap-1 hover:text-foreground text-primary font-medium"
                                    >
                                      <TableProperties className="h-3 w-3" />
                                      Ver atributos
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  /* When no visual template exists, directly show the Attribute Table */
                  <div className="flex-1 flex flex-col min-h-0 pt-1">
                    <FeatureAttributesTable
                      feature={rootFeature}
                      intersectingFeatures={intersectingFeatures}
                      selectedFeature={selectedInspectFeature}
                      onSelectFeature={(feat) => setSelectedInspectFeature(feat)}
                      title={headerTitle}
                      calculatedArea={formattedArea}
                      canOpenFiu={fiuCheck.ok && !polygonLoading}
                      onOpenFiu={handleOpenFiuClick}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Reopen Floating Button if Window is Closed */}
      {!isOpen && hasActiveContent && (
        <div className="pointer-events-auto urbis-app-panel-layer fixed bottom-24 right-4 md:right-14 z-[10090] animate-in fade-in slide-in-from-bottom-2">
          <Button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="rounded-full shadow-lg gap-2 bg-primary text-primary-foreground font-semibold px-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            aria-label={`Reabrir dados cadastrais e atributos de ${headerTitle}`}
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            <span>Dados da localização ({headerTitle})</span>
          </Button>
        </div>
      )}

      <FiuDisclaimerModal
        isOpen={showFiuDisclaimer}
        onOpenChange={(open) => setShowFiuDisclaimer(open)}
        onConfirm={handleOpenFiu}
      />
    </>
  );
};
