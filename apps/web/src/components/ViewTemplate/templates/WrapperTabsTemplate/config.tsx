import { Input, Label, Switch } from "@open-urbis/map-ui";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { CodeEditor } from "../../builder/components/CodeEditor";
import { IBuilderTemplateConfig } from "../../builder/types";
import { ITemplate } from "../../types/templates-type";

const PRESETS = {
  intersections: {
    data: `(data) => data.response.features.filter((f) => {
  if (f.id.includes("lote_cidadao") || f.properties?.layer === "slui:lote_cidadao") {
    return String(f.properties?.cd_identificador_original_lote) !== String(data.properties?.cd_identificador_original_lote);
  }
  return true;
})`,
    tabTitle: `(data) => {
  const props = data.data.properties;
  if (props.nm_tema_divisao_pde) return props.nm_tema_divisao_pde;
  if (props.nm_subprefeitura) return props.nm_subprefeitura;
  if (props.nm_distrito_municipal) return props.nm_distrito_municipal;
  if (props.nm_area_tombada) return props.nm_area_tombada;
  if (props.nm_area) return props.nm_area;
  if (props.cd_lote) return "Lote " + props.cd_lote.padStart(4, "0");
  if (props.layer) return props.layer.replace("slui:", "");
  return "Polígono";
}`,
    tabColor: `(data) => data.data.properties.ui_color_hex`,
    printMode: "grid",
  },
  selectableIntersections: {
    data: `(data) => data.response.features.filter((f) => {
  if (f.id.includes("lote_cidadao") || f.properties?.layer === "slui:lote_cidadao") {
    return String(f.properties?.cd_identificador_original_lote) !== String(data.properties?.cd_identificador_original_lote);
  }
  return true;
})`,
    tabTitle: `(data) => {
  const props = data.data.properties;
  if (props.nm_tema_divisao_pde) return props.nm_tema_divisao_pde;
  if (props.nm_subprefeitura) return props.nm_subprefeitura;
  if (props.nm_distrito_municipal) return props.nm_distrito_municipal;
  if (props.nm_area_tombada) return props.nm_area_tombada;
  if (props.nm_area) return props.nm_area;
  if (props.cd_lote) return "Lote " + props.cd_lote.padStart(4, "0");
  if (props.layer) return props.layer.replace("slui:", "");
  return "Polígono";
}`,
    tabColor: `(data) => data.data.properties.ui_color_hex`,
    printMode: "selectable",
  },
  custom: {
    data: "(data) => []",
    tabTitle: "(data) => 'Nova Aba'",
    tabColor: "",
    printMode: "grid",
  },
};

const ConfigForm = ({
  template,
  onChange,
}: {
  template: ITemplate;
  onChange: (newTemplate: ITemplate) => void;
}) => {
  const properties = (template.properties || {}) as any;
  const indexTab = properties.indexTab || { title: "Geral", templates: [] };
  const [isAdvanced, setIsAdvanced] = useState(false);

  const { register, watch, setValue } = useForm({
    defaultValues: {
      presetMode: properties._presetMode || "custom",
      data: properties.data || "",
      tabTitle: properties.tabTitle || "",
      tabColor: properties.tabColor || "",
      indexTabTitle: indexTab.title || "Geral",
      printMode: properties.printMode || "grid",
    },
  });

  const values = watch();

  // Update fields when preset changes
  useEffect(() => {
    if (!isAdvanced && values.presetMode && values.presetMode !== "custom") {
      const preset = PRESETS[values.presetMode as keyof typeof PRESETS];
      if (preset) {
        setValue("data", preset.data);
        setValue("tabTitle", preset.tabTitle);
        setValue("tabColor", preset.tabColor);
        setValue("printMode", preset.printMode);
      }
    }
  }, [values.presetMode, isAdvanced, setValue]);

  useEffect(() => {
    onChange({
      ...template,
      properties: {
        ...properties,
        _presetMode: values.presetMode,
        data: values.data,
        tabTitle: values.tabTitle,
        tabColor: values.tabColor,
        indexTab: {
          ...indexTab,
          title: values.indexTabTitle,
        },
        printMode: values.printMode === "selectable" ? "selectable" : undefined,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    values.data,
    values.tabTitle,
    values.tabColor,
    values.indexTabTitle,
    values.presetMode,
    values.printMode,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <Label className="font-semibold text-foreground">
          Configurações das Abas
        </Label>
        <div className="flex items-center space-x-2">
          <Label htmlFor="advanced-mode" className="text-xs font-normal">
            Modo Avançado (JS)
          </Label>
          <Switch
            id="advanced-mode"
            checked={isAdvanced}
            onCheckedChange={setIsAdvanced}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Título da Aba Inicial (Geral)</Label>
        <Input {...register("indexTabTitle")} placeholder="Ex: Visão Geral" />
        <span className="text-xs text-muted-foreground">
          Esta é a aba fixa exibida primeiro (se não estiver oculta).
        </span>
      </div>

      <div className="space-y-2">
        <Label>Modo na FIU / visual compacto</Label>
        <select
          {...register("printMode")}
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="grid">Grade: mostra todas as abas</option>
          <option value="selectable">Seleção: mostra uma aba por vez</option>
        </select>
        <span className="text-xs text-muted-foreground">
          Use “Seleção” em cards com mapas para evitar muitos WebGL/mapas
          carregados simultaneamente.
        </span>
      </div>

      {!isAdvanced ? (
        <div className="space-y-3 bg-muted/50 p-3 rounded-md border border-border">
          <div className="space-y-2">
            <Label>Comportamento Automático das Abas</Label>
            <select
              {...register("presetMode")}
              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="custom">Nenhum / Configurado Manualmente</option>
              <option value="intersections">
                Carregar Interseções do Mapa (grade)
              </option>
              <option value="selectableIntersections">
                Carregar Interseções com seleção (recomendado)
              </option>
            </select>
          </div>

          {(values.presetMode === "intersections" ||
            values.presetMode === "selectableIntersections") && (
            <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200">
              As abas serão geradas automaticamente a partir da resposta da API
              de interseções, ocultando o lote principal e preenchendo cores e
              nomes corretos. O modo com seleção evita abrir vários mapas ao
              mesmo tempo.
            </div>
          )}
          {values.presetMode === "custom" && (
            <div className="text-xs text-muted-foreground">
              Selecione uma predefinição acima ou mude para o Modo Avançado para
              escrever seu próprio código.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
          <div className="space-y-2">
            <Label>Data Generator (Função EJS/JS)</Label>
            <span className="text-xs text-muted-foreground block mb-1">
              Função que retorna um array de objetos para gerar as abas
              individuais.
            </span>
            <CodeEditor
              value={values.data}
              onChange={(v) => setValue("data", v)}
              placeholder="(data) => data.response.features"
              className="h-24"
            />
          </div>
          <div className="space-y-2">
            <Label>Título Dinâmico da Aba (Função EJS/JS)</Label>
            <span className="text-xs text-muted-foreground block mb-1">
              {
                "Função para extrair o nome de cada aba. Ex: `(data) => data.data.name`"
              }
            </span>
            <CodeEditor
              value={values.tabTitle}
              onChange={(v) => setValue("tabTitle", v)}
              placeholder="(data) => data.data.properties.name"
              className="h-16"
            />
          </div>
          <div className="space-y-2">
            <Label>Cor Dinâmica da Aba (Opcional)</Label>
            <span className="text-xs text-muted-foreground block mb-1">
              {
                "Função que retorna a cor hexadecimal associada. Ex: `(data) => '#FF0000'`"
              }
            </span>
            <CodeEditor
              value={values.tabColor}
              onChange={(v) => setValue("tabColor", v)}
              placeholder="(data) => data.data.properties.ui_color_hex"
              className="h-16"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const WrapperTabsTemplateConfig: Partial<IBuilderTemplateConfig> = {
  friendlyName: "Abas (Tabs)",
  description: "Cria abas dinâmicas a partir de um array e uma aba geral.",
  isWrapper: true,
  configComponent: ConfigForm,
  defaultProps: {
    properties: {
      data: "(data) => []",
      tabTitle: "(data) => 'Nova Aba'",
      tabColor: "",
      printMode: "grid",
      indexTab: {
        title: "Geral",
        templates: [],
      },
    },
  },
};
