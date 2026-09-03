import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/useToast";
import {
  DEFAULT_LAYER_FORM_COLOR,
  DEFAULT_LAYER_LINE_WIDTH,
} from "@/lib/layer-style-defaults";
import { StepsNavigation } from "@/pages/Admin/components/StepsNavigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Palette, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { LayerSchemaFormSchema, LayerSchemaFormValues } from "../utils";
import { LayerConfiguration } from "./LayerConfiguration";
import { LayerMapping } from "./LayerMapping";
import { LayerReview } from "./LayerReview";
import { LayerStyling } from "./LayerStyling";

interface LayerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  layer: { name: string; title: string; crs?: string[]; bbox?: number[] };
  initialConfig?: Partial<LayerSchemaFormValues>;
  onSave: (config: LayerSchemaFormValues) => void;
  url: string; // GeoServer URL used for fetching attributes/capabilities
}

const steps = [
  { number: 1, label: "Configuração" },
  { number: 2, label: "Mapeamento" },
  { number: 3, label: "Estilização" },
  { number: 4, label: "Revisão" },
];

export const LayerEditModal = ({
  isOpen,
  onClose,
  layer,
  initialConfig,
  onSave,
  url,
}: LayerEditModalProps) => {
  const [step, setStep] = useState(1);
  const { toastError } = useToast();

  const form = useForm<LayerSchemaFormValues>({
    resolver: zodResolver(LayerSchemaFormSchema) as any,
    defaultValues: {
      url: url,
      loadingMethod: "GeoJsonLayer",
      version: "2.0.0",
      srs: "CRS:84",
      groupId: "geral",
      layerName: layer.title,
      summaryDescription: "",
      sourceParameters: "",
      legisLinks: "",
      ckanMetadataUrl: "",
      minZoom: "",
      maxZoom: "",
      clickAction: "none",
      isActive: true,
      isSelected: false,
      isVisible: true,
      isDynamic: false,
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
      selectedLayer: layer,
      ...initialConfig,
    },
    mode: "onChange",
  });

  // Update form when layer/initialConfig changes
  useEffect(() => {
    if (isOpen && layer) {
      form.reset({
        url: url,
        loadingMethod: "GeoJsonLayer",
        version: "2.0.0",
        srs: "CRS:84",
        groupId: "geral",
        layerName: layer.title,
        minZoom: "",
        maxZoom: "",
        clickAction: "none",
        isActive: true,
        isSelected: false,
        isVisible: true,
        isDynamic: false,
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
        selectedLayer: layer,
        ...initialConfig,
      });
      setStep(1);
    }
  }, [isOpen, layer, initialConfig, url, form]);

  const handleNext = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await form.trigger([
        "groupId",
        "layerName",
        "minZoom",
        "maxZoom",
        "index",
      ]);
    } else if (step === 2) {
      // Mapping step - usually optional or handled internally
      isValid = true;
    } else if (step === 3) {
      isValid = await form.trigger([
        "isDynamic",
        "layerProperty",
        "lineWidth",
        "label",
        "colors",
      ]);
    }

    if (isValid || step === 4) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      onSave(form.getValues());
      onClose();
    } else {
      toastError("Verifique os campos obrigatórios");
    }
  };

  const handleDynamicChange = (checked: boolean) => {
    form.setValue("isDynamic", checked);
    const currentColors = form.getValues("colors");
    if (!checked && currentColors.length > 1) {
      form.setValue("colors", [currentColors[0]]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            Personalizar visualmente camada
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <StepsNavigation
            steps={steps}
            currentStep={step}
            maxReachedStep={4}
            onStepClick={(s) => setStep(s)}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-1">
          <Form {...form}>
            <form className="space-y-6 h-full">
              {step === 1 && <LayerConfiguration simpleMode hideNavigation />}

              {step === 2 && <LayerMapping hideNavigation />}

              {step === 3 && (
                <LayerStyling
                  hideNavigation
                  onDynamicChange={handleDynamicChange}
                />
              )}

              {step === 4 && (
                <div className="h-full min-h-[400px]">
                  <LayerReview hideNavigation />
                </div>
              )}
            </form>
          </Form>
        </div>

        <div className="flex justify-between pt-4 border-t mt-auto">
          <Button
            type="button"
            variant="outline"
            onClick={step === 1 ? onClose : handleBack}
          >
            {step === 1 ? (
              "Cancelar"
            ) : (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
              </>
            )}
          </Button>

          {step < 4 ? (
            <Button type="button" onClick={handleNext}>
              Próximo <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Salvar Alterações
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
