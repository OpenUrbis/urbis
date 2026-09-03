// @ts-nocheck
import { useSignal, useComputed } from "@preact/signals";
import { createElement, useEffect } from "react";
import ReactJson from "react-json-view";
import { Button, UrbisIcon } from "@open-urbis/map-ui";
import { Input } from "@open-urbis/map-ui";
import { Label } from "@open-urbis/map-ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@open-urbis/map-ui";
import { useMapContext } from "../../../hooks/useMapContext";
import {
  IGetConfigLayerSchema,
  IGetConfigLayerSchemaTypeEnum,
} from "../../../types/fetch-map-config-type";
import axios from "axios";
import { flattenLayerGroups } from "../../../utils/layer-utils";
import { getAuthHeaders } from "../../../utils/auth-headers";

interface WebLayerProps {
  onBack: () => void;
  onClose: () => void;
}

type ServiceType = "WMS" | "WFS";

type GeoServerCatalogEntry = {
  id: string;
  name: string;
  organization: string;
  serviceType: ServiceType;
  url: string;
  description: string;
};

type GeometryKind = "point" | "polygon" | "line" | "mixed" | "unknown";

type WfsRequestConfig = {
  version: string;
  typeNameParam: "typeName" | "typeNames";
  limitParam: "maxFeatures" | "count";
  outputFormat: string;
};

const WMS_CAPABILITIES_VERSIONS = ["1.3.0", "1.1.1"];
const WFS_CAPABILITIES_VERSIONS = ["2.0.0", "1.1.0", "1.0.0"];
const WFS_JSON_OUTPUT_FORMATS = ["application/json", "json"];
const SLUI_WMS_URL = "https://geoserver.slui.dev/geoserver/slui/wms";
const SLUI_WMS_PIN_STORAGE_KEY = "urbis:slui-wms-pinned-url";

const GEOMETRY_KIND_LABEL: Record<GeometryKind, string> = {
  point: "Pontos",
  polygon: "Polígonos",
  line: "Linhas",
  mixed: "Geometria mista",
  unknown: "Não identificada",
};

const GEOSERVER_CATALOG: GeoServerCatalogEntry[] = [
  {
    id: "funai-wfs",
    name: "FUNAI (WFS)",
    organization: "Fundação Nacional dos Povos Indígenas",
    serviceType: "WFS",
    url: "https://geoserver.funai.gov.br/geoserver/ows",
    description:
      "Referência editável para dados geográficos de terras indígenas.",
  },
  {
    id: "slui-wms",
    name: "SLUI (WMS)",
    organization: "Urbis",
    serviceType: "WMS",
    url: SLUI_WMS_URL,
    description: "Serviço WMS oficial do GeoServer SLUI.",
  },
];

const isSluiWmsUrl = (value: string) => {
  try {
    const parsed = new URL(value.trim());
    const normalizedPath = parsed.pathname.replace(/\/$/, "");
    return `${parsed.origin}${normalizedPath}` === SLUI_WMS_URL;
  } catch {
    return false;
  }
};

export const WebLayer = ({ onBack, onClose }: WebLayerProps) => {
  const { layerSchemas, layerGroups } = useMapContext();
  const savedPinnedUrl =
    typeof window !== "undefined"
      ? window.localStorage.getItem(SLUI_WMS_PIN_STORAGE_KEY) || ""
      : "";
  const url = useSignal(savedPinnedUrl);
  const serviceType = useSignal<ServiceType>(savedPinnedUrl ? "WMS" : "WFS");
  const pinnedUrl = useSignal(Boolean(savedPinnedUrl));
  const loading = useSignal(false);
  const error = useSignal("");
  const layers = useSignal<
    { name: string; title: string; abstract?: string; styles?: string[] }[]
  >([]);
  const layerSearch = useSignal("");
  const selectedLayer = useSignal("");
  const selectedGroupId = useSignal<string>("");
  const pendingSchema = useSignal<IGetConfigLayerSchema | null>(null);
  const showTechnicalJson = useSignal(false);
  const selectedCatalogId = useSignal("");
  const capabilitiesVersion = useSignal("");

  const isPinnedSluiWms =
    pinnedUrl.value && isSluiWmsUrl(url.value) && url.value === pinnedUrl.value;

  const toggleSluiWmsPin = () => {
    if (pinnedUrl.value) {
      pinnedUrl.value = "";
      window.localStorage.removeItem(SLUI_WMS_PIN_STORAGE_KEY);
      return;
    }

    if (!isSluiWmsUrl(url.value)) return;
    pinnedUrl.value = url.value;
    window.localStorage.setItem(SLUI_WMS_PIN_STORAGE_KEY, url.value);
  };

  const flatGroups = useComputed(() => flattenLayerGroups(layerGroups.value));
  const filteredLayers = useComputed(() => {
    const search = layerSearch.value.trim().toLowerCase();
    return [...layers.value]
      .sort((a, b) =>
        (a.title || a.name).localeCompare(b.title || b.name, "pt-BR"),
      )
      .filter((layer) => {
        if (!search) return true;
        return [layer.title, layer.name, layer.abstract]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      });
  });

  // Pre-select the first group (usually "Geral")
  useEffect(() => {
    if (flatGroups.value.length > 0 && !selectedGroupId.value) {
      selectedGroupId.value = flatGroups.value[0].id;
    }
  }, [flatGroups.value]);

  const getBaseUrl = (inputUrl: string) => {
    try {
      const urlObj = new URL(inputUrl.trim());
      return `${urlObj.origin}${urlObj.pathname}`;
    } catch (e) {
      return inputUrl.trim();
    }
  };

  const getElementsByLocalName = (
    node: Document | Element,
    localName: string,
  ) =>
    Array.from(node.getElementsByTagName("*")).filter(
      (item) => item.localName === localName || item.nodeName === localName,
    );

  const getDirectChildText = (node: Element, localName: string) => {
    const child = Array.from(node.children).find(
      (item) => item.localName === localName || item.nodeName === localName,
    );

    return child?.textContent?.trim() || "";
  };

  const buildWfsParams = (
    config: WfsRequestConfig,
    layerName: string,
    limit: number,
  ) => ({
    service: "WFS",
    version: config.version,
    request: "GetFeature",
    [config.typeNameParam]: layerName,
    [config.limitParam]: limit,
    outputFormat: config.outputFormat,
    srsName: "CRS:84",
  });

  const buildWfsUrl = (
    baseUrl: string,
    config: WfsRequestConfig,
    layerName: string,
    limit: number,
  ) => {
    const params = new URLSearchParams();
    Object.entries(buildWfsParams(config, layerName, limit)).forEach(
      ([key, value]) => params.set(key, String(value)),
    );

    return `${baseUrl}?${params.toString()}`;
  };

  const fetchCapabilities = async (
    inputUrl = url.value,
    inputServiceType = serviceType.value,
  ) => {
    if (!inputUrl) return;
    loading.value = true;
    error.value = "";
    layers.value = [];
    layerSearch.value = "";
    selectedLayer.value = "";
    capabilitiesVersion.value = "";

    try {
      const baseUrl = getBaseUrl(inputUrl);
      const environment = import.meta.env.VITE_API_URL || "/api";
      const versions =
        inputServiceType === "WMS"
          ? WMS_CAPABILITIES_VERSIONS
          : WFS_CAPABILITIES_VERSIONS;

      let xmlDoc: Document | null = null;
      let lastError: unknown = null;

      const headers = await getAuthHeaders().catch(() => ({}));

      for (const version of versions) {
        try {
          const response = await axios.get(`${environment}/maps/proxy`, {
            params: {
              url: baseUrl,
              service: inputServiceType,
              version,
              request: "GetCapabilities",
            },
            headers,
            timeout: 20000,
          });

          const parser = new DOMParser();
          const parsed = parser.parseFromString(response.data, "text/xml");
          const hasParserError =
            parsed.getElementsByTagName("parsererror").length > 0;

          if (!hasParserError) {
            xmlDoc = parsed;
            capabilitiesVersion.value = version;
            break;
          }
        } catch (versionError) {
          lastError = versionError;
        }
      }

      if (!xmlDoc) throw lastError || new Error("Capabilities inválido");

      const extractedLayers: {
        name: string;
        title: string;
        abstract?: string;
        styles?: string[];
      }[] = [];

      if (inputServiceType === "WMS") {
        const layerNodes = getElementsByLocalName(xmlDoc, "Layer");
        layerNodes.forEach((node) => {
          const name = getDirectChildText(node, "Name");
          const title = getDirectChildText(node, "Title") || name;
          const abstract = getDirectChildText(node, "Abstract") || undefined;
          const styles = Array.from(node.children)
            .filter(
              (child) =>
                child.localName === "Style" || child.nodeName === "Style",
            )
            .map((styleNode) => getDirectChildText(styleNode, "Name"))
            .filter(Boolean);

          if (name && !extractedLayers.some((l) => l.name === name)) {
            extractedLayers.push({ name, title, abstract, styles });
          }
        });
      } else {
        const featureTypeNodes = getElementsByLocalName(xmlDoc, "FeatureType");
        featureTypeNodes.forEach((node) => {
          const name = getDirectChildText(node, "Name");
          const title = getDirectChildText(node, "Title") || name;
          const abstract = getDirectChildText(node, "Abstract") || undefined;

          if (name && !extractedLayers.some((l) => l.name === name)) {
            extractedLayers.push({ name, title, abstract });
          }
        });
      }

      if (extractedLayers.length === 0) {
        selectedCatalogId.value = "";
        error.value = `Nenhuma camada ${inputServiceType} encontrada ou resposta inválida.`;
      } else {
        layers.value = extractedLayers.sort((a, b) =>
          (a.title || a.name).localeCompare(b.title || b.name, "pt-BR"),
        );
      }
    } catch (e) {
      console.error(`${inputServiceType} Error`, e);
      selectedCatalogId.value = "";
      const isTimeout = axios.isAxiosError(e) && e.code === "ECONNABORTED";
      error.value = isTimeout
        ? `A conexão demorou demais. Verifique se o serviço ${inputServiceType} está disponível e tente novamente.`
        : `Falha ao conectar. Verifique a URL e se é um serviço ${inputServiceType} válido.`;
    } finally {
      loading.value = false;
    }
  };

  const handleFetchCapabilities = async () => {
    await fetchCapabilities();
  };

  const handleCatalogSelect = async (entryId: string) => {
    if (pinnedUrl.value) return;
    selectedCatalogId.value = entryId;
    const entry = GEOSERVER_CATALOG.find((item) => item.id === entryId);
    if (!entry) return;

    serviceType.value = entry.serviceType;
    url.value = entry.url;
    pendingSchema.value = null;
    await fetchCapabilities(entry.url, entry.serviceType);
  };

  const handleManualUrlChange = (value: string) => {
    selectedCatalogId.value = "";
    url.value = value;
  };

  const escapeXml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const looksLikePointLayer = (layer?: {
    name?: string;
    title?: string;
    styles?: string[];
  }) => {
    const searchable = [layer?.name, layer?.title, ...(layer?.styles ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return /\b(point|ponto|pontos|aldeias_pontos)\b/.test(searchable);
  };

  const buildDefaultPointWmsSld = (
    layerName: string,
  ) => `<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <NamedLayer>
    <Name>${escapeXml(layerName)}</Name>
    <UserStyle>
      <Title>Urbis - pontos</Title>
      <FeatureTypeStyle>
        <Rule>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#2563eb</CssParameter>
                  <CssParameter name="fill-opacity">0.9</CssParameter>
                </Fill>
                <Stroke>
                  <CssParameter name="stroke">#ffffff</CssParameter>
                  <CssParameter name="stroke-width">1.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>9</Size>
            </Graphic>
          </PointSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`;

  const detectGeometryKindFromType = (geometryType?: string): GeometryKind => {
    if (!geometryType) return "unknown";

    const normalized = geometryType.toLowerCase();
    if (normalized.includes("point")) return "point";
    if (normalized.includes("polygon")) return "polygon";
    if (normalized.includes("line")) return "line";
    if (normalized.includes("collection")) return "mixed";

    return "unknown";
  };

  const detectWfsGeometryKind = async (
    baseUrl: string,
  ): Promise<{ geometryKind: GeometryKind; config: WfsRequestConfig }> => {
    const environment = import.meta.env.VITE_API_URL || "/api";
    const configs: WfsRequestConfig[] = [
      ...WFS_JSON_OUTPUT_FORMATS.map((outputFormat) => ({
        version: "2.0.0",
        typeNameParam: "typeNames" as const,
        limitParam: "count" as const,
        outputFormat,
      })),
      ...WFS_JSON_OUTPUT_FORMATS.map((outputFormat) => ({
        version: "1.1.0",
        typeNameParam: "typeName" as const,
        limitParam: "maxFeatures" as const,
        outputFormat,
      })),
      ...WFS_JSON_OUTPUT_FORMATS.map((outputFormat) => ({
        version: "1.0.0",
        typeNameParam: "typeName" as const,
        limitParam: "maxFeatures" as const,
        outputFormat,
      })),
    ];

    let lastError: unknown = null;
    const headers = await getAuthHeaders().catch(() => ({}));

    for (const config of configs) {
      try {
        const response = await axios.get(`${environment}/maps/proxy`, {
          params: {
            url: baseUrl,
            ...buildWfsParams(config, selectedLayer.value, 1),
          },
          headers,
          timeout: 20000,
        });

        const data =
          typeof response.data === "string"
            ? JSON.parse(response.data)
            : response.data;
        const geometryType = data?.features?.[0]?.geometry?.type;
        const geometryKind = detectGeometryKindFromType(geometryType);

        if (geometryKind !== "unknown") {
          return { geometryKind, config };
        }
      } catch (e) {
        lastError = e;
      }
    }

    if (lastError) console.warn("WFS geometry detection failed", lastError);

    return {
      geometryKind: "unknown",
      config: {
        version: "1.0.0",
        typeNameParam: "typeName",
        limitParam: "maxFeatures",
        outputFormat: "json",
      },
    };
  };

  const createWfsVisualConfig = (
    layerId: string,
    geometryKind: GeometryKind,
  ) => {
    const fillColor = [
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      geometryKind === "polygon" ? 120 : 220,
    ];

    if (geometryKind === "point") {
      return {
        colors: [
          {
            id: Date.now(),
            type: "fill",
            color: fillColor,
            pattern: "full",
            label: "default",
            value: "default",
            layerSchemaId: layerId,
          },
          {
            id: Date.now() + 1,
            type: "line",
            color: [255, 255, 255, 230],
            pattern: "full",
            label: "default",
            value: "default",
            layerSchemaId: layerId,
          },
        ],
        properties: {
          pointType: "circle",
          pointRadiusUnits: "pixels",
          getPointRadius: 6,
          pointRadiusMinPixels: 4,
          pointRadiusMaxPixels: 14,
          filled: true,
          stroked: true,
          pickable: true,
          getLineWidth: 1,
          lineWidthUnits: "pixels",
        },
      };
    }

    if (geometryKind === "line") {
      return {
        colors: [
          {
            id: Date.now(),
            type: "line",
            color: [fillColor[0], fillColor[1], fillColor[2], 230],
            pattern: "full",
            label: "default",
            value: "default",
            layerSchemaId: layerId,
          },
        ],
        properties: {
          filled: false,
          stroked: true,
          pickable: true,
          getLineWidth: 3,
          lineWidthUnits: "pixels",
        },
      };
    }

    return {
      colors: [
        {
          id: Date.now(),
          type: "fill",
          color: fillColor,
          pattern: "full",
          label: "default",
          value: "default",
          layerSchemaId: layerId,
        },
        {
          id: Date.now() + 1,
          type: "line",
          color: [fillColor[0], fillColor[1], fillColor[2], 230],
          pattern: "full",
          label: "default",
          value: "default",
          layerSchemaId: layerId,
        },
      ],
      properties: {
        filled: true,
        stroked: true,
        pickable: true,
        getLineWidth: 2,
        lineWidthUnits: "pixels",
      },
    };
  };

  const handlePrepare = async () => {
    if (!selectedLayer.value || !selectedGroupId.value) return;

    const layerInfo = layers.value.find((l) => l.name === selectedLayer.value);
    const baseUrl = getBaseUrl(url.value);

    let newLayer: IGetConfigLayerSchema;

    if (serviceType.value === "WMS") {
      const layerId = `wms-${Date.now()}`;
      newLayer = {
        id: layerId,
        name: layerInfo?.title || selectedLayer.value,
        origin: `${baseUrl}`,
        isActive: true,
        isSelected: true,
        type: IGetConfigLayerSchemaTypeEnum.CustomWMSLayer,
        isVisible: true,
        groupId: selectedGroupId.value,
        colors: [],
        clickAction: { action: "info" as any, params: {} },
        properties: {
          source: selectedCatalogId.value
            ? "geoserver-catalog"
            : "manual-geoserver",
          catalogEntryId: selectedCatalogId.value || undefined,
          supportsVisualCustomization: !selectedCatalogId.value,
          metadata: {
            description:
              layerInfo?.abstract || "Camada WMS adicionada pelo usuário",
            links: [{ label: "URL do Serviço", url: url.value }],
          },
          ...(looksLikePointLayer(layerInfo)
            ? { sldBody: buildDefaultPointWmsSld(selectedLayer.value) }
            : {}),
          wms: {
            url: baseUrl,
            layers: selectedLayer.value,
            version: capabilitiesVersion.value || "1.3.0",
            transparent: true,
            format: "image/png",
          },
        },
      };
    } else {
      // WFS
      loading.value = true;
      error.value = "";

      try {
        const { geometryKind, config } = await detectWfsGeometryKind(baseUrl);

        if (geometryKind === "unknown") {
          error.value =
            "Não foi possível identificar a geometria da camada WFS. Use WMS para visualização ou selecione uma camada com feições disponíveis.";
          return;
        }

        const layerId = `wfs-${Date.now()}`;
        const visualConfig = createWfsVisualConfig(layerId, geometryKind);

        newLayer = {
          id: layerId,
          name: layerInfo?.title || selectedLayer.value,
          origin: buildWfsUrl(baseUrl, config, selectedLayer.value, 10000),
          isActive: true,
          isSelected: true,
          type: IGetConfigLayerSchemaTypeEnum.GeoJsonLayer,
          isVisible: true,
          groupId: selectedGroupId.value,
          colors: visualConfig.colors,
          clickAction: { action: "SelectFeature" as any, params: {} },
          properties: {
            ...visualConfig.properties,
            source: selectedCatalogId.value
              ? "geoserver-catalog"
              : "manual-geoserver",
            catalogEntryId: selectedCatalogId.value || undefined,
            supportsVisualCustomization: !selectedCatalogId.value,
            metadata: {
              description:
                layerInfo?.abstract || "Camada WFS adicionada pelo usuário",
              geometry: GEOMETRY_KIND_LABEL[geometryKind],
              version: config.version,
              outputFormat: config.outputFormat,
              links: [{ label: "URL do Serviço", url: url.value }],
            },
          },
        };
      } catch (e) {
        console.error("WFS sample error", e);
        error.value =
          "Não foi possível testar a camada WFS antes de adicionar. Verifique se ela retorna GeoJSON e tente novamente.";
        return;
      } finally {
        loading.value = false;
      }
    }

    pendingSchema.value = newLayer;
  };

  const handleConfirm = () => {
    if (pendingSchema.value) {
      layerSchemas.value = [...layerSchemas.value, pendingSchema.value];
      onClose();
    }
  };

  return (
    <div className="space-y-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="h-7 w-fit gap-1 px-1 text-xs text-muted-foreground"
      >
        <UrbisIcon name="arrow_back" className="text-base" aria-hidden="true" />
        Voltar
      </Button>

      {!pendingSchema.value ? (
        <div className="grid w-full gap-3">
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label>Catálogo de geoservers</Label>
              <span className="text-[11px] text-muted-foreground">
                ou informe a URL abaixo
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {GEOSERVER_CATALOG.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  title={`${entry.organization} — ${entry.description}`}
                  className={`flex min-h-9 items-center justify-between gap-1.5 rounded-md border px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted ${selectedCatalogId.value === entry.id ? "border-primary bg-primary/10 text-foreground" : "bg-background"}`}
                  onClick={() => handleCatalogSelect(entry.id)}
                  disabled={loading.value || Boolean(pinnedUrl.value)}
                >
                  <span className="min-w-0 truncate font-medium">
                    {entry.name}
                  </span>
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {entry.serviceType}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Tipo</Label>
            {/* @ts-ignore */}
            <Select
              value={serviceType.value}
              onValueChange={(val) => {
                if (pinnedUrl.value) return;
                selectedCatalogId.value = "";
                serviceType.value = val as ServiceType;
                layers.value = [];
                layerSearch.value = "";
                selectedLayer.value = "";
                capabilitiesVersion.value = "";
                error.value = "";
              }}
            >
              {/* @ts-ignore */}
              <SelectTrigger>
                {/* @ts-ignore */}
                <SelectValue placeholder="Selecione o tipo de serviço" />
              </SelectTrigger>
              {/* @ts-ignore */}
              <SelectContent>
                {/* @ts-ignore */}
                <SelectItem value="WMS">WMS (Web Map Service)</SelectItem>
                {/* @ts-ignore */}
                <SelectItem value="WFS">WFS (Web Feature Service)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground">
            {serviceType.value === "WMS" ? (
              <p>
                WMS adiciona uma imagem renderizada pelo servidor. É a opção
                mais leve para visualizar camadas externas; seleção e estilos
                dependem do serviço.
              </p>
            ) : (
              <p>
                WFS carrega feições vetoriais no navegador e pode ficar pesado
                em camadas grandes. Antes de adicionar, o Urbis testa uma feição
                e ajusta o estilo para pontos, linhas ou polígonos.
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="url">URL do geoserver</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                placeholder={
                  serviceType.value === "WMS"
                    ? "https://geoserver.exemplo.com/geoserver/wms"
                    : "https://geoserver.exemplo.com/geoserver/ows"
                }
                value={url.value}
                disabled={Boolean(pinnedUrl.value)}
                onInput={(e) =>
                  handleManualUrlChange(
                    (e.currentTarget as HTMLInputElement).value,
                  )
                }
              />
              <Button
                onClick={handleFetchCapabilities}
                disabled={loading.value || !url.value || Boolean(pinnedUrl.value)}
              >
                {loading.value ? "Conectando..." : "Conectar"}
              </Button>
              {isSluiWmsUrl(url.value) && (
                <Button
                  type="button"
                  variant={isPinnedSluiWms ? "default" : "outline"}
                  size="icon"
                  onClick={toggleSluiWmsPin}
                  aria-label={isPinnedSluiWms ? "Desfixar URL SLUI" : "Fixar URL SLUI"}
                  title={isPinnedSluiWms ? "Desfixar URL SLUI" : "Fixar URL SLUI"}
                >
                  <UrbisIcon
                    name="edit_location_alt"
                    className={isPinnedSluiWms ? "text-primary-foreground" : ""}
                    aria-hidden="true"
                  />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              URL base do serviço {serviceType.value}; use o catálogo ou edite
              manualmente.
            </p>
          </div>

          {layers.value.length > 0 && (
            <>
              <div className="grid gap-1.5 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Escolher camada publicada</Label>
                  <span className="text-xs text-muted-foreground">
                    {filteredLayers.value.length} de {layers.value.length}
                  </span>
                </div>
                <Input
                  placeholder="Buscar por nome, título ou resumo"
                  className="h-8"
                  value={layerSearch.value}
                  onInput={(e) =>
                    (layerSearch.value = (
                      e.currentTarget as HTMLInputElement
                    ).value)
                  }
                />
                <div className="max-h-60 overflow-y-auto border rounded-md p-1.5 space-y-1">
                  {filteredLayers.value.map((l) => (
                    <div
                      key={l.name}
                      className={`p-2 rounded cursor-pointer text-sm ${selectedLayer.value === l.name ? "bg-blue-100 text-blue-900" : "hover:bg-muted"}`}
                      onClick={() => (selectedLayer.value = l.name)}
                    >
                      <div className="font-medium leading-tight">
                        {l.title || l.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {l.name}
                      </div>
                      {l.abstract && (
                        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {l.abstract}
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredLayers.value.length === 0 && (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      Nenhuma camada encontrada com esse termo.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-1.5 animate-in fade-in slide-in-from-top-2">
                <Label>Grupo no catálogo</Label>
                {/* @ts-ignore */}
                <Select
                  value={selectedGroupId.value}
                  onValueChange={(val) => (selectedGroupId.value = val)}
                >
                  {/* @ts-ignore */}
                  <SelectTrigger>
                    {/* @ts-ignore */}
                    <SelectValue placeholder="Escolha um grupo para esta camada" />
                  </SelectTrigger>
                  {/* @ts-ignore */}
                  <SelectContent>
                    {flatGroups.value.map((group) => (
                      // @ts-ignore
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2 animate-in fade-in slide-in-from-right-4 w-full relative">
          <Label>Revisar camada</Label>
          <div className="rounded-md border bg-muted/20 p-3 text-sm">
            <p className="font-medium">{pendingSchema.value.name}</p>
            <p className="text-xs text-muted-foreground">
              Revise a camada selecionada e confirme para adicioná-la ao mapa.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
              <span className="rounded bg-background px-1.5 py-0.5">
                {pendingSchema.value.type ===
                IGetConfigLayerSchemaTypeEnum.CustomWMSLayer
                  ? "WMS"
                  : "WFS"}
              </span>
              {pendingSchema.value.properties?.metadata?.geometry && (
                <span className="rounded bg-background px-1.5 py-0.5">
                  {pendingSchema.value.properties.metadata.geometry}
                </span>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-0 text-xs text-muted-foreground"
            onClick={() => (showTechnicalJson.value = !showTechnicalJson.value)}
          >
            {showTechnicalJson.value
              ? "Ocultar JSON técnico"
              : "Ver JSON técnico"}
          </Button>
          {showTechnicalJson.value && (
            <div className="max-h-[400px] w-full overflow-auto border rounded-md bg-muted/20">
              <div className="min-w-full w-fit p-4">
                {createElement(ReactJson, {
                  collapsed: 2,
                  collapseStringsAfterLength: 60,
                  src: pendingSchema.value,
                  style: {
                    backgroundColor: "transparent",
                    wordBreak: "break-all",
                  },
                  name: false,
                  displayDataTypes: false,
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {error.value && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error.value}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        {!pendingSchema.value ? (
          <Button
            onClick={handlePrepare}
            disabled={
              loading.value || !selectedLayer.value || !selectedGroupId.value
            }
          >
            Revisar camada
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={() => (pendingSchema.value = null)}
            >
              Voltar
            </Button>
            <Button onClick={handleConfirm} disabled={!pendingSchema.value}>
              Adicionar ao mapa
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
