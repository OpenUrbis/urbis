import { Label } from "@open-urbis/map-ui";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { CodeEditor } from "../../builder/components/CodeEditor";
import { IBuilderTemplateConfig } from "../../builder/types";
import { ITemplate } from "../../types/templates-type";

const ConfigForm = ({
  template,
  onChange,
}: {
  template: ITemplate;
  onChange: (newTemplate: ITemplate) => void;
}) => {
  const properties = (template.properties || {}) as any;

  const { watch, setValue } = useForm({
    defaultValues: {
      initialViewState: properties.initialViewState || "",
      polygonProps: properties.polygonProps || "",
    },
  });

  const values = watch();

  useEffect(() => {
    onChange({
      ...template,
      properties: {
        ...properties,
        initialViewState: values.initialViewState,
        polygonProps: values.polygonProps,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.initialViewState, values.polygonProps]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Initial View State (Função string)</Label>
        <CodeEditor
          value={values.initialViewState}
          onChange={(v) => setValue("initialViewState", v)}
          placeholder="(data) => ({ longitude: ... })"
          className="h-24"
        />
      </div>
      <div className="space-y-2">
        <Label>Polygon Props (Função string)</Label>
        <CodeEditor
          value={values.polygonProps}
          onChange={(v) => setValue("polygonProps", v)}
          placeholder="(data) => ({ id: 'layer', ... })"
          className="h-32"
        />
      </div>
    </div>
  );
};

export const PolygonMapTemplateConfig: Partial<IBuilderTemplateConfig> = {
  friendlyName: "Mapa do Polígono",
  description: "Exibe polígono no mapa.",
  configComponent: ConfigForm,
  defaultProps: {
    properties: {
      initialViewState: "(data) => ({ zoom: 16 })",
    },
  },
};
