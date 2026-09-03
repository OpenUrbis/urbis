import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@open-urbis/map-ui";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { IBuilderTemplateConfig } from "../../builder/types";
import { ITemplate } from "../../types/templates-type";

const toPositiveInteger = (value?: string) => {
  if (!value) return undefined;

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) return undefined;

  return parsedValue;
};

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
      helper: properties.helper || "",
      printColumn:
        typeof properties.printColumn === "number"
          ? String(properties.printColumn)
          : "",
      semanticCardWeight:
        typeof properties.semanticCardWeight === "number"
          ? String(properties.semanticCardWeight)
          : "",
      printSpan:
        typeof properties.printSpan === "number"
          ? String(properties.printSpan)
          : "",
    },
  });

  const values = watch();

  useEffect(() => {
    const printColumn = toPositiveInteger(values.printColumn);
    const semanticCardWeight = toPositiveInteger(values.semanticCardWeight);
    const rawPrintSpan = toPositiveInteger(values.printSpan);
    const printSpan = rawPrintSpan
      ? Math.min(12, Math.max(1, rawPrintSpan))
      : undefined;

    onChange({
      ...template,
      label: values.label,
      properties: {
        ...properties,
        helper: values.helper,
        ...(printColumn
          ? { printColumn }
          : { printColumn: undefined, semanticColumn: undefined }),
        ...(semanticCardWeight
          ? { semanticCardWeight }
          : { semanticCardWeight: undefined, printColumnWeight: undefined }),
        ...(printSpan
          ? { printSpan }
          : { printSpan: undefined, semanticSpan: undefined }),
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    values.label,
    values.helper,
    values.printColumn,
    values.semanticCardWeight,
    values.printSpan,
  ]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Título do Cartão</Label>
        <Input {...register("label")} placeholder="Ex: Informações" />
        <p className="text-xs text-muted-foreground">
          Nome exibido no cabeçalho do card. Use um título curto e objetivo.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Texto de Ajuda (Helper)</Label>
        <Input {...register("helper")} placeholder="Texto auxiliar opcional" />
        <p className="text-xs text-muted-foreground">
          Texto complementar para contextualizar o conteúdo mostrado dentro do
          card.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Coluna fixa da visualização semântica</Label>
        <Select
          value={values.printColumn || "auto"}
          onValueChange={(value) => setValue("printColumn", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecionar coluna" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Automática</SelectItem>
            <SelectItem value="1">Coluna 1</SelectItem>
            <SelectItem value="2">Coluna 2</SelectItem>
            <SelectItem value="3">Coluna 3</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Define exatamente em qual coluna este card deve aparecer no layout de
          3 colunas. Use esta opção quando você quiser travar a posição do card,
          sem depender do balanceamento automático.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Largura na FIU / grade semântica</Label>
        <Select
          value={values.printSpan || "auto"}
          onValueChange={(value) => setValue("printSpan", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecionar largura" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Automática</SelectItem>
            <SelectItem value="3">3/12 · 1/4</SelectItem>
            <SelectItem value="4">4/12 · 1/3</SelectItem>
            <SelectItem value="6">6/12 · 1/2</SelectItem>
            <SelectItem value="8">8/12 · 2/3</SelectItem>
            <SelectItem value="12">12/12 · largura total</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Controla quanto espaço o card ocupa na FIU e nos painéis em grade. Use
          12 para cards grandes como “Polígonos de Interseção”, 6 para meia
          largura e 4 para um terço da linha.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Peso semântico do cartão</Label>
        <Select
          value={values.semanticCardWeight || "auto"}
          onValueChange={(value) => setValue("semanticCardWeight", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecionar peso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Automático</SelectItem>
            <SelectItem value="1">1 · Leve</SelectItem>
            <SelectItem value="2">2 · Médio</SelectItem>
            <SelectItem value="3">3 · Pesado</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Influencia apenas o balanceamento automático. Quanto maior o peso,
          maior a “carga” lógica do card na coluna. Diferente da coluna fixa,
          este valor não trava a posição; ele apenas ajuda o algoritmo a
          distribuir melhor os cards restantes.
        </p>
      </div>
    </div>
  );
};

export const CardWrapperConfig: Partial<IBuilderTemplateConfig> = {
  friendlyName: "Cartão",
  description:
    "Agrupa informações em um card com título, ajuda opcional e configurações semânticas de coluna/peso.",
  isWrapper: true,
  configComponent: ConfigForm,
  defaultProps: {
    label: "Novo Cartão",
  },
};
