import { useContext, useEffect } from "react";
import { useSignal } from "@preact/signals";
import { useAuth } from "react-oidc-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { shareService } from "../../../integrations/share-service";
import { useMapContext, currentShare } from "../../../hooks/useMapContext";
import { SearchContext } from "../../../context/SearchContext";
import { appState, AppStateDoc } from "../../../integrations/signaldb";

interface ShareModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShareModal = ({ isOpen, onOpenChange }: ShareModalProps) => {
  const mapContext = useMapContext();
  const searchContext = useContext(SearchContext);
  
  const shortUrl = useSignal("");
  const directUrl = useSignal("");
  const loading = useSignal(false);
  const name = useSignal("");
  const description = useSignal("");
  const error = useSignal("");
  const success = useSignal("");
  
  const auth = useAuth();

  const currentUserId = auth.user?.profile.sub || 'mock-user-id-123';
  const isOwner = currentShare.value && currentShare.value.userId === currentUserId;

  useEffect(() => {
      if (isOpen && currentShare.value) {
          if (!name.value) name.value = currentShare.value.name;
          if (!description.value) description.value = currentShare.value.description || "";
      }
  }, [isOpen]);

  const getPayload = () => {
     // Retrieve current state from SignalDB or construct it
     const currentState = appState.findOne({ id: 'current' }) || {
        root: {
            searchContext: {
                currentTerm: searchContext?.currentTerm.value || "",
                history: searchContext?.history.value || [],
                searchQuery: searchContext?.searchQuery || {}, 
                searchConfig: searchContext?.searchConfig.value || []
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
                layerWithRootEditTemplate: mapContext.layerWithRootEditTemplate.value
            }
        }
     };

     const hasMapContext = 'mapContext' in currentState;
     return hasMapContext 
        ? { root: { searchContext: (currentState as unknown as AppStateDoc).searchContext, mapContext: (currentState as unknown as AppStateDoc).mapContext } } 
        : currentState;
  };

  const handleShare = async () => {
     error.value = "";
     success.value = "";
     if (!name.value.trim()) return;
     loading.value = true;
     
     const payload = getPayload();

     try {
         const result = await shareService.share(payload as any, name.value, description.value);
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
         const result = await shareService.update(currentShare.value.id, payload as any, name.value, description.value);
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
      error.value = "";
      success.value = "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isOwner ? "Atualizar Compartilhamento" : "Compartilhar"}</DialogTitle>
        </DialogHeader>
        
        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-md flex gap-3 text-sm text-blue-700 dark:text-blue-300">
           <span className="material-symbols-outlined text-xl shrink-0">info</span>
           <p>Estes links não incluem anotações, medições ou camadas personalizadas adicionadas ao mapa.</p>
        </div>

        <div className="grid gap-4 py-2">
          {error.value && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-3 rounded-md text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {error.value}
            </div>
          )}
          {success.value && (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 p-3 rounded-md text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                {success.value}
            </div>
          )}
          {!shortUrl.value ? (
            <>
                <div className="space-y-2">
                    <Label htmlFor="share-name">Nome do compartilhamento</Label>
                    <Input 
                        id="share-name" 
                        value={name.value} 
                        onInput={(e) => (name.value = (e.currentTarget as HTMLInputElement).value)} 
                        placeholder="Ex: Análise da região sul" 
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="share-desc">Descrição (opcional)</Label>
                    <Textarea 
                        id="share-desc" 
                        value={description.value} 
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onInput={(e) => (description.value = (e.currentTarget as any).value)} 
                        placeholder="Adicione uma breve descrição..." 
                    />
                </div>
                <div className="flex gap-2 mt-2">
                    <Button 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" 
                        onClick={handleShare}
                        disabled={loading.value || !name.value.trim()}
                    >
                        {loading.value ? "Gerando..." : "Gerar novo link"}
                    </Button>
                    {isOwner && (
                        <Button 
                            className="flex-1" 
                            variant="secondary"
                            onClick={handleUpdate}
                            disabled={loading.value || !name.value.trim()}
                        >
                            {loading.value ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    )}
                </div>
            </>
          ) : (
            <>
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Link direto</h4>
                    <div className="flex gap-2">
                        <Input value={directUrl.value} readOnly className="flex-1" />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(directUrl.value)}>
                            <span className="material-symbols-outlined text-base">content_copy</span>
                        </Button>
                    </div>
                </div>
                 <Button variant="outline" onClick={resetForm} className="mt-2">
                    Compartilhar novo mapa
                </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
