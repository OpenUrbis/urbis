import { AdminHeader } from "@/components/AdminHeader";
import { CodeEditor } from "@/components/CodeEditor";
import { ViewTemplateBuilder } from "@/components/ViewTemplate/builder/ViewTemplateBuilder";
import { ITemplate } from "@/components/ViewTemplate/types/templates-type";
import { parseAndNormalizeViewTemplate } from "@/components/ViewTemplate/utils/normalize-template-ids";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import {
  getAdminMapConfigs,
  updateAdminMapConfig,
} from "@/integrations/map-config-integration";
import {
  IMapConfigAdminItem,
  MapConfigValueType,
} from "@/types/map-config-admin-type";
import { useQuery } from "@preact-signals/query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { VIEW_TEMPLATE_DATA_MOCK } from "./mock-data-value";

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const extractLiteralValue = (value: unknown) => {
  if (isPlainObject(value) && "literally" in value) {
    return value.literally;
  }

  return value;
};

const getEditLabel = (type: MapConfigValueType) => {
  switch (type) {
    case MapConfigValueType.LITERAL_NUMBER:
      return "Número literal";
    case MapConfigValueType.LITERAL_STRING:
      return "Texto literal";
    case MapConfigValueType.ARRAY:
      return "Array JSON";
    case MapConfigValueType.OBJECT:
      return "Objeto JSON";
    case MapConfigValueType.VIEW_TEMPLATE:
      return "View template JSON";
    default:
      return "Valor";
  }
};

const buildInitialRawValue = (config: IMapConfigAdminItem) => {
  if (
    config.type === MapConfigValueType.LITERAL_NUMBER ||
    config.type === MapConfigValueType.LITERAL_STRING
  ) {
    const literalValue = extractLiteralValue(config.value);

    return literalValue === null || literalValue === undefined
      ? ""
      : String(literalValue);
  }

  return JSON.stringify(config.value, null, 2);
};

const buildInitialTemplateValue = (
  config: IMapConfigAdminItem,
): ITemplate[] => {
  if (config.type !== MapConfigValueType.VIEW_TEMPLATE) {
    return [];
  }

  return parseAndNormalizeViewTemplate(config.value);
};

const parseValueByType = (
  type: MapConfigValueType,
  rawValue: string,
): unknown => {
  switch (type) {
    case MapConfigValueType.LITERAL_NUMBER: {
      const parsedValue = Number(rawValue);

      if (rawValue.trim() === "" || Number.isNaN(parsedValue)) {
        throw new Error("Informe um número válido.");
      }

      return { literally: parsedValue };
    }

    case MapConfigValueType.LITERAL_STRING:
      return { literally: rawValue };

    case MapConfigValueType.ARRAY: {
      const parsedValue = JSON.parse(rawValue);

      if (!Array.isArray(parsedValue)) {
        throw new Error("O valor deve ser um array JSON válido.");
      }

      return parsedValue;
    }

    case MapConfigValueType.OBJECT: {
      const parsedValue = JSON.parse(rawValue);

      if (!isPlainObject(parsedValue)) {
        throw new Error("O valor deve ser um objeto JSON válido.");
      }

      return parsedValue;
    }

    default:
      return rawValue;
  }
};

const MapConfigHandlePage = () => {
  const [isEditMatch, params] = useRoute("/:id");
  const id = isEditMatch ? params?.id : undefined;
  const [, setLocation] = useLocation();
  const { toastError, toastSuccess } = useToast();

  const [editingDescription, setEditingDescription] = useState("");
  const [editingRawValue, setEditingRawValue] = useState("");
  const [editingTemplateValue, setEditingTemplateValue] = useState<
    ITemplate[] | undefined
  >(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-map-configs"],
    queryFn: getAdminMapConfigs,
  });

  const mapConfig = useMemo(() => {
    if (!id) {
      return null;
    }

    return data?.find((item) => item.id === id) ?? null;
  }, [data, id]);

  useEffect(() => {
    if (!mapConfig) {
      return;
    }

    setEditingDescription(mapConfig.description);
    setEditingRawValue(buildInitialRawValue(mapConfig));

    if (mapConfig.type === MapConfigValueType.VIEW_TEMPLATE) {
      setEditingTemplateValue(buildInitialTemplateValue(mapConfig));
      return;
    }

    setEditingTemplateValue(undefined);
  }, [mapConfig]);

  const handleBack = () => {
    setLocation("~/admin/map-config-manager");
  };

  const handleSave = async () => {
    if (!mapConfig) {
      return;
    }

    const description = editingDescription.trim();

    if (!description) {
      toastError("A descrição é obrigatória.");
      return;
    }

    try {
      if (
        mapConfig.type === MapConfigValueType.VIEW_TEMPLATE &&
        editingTemplateValue === undefined
      ) {
        toastError("Aguarde o carregamento completo do template para editar.");
        return;
      }

      const value =
        mapConfig.type === MapConfigValueType.VIEW_TEMPLATE
          ? editingTemplateValue
          : parseValueByType(mapConfig.type, editingRawValue);

      setIsSaving(true);
      await updateAdminMapConfig(mapConfig.id, {
        description,
        value,
      });
      toastSuccess("Parâmetro atualizado com sucesso.");
      handleBack();
    } catch (error) {
      toastError(
        error instanceof Error ? error.message : "Erro ao atualizar parâmetro.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-background/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Carregando parâmetro do mapa...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !mapConfig) {
    return (
      <div className="flex-1 flex flex-col h-full bg-background/50">
        <div className="px-6 py-4">
          <AdminHeader
            title="Editar parâmetro do mapa"
            subtitle="Parâmetro não encontrado ou indisponível"
          >
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </AdminHeader>
        </div>

        <div className="px-6 pb-6">
          <div className="rounded-lg border bg-card p-6 text-sm text-destructive shadow-sm">
            Não foi possível carregar o parâmetro solicitado.
          </div>
        </div>
      </div>
    );
  }

  const isLiteralField =
    mapConfig.type === MapConfigValueType.LITERAL_NUMBER ||
    mapConfig.type === MapConfigValueType.LITERAL_STRING;

  const isJsonEditorField =
    mapConfig.type === MapConfigValueType.ARRAY ||
    mapConfig.type === MapConfigValueType.OBJECT;

  const isViewTemplateField =
    mapConfig.type === MapConfigValueType.VIEW_TEMPLATE;
  const isTemplateLoading =
    isViewTemplateField && editingTemplateValue === undefined;

  const renderMetadataCard = () => (
    <div className="bg-card border md:rounded-lg p-6 shadow-sm space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <span className="text-sm font-medium">Identificador</span>
          <div className="rounded-md border bg-muted/30 px-3 py-2 font-mono text-sm">
            {mapConfig.id}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Tipo persistido</span>
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            {mapConfig.type}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Descrição</label>
        <Textarea
          value={editingDescription}
          onChange={(event) => setEditingDescription(event.target.value)}
          placeholder="Descreva a função deste parâmetro"
          rows={3}
        />
      </div>
    </div>
  );

  const renderActions = () => (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="outline" onClick={handleBack} disabled={isSaving}>
        Cancelar
      </Button>
      <Button onClick={handleSave} disabled={isSaving || isTemplateLoading}>
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Salvar alterações
      </Button>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-background/50 overflow-hidden">
      <div className="px-6 py-4">
        <AdminHeader
          title="Editar parâmetro do mapa"
          subtitle={`Editando: ${mapConfig.id}`}
        >
          <Button variant="outline" onClick={handleBack} disabled={isSaving}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </AdminHeader>
      </div>

      <div
        className={
          isViewTemplateField
            ? "flex-1 px-0 md:px-6 pb-6 min-h-0 overflow-hidden"
            : "flex-1 overflow-auto px-0 md:px-6 pb-6"
        }
      >
        {isViewTemplateField ? (
          <div className="flex h-full min-h-0 flex-col gap-6">
            {renderMetadataCard()}

            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="flex items-center justify-between gap-3 px-1">
                <label className="text-sm font-medium">
                  {getEditLabel(mapConfig.type)}
                </label>
                <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
                  Tipo: {mapConfig.type}
                </span>
              </div>

              <div className="relative flex-1 min-h-[560px] overflow-hidden rounded-md border bg-card shadow-sm">
                {isTemplateLoading ? (
                  <div className="flex h-full items-center justify-center bg-background/50">
                    <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span>Inicializando template para edição...</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-0 flex-col">
                    <ViewTemplateBuilder
                      key={mapConfig.id}
                      initialTemplate={editingTemplateValue}
                      initialMockData={VIEW_TEMPLATE_DATA_MOCK}
                      standalone={false}
                      title="Editor de ViewTemplate"
                      subtitle="Atualize exclusivamente o template persistido deste parâmetro."
                      onChange={(newTemplate) => {
                        setEditingTemplateValue(newTemplate);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0">{renderActions()}</div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="bg-card border md:rounded-lg p-6 shadow-sm space-y-6">
              {renderMetadataCard()}

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium">
                    {getEditLabel(mapConfig.type)}
                  </label>
                  <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
                    Tipo: {mapConfig.type}
                  </span>
                </div>

                {isLiteralField ? (
                  <Input
                    type={
                      mapConfig.type === MapConfigValueType.LITERAL_NUMBER
                        ? "number"
                        : "text"
                    }
                    step={
                      mapConfig.type === MapConfigValueType.LITERAL_NUMBER
                        ? "any"
                        : undefined
                    }
                    value={editingRawValue}
                    onChange={(event) => setEditingRawValue(event.target.value)}
                    placeholder={
                      mapConfig.type === MapConfigValueType.LITERAL_NUMBER
                        ? "Informe um número"
                        : "Informe um texto"
                    }
                  />
                ) : isJsonEditorField ? (
                  <div className="h-[420px] rounded-md border overflow-hidden">
                    <CodeEditor
                      value={editingRawValue}
                      onChange={setEditingRawValue}
                      language="json"
                    />
                  </div>
                ) : (
                  <Textarea
                    value={editingRawValue}
                    onChange={(event) => setEditingRawValue(event.target.value)}
                    className="min-h-[320px] font-mono text-xs"
                    placeholder="Informe um JSON válido"
                  />
                )}
              </div>

              {renderActions()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapConfigHandlePage;
