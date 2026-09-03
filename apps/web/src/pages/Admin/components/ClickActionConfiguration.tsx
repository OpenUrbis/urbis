import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

const SELECT_FEATURE_DEFAULT_ZOOM = "19.5";
const SUPPORTED_CLICK_ACTIONS = ["none", "SelectFeature", "OpenAttributesTable", "setZoom"];

export const ClickActionConfiguration = () => {
  const form = useFormContext();
  const clickAction = form.watch("clickAction");

  const handleClickActionChange = (
    value: string,
    onChange: (value: string) => void,
  ) => {
    onChange(value);

    if (value === "none") {
      form.setValue("clickActionParams", {}, { shouldDirty: true });
      return;
    }

    const currentZoom = form.getValues("clickActionParams.zoom");

    if (value === "SelectFeature" || value === "OpenAttributesTable") {
      form.setValue(
        "clickActionParams",
        { zoom: currentZoom || SELECT_FEATURE_DEFAULT_ZOOM },
        { shouldDirty: true },
      );
      return;
    }

    if (value === "setZoom") {
      form.setValue(
        "clickActionParams",
        { zoom: currentZoom || "" },
        { shouldDirty: true },
      );
    }
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="clickAction"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ação ao clicar na feição</FormLabel>
            <FormControl>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={
                  SUPPORTED_CLICK_ACTIONS.includes(field.value)
                    ? field.value
                    : "none"
                }
                onChange={(event) =>
                  handleClickActionChange(event.target.value, field.onChange)
                }
              >
                <option value="none">Não abrir consulta</option>
                <option value="SelectFeature">
                  Selecionar feição e abrir detalhes (Visualização)
                </option>
                <option value="OpenAttributesTable">
                  Selecionar feição e abrir Tabela de Atributos
                </option>
                <option value="setZoom">Apenas aproximar o mapa</option>
              </select>
            </FormControl>
            <FormDescription>
              Configure o que acontece depois que o usuário clica em uma feição
              consultável. Para abrir o painel de detalhes, use “Selecionar
              feição e abrir detalhes”.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {(clickAction === "SelectFeature" || clickAction === "OpenAttributesTable" || clickAction === "setZoom") && (
        <FormField
          control={form.control}
          name="clickActionParams.zoom"
          render={({ field }) => (
            <FormItem className="animate-in fade-in slide-in-from-top-2">
              <FormLabel>
                {clickAction === "SelectFeature" || clickAction === "OpenAttributesTable"
                  ? "Zoom após selecionar"
                  : "Zoom ao clicar"}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  placeholder={
                    clickAction === "SelectFeature" ? "Ex: 19.5" : "Ex: 17.5"
                  }
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {clickAction === "SelectFeature"
                  ? "Depois de abrir os detalhes, o mapa aproxima para facilitar a leitura da feição. O padrão segue a configuração dos lotes."
                  : "Use quando a camada só precisa aproximar o mapa, sem abrir painel de detalhes."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};
