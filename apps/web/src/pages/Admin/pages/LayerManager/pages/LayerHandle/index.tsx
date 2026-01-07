import { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { ChevronRight } from "lucide-react";
import { LayerSelection } from "./steps/LayerSelection";
import { LayerConfiguration } from "./steps/LayerConfiguration";
import { LayerStyling } from "./steps/LayerStyling";

// Schema Definitions
const step1Schema = z.object({
  url: z.string().url("Insira uma URL válida"),
  selectedLayer: z.object({
    name: z.string(),
    title: z.string()
  }).optional()
});

const step2Schema = z.object({
  loadingMethod: z.string().min(1, "Selecione o método de carregamento"),
  groupId: z.string().min(1, "Selecione um grupo"),
  layerName: z.string().min(1, "Insira o nome da camada"),
  minZoom: z.string().optional(),
  maxZoom: z.string().optional()
});

const step3Schema = z.object({
  isDynamic: z.boolean(),
  layerProperty: z.string().optional(),
  colors: z.array(z.any()).min(1, "É necessário configurar pelo menos uma cor")
}).refine((data) => {
  if (data.isDynamic && !data.layerProperty) {
    return false;
  }
  return true;
}, {
  message: "Informe o atributo para classificação",
  path: ["layerProperty"]
});

// Combined schema for form type
const formSchema = step1Schema.merge(step2Schema).merge(step3Schema);
type FormValues = z.infer<typeof formSchema>;

const LayerHandlePage = () => {
  const [step, setStep] = useState(1);
  const [layers, setLayers] = useState<{ name: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      loadingMethod: "wms",
      groupId: "",
      layerName: "",
      minZoom: "",
      maxZoom: "",
      isDynamic: false,
      colors: [{
        fillColor: [255, 0, 0, 0.5],
        borderColor: [0, 0, 0, 1],
        textColor: [255, 255, 255, 1],
      }]
    },
    mode: "onChange"
  });

  const getBaseUrl = (inputUrl: string) => {
    try {
      const urlObj = new URL(inputUrl);
      return `${urlObj.origin}${urlObj.pathname}`;
    } catch (e) {
      return inputUrl;
    }
  };

  const handleFetchCapabilities = async () => {
    const url = form.getValues("url");
    if (!url) return;
    
    setLoading(true);
    setFetchError("");
    setLayers([]);
    form.setValue("selectedLayer", undefined); // Clear selection

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
      }

    } catch (e) {
      console.error("Error fetching capabilities", e);
      setFetchError("Falha ao buscar capacidades. Verifique a URL.");
    } finally {
      setLoading(false);
    }
  };

  const handleLayerSelect = (layer: { name: string; title: string }) => {
    form.setValue("selectedLayer", layer);
    form.setValue("layerName", layer.title);
    form.trigger("selectedLayer"); // Trigger validation
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
      isValid = await form.trigger(["loadingMethod", "groupId", "layerName", "minZoom", "maxZoom"]);
    }

    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleDynamicChange = (checked: boolean) => {
    form.setValue("isDynamic", checked);
    const currentColors = form.getValues("colors");
    if (!checked && currentColors.length > 1) {
      form.setValue("colors", [currentColors[0]]);
    }
  };

  const onSubmit = (data: FormValues) => {
    if (!data.selectedLayer) {
        alert("Selecione uma camada");
        return;
    }
    console.log("Form Data:", data);
    alert("Camada salva com sucesso! (Veja o console)");
  };

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Adicionar Nova Camada</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={step >= 1 ? "text-primary font-medium" : ""}>1. Seleção</span>
          <ChevronRight className="h-4 w-4" />
          <span className={step >= 2 ? "text-primary font-medium" : ""}>2. Configuração</span>
          <ChevronRight className="h-4 w-4" />
          <span className={step >= 3 ? "text-primary font-medium" : ""}>3. Estilização</span>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {step === 1 && (
              <LayerSelection 
                loading={loading}
                fetchError={fetchError}
                layers={layers}
                onFetch={handleFetchCapabilities}
                onNext={handleNext}
                onLayerSelect={handleLayerSelect}
              />
            )}

            {step === 2 && (
              <LayerConfiguration 
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {step === 3 && (
              <LayerStyling 
                onBack={handleBack}
                onDynamicChange={handleDynamicChange}
              />
            )}
          </form>
        </Form>
      </div>
    </div>
  );
};

export default LayerHandlePage;
