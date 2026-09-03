import LayerColorManager from "@/components/LayerColorManager";
import { ColorPickerSwatch } from "@/components/ColorPickerSwatch";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_LAYER_LINE_WIDTH,
  DEFAULT_LAYER_HOVER_COLOR,
  DEFAULT_LAYER_SELECTED_COLOR,
} from "@/lib/layer-style-defaults";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { fetchAttributes as fetchLayerAttributes } from "@/integrations/layer-attributes-integration";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

const MIN_LAYER_LINE_WIDTH = 0.1;
const MAX_LAYER_LINE_WIDTH = 20;

const DEFAULT_LABEL_SIZE = 13;
const DEFAULT_LABEL_COLOR = "#111827";
const DEFAULT_LABEL_HALO_COLOR = "#ffffff";
const DEFAULT_LABEL_HALO_WIDTH = 2;

const normalizeLineWidth = (lineWidth: unknown) => {
  const parsed = Number(lineWidth);
  if (!Number.isFinite(parsed)) return DEFAULT_LAYER_LINE_WIDTH;

  return Math.min(MAX_LAYER_LINE_WIDTH, Math.max(MIN_LAYER_LINE_WIDTH, parsed));
};

interface LayerStylingProps {
  onBack?: () => void;
  onNext?: () => void;
  onDynamicChange: (checked: boolean) => void;
  hideNavigation?: boolean;
}

export const LayerStyling = ({
  onBack,
  onNext,
  onDynamicChange,
  hideNavigation = false,
}: LayerStylingProps) => {
  const form = useFormContext();
  const [attributes, setAttributes] = useState<string[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [useCustomExpression, setUseCustomExpression] = useState(false);
  const loadingMethod = form.watch("loadingMethod");
  const isSelected = form.watch("isSelected");
  const isDynamic = form.watch("isDynamic");
  const isLabelEnabled = form.watch("label.enabled");
  const labelProperty = form.watch("label.property");
  const isWmsLayer = loadingMethod === "CustomWMSLayer";
  const supportsInteractionStates = Boolean(isSelected) && !isWmsLayer;

  useEffect(() => {
    if (isLabelEnabled && labelProperty) {
      const looksLikeExpression =
        labelProperty.startsWith("(") ||
        labelProperty.includes("=>") ||
        labelProperty.includes(".") ||
        labelProperty.includes("?") ||
        labelProperty.includes("+") ||
        (attributes.length > 0 && !attributes.includes(labelProperty));

      if (looksLikeExpression && labelProperty !== "") {
        setUseCustomExpression(true);
      }
    }
  }, [isLabelEnabled, labelProperty, attributes]);

  useEffect(() => {
    const fetchAttributes = async () => {
      const url = form.getValues("url");
      const layer = form.getValues("selectedLayer");
      const shouldLoadAttributes =
        form.getValues("isDynamic") || form.getValues("label.enabled");

      if (!url || !layer || !shouldLoadAttributes) return;

      setLoadingAttributes(true);
      try {
        const fetchedAttributes = await fetchLayerAttributes(url, layer.name);
        setAttributes(fetchedAttributes.map((attr) => attr.name));
      } catch (e) {
        console.error("Failed to fetch attributes", e);
      } finally {
        setLoadingAttributes(false);
      }
    };

    fetchAttributes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDynamic, isLabelEnabled]);

  const ensureLabelDefaults = (enabled: boolean) => {
    if (!enabled) {
      form.setValue("label.enabled", false, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    const currentLabel = form.getValues("label") ?? {};
    form.setValue(
      "label",
      {
        enabled: true,
        property: currentLabel.property ?? "",
        minZoom: currentLabel.minZoom ?? "",
        size: currentLabel.size ?? DEFAULT_LABEL_SIZE,
        color: currentLabel.color ?? DEFAULT_LABEL_COLOR,
        haloColor: currentLabel.haloColor ?? DEFAULT_LABEL_HALO_COLOR,
        haloWidth: currentLabel.haloWidth ?? DEFAULT_LABEL_HALO_WIDTH,
      },
      { shouldDirty: true, shouldValidate: true },
    );
  };

  if (isWmsLayer) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="space-y-1">
              <h3 className="text-sm font-medium">
                Estilização visual desativada para WMS
              </h3>
              <p className="text-sm opacity-90">
                Esta camada será renderizada conforme a simbologia publicada na
                fonte WMS. Cores, hachuras, espessura de borda e estados de
                interação devem ser ajustados no serviço de origem.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
      <section className="space-y-3" aria-labelledby="layer-style-colors-title">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <h3 id="layer-style-colors-title" className="text-sm font-semibold">
              Estilo da feição
            </h3>
            <p className="text-xs text-muted-foreground">
              Ajuste a aparência principal da camada.
            </p>
          </div>

          <FormField
            control={form.control}
            name="isDynamic"
            render={({ field }) => (
              <FormItem className="flex shrink-0 flex-row items-center gap-2">
                <FormLabel className="text-xs font-medium">
                  Cores dinâmicas
                </FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={onDynamicChange}
                    aria-label="Ativar cores dinâmicas"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {form.watch("isDynamic") && (
          <FormField
            control={form.control}
            name="layerProperty"
            render={({ field }) => (
              <FormItem className="animate-in fade-in slide-in-from-top-2">
                <FormLabel className="text-xs">
                  Atributo para classificação
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger disabled={loadingAttributes} className="h-8">
                      <SelectValue
                        placeholder={
                          loadingAttributes
                            ? "Carregando..."
                            : "Selecione o atributo"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {attributes.map((attr) => (
                      <SelectItem key={attr} value={attr}>
                        {attr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  Use múltiplas cores baseadas em um atributo da camada.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="colors"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <LayerColorManager
                  colors={field.value}
                  onChange={field.onChange}
                  dynamic={form.watch("isDynamic")}
                  showTextColor={false}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      <section
        className="space-y-3 border-t pt-4"
        aria-labelledby="layer-style-label-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <h3 id="layer-style-label-title" className="text-sm font-semibold">
              Rótulos no mapa
            </h3>
            <p className="text-xs text-muted-foreground">
              Exiba textos sobre as feições usando um atributo da camada.
            </p>
          </div>

          <FormField
            control={form.control}
            name="label.enabled"
            render={({ field }) => (
              <FormItem className="flex shrink-0 flex-row items-center gap-2">
                <FormLabel className="text-xs font-medium">
                  Exibir rótulo
                </FormLabel>
                <FormControl>
                  <Switch
                    checked={Boolean(field.value)}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      ensureLabelDefaults(checked);
                    }}
                    aria-label="Exibir rótulo no mapa"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {isLabelEnabled && (
          <div className="grid gap-4 rounded-lg border bg-muted/20 p-3 animate-in fade-in slide-in-from-top-2">
            <FormField
              control={form.control}
              name="label.property"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs">
                      Campo usado como texto
                    </FormLabel>
                    <button
                      type="button"
                      onClick={() => setUseCustomExpression(!useCustomExpression)}
                      className="text-[10px] font-semibold text-primary underline hover:text-primary/80"
                    >
                      {useCustomExpression ? "Selecionar atributo" : "Escrever expressão JS"}
                    </button>
                  </div>
                  <FormControl>
                    {useCustomExpression ? (
                      <Input
                        placeholder="Ex: (d) => d?.properties?.nome"
                        className="h-8 text-xs font-mono"
                        {...field}
                      />
                    ) : (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger
                            disabled={loadingAttributes}
                            className="h-8"
                          >
                            <SelectValue
                              placeholder={
                                loadingAttributes
                                  ? "Carregando..."
                                  : "Selecione o atributo"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {attributes.map((attr) => (
                            <SelectItem key={attr} value={attr}>
                              {attr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormControl>
                  <FormDescription className="text-xs">
                    Para distritos, por exemplo, use o campo de nome como
                    <code className="ml-1 rounded bg-muted px-1 py-0.5">
                      nm_distrito_municipal
                    </code>
                    .
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="label.minZoom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Zoom mínimo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="Ex: 11"
                        className="h-8 text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="label.size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Tamanho</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Ex: 13"
                        className="h-8 text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="label.haloWidth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Largura do halo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="Ex: 2"
                        className="h-8 text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="label.color"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-medium">
                      Cor do texto
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <ColorPickerSwatch
                          color={field.value || DEFAULT_LABEL_COLOR}
                          onChange={(color) => field.onChange(color.hex())}
                        />
                        <span className="text-xs text-muted-foreground">
                          {field.value || DEFAULT_LABEL_COLOR}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="label.haloColor"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-medium">
                      Cor do halo/contorno
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <ColorPickerSwatch
                          color={field.value || DEFAULT_LABEL_HALO_COLOR}
                          onChange={(color) => field.onChange(color.hex())}
                        />
                        <span className="text-xs text-muted-foreground">
                          {field.value || DEFAULT_LABEL_HALO_COLOR}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
      </section>

      <section
        className="space-y-3 border-t pt-4"
        aria-labelledby="layer-style-interaction-title"
      >
        <div className="space-y-0.5">
          <h3
            id="layer-style-interaction-title"
            className="text-sm font-semibold"
          >
            Estados de interação
          </h3>
          <p className="text-xs text-muted-foreground">
            Opcional. Hover e seleção podem usar cores próprias ou acompanhar a
            cor da feição.
          </p>
        </div>

        {!supportsInteractionStates && (
          <p className="text-xs text-muted-foreground">
            Esta camada não possui seleção/interação habilitada na configuração
            original (<code>isSelected</code>); estes estados não serão
            aplicados no mapa.
          </p>
        )}

        {supportsInteractionStates && (
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="hoverColor"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-medium">
                    Cor ao passar o mouse
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <ColorPickerSwatch
                        color={field.value ?? [...DEFAULT_LAYER_HOVER_COLOR]}
                        onChange={(color) => field.onChange(color.array())}
                      />
                      <span className="text-xs text-muted-foreground">
                        Vazio: preenchimento transparente.
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="selectedColor"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-medium">
                    Cor selecionada
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <ColorPickerSwatch
                        color={field.value ?? [...DEFAULT_LAYER_SELECTED_COLOR]}
                        onChange={(color) => field.onChange(color.array())}
                      />
                      <span className="text-xs text-muted-foreground">
                        Vazio: preenchimento opaco.
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </section>

      <section
        className="space-y-3 border-t pt-4"
        aria-labelledby="layer-style-stroke-title"
      >
        <div className="space-y-0.5">
          <h3 id="layer-style-stroke-title" className="text-sm font-semibold">
            Traço
          </h3>
          <p className="text-xs text-muted-foreground">
            Ajuste a espessura da borda aplicada na prévia.
          </p>
        </div>

        <FormField
          control={form.control}
          name="lineWidth"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between gap-3">
                <FormLabel>Espessura da borda</FormLabel>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {normalizeLineWidth(field.value).toFixed(1)} px
                </span>
              </div>
              <FormControl>
                <div className="grid grid-cols-[1fr_4.5rem] items-center gap-3">
                  <Slider
                    min={MIN_LAYER_LINE_WIDTH}
                    max={MAX_LAYER_LINE_WIDTH}
                    step={0.1}
                    value={[normalizeLineWidth(field.value)]}
                    onValueChange={([nextLineWidth]) =>
                      field.onChange(normalizeLineWidth(nextLineWidth))
                    }
                    aria-label="Espessura da borda"
                  />
                  <Input
                    type="number"
                    min={MIN_LAYER_LINE_WIDTH}
                    max={MAX_LAYER_LINE_WIDTH}
                    step="0.1"
                    placeholder={`Ex: ${DEFAULT_LAYER_LINE_WIDTH}`}
                    value={normalizeLineWidth(field.value)}
                    onChange={(event) =>
                      field.onChange(normalizeLineWidth(event.target.value))
                    }
                    className="h-8 text-xs"
                    aria-label="Valor da espessura da borda em pixels"
                  />
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                {MIN_LAYER_LINE_WIDTH}–{MAX_LAYER_LINE_WIDTH}px. Padrão:{" "}
                {DEFAULT_LAYER_LINE_WIDTH}px.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>
    </div>
  );
};
