import { Input, Label } from "@open-urbis/map-ui";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { IBuilderTemplateConfig } from "../../builder/types";
import { IRowWrapperProperties } from "../../types/row-wrapper-type";
import { ITemplate } from "../../types/templates-type";

const ConfigForm = ({
  template,
  onChange,
}: {
  template: ITemplate;
  onChange: (newTemplate: ITemplate) => void;
}) => {
  const properties = (template.properties || {}) as IRowWrapperProperties;

  const { register, watch } = useForm({
    defaultValues: {
      columnClass: properties.columnClass || "",
    },
  });

  const values = watch();

  useEffect(() => {
    onChange({
      ...template,
      properties: {
        ...properties,
        columnClass: values.columnClass,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.columnClass]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Classe de Coluna (Bootstrap)</Label>
        <Input {...register("columnClass")} placeholder="Ex: col-md-6" />
        <p className="text-xs text-muted-foreground">
          Define a largura da coluna no grid (ex: col-md-6 para 50%).
        </p>
      </div>
    </div>
  );
};

export const RowWrapperConfig: Partial<IBuilderTemplateConfig> = {
  friendlyName: "Linha (Grid)",
  description: "Organiza templates em colunas usando grid do Bootstrap.",
  isWrapper: true,
  configComponent: ConfigForm,
  defaultProps: {
    properties: {
      columnClass: "col-12",
    },
  },
};
