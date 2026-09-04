import { Signal, signal, useSignal } from "@preact/signals";
import { useCallback, useEffect, useState } from "preact/hooks";
import { useMemo, useRef } from "react";
import "preact/compat";
import {
  Button,
  Label,
  Textarea,
  UrbisIcon,
} from "@open-urbis/map-ui";
import { Input } from "@open-urbis/map-ui";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@open-urbis/map-ui";

import { Switch } from "@open-urbis/map-ui";
import { cn } from "@open-urbis/map-ui";
import { Camera, Satellite, Map, MoreVertical, BookA, Layers, Expand, Info, Palette } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@open-urbis/map-ui";
import { Slider } from "../ui/slider";
import { BASE_MAPS_CONFIG, BaseMapStyleId, BaseMapConfig } from "../MapView/base-map-styles";
import { currentShare, useMapContext } from "../../hooks/useMapContext";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { LayerGroup } from "./LayerGroup";
import { LayerSortableList } from "./LayerSortableList";
import { AddLayerModal } from "./modals/AddLayerModal";
import { ScreenExportPanel } from "./ScreenExportPanel";
import { AuthRequiredModal } from "../AuthRequiredModal";
import { MapLegendContent } from "../MapLegend";
import { useAuth } from "@open-urbis/map-auth";
import { shareService, SharedMapItem } from "../../integrations/share-service";
import { userManager } from "../../auth/oidc-config";
import { userProfile } from "../../auth/user-state";
import { useSearchContext } from "../../hooks/useSearchContext";
import { enabledFeatureFlags } from "../../features/feature-flags";
import { LayerVisualCustomizationPanel } from "./LayerVisualCustomizationPanel";
import { LayerMetadataPanel } from "./LayerMetadataPanel";
import { IGetConfigLayerSchema } from "../../types/fetch-map-config-type";
import { mapImageControl } from "../MapView/map-controls";
import { mapTutorialVisible } from "../MapTutorial/state";
import { requestedLayerMetadataId } from "./state";

const isCollapsed = signal<boolean>(false);

const cloneLayerSchema = (layer: IGetConfigLayerSchema) =>
  structuredClone(layer) as IGetConfigLayerSchema;

const contentActionClass =
  "flex h-10 w-10 min-w-10 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background p-0 text-foreground shadow-lg shadow-black/20 ring-1 ring-background/80 backdrop-blur-md hover:border-primary/60 hover:bg-background hover:text-primary dark:border-white/20 dark:bg-background/95 dark:ring-black/40";
const highlightedContentActionClass =
  "border-primary/70 text-primary ring-2 ring-primary/25 hover:border-primary";

const PanelHeader = ({
  title,
  description,
  onClose,
}: {
  title: string;
  description?: string;
  onClose?: () => void;
  showResize?: boolean;
}) => (
  <div className="flex items-start justify-between gap-3 border-b bg-background/70 p-3">
    <div>
      <h5 className="m-0 text-sm font-semibold flex items-center gap-1.5">
        {title}
      </h5>
      {description && (
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={onClose ?? (() => (isCollapsed.value = false))}
      aria-label={`Fechar ${title}`}
    >
      <UrbisIcon name="close" className="text-base" aria-hidden="true" />
    </Button>
  </div>
);

const PlaceholderPanel = ({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) => (
  <div className="flex min-h-0 flex-1 flex-col">
    <PanelHeader title={title} description={description} />
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
      <UrbisIcon
        name={icon}
        className="text-4xl opacity-60"
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-[260px] text-xs leading-relaxed">{description}</p>
    </div>
  </div>
);

const ImageInsertPanel = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFile = useSignal<File | null>(null);
  const status = useSignal("");
  const error = useSignal("");

  const getImageControl = () => {
    if (!mapImageControl.current) {
      throw new Error("Controle de imagem ainda não inicializado");
    }
    return mapImageControl.current;
  };

  const runImageAction = async (
    action: () => void | Promise<void>,
    successMessage: string,
  ) => {
    error.value = "";
    try {
      await action();
      status.value = successMessage;
    } catch (err) {
      console.error("Erro ao controlar imagem no mapa", err);
      error.value = "Insira ou selecione uma imagem primeiro.";
    }
  };

  const handleAddImage = (file: File | null) =>
    runImageAction(async () => {
      if (!file) {
        throw new Error("Arquivo de imagem não selecionado");
      }
      const control = getImageControl();
      const imageId = await control.addFile(file);
      if (imageId) {
        control.selectRaster(imageId);
      }
    }, "Imagem inserida.");

  const setMode = (mode: "move" | "scale" | "rotate") =>
    runImageAction(
      () => getImageControl().setMode(mode),
      mode === "move"
        ? "Mover ativo."
        : mode === "scale"
          ? "Tamanho ativo."
          : "Girar ativo.",
    );

  const removeImage = () =>
    runImageAction(
      () => getImageControl().removeRaster(),
      "Imagem removida.",
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PanelHeader
        title="Inserir imagem na tela"
        description="Use este modo para inserir, posicionar e ajustar imagens sobre o mapa."
      />
      <div className="space-y-3 p-3">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file =
              (event.currentTarget as HTMLInputElement).files?.[0] ?? null;
            selectedFile.value = file;
            error.value = "";
            status.value = "";
            void handleAddImage(file);
          }}
        />

        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => fileInputRef.current?.click()}
          title="Escolher e inserir imagem no mapa"
        >
          <UrbisIcon
            name="image"
            className="mr-2 text-base"
            aria-hidden="true"
          />
          <span className="truncate">
            {selectedFile.value?.name ?? "Escolher imagem"}
          </span>
        </Button>

        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            className="h-10 px-0"
            onClick={() => setMode("move")}
            title="Mover imagem"
          >
            <UrbisIcon
              name="open_with"
              className="text-lg"
              aria-hidden="true"
            />
          </Button>
          <Button
            variant="outline"
            className="h-10 px-0"
            onClick={() => setMode("scale")}
            title="Ajustar tamanho"
          >
            <UrbisIcon
              name="zoom_out_map"
              className="text-lg"
              aria-hidden="true"
            />
          </Button>
          <Button
            variant="outline"
            className="h-10 px-0"
            onClick={() => setMode("rotate")}
            title="Girar imagem"
          >
            <UrbisIcon
              name="rotate_right"
              className="text-lg"
              aria-hidden="true"
            />
          </Button>
          <Button
            variant="outline"
            className="h-10 px-0 text-destructive hover:text-destructive"
            onClick={removeImage}
            title="Remover imagem selecionada"
          >
            <UrbisIcon name="delete" className="text-lg" aria-hidden="true" />
          </Button>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Clique na imagem no mapa para selecionar e ajustar.
        </p>

        {(status.value || error.value) && (
          <p
            className={cn(
              "text-[11px]",
              error.value ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {error.value || status.value}
          </p>
        )}
      </div>
    </div>
  );
};

const ShareContentPanel = () => {
  const auth = useAuth();
  const {
    layerSchemas,
    layerGroups,
    boundingBox,
    zoom,
    is3DActive,
    selectedBaseMap,
  } = useMapContext();
  const searchContext = useSearchContext();
  const name = useSignal(currentShare.value?.name ?? "");
  const description = useSignal(currentShare.value?.description ?? "");
  const isPublic = useSignal(false);
  const loading = useSignal(false);
  const error = useSignal("");
  const url = useSignal("");

  const currentUserId = auth.user?.profile.sub || "mock-user-id-123";
  const isOwner =
    currentShare.value && currentShare.value.userId === currentUserId;

  const payload = useMemo(
    () => ({
      root: {
        searchContext: {
          currentTerm: searchContext?.currentTerm.value || "",
          history: searchContext?.history.value || [],
          searchConfig: searchContext?.searchConfig.value || [],
        },
        mapContext: {
          layerSchemas: layerSchemas.value,
          layerGroups: layerGroups.value,
          boundingBox: boundingBox.value,
          zoom: zoom.value,
          is3DActive: is3DActive.value,
          selectedBaseMap: selectedBaseMap.value,
        },
      },
    }),
    [],
  );

  const saveShare = async () => {
    error.value = "";
    if (!name.value.trim()) return;

    const user = await userManager.getUser();
    if (!user) {
      error.value = "Você precisa estar autenticado para compartilhar.";
      return;
    }

    loading.value = true;
    try {
      const result = isOwner
        ? await shareService.update(
            currentShare.value!.id,
            payload as any,
            name.value,
            description.value,
            "map",
            isPublic.value,
          )
        : await shareService.share(
            payload as any,
            name.value,
            description.value,
            "map",
            isPublic.value,
          );
      url.value = `${window.location.origin}/?shareId=${result.id}`;
    } catch (e) {
      console.error("Error sharing", e);
      error.value = "Ocorreu um erro ao salvar. Tente novamente.";
    } finally {
      loading.value = false;
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PanelHeader
        title="Compartilhar visualização do mapa"
        description="Gere um link para abrir o mapa exatamente como você está vendo agora."
      />
      <div className="space-y-3 p-3">
        {/* Box explicativo em Linguagem Simples com (i) */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs space-y-1.5">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-1 min-w-0">
              <p className="font-semibold text-xs text-foreground">
                O que será salvo neste link?
              </p>
              <ul className="space-y-1 text-[11px] leading-relaxed text-muted-foreground list-disc list-inside">
                <li>
                  <strong className="text-foreground">Local e aproximação (zoom):</strong> o ponto exato da cidade onde você está navegando.
                </li>
                <li>
                  <strong className="text-foreground">Camadas visíveis:</strong> as camadas de dados que você deixou ativas no mapa.
                </li>
                <li>
                  <strong className="text-foreground">Ajustes visuais e 3D:</strong> o mapa base escolhido (satélite, ortofoto, etc.), cores, opacidades e modo 3D.
                </li>
                <li>
                  <strong className="text-foreground">Filtros aplicados:</strong> quaisquer regras de filtro ativas nas camadas.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {error.value && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-2 text-xs text-destructive">
            {error.value}
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="content-share-name">Nome da visualização</Label>
          <Input
            id="content-share-name"
            value={name.value}
            onInput={(e) => (name.value = e.currentTarget.value)}
            placeholder="Ex: Análise de zoneamento da região central"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="content-share-description">
            Descrição (opcional)
          </Label>
          <Textarea
            id="content-share-description"
            value={description.value}
            onInput={(e) => (description.value = e.currentTarget.value)}
            rows={3}
            placeholder="Adicione observações para quem abrir este link..."
            className="resize-none"
          />
        </div>
        {userProfile.value?.position === "Administrador" && (
          <div className="flex items-center justify-between rounded-lg border bg-primary/5 p-3">
            <Label
              htmlFor="content-share-public"
              className="text-xs font-medium"
            >
              Tornar público na Biblioteca
            </Label>
            <Switch
              id="content-share-public"
              checked={isPublic.value}
              onCheckedChange={(checked) => (isPublic.value = checked)}
            />
          </div>
        )}
        <Button
          className="w-full"
          onClick={saveShare}
          disabled={loading.value || !name.value.trim()}
        >
          {loading.value ? "Salvando..." : "Salvar e gerar link"}
        </Button>
        {url.value && (
          <div className="flex gap-2">
            <Input value={url.value} readOnly className="text-xs" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigator.clipboard.writeText(url.value)}
              aria-label="Copiar link"
            >
              <UrbisIcon
                name="content_copy"
                className="text-base"
                aria-hidden="true"
              />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

interface LibrarySectionProps {
  title: string;
  icon: string;
  items: SharedMapItem[];
  empty: string;
  requiresLogin?: boolean;
  isAuthenticated: boolean;
  onOpenItem: (item: SharedMapItem) => void;
  onCopyItemLink: (item: SharedMapItem) => void;
  onRenameItem?: (item: SharedMapItem) => void;
  onDeleteItem?: (item: SharedMapItem) => void;
}

const LibrarySection = ({
  title,
  icon,
  items,
  empty,
  requiresLogin,
  isAuthenticated,
  onOpenItem,
  onCopyItemLink,
  onRenameItem,
  onDeleteItem,
}: LibrarySectionProps) => (
  <section className="rounded-xl border bg-card/70 p-3">
    <div className="mb-2 flex items-center gap-2">
      <UrbisIcon
        name={icon}
        className="text-base text-primary"
        aria-hidden="true"
      />
      <h6 className="text-xs font-semibold">{title}</h6>
    </div>
    {requiresLogin && !isAuthenticated ? (
      <p className="text-xs text-muted-foreground">
        Entre na sua conta para ver este conteúdo.
      </p>
    ) : items.length === 0 ? (
      <p className="text-xs italic text-muted-foreground">{empty}</p>
    ) : (
      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border bg-background/70 p-2 transition hover:bg-accent/50"
          >
            <button
              type="button"
              className="w-full text-left"
              onClick={() => onOpenItem(item)}
            >
              <p className="truncate text-xs font-medium">{item.name}</p>
              <p className="line-clamp-1 text-[11px] text-muted-foreground">
                {item.description || "Sem descrição"}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground/70">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </button>
            <div className="mt-2 flex flex-wrap gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[11px]"
                onClick={() => onOpenItem(item)}
              >
                Aplicar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[11px]"
                onClick={() => onCopyItemLink(item)}
              >
                Copiar link
              </Button>
              {onRenameItem && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => onRenameItem(item)}
                >
                  Renomear
                </Button>
              )}
              {onDeleteItem && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[11px] text-destructive hover:text-destructive"
                  onClick={() => onDeleteItem(item)}
                >
                  Excluir
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
);

const LibraryContentPanel = () => {
  const auth = useAuth();
  const myMaps = useSignal<SharedMapItem[]>([]);
  const mySearches = useSignal<SharedMapItem[]>([]);
  const publicMaps = useSignal<SharedMapItem[]>([]);
  const publicSearches = useSignal<SharedMapItem[]>([]);
  const loading = useSignal(false);

  useEffect(() => {
    const loadLibrary = async () => {
      loading.value = true;
      try {
        const [mapsPublic, searchesPublic, mapsHistory, searchesHistory] =
          await Promise.all([
            shareService.findAllPublic(1, 20, "map"),
            shareService.findAllPublic(1, 20, "search"),
            auth.isAuthenticated
              ? shareService.getHistory(1, 20, "map")
              : Promise.resolve({ items: [], total: 0 }),
            auth.isAuthenticated
              ? shareService.getHistory(1, 20, "search")
              : Promise.resolve({ items: [], total: 0 }),
          ]);

        publicMaps.value = mapsPublic.items;
        publicSearches.value = searchesPublic.items;
        myMaps.value = mapsHistory.items;
        mySearches.value = searchesHistory.items;
      } catch (e) {
        console.error("Failed to load content library", e);
      } finally {
        loading.value = false;
      }
    };
    void loadLibrary();
  }, [auth.isAuthenticated]);

  const openItem = (item: SharedMapItem) => {
    window.location.href = `${window.location.origin}/?shareId=${item.id}`;
  };

  const copyItemLink = (item: SharedMapItem) => {
    void navigator.clipboard.writeText(
      `${window.location.origin}/?shareId=${item.id}`,
    );
  };

  const deleteItem = async (
    item: SharedMapItem,
    target: typeof myMaps | typeof mySearches,
  ) => {
    const confirmed = window.confirm(
      `Excluir "${item.name}" da Biblioteca de conteúdos?`,
    );
    if (!confirmed) return;

    await shareService.delete(item.id);
    target.value = target.value.filter((current) => current.id !== item.id);
  };

  const renameItem = async (
    item: SharedMapItem,
    target: typeof myMaps | typeof mySearches,
    type: "map" | "search",
  ) => {
    const name = window.prompt("Novo nome", item.name)?.trim();
    if (!name || name === item.name) return;

    const updated = await shareService.update(
      item.id,
      item.state,
      name,
      item.description,
      type,
    );
    target.value = target.value.map((current) =>
      current.id === item.id ? { ...current, name: updated.name } : current,
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PanelHeader
        title="Biblioteca de conteúdos"
        description="Acesse suas visualizações do mapa e consultas de dados salvas em um só lugar."
      />
      <div className="space-y-3 p-3">
        {/* Box explicativo com (i) em Linguagem Simples */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs space-y-2">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-1.5 min-w-0">
              <p className="font-semibold text-xs text-foreground">
                Como funciona a Biblioteca?
              </p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Aqui você encontra tudo o que foi salvo no Urbis para consultar novamente ou compartilhar:
              </p>
              <ul className="space-y-1 text-[11px] leading-relaxed text-muted-foreground list-disc list-inside">
                <li>
                  <strong className="text-foreground">Visualizações do mapa:</strong> guarda o local exato da cidade, aproximação (zoom), camadas ativas, mapa base (satélite, ortofoto ou ruas), estilos e filtros.
                </li>
                <li>
                  <strong className="text-foreground">Consultas e tabelas:</strong> guarda as buscas por atributos feitas na ferramenta <em>Explorar registros filtrados</em>, prontas para reabrir e baixar em planilha.
                </li>
                <li>
                  <strong className="text-foreground">Compartilhamento:</strong> você pode copiar o link de qualquer item para enviar a colegas ou cidadãos.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {loading.value ? (
          <div className="flex justify-center p-8 text-muted-foreground">
            <UrbisIcon
              name="progress_activity"
              className="animate-spin"
              aria-hidden="true"
            />
          </div>
        ) : (
          <>
            <div className="space-y-2 rounded-xl border bg-muted/20 p-2.5">
              <div className="flex items-center gap-2 px-1 text-xs font-semibold text-foreground">
                <UrbisIcon
                  name="map"
                  className="text-base text-primary"
                  aria-hidden="true"
                />
                Visualizações do mapa
              </div>
              <LibrarySection
                title="Minhas visualizações salvas"
                icon="person"
                items={myMaps.value}
                empty="Você ainda não salvou nenhuma visualização. Para salvar o estado atual do mapa, use o botão Compartilhar no menu lateral."
                requiresLogin
                isAuthenticated={auth.isAuthenticated}
                onOpenItem={openItem}
                onCopyItemLink={copyItemLink}
                onRenameItem={(item) => renameItem(item, myMaps, "map")}
                onDeleteItem={(item) => deleteItem(item, myMaps)}
              />
              <LibrarySection
                title="Visualizações públicas"
                icon="public"
                items={publicMaps.value}
                empty="Nenhuma visualização pública disponível no momento."
                isAuthenticated={auth.isAuthenticated}
                onOpenItem={openItem}
                onCopyItemLink={copyItemLink}
              />
            </div>
            <div className="space-y-2 rounded-xl border bg-muted/20 p-2.5">
              <div className="flex items-center gap-2 px-1 text-xs font-semibold text-foreground">
                <UrbisIcon
                  name="table_chart"
                  className="text-base text-primary"
                  aria-hidden="true"
                />
                Consultas de dados e tabelas
              </div>
              <LibrarySection
                title="Minhas consultas salvas"
                icon="person"
                items={mySearches.value}
                empty="Você ainda não salvou nenhuma consulta. Ao filtrar dados em Explorar registros filtrados, clique em Compartilhar para guardar sua tabela aqui."
                requiresLogin
                isAuthenticated={auth.isAuthenticated}
                onOpenItem={openItem}
                onCopyItemLink={copyItemLink}
                onRenameItem={(item) => renameItem(item, mySearches, "search")}
                onDeleteItem={(item) => deleteItem(item, mySearches)}
              />
              <LibrarySection
                title="Consultas públicas"
                icon="public"
                items={publicSearches.value}
                empty="Nenhuma consulta pública disponível no momento."
                isAuthenticated={auth.isAuthenticated}
                onOpenItem={openItem}
                onCopyItemLink={copyItemLink}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface BaseMapsPanelProps {
  onOpenOptions: (e: any, item: BaseMapConfig) => void;
}

const BaseMapsPanel = ({ onOpenOptions }: BaseMapsPanelProps) => {
  const {
    selectedBaseMap,
    selectedBaseMaps,
    baseMapOpacity,
    baseMapOpacities,
    baseMapSaturation,
    baseMap3DOpacity,
    is3DActive,
  } = useMapContext();

  const activeBaseMaps = selectedBaseMaps?.value ?? [selectedBaseMap.value];
  const isMultiSelect = useSignal<boolean>(
    (selectedBaseMaps?.value?.length ?? 0) > 1,
  );

  useEffect(() => {
    isMultiSelect.value = (selectedBaseMaps?.value?.length ?? 0) > 1;
  }, [selectedBaseMaps?.value?.length]);

  const getOpacityForStyle = (styleId: string) => {
    return baseMapOpacities?.value?.[styleId] ?? 100;
  };

  const setOpacityForStyle = (styleId: string, value: number) => {
    if (baseMapOpacities) {
      baseMapOpacities.value = {
        ...baseMapOpacities.value,
        [styleId]: value,
      };
    }
    if (baseMapOpacity && activeBaseMaps.length === 1) {
      baseMapOpacity.value = value;
    }
  };

  const handleToggleBaseMap = (styleId: BaseMapStyleId) => {
    if (isMultiSelect.value) {
      const current = [...activeBaseMaps];
      const index = current.indexOf(styleId);
      if (index >= 0) {
        if (current.length > 1) {
          current.splice(index, 1);
        }
      } else {
        current.push(styleId);
      }
      if (selectedBaseMaps) selectedBaseMaps.value = current;
      if (current.length > 0) selectedBaseMap.value = current[0];
    } else {
      if (selectedBaseMaps) selectedBaseMaps.value = [styleId];
      selectedBaseMap.value = styleId;
    }
  };

  const handleMultiSelectChange = (checked: boolean) => {
    isMultiSelect.value = checked;
    if (!checked && activeBaseMaps.length > 1) {
      const first = activeBaseMaps[0];
      if (selectedBaseMaps) selectedBaseMaps.value = [first];
      selectedBaseMap.value = first;
    }
  };

  const basesOficiais = BASE_MAPS_CONFIG.filter(
    (style) => style.grupo === "Bases oficiais",
  ).sort((a, b) => a.ordemExibicao - b.ordemExibicao);

  const basesNaoOficiais = BASE_MAPS_CONFIG.filter(
    (style) => style.grupo === "Bases não oficiais",
  ).sort((a, b) => a.ordemExibicao - b.ordemExibicao);

  const renderBaseMapOption = (item: BaseMapConfig) => {
    const TypeIcon =
      item.tipo === "ortofoto"
        ? Camera
        : item.tipo === "satélite"
        ? Satellite
        : Map;

    const isSelected = activeBaseMaps.includes(item.id);
    const selectedIndex = activeBaseMaps.indexOf(item.id);

    return (
      <div
        key={item.id}
        className={cn(
          "group relative overflow-hidden rounded-xl border bg-background text-left shadow-sm transition hover:border-primary/60 hover:bg-accent/50 flex flex-col min-h-[185px] h-auto pb-1.5 select-none",
          isSelected && "border-primary bg-accent/40",
        )}
      >
        <div
          onClick={() => handleToggleBaseMap(item.id as BaseMapStyleId)}
          className="cursor-pointer flex flex-col flex-1"
        >
          <div className="relative h-24 w-full overflow-hidden bg-muted shrink-0">
            <img
              src={item.urlMiniatura}
              alt={item.nome}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            {isSelected && (
              <span className="absolute right-2 top-2 inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold px-1.5 shadow">
                {activeBaseMaps.length > 1 ? `${selectedIndex + 1}º` : <UrbisIcon name="check" className="text-sm" aria-hidden="true" />}
              </span>
            )}
          </div>
          <div className="px-3 py-2 flex flex-col gap-1 flex-1">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-sm font-semibold truncate leading-none flex-1">{item.nome}</span>
              <button
                type="button"
                onClick={(e) => onOpenOptions(e, item)}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 z-20"
                title="Mais opções"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-start gap-1.5 mt-0.5 min-h-0">
              <TypeIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-[11px] leading-tight text-muted-foreground">
                {item.descricao}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PanelHeader
        title="Mapas base"
        description="Escolha a referência visual de fundo e configure a visualização 3D e ajustes visuais."
      />
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {/* Controles: 3D e Sobrepor em linhas separadas */}
        <div className="space-y-2 text-xs">
          <label
            htmlFor="3d-mode-panel"
            className="flex items-center justify-between gap-2 rounded-xl border bg-muted/20 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors select-none"
          >
            <span className="flex items-center gap-2 font-medium">
              <UrbisIcon
                name="view_in_ar"
                className="text-muted-foreground text-base shrink-0"
                aria-hidden="true"
              />
              Edificações 3D
            </span>
            <Switch
              id="3d-mode-panel"
              checked={is3DActive.value}
              onCheckedChange={(checked) => (is3DActive.value = checked)}
            />
          </label>

          <label
            htmlFor="multi-base-mode-lc"
            className="flex items-center justify-between gap-2 rounded-xl border bg-muted/20 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors select-none"
          >
            <span className="flex items-center gap-2 font-medium">
              <UrbisIcon
                name="layers"
                className="text-muted-foreground text-base shrink-0"
                aria-hidden="true"
              />
              Sobrepor mapas base
            </span>
            <Switch
              id="multi-base-mode-lc"
              checked={isMultiSelect.value}
              onCheckedChange={handleMultiSelectChange}
            />
          </label>
        </div>

        {/* Ajustes de Opacidade e Saturação */}
        <div className="space-y-2.5 rounded-xl border bg-muted/20 p-3 text-xs">
          {activeBaseMaps.map((styleId, idx) => {
            const itemConfig = BASE_MAPS_CONFIG.find((c) => c.id === styleId);
            const name = itemConfig?.nome ?? styleId;
            const opacityVal = getOpacityForStyle(styleId);

            return (
              <div key={styleId} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-foreground truncate max-w-[200px]">
                    {activeBaseMaps.length > 1 && (
                      <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1 shrink-0">
                        {idx + 1}º
                      </span>
                    )}
                    <span className="truncate">Opacidade {activeBaseMaps.length > 1 ? `(${name})` : ""}</span>
                  </span>
                  <span className="tabular-nums font-medium text-muted-foreground">{opacityVal}%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[opacityVal]}
                  onValueChange={([val]) => {
                    if (val !== undefined) setOpacityForStyle(styleId, val);
                  }}
                  aria-label={`Opacidade de ${name}`}
                />
              </div>
            );
          })}

          <div className="space-y-1 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <UrbisIcon name="palette" className="text-sm shrink-0" aria-hidden="true" />
                Saturação
              </span>
              <span className="tabular-nums font-medium text-muted-foreground">{baseMapSaturation?.value ?? 100}%</span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[baseMapSaturation?.value ?? 100]}
              onValueChange={([val]) => {
                if (baseMapSaturation && val !== undefined) baseMapSaturation.value = val;
              }}
              aria-label="Saturação dos mapas base"
            />
          </div>
        </div>

        <section className="space-y-2">
          <div>
            <h4 className="text-sm font-semibold">Bases oficiais</h4>
            <p className="text-xs text-muted-foreground">
              Coletânea de mapas, ortofotos e fotos de satélite oficiais da Prefeitura de São Paulo.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {basesOficiais.map(renderBaseMapOption)}
          </div>
        </section>

        <section className="space-y-2">
          <div>
            <h4 className="text-sm font-semibold">Bases não oficiais</h4>
            <p className="text-xs text-muted-foreground">
              Coletânea de mapas e ortofotos de bases públicas colaborativas.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {basesNaoOficiais.map(renderBaseMapOption)}
          </div>
        </section>
      </div>
    </div>
  );
};

interface LayersPanelProps {
  title?: string;
  description?: string;
  activeTab: Signal<"sources" | "visible">;
  searchValue: Signal<string>;
  highlightCustomize?: boolean;
  highlightFilter?: boolean;
  onRemoveLayer: (id: string) => void;
  onShowLayerMetadata: (id: string) => void;
  onCustomizeLayer: (id: string) => void;
  onOpenLegendFromLayers: () => void;
}

const LayersPanel = ({
  title = "Camadas",
  description = "Clique no ícone de olho para exibir/ocultar camadas, ou nos três pontinhos para mais opções.",
  activeTab,
  searchValue,
  highlightCustomize = false,
  highlightFilter = false,
  onRemoveLayer,
  onShowLayerMetadata,
  onCustomizeLayer,
  onOpenLegendFromLayers,
}: LayersPanelProps) => {
  const { layerGroups } = useMapContext();

  return (
    <>
      <PanelHeader title={title} description={description} />
      <div className="flex items-center border-b bg-background/30 px-2 pt-1">
        <button
          className={cn(
            "flex-1 border-b-2 pb-2 pt-2 text-xs font-medium transition-all focus-visible:outline-none",
            activeTab.value === "sources"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground",
          )}
          onClick={() => (activeTab.value = "sources")}
        >
          Catálogo
        </button>
        <button
          className={cn(
            "flex-1 border-b-2 pb-2 pt-2 text-xs font-medium transition-all focus-visible:outline-none",
            activeTab.value === "visible"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground",
          )}
          onClick={() => (activeTab.value = "visible")}
        >
          No mapa
        </button>
      </div>

      {activeTab.value === "sources" && (
        <div className="border-b bg-background/30 px-3 py-2">
          <div className="relative">
            <UrbisIcon
              name="search"
              className="absolute left-2 top-1.5 text-base text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="Buscar no catálogo"
              className="h-8 bg-background/50 pl-8 text-sm"
              value={searchValue.value}
              onInput={(e) =>
                (searchValue.value = (e.target as HTMLInputElement).value)
              }
            />
          </div>
        </div>
      )}

      <div className="min-h-[180px] flex-1 overflow-y-auto">
        {activeTab.value === "sources" ? (
          <div className="flex flex-col">
            {layerGroups.value.map((group, i) => (
              <LayerGroup
                key={`group-main-${i}`}
                group={group}
                searchValue={searchValue.value}
                onRemove={onRemoveLayer}
                onShowMetadata={onShowLayerMetadata}
                onCustomize={onCustomizeLayer}
                highlightCustomize={highlightCustomize}
                highlightFilter={highlightFilter}
              />
            ))}
          </div>
        ) : (
          <LayerSortableList
            onCustomize={onCustomizeLayer}
            onShowMetadata={onShowLayerMetadata}
            onRemove={onRemoveLayer}
            onOpenLegend={onOpenLegendFromLayers}
            highlightCustomize={highlightCustomize}
            highlightFilter={highlightFilter}
          />
        )}
      </div>
    </>
  );
};

const ContentMenuButton = ({
  icon,
  label,
  onClick,
  disabled,
  title,
  highlighted,
  hasWarning,
  showTutorialLabels = false,
}: {
  icon: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  highlighted?: boolean;
  hasWarning?: boolean;
  badge?: string | number | null;
  showTutorialLabels?: boolean;
}) => {
  const isSvg = icon.startsWith("/") || icon.endsWith(".svg");
  return (
    <div className="relative flex items-center justify-end">
      <Button
        variant="outline"
        size="icon"
        className={cn(
          contentActionClass,
          highlighted && highlightedContentActionClass,
          disabled && "opacity-55",
        )}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        aria-label={label}
        title={showTutorialLabels ? undefined : (title ?? label)}
      >
        {isSvg ? (
          <span
            className="h-4 w-4 shrink-0"
            style={{
              backgroundColor: "currentColor",
              mask: `url(${icon}) no-repeat center / contain`,
              WebkitMask: `url(${icon}) no-repeat center / contain`,
            }}
          />
        ) : (
          <UrbisIcon name={icon} className="text-base" aria-hidden="true" />
        )}
        {hasWarning && (
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 ring-2 ring-background" />
        )}
      </Button>
      <span
        aria-hidden="true"
        className={cn(
          "urbis-app-menu-layer pointer-events-none absolute right-[calc(100%+8px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md z-50 bg-background",
          showTutorialLabels
            ? "opacity-100"
            : "transition-all duration-200 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0",
        )}
      >
        {title ?? label}
      </span>
    </div>
  );
};

// MAP_STYLES is now imported and managed via BASE_MAPS_CONFIG in base-map-styles.ts

export const LayerController = ({
  hideManager = false,
  hideBaseMapSelector = false,
}: {
  hideManager?: boolean;
  hideBaseMapSelector?: boolean;
} = {}) => {
  const {
    layerSchemas,
    zoom,
    selectedBaseMaps,
    baseMapOpacity,
    baseMapOpacities,
    baseMapSaturation,
    overlayRef,
    flyTo,
  } = useMapContext();
  const { isProspectiveSearchActive } = useNavigationContext();
  const { concatenatedSearch } = useSearchContext();
  const auth = useAuth();
  const features = enabledFeatureFlags.value;
  const canManageLayers = features.manageLayers && !hideManager;
  const canUseBaseMaps = features.baseMaps && !hideBaseMapSelector;

  const activeTab = useSignal<"sources" | "visible">("visible");
  const customizingLayerId = useSignal<string | null>(null);
  const highlightCustomizeButtons = useSignal(false);
  const highlightFilterButtons = useSignal(false);
  const originalCustomizingLayer = useSignal<IGetConfigLayerSchema | null>(
    null,
  );
  const metadataLayerId = useSignal<string | null>(null);
  const contentPanel = useSignal<
    | "layers"
    | "baseMaps"
    | "addLayer"
    | "filters"
    | "geoExport"
    | "image"
    | "style"
    | "screenExport"
    | "library"
    | "share"
    | "legend"
  >("layers");

  const baseMapOptionsOpen = useSignal<boolean>(false);
  const selectedBaseMapOptions = useSignal<BaseMapConfig | null>(null);
  const showMetadataInfo = useSignal<boolean>(false);

  const handleOpenOptions = (e: any, item: BaseMapConfig) => {
    e.stopPropagation();
    selectedBaseMapOptions.value = item;
    showMetadataInfo.value = false;
    baseMapOptionsOpen.value = true;
  };

  const BASE_PANEL_WIDTH = 372;
  const MIN_PANEL_WIDTH = 320;
  const MAX_PANEL_WIDTH = BASE_PANEL_WIDTH * 2; // Máximo dobro do tamanho (744px)

  const [panelWidth, setPanelWidth] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("urbis:layer-panel-width");
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (
            !isNaN(parsed) &&
            parsed >= MIN_PANEL_WIDTH &&
            parsed <= MAX_PANEL_WIDTH
          ) {
            return parsed;
          }
        }
      } catch {
        // ignore
      }
    }
    return BASE_PANEL_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);

  const handleResizeStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);

      const startX = e.clientX;
      const startWidth = panelWidth;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const deltaX = startX - moveEvent.clientX;
        const maxAllowed = Math.min(
          MAX_PANEL_WIDTH,
          typeof window !== "undefined"
            ? window.innerWidth - 80
            : MAX_PANEL_WIDTH,
        );
        const minAllowed = MIN_PANEL_WIDTH;
        const newWidth = Math.max(
          minAllowed,
          Math.min(maxAllowed, startWidth + deltaX),
        );
        setPanelWidth(newWidth);
        try {
          localStorage.setItem("urbis:layer-panel-width", String(newWidth));
        } catch {
          // ignore
        }
      };

      const handlePointerUp = () => {
        setIsResizing(false);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        document.body.style.removeProperty("cursor");
        document.body.style.removeProperty("user-select");
      };

      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [panelWidth],
  );

  const customizingLayer =
    layerSchemas.value.find(
      (layer) => String(layer.id) === customizingLayerId.value,
    ) ?? null;

  const metadataLayer =
    layerSchemas.value.find(
      (layer) => String(layer.id) === metadataLayerId.value,
    ) ?? null;

  const effectiveWidth = useMemo(() => {
    const maxAllowed = Math.min(
      MAX_PANEL_WIDTH,
      typeof window !== "undefined" ? window.innerWidth - 80 : MAX_PANEL_WIDTH,
    );
    const base = Math.min(panelWidth, maxAllowed);
    if (customizingLayer || metadataLayer) {
      return Math.min(Math.max(base, 420), maxAllowed);
    }
    return base;
  }, [customizingLayer, metadataLayer, panelWidth]);

  useEffect(() => {
    isCollapsed.value = true;
    const timeout = setTimeout(() => {
      isCollapsed.value = false;
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const requestedId = requestedLayerMetadataId.value;
    if (!requestedId) return;

    metadataLayerId.value = requestedId;
    customizingLayerId.value = null;
    originalCustomizingLayer.value = null;
    activeTab.value = "visible";
    contentPanel.value = "layers";
    isCollapsed.value = true;
    requestedLayerMetadataId.value = null;
  }, [requestedLayerMetadataId.value]);

  const searchValue = useSignal("");
  const isAddLayerOpen = useSignal(false);
  const addLayerInitialMode = useSignal<"select" | "web" | "upload">("select");

  const isAuthModalOpen = useSignal(false);

  // Count active layers that require higher zoom to be rendered on map
  const layersRequiringZoomCount = useMemo(() => {
    const currentZoom = zoom?.value ?? 0;
    return (layerSchemas?.value || []).filter((s) => {
      if (!s.isVisible) return false;
      const minZ = s.minZoom;
      return typeof minZ === "number" && minZ > 0 && currentZoom < minZ;
    }).length;
  }, [layerSchemas?.value, zoom?.value]);

  const hasLayersRequiringZoom = layersRequiringZoomCount > 0;

  const handleActionWithAuth = (action: () => void) => {
    if (!auth.isAuthenticated) {
      isAuthModalOpen.value = true;
      return;
    }
    action();
  };

  const openContentPanel = (panel: typeof contentPanel.value) => {
    contentPanel.value = panel;
    isCollapsed.value = true;
  };

  const updateLayerSchema = (updatedLayer: IGetConfigLayerSchema) => {
    layerSchemas.value = layerSchemas.value.map((layer) =>
      String(layer.id) === String(updatedLayer.id) ? updatedLayer : layer,
    );
  };

  const handleCustomizeLayer = (id: string) => {
    const layer = layerSchemas.value.find((item) => String(item.id) === id);

    if (
      layer?.properties?.supportsVisualCustomization === false ||
      layer?.properties?.source === "geoserver-catalog"
    ) {
      return;
    }

    originalCustomizingLayer.value = layer ? cloneLayerSchema(layer) : null;
    customizingLayerId.value = id;
    metadataLayerId.value = null;
    activeTab.value = "visible";
    isCollapsed.value = true;
  };

  const handleCloseCustomization = () => {
    if (originalCustomizingLayer.value) {
      updateLayerSchema(originalCustomizingLayer.value);
    }

    customizingLayerId.value = null;
    originalCustomizingLayer.value = null;
  };

  const handleSaveCustomization = (updatedLayer: IGetConfigLayerSchema) => {
    updateLayerSchema(updatedLayer);
    customizingLayerId.value = null;
    originalCustomizingLayer.value = null;
  };

  const handleShowLayerMetadata = (id: string) => {
    metadataLayerId.value = id;
    customizingLayerId.value = null;
    originalCustomizingLayer.value = null;
    activeTab.value = "visible";
    isCollapsed.value = true;
  };

  const handleRemoveLayer = (id: string) => {
    layerSchemas.value = layerSchemas.value.filter(
      (layer) => String(layer.id) !== String(id),
    );

    if (customizingLayerId.value === id) {
      customizingLayerId.value = null;
      originalCustomizingLayer.value = null;
    }

    if (metadataLayerId.value === id) {
      metadataLayerId.value = null;
    }
  };

  const handleOpenLegendFromLayers = () => {
    contentPanel.value = "legend";
    isCollapsed.value = true;
  };

  const handleCloseMetadata = () => {
    metadataLayerId.value = null;
  };

  const renderContentPanel = () => {
    switch (contentPanel.value) {
      case "baseMaps":
        return <BaseMapsPanel onOpenOptions={handleOpenOptions} />;
      case "addLayer":
        return (
          <div className="flex min-h-0 flex-1 flex-col">
            <PanelHeader
              title="Adicionar camada de GeoServer"
              description="Conecte serviços WMS/WFS e escolha uma camada publicada para visualizar no mapa."
            />
            <div className="space-y-3 p-3">
              <Button
                className="w-full"
                onClick={() => {
                  addLayerInitialMode.value = "web";
                  isAddLayerOpen.value = true;
                }}
              >
                <UrbisIcon
                  name="add_circle"
                  className="mr-2 text-base"
                  aria-hidden="true"
                />
                Adicionar camada WMS/WFS
              </Button>
            </div>
          </div>
        );
      case "filters":
        return (
          <LayersPanel
            title="Filtros por atributos de camadas"
            description="Selecione uma camada no mapa para configurar seus filtros por atributos."
            activeTab={activeTab}
            searchValue={searchValue}
            highlightCustomize={highlightCustomizeButtons.value}
            highlightFilter={highlightFilterButtons.value}
            onRemoveLayer={handleRemoveLayer}
            onShowLayerMetadata={handleShowLayerMetadata}
            onCustomizeLayer={handleCustomizeLayer}
            onOpenLegendFromLayers={handleOpenLegendFromLayers}
          />
        );
      case "geoExport":
        return (
          <PlaceholderPanel
            title="Exportar arquivo georreferenciado"
            description="Exportação de arquivo georreferenciado ainda indisponível neste painel."
            icon="file_download"
          />
        );

      case "image":
        return <ImageInsertPanel />;
      case "style":
        return (
          <LayersPanel
            title="Personalizar visualmente camada"
            description="Selecione uma camada no mapa e ajuste preenchimento, borda e rótulos."
            activeTab={activeTab}
            searchValue={searchValue}
            highlightCustomize={highlightCustomizeButtons.value}
            highlightFilter={highlightFilterButtons.value}
            onRemoveLayer={handleRemoveLayer}
            onShowLayerMetadata={handleShowLayerMetadata}
            onCustomizeLayer={handleCustomizeLayer}
            onOpenLegendFromLayers={handleOpenLegendFromLayers}
          />
        );
      case "screenExport":
        return (
          <ScreenExportPanel onClose={() => (isCollapsed.value = false)} />
        );
      case "library":
        return <LibraryContentPanel />;
      case "share":
        return <ShareContentPanel />;
      case "legend":
        return (
          <div className="flex min-h-0 flex-1 flex-col">
            <PanelHeader
              title="Legenda"
              description="Entenda as cores e símbolos das camadas ativas no mapa."
            />
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <MapLegendContent onShowMetadata={handleShowLayerMetadata} />
            </div>
          </div>
        );
      case "layers":
      default:
        return (
          <LayersPanel
            activeTab={activeTab}
            searchValue={searchValue}
            highlightCustomize={highlightCustomizeButtons.value}
            highlightFilter={highlightFilterButtons.value}
            onRemoveLayer={handleRemoveLayer}
            onShowLayerMetadata={handleShowLayerMetadata}
            onCustomizeLayer={handleCustomizeLayer}
            onOpenLegendFromLayers={handleOpenLegendFromLayers}
          />
        );
    }
  };

  const showTutorialLabels = mapTutorialVisible.value;
  const canShowContentPanel =
    !isProspectiveSearchActive.value &&
    (canManageLayers ||
      (canUseBaseMaps && contentPanel.value === "baseMaps") ||
      (features.library && contentPanel.value === "library") ||
      contentPanel.value === "legend");

  useEffect(() => {
    if (isProspectiveSearchActive.value) {
      isCollapsed.value = false;
      customizingLayerId.value = null;
      metadataLayerId.value = null;
    }
  }, [isProspectiveSearchActive.value]);

  return (
    <>
      {(canUseBaseMaps || canManageLayers || features.library) &&
        !isProspectiveSearchActive.value && (
          <div className="urbis-app-menu-layer group pointer-events-auto fixed right-2 top-20 flex max-h-[calc(100vh-156px)] flex-col items-end gap-1.5 overflow-visible bg-transparent p-1 md:right-3 md:top-[70px] md:max-h-[calc(100vh-96px)]">
            {canManageLayers && (
              <ContentMenuButton
                icon="layers"
                label="Camadas"
                highlighted
                showTutorialLabels={showTutorialLabels}
                onClick={() => {
                  activeTab.value = "visible";
                  contentPanel.value = "layers";
                  isCollapsed.value = true;
                }}
              />
            )}

            {canUseBaseMaps && (
              <ContentMenuButton
                icon="map"
                label="Mapas base"
                highlighted
                showTutorialLabels={showTutorialLabels}
                onClick={() => openContentPanel("baseMaps")}
              />
            )}

            {canManageLayers && (
              <ContentMenuButton
                icon="library_add"
                label="Adicionar camada de GeoServer"
                showTutorialLabels={showTutorialLabels}
                onClick={() => {
                  addLayerInitialMode.value = "web";
                  isAddLayerOpen.value = true;
                }}
              />
            )}

            {canManageLayers && features.concatenatedSearch && (
              <ContentMenuButton
                icon="table_chart"
                label="Explorar registros filtrados"
                title="Explorar e exportar registros em formato de planilha"
                showTutorialLabels={showTutorialLabels}
                onClick={() => {
                  concatenatedSearch.value = {
                    ...concatenatedSearch.peek(),
                    isOpen: true,
                  };
                }}
              />
            )}

            {canManageLayers && (
              <ContentMenuButton
                icon="filter_alt"
                label="Filtrar geometrias no mapa"
                title="Filtrar geometrias visíveis no mapa"
                showTutorialLabels={showTutorialLabels}
                onClick={() => {
                  activeTab.value = "visible";
                  contentPanel.value = "filters";
                  isCollapsed.value = true;
                  highlightFilterButtons.value = true;
                  window.setTimeout(() => {
                    highlightFilterButtons.value = false;
                  }, 4500);
                }}
              />
            )}

            {canManageLayers && (
              <ContentMenuButton
                icon="add_photo_alternate"
                label="Inserir imagem na tela"
                showTutorialLabels={showTutorialLabels}
                onClick={() => openContentPanel("image")}
                title="Inserir imagem na tela"
              />
            )}

            {canManageLayers && (
              <ContentMenuButton
                icon="palette"
                label="Personalizar visualmente camada"
                showTutorialLabels={showTutorialLabels}
                onClick={() => {
                  activeTab.value = "visible";
                  contentPanel.value = "style";
                  isCollapsed.value = true;
                  highlightCustomizeButtons.value = true;
                  window.setTimeout(() => {
                    highlightCustomizeButtons.value = false;
                  }, 4500);
                }}
              />
            )}

            {canManageLayers && (
              <ContentMenuButton
                icon="/exportar_geometrias_tela.svg"
                label="Exportar geometrias da tela"
                showTutorialLabels={showTutorialLabels}
                onClick={() => openContentPanel("screenExport")}
              />
            )}

            {features.library && (
              <ContentMenuButton
                icon="library"
                label="Biblioteca de conteúdos"
                showTutorialLabels={showTutorialLabels}
                onClick={() =>
                  handleActionWithAuth(() => openContentPanel("library"))
                }
              />
            )}

            {canManageLayers && (
              <ContentMenuButton
                icon="share"
                label="Compartilhar"
                showTutorialLabels={showTutorialLabels}
                onClick={() =>
                  handleActionWithAuth(() => openContentPanel("share"))
                }
              />
            )}

            {canManageLayers && (
              <ContentMenuButton
                icon="list"
                label="Legenda"
                highlighted
                hasWarning={hasLayersRequiringZoom}
                title={
                  hasLayersRequiringZoom
                    ? `Legenda (${layersRequiringZoomCount} ${layersRequiringZoomCount === 1 ? "camada requer" : "camadas requerem"} aproximação de zoom)`
                    : "Legenda"
                }
                showTutorialLabels={showTutorialLabels}
                onClick={() => openContentPanel("legend")}
              />
            )}
          </div>
        )}

      {canShowContentPanel && (
        <div
          style={{
            width:
              typeof window !== "undefined" && window.innerWidth >= 768
                ? `${effectiveWidth}px`
                : undefined,
            maxWidth: `min(${MAX_PANEL_WIDTH}px, calc(100vw - 80px))`,
          }}
          className={cn(
            "urbis-app-panel-layer fixed right-[58px] top-20 flex max-h-[calc(100vh-156px)] w-[calc(100vw-74px)] min-w-[300px] flex-col overflow-visible rounded-2xl border bg-background/90 shadow-xl backdrop-blur-md md:right-[62px] md:top-[70px] md:max-h-[calc(100vh-96px)]",
            !isResizing && "transition-all duration-300 ease-in-out",
            isCollapsed.value
              ? "translate-x-0 opacity-100 visible"
              : "translate-x-[120%] opacity-0 invisible pointer-events-none",
          )}
        >
          {/* Resize handle na borda esquerda */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Redimensionar painel"
            title="Arraste para redimensionar o painel"
            onPointerDown={handleResizeStart}
            className={cn(
              "group/resizer absolute -left-2.5 top-0 bottom-0 z-50 hidden md:flex w-5 cursor-ew-resize items-center justify-center select-none touch-none",
              isResizing && "cursor-ew-resize",
            )}
          >
            <div
              className={cn(
                "flex h-12 w-1.5 items-center justify-center rounded-full bg-border/80 transition-all duration-200 shadow-sm",
                "group-hover/resizer:h-16 group-hover/resizer:w-2 group-hover/resizer:bg-primary group-hover/resizer:shadow-md",
                "group-active/resizer:h-20 group-active/resizer:w-2 group-active/resizer:bg-primary",
                isResizing && "h-20 w-2 bg-primary ring-4 ring-primary/20",
              )}
            >
              <div className="h-4 w-0.5 rounded-full bg-muted-foreground/60 group-hover/resizer:bg-primary-foreground group-active/resizer:bg-primary-foreground" />
            </div>
          </div>

          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
            {customizingLayer ? (
              <LayerVisualCustomizationPanel
                open={!!customizingLayer}
                layer={customizingLayer}
                originalLayer={originalCustomizingLayer.value}
                onClose={handleCloseCustomization}
                onPreview={updateLayerSchema}
                onSave={handleSaveCustomization}
              />
            ) : metadataLayer ? (
              <LayerMetadataPanel
                open={!!metadataLayer}
                layer={metadataLayer}
                onClose={handleCloseMetadata}
              />
            ) : (
              renderContentPanel()
            )}
          </div>
        </div>
      )}

      <AddLayerModal
        isOpen={isAddLayerOpen.value}
        initialMode={addLayerInitialMode.value}
        onOpenChange={(v) => (isAddLayerOpen.value = v)}
      />

      <AuthRequiredModal
        isOpen={isAuthModalOpen.value}
        onOpenChange={(v) => (isAuthModalOpen.value = v)}
      />

      <Dialog
        open={baseMapOptionsOpen.value}
        onOpenChange={(v) => (baseMapOptionsOpen.value = v)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedBaseMapOptions.value?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Descrição</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedBaseMapOptions.value?.descricao}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Palette className="h-3.5 w-3.5 text-primary" />
                  Personalizar visualmente camada
                </h4>
              </div>
              <div className="space-y-3 rounded-lg border bg-muted/20 p-3 text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between font-medium">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <UrbisIcon name="opacity" className="text-base" aria-hidden="true" />
                      Opacidade
                    </span>
                    <span className="tabular-nums font-semibold">
                      {selectedBaseMapOptions.value?.id
                        ? (baseMapOpacities?.value?.[selectedBaseMapOptions.value.id] ?? 100)
                        : 100}%
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[
                      selectedBaseMapOptions.value?.id
                        ? (baseMapOpacities?.value?.[selectedBaseMapOptions.value.id] ?? 100)
                        : 100,
                    ]}
                    onValueChange={([val]) => {
                      if (val !== undefined && selectedBaseMapOptions.value?.id) {
                        const styleId = selectedBaseMapOptions.value.id;
                        if (baseMapOpacities) {
                          baseMapOpacities.value = {
                            ...baseMapOpacities.value,
                            [styleId]: val,
                          };
                        }
                        if (baseMapOpacity && (!selectedBaseMaps?.value || selectedBaseMaps.value.length <= 1)) {
                          baseMapOpacity.value = val;
                        }
                      }
                    }}
                    aria-label="Opacidade do mapa base"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Invisível (0%)</span>
                    <span>Visível (100%)</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between font-medium">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <UrbisIcon name="palette" className="text-base" aria-hidden="true" />
                      Cor / Saturação
                    </span>
                    <span className="tabular-nums font-semibold">{baseMapSaturation?.value ?? 100}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[baseMapSaturation?.value ?? 100]}
                    onValueChange={([val]) => {
                      if (baseMapSaturation && val !== undefined) baseMapSaturation.value = val;
                    }}
                    aria-label="Saturação do mapa base"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Preto e branco (0%)</span>
                    <span>Colorido (100%)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs gap-2"
                onClick={() => {
                  baseMapOptionsOpen.value = false;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const map = (overlayRef?.current as any)?._map;
                  const spBounds: [[number, number], [number, number]] = [
                    [-46.8255, -24.0082],
                    [-46.3653, -23.3567],
                  ];
                  if (map) {
                    map.fitBounds(spBounds, { padding: 40, duration: 600 });
                  } else if (flyTo) {
                    flyTo({ bounds: [-46.8255, -24.0082, -46.3653, -23.3567] });
                  }
                }}
              >
                <Expand className="h-3.5 w-3.5 text-primary" />
                <span>Expandir para a camada</span>
              </Button>
            </div>

            {selectedBaseMapOptions.value?.urlMetadados && (
              <div className="space-y-2 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Metadados</span>
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-foreground">
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[280px] p-2.5 text-[11px] leading-relaxed">
                        Metadados são dados que descrevem outros dados. Nos metadados desta camada, se encontram: (1) os estudos sobre o dado; (2) descrição semântica do dado; (3) descrição técnica do dado (fonte, transformações e formato); (4) opções de consumo (geoserver e download); (5) classificação do dado na organização do Urbis (permitindo ver outros dados semelhantes).
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex gap-2">
                  <a
                    href={selectedBaseMapOptions.value.urlMetadados}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium px-3 py-2 w-full transition-colors"
                  >
                    <BookA className="h-4 w-4" />
                    <span>Acessar Metadados</span>
                  </a>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => (baseMapOptionsOpen.value = false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
