import { useEffect } from "react";
import { useSignal } from "@preact/signals";
import { useAuth } from "react-oidc-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@open-urbis/map-ui";
import { Button } from "@open-urbis/map-ui";
import { Input } from "@open-urbis/map-ui";
import { Label } from "@open-urbis/map-ui";
import { Textarea } from "@open-urbis/map-ui";
import { Switch } from "@open-urbis/map-ui";
import {
  Copy,
  Info,
  AlertCircle,
  CheckCircle,
  Share2,
  Save,
  Link,
} from "lucide-react";
import { shareService } from "../../../integrations/share-service";
import { useMapContext, currentShare } from "../../../hooks/useMapContext";
import { useSearchContext } from "../../../hooks/useSearchContext";
import { userManager } from "../../../auth/oidc-config";
import { FilterGroup } from "../../../components/FilterBuilder/types";
import { userProfile } from "../../../auth/user-state";
import { PredefinedSearchSuggestions } from "../../Search/PredefinedSearchSuggestions";

interface ShareModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type?: string;
  data?: {
    layerId: string;
    filterTree: FilterGroup;
  };
}

export const ShareModal = ({
  isOpen,
  onOpenChange,
  type = "map",
  data,
}: ShareModalProps) => {
  const typeLabel = type === "map" ? "Visualização" : "Busca";
  const mapContext = useMapContext();
  const searchContext = useSearchContext();

  const shortUrl = useSignal("");
  const directUrl = useSignal("");
  const loading = useSignal(false);
  const name = useSignal("");
  const description = useSignal("");
  const isPublic = useSignal(false);
  const error = useSignal("");
  const success = useSignal("");

  const auth = useAuth();

  const currentUserId = auth.user?.profile.sub || "mock-user-id-123";
  const isOwner =
    currentShare.value && currentShare.value.userId === currentUserId;

  useEffect(() => {
    if (isOpen && currentShare.value) {
      if (!name.value) name.value = currentShare.value.name;
      if (!description.value)
        description.value = currentShare.value.description || "";
    }
  }, [isOpen]);

  const getPayload = () => {
    if (type === "search") {
      // For search, only include the relevant search data
      return {
        root: {
          searchContext: {
            concatenatedSearch: searchContext?.concatenatedSearch.value,
          },
        },
      };
    }

    // For map (view), include all relevant map state and basic search context
    return {
      root: {
        searchContext: {
          currentTerm: searchContext?.currentTerm.value || "",
          history: searchContext?.history.value || [],
          searchConfig: searchContext?.searchConfig.value || [],
        },
        mapContext: {
          layerSchemas: mapContext.layerSchemas.value,
          layerGroups: mapContext.layerGroups.value,
          selectedFeatures: mapContext.selectedFeatures.value,
          boundingBox: mapContext.boundingBox.value,
          viewport: mapContext.viewport.value,
          zoom: mapContext.zoom.value,
          is3DActive: mapContext.is3DActive.value,
          selectedBaseMap: mapContext.selectedBaseMap.value,
          editFeatureTemplate: mapContext.editFeatureTemplate.value,
          layerWithRootEditTemplate: mapContext.layerWithRootEditTemplate.value,
        },
      },
    };
  };

  const handleShare = async () => {
    error.value = "";
    success.value = "";
    if (!name.value.trim()) return;

    const user = await userManager.getUser();
    if (!user) {
      error.value = "Você precisa estar autenticado para compartilhar.";
      return;
    }

    loading.value = true;

    const payload = getPayload();

    try {
      const result = await shareService.share(
        payload as any,
        name.value,
        description.value,
        type,
        isPublic.value
      );
      shortUrl.value = result.shortUrl;
      directUrl.value = result.directUrl;
    } catch (e) {
      console.error("Error sharing", e);
      error.value = "Ocorreu um erro ao gerar o link. Tente novamente.";
    } finally {
      loading.value = false;
    }
  };

  const handleUpdate = async () => {
    error.value = "";
    success.value = "";
    if (!name.value.trim() || !currentShare.value) return;
    loading.value = true;

    const payload = getPayload();

    try {
      const result = await shareService.update(
        currentShare.value.id,
        payload as any,
        name.value,
        description.value,
        type,
        isPublic.value
      );
      currentShare.value = result;
      success.value = "Compartilhamento atualizado com sucesso!";
      directUrl.value = `${window.location.origin}/?shareId=${result.id}`;
      shortUrl.value = `${window.location.origin}/?shareId=${result.id}`;
    } catch (e) {
      console.error("Error updating", e);
      error.value = "Ocorreu um erro ao atualizar. Tente novamente.";
    } finally {
      loading.value = false;
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  const resetForm = () => {
    shortUrl.value = "";
    directUrl.value = "";
    name.value = "";
    description.value = "";
    isPublic.value = false;
    error.value = "";
    success.value = "";
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) resetForm();
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isOwner
              ? "Atualizar Compartilhamento"
              : `Compartilhar ${typeLabel}`}
          </DialogTitle>
        </DialogHeader>

        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 p-4 rounded-lg flex gap-3 text-sm text-blue-700 dark:text-blue-300">
          <Info className="h-5 w-5 shrink-0" />
          <p>
            Estes links não incluem anotações, medições ou camadas
            personalizadas adicionadas ao mapa.
          </p>
        </div>

        {type === "search" && !shortUrl.value && (
          <div className="py-2">
            <PredefinedSearchSuggestions limit={4} />
          </div>
        )}

        <div className="grid gap-4 py-2">
          {error.value && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-300 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error.value}
            </div>
          )}
          {success.value && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900 text-green-600 dark:text-green-300 p-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {success.value}
            </div>
          )}
          {!shortUrl.value ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="share-name">
                  Nome da {typeLabel.toLowerCase()}
                </Label>
                <Input
                  id="share-name"
                  value={name.value}
                  onInput={(e) =>
                    (name.value = (e.currentTarget as HTMLInputElement).value)
                  }
                  placeholder="Ex: Análise da região sul"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="share-desc">Descrição (opcional)</Label>
                <Textarea
                  id="share-desc"
                  value={description.value}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onInput={(e) =>
                    (description.value = (e.currentTarget as any).value)
                  }
                  placeholder={`Adicione uma breve descrição sobre esta ${typeLabel.toLowerCase()}...`}
                  className="resize-none"
                  rows={3}
                />
              </div>
              {userProfile.value?.position === "Administrador" && (
                <div className="flex items-center justify-between space-x-2 py-2">
                  <Label htmlFor="is-public" className="flex flex-col space-y-1">
                    <span>Tornar Público</span>
                    <span className="font-normal text-xs text-muted-foreground">
                      Permite que qualquer pessoa acesse este compartilhamento
                      sem autenticação.
                    </span>
                  </Label>
                  <Switch
                    id="is-public"
                    checked={isPublic.value}
                    onCheckedChange={(checked) => (isPublic.value = checked)}
                  />
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Button
                  className="flex-1 gap-2"
                  onClick={handleShare}
                  disabled={loading.value || !name.value.trim()}
                >
                  {loading.value ? (
                    "Gerando..."
                  ) : (
                    <>
                      <Link className="h-4 w-4" />
                      Gerar Link
                    </>
                  )}
                </Button>
                {isOwner && (
                  <Button
                    className="flex-1 gap-2"
                    variant="secondary"
                    onClick={handleUpdate}
                    disabled={loading.value || !name.value.trim()}
                  >
                    {loading.value ? (
                      "Salvando..."
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Link para compartilhamento
                </h4>
                <div className="flex gap-2">
                  <Input value={directUrl.value} readOnly className="flex-1" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(directUrl.value)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button variant="ghost" onClick={resetForm} className="mt-2">
                Compartilhar nova {typeLabel.toLowerCase()}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
