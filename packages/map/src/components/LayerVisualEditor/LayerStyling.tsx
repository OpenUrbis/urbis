import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Switch,
} from "@open-urbis/map-ui";
import { useFormContext } from "react-hook-form";
import { DEFAULT_LAYER_LINE_WIDTH } from "../../lib/layer-style-defaults";

interface LayerStylingProps {
  onDynamicChange: (checked: boolean) => void;
  hideNavigation?: boolean;
}

const colorArrayToText = (value: unknown, fallback: number[]) =>
  Array.isArray(value) ? value.join(",") : fallback.join(",");

const parseColorArray = (value: string, fallback: number[]) => {
  const parsed = value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));

  return parsed.length >= 3 ? parsed : fallback;
};

export const LayerStyling = ({ onDynamicChange }: LayerStylingProps) => {
  const form = useFormContext();
  const isDynamic = form.watch("isDynamic");
  const isLabelEnabled = form.watch("label.enabled");
  const colors = form.watch("colors") ?? [];
  const firstColor = colors[0] ?? {};

  const updateFirstColor = (patch: Record<string, unknown>) => {
    const nextColors = colors.length ? [...colors] : [{}];
    nextColors[0] = { ...nextColors[0], ...patch };
    form.setValue("colors", nextColors, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

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
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      onDynamicChange(checked);
                    }}
                    aria-label="Ativar cores dinâmicas"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {isDynamic && (
          <FormField
            control={form.control}
            name="layerProperty"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">
                  Atributo para classificação
                </FormLabel>
                <FormControl>
                  <Input
                    className="h-8 text-xs"
                    placeholder="nome_do_atributo"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Informe o atributo da camada usado para cores dinâmicas.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="layer-fill-color" className="text-xs">
              Preenchimento RGBA
            </label>
            <Input
              id="layer-fill-color"
              className="h-8 text-xs font-mono"
              value={colorArrayToText(
                firstColor.fillColor,
                [55, 126, 184, 0.45],
              )}
              onChange={(event) =>
                updateFirstColor({
                  fillColor: parseColorArray(
                    event.target.value,
                    [55, 126, 184, 0.45],
                  ),
                })
              }
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="layer-border-color" className="text-xs">
              Borda RGBA
            </label>
            <Input
              id="layer-border-color"
              className="h-8 text-xs font-mono"
              value={colorArrayToText(
                firstColor.borderColor,
                [31, 41, 55, 1],
              )}
              onChange={(event) =>
                updateFirstColor({
                  borderColor: parseColorArray(
                    event.target.value,
                    [31, 41, 55, 1],
                  ),
                })
              }
            />
          </div>
        </div>
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
                    onCheckedChange={(checked) => field.onChange(checked)}
                    aria-label="Exibir rótulo no mapa"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {isLabelEnabled && (
          <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="label.property"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">
                    Campo usado como texto
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-8 text-xs"
                      placeholder="nome_do_atributo"
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
                      className="h-8 text-xs"
                      {...field}
                    />
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
        <FormField
          control={form.control}
          name="lineWidth"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Espessura da borda</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  className="h-8 text-xs"
                  {...field}
                  value={field.value ?? DEFAULT_LAYER_LINE_WIDTH}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>
    </div>
  );
};
