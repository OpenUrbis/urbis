import { Input, Label } from "@open-urbis/map-ui";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { IBuilderTemplateConfig } from "../../builder/types";
import { ITemplate } from "../../types/templates-type";
import { CodeEditor } from "../../builder/components/CodeEditor";

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
      label: template.label || "",
      action: properties.action || "",
    },
  });

  const values = watch();

  useEffect(() => {
    onChange({
      ...template,
      label: values.label,
      properties: {
        ...properties,
        action: values.action,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.label, values.action]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Rótulo do Botão</Label>
        <Input {...register("label")} placeholder="Ex: Imprimir" />
      </div>
      <div className="space-y-2">
        <Label>Action (Função string)</Label>
        <CodeEditor
          value={values.action}
          onChange={(v) => setValue("action", v)}
          placeholder="(data) => console.log('Click')"
          className="h-24"
        />
      </div>
    </div>
  );
};

export const ButtonTemplateConfig: Partial<IBuilderTemplateConfig> = {
  friendlyName: "Ação de Botão",
  description: "Botão simples com ação customizada.",
  configComponent: ConfigForm,
  defaultProps: {
    label: "Ação",
    properties: {
      action: "(data) => console.log('Click')",
    },
  },
};
