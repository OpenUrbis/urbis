import { AdminHeader } from "@/components/AdminHeader";
import { MapView } from "@/components/MapView";
import {
  stringifyNormalizedViewTemplate,
} from "@/components/ViewTemplate/utils/normalize-template-ids";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useMapContext } from "@/hooks/useMapContext";
import { useToast } from "@/hooks/useToast";
import {
  createLayerSchema,
  getLayerSchema,
  updateLayerSchema,
} from "@/integrations/layer-schema-integration";
import {
  DEFAULT_LAYER_FORM_COLOR,
  DEFAULT_LAYER_LINE_WIDTH,
} from "@/lib/layer-style-defaults";
import { cn } from "@/lib/utils";
import { IGetConfigLayerSchema } from "@/types/fetch-map-config-type";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import {
  ChevronDown,
  Eye,
  FileJson,
  FileText,
  Globe2,
  Loader2,
  Save,
} from "lucide-react";
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useRoute } from "wouter";
import {
  buildLayerSchema,
  extractGeographicBboxFromXmlNode,
  getBaseGeoServerUrl,
  getDirectXmlChildText,
  getXmlElementsByLocalName,
  LayerSchema,
  LayerSchemaFormSchema,
  LayerSchemaFormValues,
  parseLayerSchemaToForm,
  WFS_CAPABILITIES_VERSIONS,
  WMS_CAPABILITIES_VERSIONS,
} from "./utils";

const LayerConfiguration = lazy(() =>
  import("./steps/LayerConfiguration").then((module) => ({
    default: module.LayerConfiguration,
  })),
);
const LayerSourceSettings = lazy(() =>
  import("./steps/LayerConfiguration").then((module) => ({
    default: module.LayerSourceSettings,
  })),
);
const LayerMapping = lazy(() =>
  import("./steps/LayerMapping").then((module) => ({
    default: module.LayerMapping,
  })),
);
const LayerSelection = lazy(() =>
  import("./steps/LayerSelection").then((module) => ({
    default: module.LayerSelection,
  })),
);
const LayerStyling = lazy(() =>
  import("./steps/LayerStyling").then((module) => ({
    default: module.LayerStyling,
  })),
);
const LayerTemplate = lazy(() =>
  import("./steps/LayerTemplate").then((module) => ({
    default: module.LayerTemplate,
  })),
);

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8 text-muted-foreground">
    <Loader2 className="h-6 w-6 animate-spin" />
  </div>
);

const SOURCE_FIELDS = [
  "url",
  "selectedLayer",
  "loadingMethod",
  "version",
  "origin",
] as const;

const LayerHandlePage = () => {
  const [isEditMatch, editParams] = useRoute("/:id");

  const isEditing = !!isEditMatch && editParams?.id !== "handle";
  const id = isEditing ? editParams?.id : undefined;

  const [layers, setLayers] = useState<
    { name: string; title: string; crs?: string[]; bbox?: number[] }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [fetchedServiceVersion, setFetchedServiceVersion] =
    useState<string>("");
  const [fetchError, setFetchError] = useState("");
  const [editLoadError, setEditLoadError] = useState("");
  const [editLoadAttempt, setEditLoadAttempt] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [originalData, setOriginalData] = useState<LayerSchema | null>(null);
  const [savedLayerId, setSavedLayerId] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState<LayerSchemaFormValues | null>(
    null,
  );
  const [templateDialog, setTemplateDialog] = useState<"view" | null>(null);
  const [isJsonDialogOpen, setIsJsonDialogOpen] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState<
    "consulta" | "estilo" | "atributos"
  >("atributos");
  const [isSourceOpen, setIsSourceOpen] = useState(!isEditing);
  const hasLoadedEditingDataRef = useRef(false);

  const { toastSuccess, toastError, toastWarning } = useToast();
  const { overlayRef } = useMapContext();

  const form = useForm<LayerSchemaFormValues>({
    resolver: zodResolver(LayerSchemaFormSchema) as any,
    defaultValues: {
      url: "https://geoserver.slui.dev/geoserver/slui/ows",
      selectedLayer: undefined,
      origin: "",
      loadingMethod: "GeoJsonLayer",
      version: "2.0.0",
      srs: "CRS:84",
      groupId: "geral",
      layerName: "",
      summaryDescription: "",
      sourceParameters: "",
      legisLinks: "",
      ckanMetadataUrl: "",
      index: undefined,
      minZoom: "",
      maxZoom: "",
      clickAction: "none",
      clickActionParams: {},
      viewTemplate: "",
      boardTemplate: "",
      isActive: true,
      isSelected: false,
      isVisible: true,
      includeInAnalysis: true,
      includeInFiu: true,
      isDynamic: false,
      layerProperty: "",
      lineWidth: DEFAULT_LAYER_LINE_WIDTH,
      hoverColor: undefined,
      selectedColor: undefined,
      label: {
        enabled: false,
        property: "",
        minZoom: "",
        size: 13,
        color: "#111827",
        haloColor: "#ffffff",
        haloWidth: 2,
      },
      colors: [DEFAULT_LAYER_FORM_COLOR],
      propertyMapping: {},
    },
    mode: "onChange",
  });

  const loadingMethod = form.watch("loadingMethod");
  const layerName = form.watch("layerName");
  const selectedLayer = form.watch("selectedLayer");
  const viewTemplate = form.watch("viewTemplate");
  const isWms = loadingMethod === "CustomWMSLayer";
  const isStream = loadingMethod === "Stream";
  const loadingMethodLabel = isWms
    ? "WMS imagem"
    : isStream
      ? "WFS recortado por área visível"
      : "WFS vetorial completo";
  const minZoomValue = form.watch("minZoom");
  const streamPreviewZoom = Number(minZoomValue || 17);

  const previewSchema = useMemo(() => {
    if (!previewData || !previewData.selectedLayer) return null;
    try {
      const schema = buildLayerSchema(previewData);

      const mergedProperties = {
        ...(originalData?.properties || {}),
        ...(schema.properties || {}),
      };

      const mergedSchema = {
        ...(originalData || {}),
        ...schema,
        properties: mergedProperties,
      };

      mergedSchema.isVisible = true;

      if (mergedSchema.type === "CustomWMSLayer" && previewData.url) {
        try {
          const urlObj = new URL(previewData.url);
          mergedSchema.origin = `${urlObj.origin}${urlObj.pathname}`;
        } catch {
          mergedSchema.origin = previewData.url;
        }
      }

      return mergedSchema as unknown as IGetConfigLayerSchema;
    } catch {
      return null;
    }
  }, [previewData, originalData]);

  const shouldShowPreview = isPreviewVisible;

  const technicalJson = useMemo(() => {
    const values = previewData ?? form.getValues();

    if (!values.selectedLayer) {
      return originalData;
    }

    try {
      const generatedSchema = buildLayerSchema(values);

      const mergedProperties = {
        ...(originalData?.properties || {}),
        ...(generatedSchema.properties || {}),
      };

      return {
        ...(originalData || {}),
        ...generatedSchema,
        properties: mergedProperties,
      };
    } catch {
      return previewSchema ?? originalData;
    }
  }, [form, originalData, previewData, previewSchema]);

  const handleUpdatePreview = () => {
    setPreviewData(form.getValues());
    setIsPreviewVisible(true);
  };

  const handleLoadingMethodChange = (value: string) => {
    if (value === form.getValues("loadingMethod")) return;

    form.setValue("loadingMethod", value, {
      shouldDirty: true,
      shouldValidate: false,
    });
    form.setValue("selectedLayer", undefined, {
      shouldDirty: true,
      shouldValidate: false,
    });
    form.setValue("origin", "", {
      shouldDirty: true,
      shouldValidate: false,
    });

    if (value === "CustomWMSLayer") {
      form.setValue("version", "1.3.0", {
        shouldDirty: true,
        shouldValidate: false,
      });
      form.setValue("srs", "EPSG:3857", {
        shouldDirty: true,
        shouldValidate: false,
      });
    } else if (value === "Stream") {
      form.setValue("version", "1.1.0", {
        shouldDirty: true,
        shouldValidate: false,
      });
      form.setValue("srs", "EPSG:4326", {
        shouldDirty: true,
        shouldValidate: false,
      });
      form.setValue("isSelected", true, {
        shouldDirty: true,
        shouldValidate: false,
      });
      form.setValue("clickAction", "SelectFeature", {
        shouldDirty: true,
        shouldValidate: false,
      });
      form.setValue(
        "clickActionParams",
        { zoom: "19.5" },
        {
          shouldDirty: true,
          shouldValidate: false,
        },
      );
      form.setValue("minZoom", form.getValues("minZoom") || "17", {
        shouldDirty: true,
        shouldValidate: false,
      });
    } else {
      form.setValue("version", "2.0.0", {
        shouldDirty: true,
        shouldValidate: false,
      });
      form.setValue("srs", "CRS:84", {
        shouldDirty: true,
        shouldValidate: false,
      });
    }

    setIsPreviewVisible(false);
    setPreviewData(null);
    setLayers([]);
    setFetchError("");
    setFetchedServiceVersion("");
  };

  useEffect(() => {
    const loadData = async () => {
      if (isEditing && id && !hasLoadedEditingDataRef.current) {
        try {
          hasLoadedEditingDataRef.current = true;
          const backendData = await getLayerSchema(id);
          setOriginalData(backendData as unknown as LayerSchema);

          const formData = parseLayerSchemaToForm(
            backendData as unknown as LayerSchema,
          );

          if (formData.viewTemplate) {
            try {
              formData.viewTemplate = stringifyNormalizedViewTemplate(
                formData.viewTemplate,
              );
            } catch {
              // Mantém o valor original caso o template legado não normalize.
            }
          }

          if (formData.boardTemplate) {
            try {
              formData.boardTemplate = stringifyNormalizedViewTemplate(
                formData.boardTemplate,
              );
            } catch {
              // Mantém o valor original caso o template legado não normalize.
            }
          }

          form.reset(formData);

          if (formData.selectedLayer) {
            form.setValue("selectedLayer", formData.selectedLayer);
          }

          setIsDataLoaded(true);
          setEditLoadError("");
        } catch (error) {
          hasLoadedEditingDataRef.current = false;
          console.error("Failed to load layer schema", error);
          const message =
            error instanceof Error
              ? error.message
              : "Erro ao carregar esquema da camada";
          setEditLoadError(message);
          toastError(message);
        }
      }
    };

    loadData();
  }, [form, id, isEditing, toastError, editLoadAttempt]);

  useEffect(() => {
    if (!isEditing || isDataLoaded) {
      handleFetchCapabilities(form.getValues("url"));
    }
    // A busca deve ocorrer apenas ao montar e após carregar os dados de edição.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, isDataLoaded]);

  const focusPreviewZoom = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (overlayRef?.current as any)?._map;
    if (!map) {
      toastWarning("Abra a prévia antes de ajustar o zoom.");
      return;
    }

    map.easeTo({ zoom: streamPreviewZoom, duration: 300 });
  };

  useEffect(() => {
    if (shouldShowPreview && overlayRef?.current) {
      const timer = setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = (overlayRef.current as any)._map;
        map?.resize();
      }, 350);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [shouldShowPreview, overlayRef]);

  const getBaseUrl = getBaseGeoServerUrl;

  const handleFetchCapabilities = async (overrideUrl?: string) => {
    const url =
      typeof overrideUrl === "string" ? overrideUrl : form.getValues("url");
    if (!url) return;

    setLoading(true);
    setFetchError("");
    setLayers([]);

    if (!isEditing) {
      form.setValue("selectedLayer", undefined);
    }

    try {
      const baseUrl = getBaseUrl(url);
      const environment = import.meta.env.VITE_API_URL || "/api";

      const selectedService =
        form.getValues("loadingMethod") === "CustomWMSLayer" ? "WMS" : "WFS";
      const versions =
        selectedService === "WMS"
          ? WMS_CAPABILITIES_VERSIONS
          : WFS_CAPABILITIES_VERSIONS;

      let xmlDoc: Document | null = null;
      let serviceVersion = "";
      let lastError: unknown = null;

      for (const version of versions) {
        try {
          const response = await axios.get(`${environment}/maps/proxy`, {
            params: {
              url: baseUrl,
              service: selectedService,
              version,
              request: "GetCapabilities",
            },
            timeout: 20000,
          });

          const parser = new DOMParser();
          const parsed = parser.parseFromString(response.data, "text/xml");
          if (parsed.getElementsByTagName("parsererror").length === 0) {
            xmlDoc = parsed;
            serviceVersion =
              parsed.documentElement.getAttribute("version") || version;
            break;
          }
        } catch (error) {
          lastError = error;
        }
      }

      if (!xmlDoc) throw lastError || new Error("Capabilities inválido");

      setFetchedServiceVersion(serviceVersion);

      const extractedLayers: {
        name: string;
        title: string;
        crs: string[];
        bbox?: number[];
        styles?: string[];
      }[] = [];
      const layerNodes = getXmlElementsByLocalName(
        xmlDoc,
        selectedService === "WMS" ? "Layer" : "FeatureType",
      );

      for (let i = 0; i < layerNodes.length; i++) {
        const node = layerNodes[i];
        const name = getDirectXmlChildText(node, "Name");
        const title = getDirectXmlChildText(node, "Title") || name;
        const styles = Array.from(node.children)
          .filter(
            (child) =>
              child.localName === "Style" || child.nodeName === "Style",
          )
          .map((styleNode) => getDirectXmlChildText(styleNode, "Name"))
          .filter(Boolean);

        if (name) {
          const crsList: string[] = [];
          const crsNodes = node.getElementsByTagName("CRS");
          const srsNodes = node.getElementsByTagName("SRS");
          const defaultCrsNodes = node.getElementsByTagName("DefaultCRS");
          const defaultSrsNodes = node.getElementsByTagName("DefaultSRS");

          for (let j = 0; j < crsNodes.length; j++) {
            if (crsNodes[j].textContent) crsList.push(crsNodes[j].textContent!);
          }
          for (let j = 0; j < srsNodes.length; j++) {
            if (srsNodes[j].textContent) crsList.push(srsNodes[j].textContent!);
          }
          for (let j = 0; j < defaultCrsNodes.length; j++) {
            if (defaultCrsNodes[j].textContent) {
              crsList.push(defaultCrsNodes[j].textContent!);
            }
          }
          for (let j = 0; j < defaultSrsNodes.length; j++) {
            if (defaultSrsNodes[j].textContent) {
              crsList.push(defaultSrsNodes[j].textContent!);
            }
          }

          const bbox = extractGeographicBboxFromXmlNode(node);

          if (name && !extractedLayers.some((l) => l.name === name)) {
            extractedLayers.push({
              name,
              title,
              crs: Array.from(new Set(crsList)),
              bbox,
              styles,
            });
          }
        }
      }

      if (extractedLayers.length === 0) {
        setFetchError("Nenhuma camada encontrada ou resposta inválida.");
      } else {
        setLayers(extractedLayers);

        if (isEditing) {
          const currentValues = form.getValues();
          const targetName = currentValues.selectedLayer?.name;
          const targetTitle = currentValues.layerName;

          let found = undefined;

          if (targetName) {
            found = extractedLayers.find((l) => l.name === targetName);
          }

          if (!found && targetTitle) {
            found = extractedLayers.find((l) => l.title === targetTitle);
          }

          if (found) {
            form.setValue("selectedLayer", found);
          }
        }
      }
    } catch (e) {
      console.error("Error fetching capabilities", e);
      setFetchError("Falha ao buscar capacidades. Verifique a URL.");
      toastError("Falha ao buscar capacidades");
    } finally {
      setLoading(false);
    }
  };

  const handleLayerSelect = (layer: {
    name: string;
    title: string;
    crs?: string[];
    bbox?: number[];
    styles?: string[];
  }) => {
    form.setValue("selectedLayer", layer, {
      shouldValidate: true,
      shouldDirty: true,
    });
    form.setValue("layerName", layer.title, { shouldDirty: true });

    const currentLoadingMethod = form.getValues("loadingMethod");

    if (currentLoadingMethod === "Stream") {
      form.setValue("version", "1.1.0");
      form.setValue("srs", "EPSG:4326");
      return;
    }

    if (fetchedServiceVersion) {
      form.setValue("version", fetchedServiceVersion);
    }

    form.setValue(
      "srs",
      currentLoadingMethod === "CustomWMSLayer" ? "EPSG:3857" : "CRS:84",
    );
  };

  const handleDynamicChange = (checked: boolean) => {
    form.setValue("isDynamic", checked);
    const currentColors = form.getValues("colors");
    if (!checked && currentColors.length > 1) {
      form.setValue("colors", [currentColors[0]]);
    }
  };

  const persistCurrentLayerSchema = async (data: LayerSchemaFormValues) => {
    const transformed = buildLayerSchema(data);

    const existingId = id || savedLayerId;
    if (existingId && originalData) {
      const mergedProperties = {
        ...(originalData.properties || {}),
        ...(transformed.properties || {}),
      };

      // Explicitly strip read-only database-generated fields to prevent validation errors (400 Bad Request)
      const {
        layerGroup: _layerGroup,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        deletedAt: _deletedAt,
        ...cleanOriginalData
      } = originalData;

      const payload = {
        ...cleanOriginalData,
        ...transformed,
        properties: mergedProperties,
        id: existingId,
      };
      const updatedSchema = await updateLayerSchema(existingId, payload as any);
      setOriginalData(updatedSchema as unknown as LayerSchema);
      return updatedSchema;
    }

    if (!data.selectedLayer) {
      throw new Error("Selecione uma camada");
    }

    const techName = data.selectedLayer.name.split(":").pop() || data.layerName;
    const generatedId = `${techName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`;

    const payload = {
      ...transformed,
      id: generatedId,
    };

    return createLayerSchema(payload);
  };

  const validateBeforeSave = async () => {
    const fields: (keyof LayerSchemaFormValues)[] = [
      "url",
      "selectedLayer",
      "loadingMethod",
      "version",
      "origin",
      "groupId",
      "layerName",
      "summaryDescription",
      "sourceParameters",
      "legisLinks",
      "index",
      "minZoom",
      "maxZoom",
      "clickAction",
      "clickActionParams",
      "isActive",
      "isSelected",
      "isVisible",
      "includeInAnalysis",
      "includeInFiu",
      "isPublic",
      "allowedRoles",
      "propertyMapping",
    ];

    if (!isWms) {
      fields.push("isDynamic", "layerProperty", "lineWidth", "colors");
    }

    const isValid = await form.trigger(fields as string[], {
      shouldFocus: true,
    });

    if (!isValid) {
      const errors = form.formState.errors;
      const hasSourceError = SOURCE_FIELDS.some((field) => !!errors[field]);

      if (hasSourceError) {
        setIsSourceOpen(true);
      }
    }

    return isValid;
  };

  const onSubmit: SubmitHandler<LayerSchemaFormValues> = async (data) => {
    const isValid = await validateBeforeSave();
    if (!isValid) {
      const errors = form.formState.errors;
      const firstError = Object.values(errors)[0] as any;
      const msg = firstError?.message || "Revise os campos destacados antes de salvar";
      toastWarning(msg);
      return;
    }

    if (!data.selectedLayer) {
      toastWarning("Selecione uma camada");
      return;
    }

    setLoading(true);
    try {
      const savedSchema = await persistCurrentLayerSchema(data);
      if (!isEditing && savedSchema && "id" in savedSchema) {
        setSavedLayerId(savedSchema.id);
      }

      toastSuccess(
        isEditing
          ? "Camada atualizada com sucesso"
          : "Camada criada com sucesso",
      );
      if (savedSchema) {
        setOriginalData(savedSchema as unknown as LayerSchema);
      }
    } catch (error) {
      console.error("Failed to save layer", error);
      toastError(
        error instanceof Error ? error.message : "Erro ao salvar camada",
      );
    } finally {
      setLoading(false);
    }
  };

  if (isEditing && !isDataLoaded) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 bg-background/50 p-6 text-center">
        {editLoadError ? (
          <>
            <p className="max-w-xl text-sm text-destructive">{editLoadError}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                hasLoadedEditingDataRef.current = false;
                setEditLoadError("");
                setIsDataLoaded(false);
                setEditLoadAttempt((attempt) => attempt + 1);
              }}
            >
              Tentar novamente
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="animate-pulse text-sm text-muted-foreground">
              Carregando dados da camada...
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="shrink-0 border-b bg-background/95 px-6 py-3 backdrop-blur">
        <AdminHeader
          title={layerName || (isEditing ? "Editar camada" : "Criar camada")}
          subtitle={`${isEditing ? "Camada em edição" : "Nova camada"} • ${loadingMethodLabel}${selectedLayer?.name ? ` • ${selectedLayer.name}` : ""}`}
          className="mb-0 gap-3 pb-0"
        >
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsJsonDialogOpen(true)}
            className="gap-2"
          >
            <FileJson className="h-4 w-4" />
            JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleUpdatePreview}
            className="gap-2 xl:hidden"
          >
            <Eye className="h-4 w-4" />
            {isPreviewVisible ? "Atualizar prévia" : "Visualizar no mapa"}
          </Button>
          <Button
            type="submit"
            form="layer-handle-form"
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar publicação
          </Button>
        </AdminHeader>
      </div>

      <Form {...form}>
        <form
          id="layer-handle-form"
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            const errorFields = Object.keys(errors)
              .map((key) => {
                if (key === "clickAction") return "Ação de clique";
                if (key === "colors") return "Cores e estilos";
                if (key === "layerName") return "Nome da camada";
                if (key === "origin") return "URL de origem";
                if (key === "groupId") return "Grupo";
                if (key === "allowedRoles") return "Cargos autorizados";
                if (key === "minZoom") return "Zoom mínimo";
                if (key === "maxZoom") return "Zoom máximo";
                if (key === "label") return "Rótulos no mapa";
                return key;
              })
              .join(", ");
            toastWarning(`Revise os campos destacados antes de salvar: ${errorFields}`);
            console.warn("[Form Validation Errors]", errors);
          })}
          className="flex min-h-0 flex-1 overflow-hidden"
        >
          <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(460px,38vw)] 2xl:grid-cols-[minmax(0,1fr)_640px]">
            <main className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-background">
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-6 pb-16">
                <section className="min-w-0 overflow-hidden rounded-xl border bg-card">
                  <button
                    type="button"
                    onClick={() => setIsSourceOpen((current) => !current)}
                    aria-expanded={isSourceOpen}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <span className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Globe2 className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold tracking-tight">
                        Fonte de dados
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {selectedLayer?.name
                          ? `${loadingMethodLabel} • ${selectedLayer.name}`
                          : "Informe o serviço GeoServer e escolha a camada técnica."}
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        isSourceOpen && "rotate-180",
                      )}
                    />
                  </button>

                  {isSourceOpen && (
                    <div className="space-y-5 border-t px-4 py-4">
                      <Suspense fallback={<LoadingFallback />}>
                        <LayerSelection
                          loading={loading}
                          fetchError={fetchError}
                          layers={layers}
                          onFetch={handleFetchCapabilities}
                          onNext={() => undefined}
                          onLayerSelect={handleLayerSelect}
                          onLoadingMethodChange={handleLoadingMethodChange}
                          readOnly={false}
                        />
                      </Suspense>

                      <Suspense fallback={<LoadingFallback />}>
                        <LayerSourceSettings loadingMethod={loadingMethod} />
                      </Suspense>
                    </div>
                  )}
                </section>

                <section className="min-w-0 rounded-xl border bg-card px-4 py-4">
                  <Suspense fallback={<LoadingFallback />}>
                    <LayerConfiguration hideNavigation hideSourceSettings />
                  </Suspense>
                </section>

                <section className="min-w-0 overflow-hidden rounded-xl border bg-card">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold tracking-tight">
                        Configurações avançadas
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Fichas de consulta, estilo da feição e atributos
                        exibidos.
                      </p>
                    </div>
                    <div
                      role="tablist"
                      aria-label="Configurações avançadas da camada"
                      className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-md bg-muted/60 p-1"
                    >
                      {!isWms && (
                        <Button
                          type="button"
                          role="tab"
                          aria-selected={activeEditorTab === "consulta"}
                          variant={
                            activeEditorTab === "consulta"
                              ? "secondary"
                              : "ghost"
                          }
                          onClick={() => setActiveEditorTab("consulta")}
                          className="h-8 shrink-0 rounded-sm px-3 text-xs font-medium shadow-none"
                        >
                          Fichas
                        </Button>
                      )}
                      {!isWms && (
                        <Button
                          type="button"
                          role="tab"
                          aria-selected={activeEditorTab === "estilo"}
                          variant={
                            activeEditorTab === "estilo" ? "secondary" : "ghost"
                          }
                          onClick={() => setActiveEditorTab("estilo")}
                          className="h-8 shrink-0 rounded-sm px-3 text-xs font-medium shadow-none"
                        >
                          Estilo
                        </Button>
                      )}
                      <Button
                        type="button"
                        role="tab"
                        aria-selected={activeEditorTab === "atributos"}
                        variant={
                          activeEditorTab === "atributos"
                            ? "secondary"
                            : "ghost"
                        }
                        onClick={() => setActiveEditorTab("atributos")}
                        className="h-8 shrink-0 rounded-sm px-3 text-xs font-medium shadow-none"
                      >
                        Atributos
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 overflow-x-hidden px-4 py-4">
                    {!isWms && activeEditorTab === "consulta" && (
                      <div className="max-w-md">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setTemplateDialog("view")}
                          className="h-auto w-full justify-start gap-3 rounded-lg border-dashed p-4 text-left shadow-none"
                        >
                          <FileText className="h-4 w-4 shrink-0 text-primary" />
                          <span className="grid gap-1">
                            <span className="font-medium">
                              {viewTemplate?.trim()
                                ? "Editar consulta da feição"
                                : "Criar consulta da feição"}
                            </span>
                            <span className="text-xs font-normal leading-5 text-muted-foreground">
                              Template usado no clique e nos detalhes do mapa.
                            </span>
                          </span>
                        </Button>
                      </div>
                    )}

                    {!isWms && activeEditorTab === "estilo" && (
                      <Suspense fallback={<LoadingFallback />}>
                        <LayerStyling
                          hideNavigation
                          onDynamicChange={handleDynamicChange}
                        />
                      </Suspense>
                    )}

                    {activeEditorTab === "atributos" && (
                      <Suspense fallback={<LoadingFallback />}>
                        <LayerMapping hideNavigation />
                      </Suspense>
                    )}
                  </div>
                </section>
              </div>
            </main>

            <aside className="hidden min-h-0 min-w-0 flex-col overflow-hidden border-l bg-muted/20 xl:flex">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-background/80 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium">Prévia da camada</p>
                  <p className="truncate text-[11px] leading-4 text-muted-foreground">
                    {shouldShowPreview && previewSchema
                      ? isStream
                        ? `Aparece a partir do zoom ${streamPreviewZoom}.`
                        : "Usa os dados do formulário atual."
                      : "Clique em visualizar para renderizar a camada."}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isStream && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={focusPreviewZoom}
                    >
                      Zoom {streamPreviewZoom}
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleUpdatePreview}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    {isPreviewVisible ? "Atualizar" : "Visualizar"}
                  </Button>
                </div>
              </div>

              <div
                className="relative min-h-0 min-w-0 flex-1 overflow-hidden"
                style={{ transform: "translateZ(0)" }}
              >
                <MapView
                  previewLayers={
                    shouldShowPreview && previewSchema
                      ? [previewSchema]
                      : undefined
                  }
                  hideControls={false}
                  disablePadding={true}
                  minimalPreview={false}
                />
              </div>
            </aside>
          </div>
        </form>

        <Dialog
          open={templateDialog === "view"}
          onOpenChange={(open) => setTemplateDialog(open ? "view" : null)}
        >
          <DialogContent
            className="z-[var(--urbis-z-app-modal,10160)] h-screen w-screen max-w-none grid-rows-[auto_minmax(0,1fr)] rounded-none p-0 sm:rounded-none"
            overlayClassName="z-[calc(var(--urbis-z-app-modal,10160)-1)]"
          >
            <DialogHeader className="border-b px-6 py-4 pr-14">
              <DialogTitle>Template de visualização</DialogTitle>
              <DialogDescription>
                Configure em tela cheia os campos exibidos na consulta da
                feição.
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 overflow-hidden">
              <Suspense fallback={<LoadingFallback />}>
                <LayerTemplate />
              </Suspense>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isJsonDialogOpen} onOpenChange={setIsJsonDialogOpen}>
          <DialogContent
            className="z-[var(--urbis-z-app-modal,10160)] h-[92vh] w-[94vw] max-w-6xl grid-rows-[auto_minmax(0,1fr)] p-0"
            overlayClassName="z-[calc(var(--urbis-z-app-modal,10160)-1)]"
          >
            <DialogHeader className="border-b px-6 py-4 pr-14">
              <DialogTitle>JSON técnico da camada</DialogTitle>
              <DialogDescription>
                Payload gerado a partir do formulário atual. Use para auditoria,
                suporte técnico e conferência antes da publicação.
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 overflow-hidden bg-slate-950">
              <pre className="h-full overflow-auto p-5 text-xs leading-relaxed text-slate-100">
                {JSON.stringify(technicalJson, null, 2)}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      </Form>
    </div>
  );
};

export default LayerHandlePage;
