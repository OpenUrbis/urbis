import { AdminHeader } from "@/components/AdminHeader";
import { Form } from "@/components/ui/form";
import { createLayerSchema, getLayerSchema, updateLayerSchema } from "@/integrations/layer-schema-integration";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useLocation, useRoute } from "wouter";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { LayerConfiguration } from "./steps/LayerConfiguration";
import { LayerReview } from "./steps/LayerReview";
import { LayerSelection } from "./steps/LayerSelection";
import { LayerStyling } from "./steps/LayerStyling";
import { buildLayerSchema, LayerSchema, LayerSchemaFormSchema, LayerSchemaFormValues, parseLayerSchemaToForm } from "./utils";

const LayerHandlePage = () => {
  const [isEditMatch, editParams] = useRoute("/:id");

  const isEditing = !!isEditMatch && editParams?.id !== "handle";
  const id = isEditing ? editParams?.id : undefined;

  const [step, setStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(isEditing ? 4 : 1);
  const [layers, setLayers] = useState<{ name: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [originalData, setOriginalData] = useState<LayerSchema | null>(null);
  const [, setLocation] = useLocation();
  const { toastSuccess, toastError, toastWarning } = useToast();

  const form = useForm<LayerSchemaFormValues>({
    resolver: zodResolver(LayerSchemaFormSchema),
    defaultValues: {
      url: "https://geoserver.slui.dev/geoserver/slui/ows",
      loadingMethod: "CustomWMSLayer",
      groupId: "geral",
      layerName: "",
      minZoom: "",
      maxZoom: "",
      isActive: true,
      isVisible: false,
      isDynamic: false,
      colors: [{
        fillColor: [255, 0, 0, 0.5],
        borderColor: [0, 0, 0, 1],
        textColor: [255, 255, 255, 1],
      }]
    },
    mode: "onChange"
  });

  useEffect(() => {
    const loadData = async () => {
      if (isEditing && id) {
        setMaxReachedStep(4);
        try {
          const backendData = await getLayerSchema(id);
          setOriginalData(backendData as unknown as LayerSchema);
          
          const formData = parseLayerSchemaToForm(backendData as unknown as LayerSchema);
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

  const getBaseUrl = (inputUrl: string) => {
    try {
      const urlObj = new URL(inputUrl);
      return `${urlObj.origin}${urlObj.pathname}`;
    } catch {
      return inputUrl;
    }
  };

  const handleFetchCapabilities = async (overrideUrl?: string) => {
    const url = overrideUrl || form.getValues("url");
    if (!url) return;

    setLoading(true);
    setFetchError("");
    setLayers([]);
    
    if (!isEditing) {
      form.setValue("selectedLayer", undefined); // Clear selection only when creating
    }

    try {
      const baseUrl = getBaseUrl(url);
      const environment = import.meta.env.VITE_API_URL || "https://api.mapa.urbis.sampa.br";
      const params = `service=WMS&version=1.3.0&request=GetCapabilities`;

      const response = await axios.get(`${environment}/maps/proxy`, {
        params: { url: `${baseUrl}?${params}` }
      });

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data, "text/xml");

      const extractedLayers: { name: string; title: string }[] = [];
      const layerNodes = xmlDoc.getElementsByTagName("Layer");

      for (let i = 0; i < layerNodes.length; i++) {
        const node = layerNodes[i];
        const nameNode = node.getElementsByTagName("Name")[0];
        const titleNode = node.getElementsByTagName("Title")[0];

        if (nameNode && titleNode) {
          const name = nameNode.textContent || "";
          const title = titleNode.textContent || "";

          if (name && !extractedLayers.some(l => l.name === name)) {
            extractedLayers.push({ name, title });
          }
        }
      }

      if (extractedLayers.length === 0) {
        setFetchError("Nenhuma camada encontrada ou resposta inválida.");
      } else {
        setLayers(extractedLayers);

        if (isEditing) {
          const currentValues = form.getValues();
          if (currentValues.selectedLayer?.name) {
            const found = extractedLayers.find(l => l.name === currentValues.selectedLayer?.name);
            if (found) {
              form.setValue("selectedLayer", found);
            }
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

  const handleLayerSelect = (layer: { name: string; title: string }) => {
    form.setValue("selectedLayer", layer, { shouldValidate: true, shouldDirty: true });
    form.setValue("layerName", layer.title, { shouldDirty: true });
  };

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
        "groupId",
        "layerName",
        "minZoom",
        "maxZoom",
      ]);
    } else if (step === 3) {
      isValid = await form.trigger(["isDynamic", "layerProperty", "colors"]);
    }

    if (isValid) {
      const nextStep = step + 1;
      setStep(nextStep);
      if (nextStep > maxReachedStep) {
        setMaxReachedStep(nextStep);
      }
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
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
          id, // Keep the same ID
        };
        await updateLayerSchema(id, payload);
      } else {
        // Create
        // Generating ID: technm_timestamps
        const techName = data.selectedLayer.name.split(":").pop() || data.layerName;
        const generatedId = `${techName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`;
        
        const payload = {
          ...transformed,
          id: generatedId,
        };
        
        await createLayerSchema(payload);
      }
      
      toastSuccess(isEditing ? "Camada atualizada com sucesso" : "Camada criada com sucesso");
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
    { number: 3, label: "Estilização" },
    { number: 4, label: "Revisão" },
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
    <div className="flex-1 flex flex-col h-full bg-background/50">
      <div className="px-6 py-4">
        <AdminHeader
          title={isEditing ? "Editar Camada" : "Criar Camada"}
          subtitle={
            isEditing ? `Editando: ${form.watch('layerName')}` : "Nova camada de dados espaciais"
          }
        />
      </div>

      <div className="flex-1 flex flex-col items-center px-0 md:px-6">
        <div className="w-full max-w-2xl space-y-12">
          <nav aria-label="Steps" className="flex justify-center">
            <ol className="flex items-center w-full max-w-md">
              {steps.map((s, i) => (
                <li
                  key={s.number}
                  className={cn(
                    "flex items-center relative",
                    i !== steps.length - 1 ? "flex-1" : ""
                  )}
                >
                  <div className="flex flex-col items-center relative">
                    <button
                      type="button"
                      onClick={() => goToStep(s.number)}
                      disabled={s.number > maxReachedStep}
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors z-10",
                        step === s.number
                          ? "border-primary bg-primary text-primary-foreground font-bold shadow-sm"
                          : s.number <= maxReachedStep
                            ? "border-primary bg-background text-primary"
                            : "border-muted bg-background text-muted-foreground cursor-not-allowed"
                      )}
                    >
                      {s.number}
                    </button>
                    <span
                      className={cn(
                        "absolute top-10 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap",
                        step === s.number
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i !== steps.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 w-full mx-2",
                        s.number < maxReachedStep ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <div className="bg-card border md:rounded-lg p-6 shadow-sm mb-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit as any)}
                className="space-y-6"
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
                  <LayerConfiguration onNext={handleNext} onBack={handleBack} />
                )}

                {step === 3 && (
                  <LayerStyling
                    onBack={handleBack}
                    onNext={handleNext}
                    onDynamicChange={handleDynamicChange}
                  />
                )}

                {step === 4 && <LayerReview onBack={handleBack} />}
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayerHandlePage;
