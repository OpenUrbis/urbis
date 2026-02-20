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
  const { register, watch } = useForm({
    defaultValues: {
      value: template.value || "",
    },
  });

  const values = watch();

  useEffect(() => {
    onChange({
      ...template,
      value: values.value,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.value]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Valor (EJS)</Label>
        <Input {...register("value")} placeholder="Ex: <%- properties.id %>" />
      </div>
    </div>
  );
};

export const PrimaryItemTemplateConfig: Partial<IBuilderTemplateConfig> = {
  friendlyName: "Item Primário",
  description: "Conteúdo principal do item de lista.",
  configComponent: ConfigForm,
  defaultProps: {
    value: "<%- primary %>",
  },
  validParents: ["wrapper-list-items"],
};
