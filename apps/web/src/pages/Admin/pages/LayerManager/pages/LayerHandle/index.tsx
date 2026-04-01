import { AdminHeader } from "@/components/AdminHeader";
import { MapView } from "@/components/MapView";
import { stringifyNormalizedViewTemplate } from "@/components/ViewTemplate/utils/normalize-template-ids";
import { Form } from "@/components/ui/form";
import { useMapContext } from "@/hooks/useMapContext";
import { useToast } from "@/hooks/useToast";
import {
  createLayerSchema,
  getLayerSchema,
  updateLayerSchema,
} from "@/integrations/layer-schema-integration";
import { cn } from "@/lib/utils";
import { StepsNavigation } from "@/pages/Admin/components/StepsNavigation";
import { IGetConfigLayerSchema } from "@/types/fetch-map-config-type";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useLocation, useRoute } from "wouter";
import {
  buildLayerSchema,
  LayerSchema,
  LayerSchemaFormSchema,
  LayerSchemaFormValues,
  parseLayerSchemaToForm,
} from "./utils";

const LayerConfiguration = lazy(() =>
  import("./steps/LayerConfiguration").then((module) => ({
    default: module.LayerConfiguration,
  })),
);
const LayerMapping = lazy(() =>
  import("./steps/LayerMapping").then((module) => ({
    default: module.LayerMapping,
  })),
);
const LayerReview = lazy(() =>
  import("./steps/LayerReview").then((module) => ({
    default: module.LayerReview,
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

const LayerHandlePage = () => {
  const [isEditMatch, editParams] = useRoute("/:id");

  const isEditing = !!isEditMatch && editParams?.id !== "handle";
  const id = isEditing ? editParams?.id : undefined;

  const [step, setStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(isEditing ? 6 : 1);
  const [layers, setLayers] = useState<
    { name: string; title: string; crs?: string[]; bbox?: number[] }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [fetchedServiceVersion, setFetchedServiceVersion] =
    useState<string>("");
  const [fetchError, setFetchError] = useState("");
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [originalData, setOriginalData] = useState<LayerSchema | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState<LayerSchemaFormValues | null>(
    null,
  );
  const [, setLocation] = useLocation();
  const { toastSuccess, toastError, toastWarning } = useToast();
  const { overlayRef } = useMapContext();

  const form = useForm<LayerSchemaFormValues>({
    resolver: zodResolver(LayerSchemaFormSchema) as any,
    defaultValues: {
      url: "https://geoserver.slui.dev/geoserver/slui/ows",
      loadingMethod: "CustomWMSLayer",
      version: "1.1.0",
      srs: "EPSG:4326",
      groupId: "geral",
      layerName: "",
      minZoom: "",
      maxZoom: "",
      clickAction: "none",
      isActive: true,
      isSelected: false,
      isVisible: true,
      isDynamic: false,
      colors: [
        {
          fillColor: [255, 0, 0, 0.5],
          borderColor: [0, 0, 0, 1],
          textColor: [255, 255, 255, 1],
        },
      ],
    },
    mode: "onChange",
  });

  const previewSchema = useMemo(() => {
    if (!previewData || !previewData.selectedLayer) return null;
    try {
      const schema = buildLayerSchema(previewData);

      // Merge with original data to preserve unedited properties (cqlFilter, wms props, etc.)
      const mergedSchema = {
        ...(originalData || {}),
        ...schema,
        properties: {
          ...(originalData?.properties || {}),
          ...(schema.properties || {}),
        },
      };

      // Force visibility for preview
      mergedSchema.isVisible = true;

      // Fix for CustomWMSLayer: MapView expects base URL, not full GetMap URL
      if (mergedSchema.type === "CustomWMSLayer" && previewData.url) {
        try {
          const urlObj = new URL(previewData.url);
          mergedSchema.origin = `${urlObj.origin}${urlObj.pathname}`;
        } catch {
          mergedSchema.origin = previewData.url;
        }
      }

      return mergedSchema as unknown as IGetConfigLayerSchema;
    } catch (e) {
      return null;
    }
  }, [previewData, originalData]);

  const handleUpdatePreview = () => {
    setPreviewData(form.getValues());
    setIsPreviewVisible(true);
  };

  useEffect(() => {
    const loadData = async () => {
      if (isEditing && id) {
        setMaxReachedStep(6);
        try {
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
            } catch (e) {
              // Ignore parsing errors and keep existing string
            }
          }

          console.log("Parsed Form Data:", formData);
          form.reset(formData);

          if (formData.selectedLayer) {
            form.setValue("selectedLayer", formData.selectedLayer);
          }

          setIsDataLoaded(true);
        } catch (error) {
          console.error("Failed to load layer schema", error);
          toastError("Erro ao carregar esquema da camada");
          setLocation("~/admin/layer-manager");
        }
      }
    };

    loadData();
  }, [isEditing, id]);

  useEffect(() => {
    if (step === 1 && !isEditing) {
      handleFetchCapabilities();
    } else if (step === 1 && isEditing && isDataLoaded) {
      handleFetchCapabilities(form.getValues("url"));
    }
  }, [step, isEditing, isDataLoaded]);

  // Reset preview visibility on step change
  useEffect(() => {
    setIsPreviewVisible(false);
  }, [step]);

  const shouldShowPreview =
    isPreviewVisible && (step === 2 || step === 4 || step === 6);

  useEffect(() => {
    if (shouldShowPreview && overlayRef?.current) {
      const timer = setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = (overlayRef.current as any)._map;
        if (map) {
          map.resize();

          if (previewData?.selectedLayer?.bbox) {
            const bbox = previewData.selectedLayer.bbox;
            try {
              map.fitBounds(
                [
                  [bbox[0], bbox[1]], // [minLng, minLat]
                  [bbox[2], bbox[3]], // [maxLng, maxLat]
                ],
                { padding: 50, duration: 1000 },
              );
            } catch (e) {
              console.error("Error fitting bounds", e);
            }
          }
        }
      }, 350); // Wait for transition animation
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [shouldShowPreview, previewData, overlayRef]);

  const getBaseUrl = (inputUrl: string) => {
    try {
      const urlObj = new URL(inputUrl);
      return `${urlObj.origin}${urlObj.pathname}`;
    } catch {
      return inputUrl;
    }
  };

  const handleFetchCapabilities = async (overrideUrl?: string) => {
    const url =
      typeof overrideUrl === "string" ? overrideUrl : form.getValues("url");
    if (!url) return;

    setLoading(true);
    setFetchError("");
    setLayers([]);

    if (!isEditing) {
      form.setValue("selectedLayer", undefined); // Clear selection only when creating
    }

    try {
      const baseUrl = getBaseUrl(url);
      const environment = import.meta.env.VITE_API_URL || "/api";

      const response = await axios.get(`${environment}/maps/proxy`, {
        params: {
          url: baseUrl,
          service: "WMS",
          version: "1.3.0",
          request: "GetCapabilities",
        },
      });

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data, "text/xml");

      const root = xmlDoc.documentElement;
      const serviceVersion = root.getAttribute("version") || "1.1.1";
      setFetchedServiceVersion(serviceVersion);

      const extractedLayers: {
        name: string;
        title: string;
        crs: string[];
        bbox?: number[];
      }[] = [];
      const layerNodes = xmlDoc.getElementsByTagName("Layer");

      for (let i = 0; i < layerNodes.length; i++) {
        const node = layerNodes[i];
        const nameNode = node.getElementsByTagName("Name")[0];
        const titleNode = node.getElementsByTagName("Title")[0];

        if (nameNode && titleNode) {
          const name = nameNode.textContent || "";
          const title = titleNode.textContent || "";

          const crsList: string[] = [];
          const crsNodes = node.getElementsByTagName("CRS");
          const srsNodes = node.getElementsByTagName("SRS");

          for (let j = 0; j < crsNodes.length; j++) {
            if (crsNodes[j].textContent) crsList.push(crsNodes[j].textContent!);
          }
          for (let j = 0; j < srsNodes.length; j++) {
            if (srsNodes[j].textContent) crsList.push(srsNodes[j].textContent!);
          }

          // Extract BBox
          let bbox: number[] | undefined;
          const exBbox = node.getElementsByTagName(
            "EX_GeographicBoundingBox",
          )[0];
          if (exBbox) {
            const west = parseFloat(
              exBbox.getElementsByTagName("westBoundLongitude")[0]
                ?.textContent || "0",
            );
            const east = parseFloat(
              exBbox.getElementsByTagName("eastBoundLongitude")[0]
                ?.textContent || "0",
            );
            const south = parseFloat(
              exBbox.getElementsByTagName("southBoundLatitude")[0]
                ?.textContent || "0",
            );
            const north = parseFloat(
              exBbox.getElementsByTagName("northBoundLatitude")[0]
                ?.textContent || "0",
            );
            bbox = [west, south, east, north];
          } else {
            const llBbox = node.getElementsByTagName("LatLonBoundingBox")[0];
            if (llBbox) {
              const minx = parseFloat(llBbox.getAttribute("minx") || "0");
              const miny = parseFloat(llBbox.getAttribute("miny") || "0");
              const maxx = parseFloat(llBbox.getAttribute("maxx") || "0");
              const maxy = parseFloat(llBbox.getAttribute("maxy") || "0");
              bbox = [minx, miny, maxx, maxy];
            }
          }

          if (name && !extractedLayers.some((l) => l.name === name)) {
            extractedLayers.push({
              name,
              title,
              crs: Array.from(new Set(crsList)),
              bbox,
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

          // Try match by technical name (ID)
          if (targetName) {
            found = extractedLayers.find((l) => l.name === targetName);
          }

          // Fallback: Try match by title (Layer Name)
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
  }) => {
    form.setValue("selectedLayer", layer, {
      shouldValidate: true,
      shouldDirty: true,
    });
    form.setValue("layerName", layer.title, { shouldDirty: true });

    if (fetchedServiceVersion) {
      form.setValue("version", fetchedServiceVersion);
    }

    if (layer.crs && layer.crs.length > 0) {
      const preferred = ["EPSG:4326", "EPSG:3857", "CRS:84"];
      const found = preferred.find((p) => layer.crs!.includes(p));
      form.setValue("srs", found || layer.crs[0]);
    }
  };

  const loadingMethod = form.watch("loadingMethod");
  const isWms = loadingMethod === "CustomWMSLayer";

  const handleNext = async () => {
    let isValid = false;
    if (step === 1) {
      const isUrlValid = await form.trigger("url");
      const selected = form.getValues("selectedLayer");
      if (isUrlValid && selected) {
        isValid = true;
      }
    } else if (step === 2) {
      isValid = await form.trigger([
        "loadingMethod",
        "version",
        "srs",
        "groupId",
        "layerName",
        "minZoom",
        "maxZoom",
        "clickAction",
        "clickActionParams",
      ]);
    } else if (step === 3) {
      isValid = true; // Mapeamento
    } else if (step === 4) {
      isValid = true; // Template
    } else if (step === 5) {
      isValid = await form.trigger(["isDynamic", "layerProperty", "colors"]); // Estilização
    }

    if (isValid) {
      let nextStep = step + 1;
      // Skip Template (4) and Styling (5) for WMS
      if (isWms && nextStep === 4) {
        nextStep = 6;
      }
      setStep(nextStep);
      if (nextStep > maxReachedStep) {
        setMaxReachedStep(nextStep);
      }
    }
  };

  const handleBack = () => {
    let prevStep = step - 1;
    // Skip Styling (5) and Template (4) for WMS
    if (isWms && prevStep === 5) {
      prevStep = 3;
    }
    setStep(prevStep);
  };

  const goToStep = async (targetStep: number) => {
    if (isEditing) {
      setStep(targetStep);
      return;
    }

    if (targetStep < step) {
      setStep(targetStep);
      return;
    }

    if (targetStep <= maxReachedStep) {
      setStep(targetStep);
    }
  };

  const handleDynamicChange = (checked: boolean) => {
    form.setValue("isDynamic", checked);
    const currentColors = form.getValues("colors");
    if (!checked && currentColors.length > 1) {
      form.setValue("colors", [currentColors[0]]);
    }
  };

  const onSubmit: SubmitHandler<LayerSchemaFormValues> = async (data) => {
    if (!data.selectedLayer) {
      toastWarning("Selecione uma camada");
      return;
    }

    setLoading(true);
    try {
      const transformed = buildLayerSchema(data);

      if (isEditing && id && originalData) {
        // Update
        const payload = {
          ...originalData,
          ...transformed,
          properties: {
            ...(originalData.properties || {}),
            ...(transformed.properties || {}),
          },
          id, // Keep the same ID
        };
        await updateLayerSchema(id, payload);
      } else {
        // Create
        // Generating ID: technm_timestamps
        const techName =
          data.selectedLayer.name.split(":").pop() || data.layerName;
        const generatedId = `${techName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`;

        const payload = {
          ...transformed,
          id: generatedId,
        };

        await createLayerSchema(payload);
      }

      toastSuccess(
        isEditing
          ? "Camada atualizada com sucesso"
          : "Camada criada com sucesso",
      );
      setLocation("~/admin/layer-manager");
    } catch (error) {
      console.error("Failed to save layer", error);
      toastError("Erro ao salvar camada");
      setLocation("~/admin/layer-manager");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, label: "Seleção" },
    { number: 2, label: "Configuração" },
    { number: 3, label: "Mapeamento" },
    ...(isWms
      ? []
      : [
          { number: 4, label: "Template" },
          { number: 5, label: "Estilização" },
        ]),
    { number: 6, label: "Revisão" },
  ];

  if (isEditing && !isDataLoaded) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-background/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Carregando dados da camada...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background/50 overflow-hidden relative">
      <div className="px-6 py-6 min-h-[120px] bg-card border-b shadow-sm z-10 shrink-0 flex flex-col justify-center">
        <div className="grid grid-cols-1 min-[1000px]:grid-cols-[1fr_minmax(auto,2fr)_1fr] items-center gap-6 w-full">
          <div className="flex justify-start">
            <AdminHeader
              title={isEditing ? "Editar Camada" : "Criar Camada"}
              subtitle={
                isEditing
                  ? `Editando: ${form.watch("layerName")}`
                  : "Nova camada de dados espaciais"
              }
              className="mb-0 pb-0"
            />
          </div>

          <div className="flex justify-center w-full min-w-0">
            <div className="w-full max-w-3xl">
              <StepsNavigation
                steps={steps}
                currentStep={step}
                maxReachedStep={maxReachedStep}
                onStepClick={goToStep}
              />
            </div>
          </div>

          <div className="flex justify-end min-w-[200px]">
            {(step === 2 || step === 4 || step === 6) && (
              <button
                type="button"
                onClick={handleUpdatePreview}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium"
              >
                {isPreviewVisible
                  ? "Atualizar Visualização"
                  : "Visualizar Camada"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 relative w-full h-full min-h-0 overflow-hidden pb-[73px]">
        <div className="absolute inset-0 pb-[73px] flex">
          {/* Main Content Area */}
          <div
            className={cn(
              "flex flex-col items-center px-0 h-full transition-all duration-300 scrollbar-thin scrollbar-thumb-muted-foreground/20",
              shouldShowPreview ? "w-1/2 border-r" : "w-full",
              step === 4 ? "overflow-hidden" : "overflow-y-auto",
            )}
          >
            <div
              className={cn(
                "w-full flex flex-col",
                step === 4
                  ? "flex-1 h-full max-w-full min-h-0"
                  : "max-w-4xl p-6 h-auto",
              )}
            >
              <div
                className={cn(
                  "flex flex-col",
                  step === 4
                    ? "flex-1 h-full min-h-0"
                    : "bg-card border md:rounded-lg shadow-sm overflow-hidden p-6 h-auto",
                )}
              >
                <Form {...form}>
                  <form
                    id="layer-handle-form"
                    onSubmit={form.handleSubmit(onSubmit as any)}
                    className={cn(
                      "flex flex-col",
                      step === 4 ? "flex-1 h-full min-h-0" : "",
                    )}
                  >
                    <Suspense
                      fallback={
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      }
                    >
                      {step === 1 && (
                        <LayerSelection
                          loading={loading}
                          fetchError={fetchError}
                          layers={layers}
                          onFetch={handleFetchCapabilities}
                          onNext={handleNext}
                          onLayerSelect={handleLayerSelect}
                          readOnly={isEditing}
                        />
                      )}

                      {step === 2 && (
                        <LayerConfiguration
                          onNext={handleNext}
                          onBack={handleBack}
                        />
                      )}

                      {step === 3 && (
                        <LayerMapping onBack={handleBack} onNext={handleNext} />
                      )}

                      {step === 4 && (
                        <LayerTemplate
                          onNext={handleNext}
                          onBack={handleBack}
                        />
                      )}

                      {step === 5 && (
                        <LayerStyling
                          onBack={handleBack}
                          onNext={handleNext}
                          onDynamicChange={handleDynamicChange}
                        />
                      )}

                      {step === 6 && (
                        <LayerReview
                          onBack={handleBack}
                          originalData={originalData}
                          previewSchema={previewSchema}
                        />
                      )}
                    </Suspense>
                  </form>
                </Form>
              </div>
            </div>

            {/* Preview Area */}
            <div
              className={cn(
                "transition-all duration-300 h-full",
                shouldShowPreview ? "w-1/2 border-l" : "w-0 hidden border-none",
              )}
            >
              {step > 1 && (
                <MapView
                  previewLayers={previewSchema ? [previewSchema] : undefined}
                  hideControls={true}
                  disablePadding={true}
                />
              )}
            </div>
          </div>

          {/* Global Bottom Navigation */}
          <div className="absolute bottom-0 left-0 right-0 w-full h-[73px] bg-card border-t p-4 z-50 flex justify-between items-center">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              Voltar
            </button>

            {step === 6 ? (
              <button
                type="submit"
                form="layer-handle-form"
                disabled={loading}
                className="bg-primary text-primary-foreground flex items-center gap-2 px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 font-medium text-sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Salvar"
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  step === 1 &&
                  (!form.getValues("url") || !form.getValues("selectedLayer"))
                }
                className="bg-primary text-primary-foreground flex items-center gap-2 px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 font-medium text-sm"
              >
                Próximo
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayerHandlePage;
