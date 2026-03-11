import { Input, Label } from "@open-urbis/map-ui";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ITemplate } from "../../types/templates-type";
import { IBuilderTemplateConfig } from "../../builder/types";
import { EjsDataSelector } from "../../components/EjsDataSelector";

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
      value: template.value || "",
      helper: properties.helper || "",
    },
  });

  const values = watch();

  useEffect(() => {
    onChange({
      ...template,
      label: values.label,
      value: values.value,
      properties: {
        ...properties,
        helper: values.helper,
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.label, values.value, values.helper]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Rótulo</Label>
        <Input {...register("label")} placeholder="Ex: Endereço" />
      </div>
      <EjsDataSelector
        name="value"
        label="Valor"
        register={register}
        setValue={setValue}
        watch={watch}
        placeholder="Ex: <%- properties.address %>"
      />
      <div className="space-y-2">
        <Label>Texto de Ajuda (Helper)</Label>
        <Input {...register("helper")} placeholder="Texto auxiliar" />
      </div>
    </div>
  );
};

export const LabelValueConfig: Partial<IBuilderTemplateConfig> = {
  friendlyName: "Texto (Rótulo/Valor)",
  description: "Exibe um par de rótulo e valor.",
  configComponent: ConfigForm,
  defaultProps: {
    label: "Novo Rótulo",
    value: "Valor",
  },
};
