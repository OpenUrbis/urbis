import { Input, Label } from "@open-urbis/map-ui";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { IBuilderTemplateConfig } from "../../builder/types";
import { ITemplate } from "../../types/templates-type";
import { EjsDataSelector } from "../../components/EjsDataSelector";

const ConfigForm = ({
  template,
  onChange,
}: {
  template: ITemplate;
  onChange: (newTemplate: ITemplate) => void;
}) => {
  const { register, watch, setValue } = useForm({
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
      <EjsDataSelector
        name="value"
        label="Valor (EJS)"
        register={register}
        setValue={setValue}
        watch={watch}
        placeholder="Ex: Detalhes..."
      />
    </div>
  );
};

export const SecondaryItemTemplateConfig: Partial<IBuilderTemplateConfig> = {
  friendlyName: "Item Secundário",
  description: "Conteúdo secundário do item de lista.",
  configComponent: ConfigForm,
  defaultProps: {
    value: "<%- secondary %>",
  },
  validParents: ["wrapper-list-items"],
};
