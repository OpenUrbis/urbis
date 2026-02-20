import { Input, Label } from "@open-urbis/map-ui";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
  
  const { register, watch } = useForm({
    defaultValues: {
      label: template.label || "",
      helper: properties.helper || "",
    },
  });

  const values = watch();

  useEffect(() => {
    onChange({
      ...template,
      label: values.label,
      properties: {
        ...properties,
        helper: values.helper,
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.label, values.helper]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Título do Cartão</Label>
        <Input {...register("label")} placeholder="Ex: Informações" />
      </div>
      <div className="space-y-2">
        <Label>Texto de Ajuda (Helper)</Label>
        <Input {...register("helper")} placeholder="Texto auxiliar opcional" />
      </div>
    </div>
  );
};

export const CardWrapperConfig: Partial<IBuilderTemplateConfig> = {
  friendlyName: "Cartão",
  description: "Agrupa informações com título e corpo.",
  isWrapper: true,
  configComponent: ConfigForm,
  defaultProps: {
    label: "Novo Cartão",
  },
};
