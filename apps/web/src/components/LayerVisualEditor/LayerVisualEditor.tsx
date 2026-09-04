import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Separator } from "@open-urbis/map-ui";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RotateCcw, Save } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "../../hooks/useToast";
import {
  DEFAULT_LAYER_FORM_COLOR,
  DEFAULT_LAYER_LINE_WIDTH,
} from "../../lib/layer-style-defaults";
import {
  IGetConfigLayerSchema,
  IGetConfigLayerSchemaTypeEnum,
} from "../../types/fetch-map-config-type";
import {
  buildLayerSchema,
  LayerSchemaFormSchema,
  LayerSchemaFormValues,
  parseLayerSchemaToForm,
} from "../../pages/Admin/pages/LayerManager/pages/LayerHandle/utils";
import { LayerStyling } from "../../pages/Admin/pages/LayerManager/pages/LayerHandle/steps/LayerStyling";

interface LayerVisualEditorProps {
  layer: IGetConfigLayerSchema;
  originalLayer?: IGetConfigLayerSchema | null;
  onPreview: (layer: IGetConfigLayerSchema) => void;
  onSave: (layer: IGetConfigLayerSchema) => void;
}

export const buildLayerVisualFormDefaults = (
  layer: IGetConfigLayerSchema,
): LayerSchemaFormValues => {
  const parsed = parseLayerSchemaToForm(layer as any);

  return {
    url: parsed.url,
    loadingMethod: (layer.type || parsed.loadingMethod || "CustomWMSLayer") as any,
    version: "1.3.0",
    srs: "EPSG:3857",
    groupId: "geral",
    layerName: layer.name,
    minZoom: "",
    maxZoom: "",
    clickAction: "none",
    isActive: true,
    isSelected: false,
    isVisible: true,
    isDynamic: false,
    lineWidth: DEFAULT_LAYER_LINE_WIDTH,
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
    selectedLayer: {
      name: layer.name,
      title: layer.name,
    },
    ...parsed,
  };
};

export const mergeLayerWithVisualFormValues = (
  layer: IGetConfigLayerSchema,
  formValues: LayerSchemaFormValues,
): IGetConfigLayerSchema => {
  const schema = buildLayerSchema(formValues);

  const nextName = formValues.layerName?.trim() || layer.name;
  const isBitmapLayer =
    (layer.type as string) === "BitmapLayer" ||
    (layer.type as any) === IGetConfigLayerSchemaTypeEnum.BitmapLayer;

  const primaryColor = schema.colors?.[0]?.color;
  const bitmapProperties =
    isBitmapLayer && primaryColor
      ? {
          opacity:
            primaryColor[3] !== undefined
              ? primaryColor[3] > 1
                ? primaryColor[3] / 255
                : primaryColor[3]
              : (layer.properties?.opacity ?? 1),
          tintColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
        }
      : {};

  return {
    ...layer,
    ...schema,
    id: layer.id,
    type: layer.type || schema.type,
    name: nextName,
    origin: layer.origin,
    groupId: layer.groupId,
    index: layer.index,
    minZoom: layer.minZoom,
    isActive: layer.isActive,
    isSelected: layer.isSelected,
    isVisible: layer.isVisible,
    properties: {
      ...(layer.properties || {}),
      ...(schema.properties || {}),
      ...bitmapProperties,
    },
  } as unknown as IGetConfigLayerSchema;
};

export const LayerVisualEditor = ({
  layer,
  originalLayer,
  onPreview,
  onSave,
}: LayerVisualEditorProps) => {
  const { toastError } = useToast();
  const sourceLayer = originalLayer ?? layer;
  const initialValues = useMemo(
    () => buildLayerVisualFormDefaults(sourceLayer),
    [sourceLayer],
  );

  const form = useForm<LayerSchemaFormValues>({
    resolver: zodResolver(LayerSchemaFormSchema) as any,
    defaultValues: initialValues,
    mode: "onChange",
  });

  useEffect(() => {
    form.reset(initialValues);
  }, [form, initialValues]);

  const handleDynamicChange = (checked: boolean) => {
    form.setValue("isDynamic", checked, { shouldDirty: true });
    const currentColors = form.getValues("colors");
    if (!checked && currentColors.length > 1) {
      form.setValue("colors", [currentColors[0]], { shouldDirty: true });
    }
  };

  const buildPreviewLayer = () =>
    mergeLayerWithVisualFormValues(layer, form.getValues());

  const validateVisualFields = () =>
    form.trigger([
      "isDynamic",
      "layerProperty",
      "lineWidth",
      "label",
      "colors",
    ]);

  const handlePreview = async () => {
    const isValid = await validateVisualFields();
    const previewLayer = buildPreviewLayer();

    if (!isValid || !previewLayer) {
      toastError("Verifique os campos de personalização visual");
      return;
    }

    onPreview(previewLayer);
  };

  const handleSave = async () => {
    const isValid = await validateVisualFields();
    const previewLayer = buildPreviewLayer();

    if (!isValid || !previewLayer) {
      toastError("Verifique os campos de personalização visual");
      return;
    }

    onSave(previewLayer);
  };

  const handleRestoreOriginal = () => {
    form.reset(initialValues);
    onPreview(sourceLayer);
  };

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="p-3 pb-6">
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={(event) => event.preventDefault()}
            >
              <FormField
                control={form.control}
                name="layerName"
                render={({ field }) => (
                  <FormItem className="rounded-lg border bg-muted/20 p-3">
                    <FormLabel>Nome da camada no seu mapa</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Minha camada personalizada"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Altera apenas o nome exibido nesta sessão do mapa.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <LayerStyling
                hideNavigation
                onDynamicChange={handleDynamicChange}
              />
            </form>
          </Form>
        </div>
      </div>

      <Separator />
      <div className="flex flex-wrap items-center justify-between gap-2 bg-background/95 p-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={handleRestoreOriginal}
        >
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
          Restaurar original
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePreview}
          >
            Prévia
          </Button>
          <Button type="button" size="sm" onClick={handleSave}>
            <Save className="mr-2 h-3.5 w-3.5" />
            Aplicar
          </Button>
        </div>
      </div>
    </>
  );
};
