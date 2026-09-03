import { GroupSelect } from "@/components/GroupSelect";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { Switch } from "@/components/ui/switch";
import { ClickActionConfiguration } from "@/pages/Admin/components/ClickActionConfiguration";
import { memo, useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { generateOriginUrl } from "../utils";
import { RichTextField } from "../components/RichTextField";
import { getRolesList, IRole } from "@/integrations/role-integration";

interface LayerConfigurationProps {
  onNext?: () => void;
  onBack?: () => void;
  hideNavigation?: boolean;
  simpleMode?: boolean;
  hideSourceSettings?: boolean;
}

export const LayerSourceSettings = memo(
  ({ loadingMethod }: { loadingMethod?: string }) => {
    const form = useFormContext();

    return (
      <div className="space-y-4">
        {loadingMethod === "Stream" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
            O modo recortado carrega por área visível e só desenha a camada a
            partir do zoom mínimo configurado. Para camadas que precisam
            aparecer em zoom amplo, prefira WFS completo ou WMS.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-[minmax(0,160px)_minmax(0,1fr)]">
          <FormField
            control={form.control}
            name="version"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Versão do serviço</FormLabel>
                <FormControl>
                  <Input placeholder="1.0.0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="origin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL final da camada (origin)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="URL completa..."
                    className="font-mono text-xs"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          Parâmetros gerados a partir da fonte e do modo de carregamento. Edite
          manualmente apenas em casos avançados.
        </p>
      </div>
    );
  },
);

LayerSourceSettings.displayName = "LayerSourceSettings";

export const LayerConfiguration = ({
  onNext: _onNext,
  onBack: _onBack,
  hideNavigation: _hideNavigation = false,
  simpleMode = false,
  hideSourceSettings = false,
}: LayerConfigurationProps) => {
  const form = useFormContext();
  const loadingMethod = form.watch("loadingMethod");
  const url = form.watch("url");
  const selectedLayer = form.watch("selectedLayer");
  const origin = form.watch("origin");
  const version = form.watch("version");
  const srs = form.watch("srs");
  const isSelected = form.watch("isSelected");
  const minZoom = form.watch("minZoom");
  const streamMinZoom = Number(minZoom || 17);

  const [roles, setRoles] = useState<IRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [rolesError, setRolesError] = useState("");
  const isPublic = form.watch("isPublic") !== false;

  useEffect(() => {
    if (isPublic) {
      setRolesError("");
      return;
    }

    let isCancelled = false;
    setLoadingRoles(true);
    setRolesError("");
    getRolesList()
      .then((res) => {
        if (isCancelled) return;
        const data =
          res && typeof res === "object" && "data" in res
            ? (res.data as IRole[])
            : Array.isArray(res)
              ? res
              : [];
        setRoles(data);
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error("Error loading roles", err);
        setRolesError(
          err instanceof Error ? err.message : "Falha ao carregar os cargos",
        );
      })
      .finally(() => {
        if (!isCancelled) setLoadingRoles(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [isPublic]);

  const lastSuggestedOriginRef = useRef<string | null>(null);

  useEffect(() => {
    if (loadingMethod === "CustomWMSLayer") {
      if (version !== "1.3.0") {
        form.setValue("version", "1.3.0", { shouldDirty: true });
      }
      if (srs !== "EPSG:3857") {
        form.setValue("srs", "EPSG:3857", { shouldDirty: true });
      }
      return;
    }

    if (loadingMethod === "Stream") {
      if (version !== "1.1.0") {
        form.setValue("version", "1.1.0", { shouldDirty: true });
      }
      if (srs !== "EPSG:4326") {
        form.setValue("srs", "EPSG:4326", { shouldDirty: true });
      }
      if (!form.getValues("minZoom")) {
        form.setValue("minZoom", "17", { shouldDirty: true });
      }
      if (!form.getValues("lineWidth")) {
        form.setValue("lineWidth", 2, { shouldDirty: true });
      }
      return;
    }

    if (srs !== "CRS:84") {
      form.setValue("srs", "CRS:84", { shouldDirty: true });
    }
    if (!version || version === "1.3.0" || version === "1.1.1") {
      form.setValue("version", "2.0.0", { shouldDirty: true });
    }
  }, [form, isSelected, loadingMethod, srs, version]);

  useEffect(() => {
    if (url && loadingMethod) {
      const suggested = generateOriginUrl(
        url,
        selectedLayer,
        loadingMethod,
        version,
        undefined,
      );

      const shouldUpdateOrigin =
        !origin || origin === lastSuggestedOriginRef.current;

      if (shouldUpdateOrigin && origin !== suggested) {
        form.setValue("origin", suggested);
      }

      lastSuggestedOriginRef.current = suggested;
    }
  }, [form, url, selectedLayer, loadingMethod, version, origin]);

  const handleFeatureQueryChange = (
    checked: boolean,
    onChange: (value: boolean) => void,
  ) => {
    onChange(checked);

    if (!checked) {
      form.setValue("clickAction", "none", { shouldDirty: true });
      form.setValue("clickActionParams", {}, { shouldDirty: true });
      return;
    }

    if (form.getValues("clickAction") === "none") {
      form.setValue("clickAction", "SelectFeature", { shouldDirty: true });
      form.setValue(
        "clickActionParams",
        { zoom: form.getValues("clickActionParams.zoom") || "19.5" },
        { shouldDirty: true },
      );
    }
  };

  return (
    <div className="space-y-8">
      {!simpleMode && !hideSourceSettings && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold tracking-tight">
            Parâmetros técnicos
          </h2>

          <LayerSourceSettings loadingMethod={loadingMethod} />
        </section>
      )}

      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight">
            Dados de publicação
          </h2>
          <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
            Informações usadas na legenda, na administração e nas experiências
            públicas do geoportal.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)_140px]">
          <FormField
            control={form.control}
            name="layerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da camada</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Distrito Municipal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="groupId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Grupo</FormLabel>
                <GroupSelect value={field.value} onChange={field.onChange} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="index"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ordenação</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Ex: 10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="summaryDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição resumida</FormLabel>
              <FormControl>
                <RichTextField
                  placeholder="Explique em uma frase o que esta camada representa e quando deve ser usada."
                  minHeightClassName="min-h-[76px]"
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Uma frase objetiva ajuda usuários a entenderem o conteúdo e o
                melhor contexto de uso.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="sourceParameters"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avisos</FormLabel>
                <FormControl>
                  <RichTextField
                    placeholder="Ex: Informe avisos sobre situações relevantes para a compreensão do dado ou dos riscos de utilizá-lo..."
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Informe avisos sobre situações relevantes para a compreensão do dado ou dos riscos de utilizá-lo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="legisLinks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Legis</FormLabel>
                <FormControl>
                  <RichTextField
                    placeholder="Ex: https://legis.urbis.prefeitura.sp.gov.br/pages/... ou texto da base normativa."
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Insira a base normativa para o dado com um link para página de definição do Legis ou texto manual.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="ckanMetadataUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Metadados CKAN</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: https://dadosabertos.urbis.prefeitura.sp.gov.br/dataset/..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Link do conjunto de dados no CKAN. Será usado nos botões de
                metadados e Baixar tudo do painel público.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      {loadingMethod !== "CustomWMSLayer" && (
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold tracking-tight">
              Zoom de exibição
            </h2>
            <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
              Limites em que a camada aparece no mapa. Deixe vazio para exibir
              em todos os níveis.
            </p>
          </div>

          {loadingMethod === "Stream" && streamMinZoom < 17 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
              Atenção: o modo recortado foi pensado para zoom 17 ou maior.
              Abaixo disso a prévia e o mapa podem buscar muitos recortes e
              ficar lentos. Se a camada precisa aparecer antes, use WFS completo
              ou WMS.
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FormField
              control={form.control}
              name="minZoom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zoom mínimo (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Ex: 10"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxZoom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zoom máximo (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Ex: 18"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>
      )}

      {!simpleMode && (
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold tracking-tight">
              Estado da camada
            </h2>
            <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
              Publicação, visibilidade inicial e consulta no clique.
            </p>
          </div>

          <div className="divide-y rounded-lg border bg-background">
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between gap-4 px-4 py-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Publicada</FormLabel>
                    <div className="text-[0.8rem] text-muted-foreground">
                      Disponível para usuários do geoportal.
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between gap-4 px-4 py-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Acesso público</FormLabel>
                    <div className="text-[0.8rem] text-muted-foreground">
                      Define se a camada é visível para qualquer visitante ou
                      restrita por cargo.
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value !== false}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          form.setValue("allowedRoles", [], {
                            shouldDirty: true,
                          });
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {!isPublic && (
              <div className="px-4 py-4 space-y-3 bg-muted/20">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Cargos autorizados
                </p>
                <div className="text-[0.8rem] text-muted-foreground">
                  Selecione quais cargos terão permissão para visualizar e
                  interagir com esta camada no mapa. É necessário selecionar
                  pelo menos um cargo para salvar uma camada restrita.
                </div>
                {loadingRoles ? (
                  <p className="text-xs text-muted-foreground animate-pulse">
                    Carregando cargos...
                  </p>
                ) : rolesError ? (
                  <p className="text-xs text-destructive">{rolesError}</p>
                ) : roles.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Nenhum cargo disponível.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {roles.map((role) => {
                      const allowedRolesList =
                        (form.watch("allowedRoles") as string[]) || [];
                      const isChecked = allowedRolesList.includes(role.id);
                      return (
                        <label
                          key={role.id}
                          className="flex items-center space-x-3 text-sm cursor-pointer select-none rounded-md border bg-background p-2.5 hover:bg-muted/40 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const newList = e.target.checked
                                ? [...allowedRolesList, role.id]
                                : allowedRolesList.filter(
                                    (id) => id !== role.id,
                                  );
                              form.setValue("allowedRoles", newList, {
                                shouldDirty: true,
                              });
                            }}
                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                          />
                          <div className="space-y-0.5">
                            <span className="font-medium text-xs text-foreground leading-none">
                              {role.name}
                            </span>
                            {role.description && (
                              <p className="text-[10px] text-muted-foreground leading-tight">
                                {role.description}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <FormField
              control={form.control}
              name="isSelected"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between gap-4 px-4 py-3">
                  <div className="space-y-0.5 pr-3">
                    <FormLabel className="text-sm">
                      Consulta no clique
                    </FormLabel>
                    <div className="text-[0.8rem] text-muted-foreground">
                      Permite clicar em uma feição para selecionar, abrir
                      detalhes e aplicar a ação configurada.
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        handleFeatureQueryChange(checked, field.onChange)
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {loadingMethod !== "CustomWMSLayer" && isSelected && (
              <div className="space-y-3 bg-muted/20 px-4 py-3">
                <p className="text-[0.8rem] leading-5 text-muted-foreground">
                  Defina se o clique deve abrir os detalhes da feição, apenas
                  aproximar o mapa ou não executar nenhuma ação adicional.
                </p>
                <ClickActionConfiguration />
              </div>
            )}
            <FormField
              control={form.control}
              name="isVisible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between gap-4 px-4 py-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">
                      Visibilidade inicial
                    </FormLabel>
                    <div className="text-[0.8rem] text-muted-foreground">
                      Define se a camada abre ligada no mapa.
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="includeInAnalysis"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between gap-4 px-4 py-3">
                  <div className="space-y-0.5 pr-3">
                    <FormLabel className="text-sm">
                      Incluir em análises territoriais
                    </FormLabel>
                    <div className="text-[0.8rem] text-muted-foreground">
                      Calcula sobreposições e interseções automaticamente ao desenhar polígonos ou inspecionar áreas.
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value !== false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="includeInFiu"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between gap-4 px-4 py-3">
                  <div className="space-y-0.5 pr-3">
                    <FormLabel className="text-sm">
                      Incluir na FIU
                    </FormLabel>
                    <div className="text-[0.8rem] text-muted-foreground">
                      Disponibiliza esta camada nos cálculos e demonstrativos da Ficha de Informações Urbanísticas.
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value !== false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </section>
      )}
    </div>
  );
};
