import { Button, Input, Label } from "@open-urbis/map-ui";
import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { CodeEditor } from "../../builder/components/CodeEditor";
import { IBuilderTemplateConfig } from "../../builder/types";
import { ITemplate } from "../../types/templates-type";

const REQUEST_PRESETS = {
  custom: {
    url: "",
    method: "get",
    data: "",
    transformResponse: "",
  },
  geospatialIntersections: {
    url: "/maps/geospatial-intersections",
    method: "post",
    data: `({data}) => {
  if (data?.type === "Feature") return data;
  if (data?.geometry) return { type: "Feature", geometry: data.geometry, properties: data.properties || {} };
  if (data?.type === "Polygon" || data?.type === "MultiPolygon") return { type: "Feature", geometry: data, properties: {} };
  return data;
}`,
    transformResponse: `(response) => typeof response === "string" ? JSON.parse(response) : response`,
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

  const { register, watch, setValue } = useForm({
    defaultValues: {
      presetMode: properties._presetMode || "custom",
      url: properties.url || "",
      method: properties.method || "get",
      data: properties.data || "",
      transformResponse: properties.transformResponse || "",
    },
  });

  const values = watch();

  useEffect(() => {
    if (values.presetMode === "custom") return;

    const preset =
      REQUEST_PRESETS[values.presetMode as keyof typeof REQUEST_PRESETS];
    if (!preset) return;

    setValue("url", preset.url);
    setValue("method", preset.method);
    setValue("data", preset.data);
    setValue("transformResponse", preset.transformResponse);
  }, [values.presetMode, setValue]);

  useEffect(() => {
    onChange({
      ...template,
      properties: {
        ...properties,
        _presetMode: values.presetMode,
        url: values.url,
        method: values.method,
        data: values.data,
        transformResponse: values.transformResponse,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    values.presetMode,
    values.url,
    values.method,
    values.data,
    values.transformResponse,
  ]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Preset</Label>
        <select
          {...register("presetMode")}
          className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="custom">Manual</option>
          <option value="geospatialIntersections">
            Interseções geoespaciais
          </option>
        </select>
        <p className="text-xs text-muted-foreground">
          O preset de interseções prepara URL, POST e payload de polígono. A
          função Data recebe as props do componente, por isso usa{" "}
          {"({data}) => ..."}.
        </p>
      </div>
      <div className="space-y-2">
        <Label>URL</Label>
        <Input {...register("url")} placeholder="https://api..." />
      </div>
      <div className="space-y-2">
        <Label>Método</Label>
        <select
          {...register("method")}
          className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
        >
          <option value="get">GET</option>
          <option value="post">POST</option>
          <option value="put">PUT</option>
          <option value="delete">DELETE</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Data (Função string)</Label>
        <CodeEditor
          value={values.data}
          onChange={(v) => setValue("data", v)}
          placeholder="(data) => data"
          className="h-24"
        />
      </div>
      <div className="space-y-2">
        <Label>Transform Response (Função string)</Label>
        <CodeEditor
          value={values.transformResponse}
          onChange={(v) => setValue("transformResponse", v)}
          placeholder="(response) => response"
          className="h-32"
        />
      </div>

      <div className="pt-2">
        <Button
          type="button"
          onClick={() => {
            onChange({
              ...template,
              properties: {
                ...properties,
                _presetMode: values.presetMode,
                url: values.url,
                method: values.method,
                data: values.data,
                transformResponse: values.transformResponse,
                _refreshKey: Date.now(),
              },
            });
          }}
          size="sm"
          variant="secondary"
          className="w-full gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Executar Requisição
        </Button>
      </div>
    </div>
  );
};

export const RequestWrapperConfig: Partial<IBuilderTemplateConfig> = {
  friendlyName: "Requisição",
  description: "Busca dados de uma API.",
  isWrapper: true,
  configComponent: ConfigForm,
  defaultProps: {
    properties: {
      url: "",
      method: "get",
    },
  },
};
