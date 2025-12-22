import { useContext, useState } from "preact/hooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shareService } from "../../../integrations/share-service";
import { useMapContext } from "../../../hooks/useMapContext";
import { SearchContext } from "../../../context/SearchContext";
import { appState, AppStateDoc } from "../../../integrations/signaldb";

interface ShareModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShareModal = ({ isOpen, onOpenChange }: ShareModalProps) => {
  const mapContext = useMapContext();
  const searchContext = useContext(SearchContext);
  const [shortUrl, setShortUrl] = useState("");
  const [directUrl, setDirectUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
     setLoading(true);
     
     // Retrieve current state from SignalDB or construct it
     // Using SignalDB ensures we share what was persisted locally
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

     // Ensure we share the correct structure expected by the API
     const hasMapContext = 'mapContext' in currentState;
     const payload = hasMapContext 
        ? { root: { searchContext: (currentState as AppStateDoc).searchContext, mapContext: (currentState as AppStateDoc).mapContext } } 
        : currentState;

     try {
         const result = await shareService.share(payload as any);
         setShortUrl(result.shortUrl);
         setDirectUrl(result.directUrl);
     } catch (e) {
         console.error("Error sharing", e);
     } finally {
         setLoading(false);
     }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Compartilhar</DialogTitle>
        </DialogHeader>
        
        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-md flex gap-3 text-sm text-blue-700 dark:text-blue-300">
           <span className="material-symbols-outlined text-xl shrink-0">info</span>
           <p>Estes links não incluem anotações, medições ou camadas personalizadas adicionadas ao mapa.</p>
        </div>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
             <h4 className="text-sm font-semibold">Compartilhar link direto para o mapa</h4>
             <div className="flex gap-2">
                <Input value={directUrl || "url /"} readOnly className="flex-1" />
                <Button variant="outline" size="icon" disabled={!directUrl} onClick={() => copyToClipboard(directUrl)}>
                   <span className="material-symbols-outlined text-base">content_copy</span>
                </Button>
             </div>
          </div>

          <div className="space-y-2">
             <h4 className="text-sm font-semibold">Gerar link curto</h4>
             {shortUrl ? (
                <div className="flex gap-2">
                    <Input value={shortUrl} readOnly className="flex-1" />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(shortUrl)}>
                        <span className="material-symbols-outlined text-base">content_copy</span>
                    </Button>
                </div>
             ) : (
                <>
                    <p className="text-sm text-muted-foreground">Gere um link mais curto que faz tudo o que o link acima faz, porém de forma compacta!</p>
                    <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                        onClick={handleShare}
                        disabled={loading}
                    >
                        {loading ? "Gerando..." : "Gerar link curto"}
                    </Button>
                </>
             )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
