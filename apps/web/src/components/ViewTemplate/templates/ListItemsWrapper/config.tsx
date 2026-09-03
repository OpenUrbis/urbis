import {
  Checkbox,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@open-urbis/map-ui";
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
      printColumns: String(properties.printColumns || 3),
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
        printColumns: Number(values.printColumns),
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.data, values.twoLine, values.onItemClick, values.printColumns]);

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
        <Label>Colunas na FIU / visual compacto</Label>
        <Select
          value={values.printColumns}
          onValueChange={(value) => setValue("printColumns", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecionar colunas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 coluna</SelectItem>
            <SelectItem value="2">2 colunas</SelectItem>
            <SelectItem value="3">3 colunas</SelectItem>
            <SelectItem value="4">4 colunas</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Controla a distribuição dos itens quando o template está em modo de
          FIU/visual compacto. Para listas de interseções, 3 costuma funcionar
          bem em cards largos.
        </p>
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
      printColumns: 3,
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
