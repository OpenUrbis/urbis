import { Checkbox, Label } from "@open-urbis/map-ui";
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
      data: properties.data || "",
      twoLine: properties.twoLine || false,
      onItemClick: JSON.stringify(properties.onItemClick || {}, null, 2),
    },
  });

  const values = watch();

  useEffect(() => {
    let parsedClick = {};
    try {
      parsedClick = JSON.parse(values.onItemClick);
    } catch (e) {
      console.error("Invalid JSON for onItemClick", e);
    }

    onChange({
      ...template,
      properties: {
        ...properties,
        data: values.data,
        twoLine: values.twoLine,
        onItemClick: parsedClick,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.data, values.twoLine, values.onItemClick]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Data (Função string)</Label>
        <CodeEditor
          value={values.data}
          onChange={(v) => setValue("data", v)}
          placeholder="(data) => data.items"
          className="h-24"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="twoLine"
          checked={values.twoLine}
          onCheckedChange={(c) => setValue("twoLine", c as boolean)}
        />
        <Label htmlFor="twoLine">Duas Linhas</Label>
      </div>
      <div className="space-y-2">
        <Label>On Item Click (JSON)</Label>
        <CodeEditor
          value={values.onItemClick}
          onChange={(v) => setValue("onItemClick", v)}
          placeholder='{ "action": "openFeature", "params": {} }'
          className="h-24"
        />
      </div>
    </div>
  );
};

export const ListItemsWrapperConfig: Partial<IBuilderTemplateConfig> = {
  friendlyName: "Itens de Lista",
  description: "Exibe lista de itens.",
  isWrapper: true,
  allowedChildren: ["primary-item", "secondary-item"],
  configComponent: ConfigForm,
  defaultProps: {
    properties: {
      twoLine: true,
      data: '() => [{primary:"Valor primário", secondary:"Valor secundário"}]',
    },
    templates: [
      {
        type: "primary-item",
        value: "<%- primary %>",
      },
      {
        type: "secondary-item",
        value: "<%- secondary %>",
      },
    ],
  },
};
