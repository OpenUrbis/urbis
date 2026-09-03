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
      label: template.label || "",
    },
  });

  const values = watch();

  useEffect(() => {
    onChange({
      ...template,
      label: values.label,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.label]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Rótulo do Botão</Label>
        <Input
          {...register("label")}
          placeholder="Ex: Analisar com desenho do perímetro"
        />
      </div>
    </div>
  );
};

export const EditPolygonTemplateConfig: Partial<IBuilderTemplateConfig> = {
  friendlyName: "Ação de Editar Polígono",
  description: "Edita polígono e cria protocolo.",
  configComponent: ConfigForm,
  childrenProp: "polygonTemplate",
  isWrapper: true, // It acts as a wrapper for the polygonTemplate content
  defaultProps: {
    label: "Analisar com desenho do perímetro",
    polygonTemplate: [],
  },
};
