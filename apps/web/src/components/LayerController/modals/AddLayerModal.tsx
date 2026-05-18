// @ts-nocheck
import { useSignal } from "@preact/signals";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@open-urbis/map-ui";
import { UploadLayer } from "../AddLayer/UploadLayer";
import { WebLayer } from "../AddLayer/WebLayer";

interface AddLayerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type AddLayerMode = "select" | "web" | "upload";

export const AddLayerModal = ({ isOpen, onOpenChange }: AddLayerModalProps) => {
  const mode = useSignal<AddLayerMode>("select");

  const reset = () => {
    mode.value = "select";
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode.value === "select" ? "Adicionar camada" : 
             mode.value === "web" ? "Adicionar Camada Web" : "Upload de Dados"}
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground pt-2">
            {mode.value === "select" ? "Adicione uma camada ao seu mapa, seja de uma fonte web ou enviada do seu computador. Estas camadas são adicionadas apenas durante a sua sessão." : 
             mode.value === "web" ? "Insira a URL de um serviço WMS ou WFS para adicionar camadas." : "Envie um arquivo GeoJSON para visualizar no mapa."}
          </DialogDescription>
        </DialogHeader>
        
        {mode.value === "select" && (
          <div className="grid grid-cols-2 gap-4 py-4">
            <div 
              className="flex flex-col items-center justify-center p-6 border rounded-xl hover:bg-muted/50 cursor-pointer transition-colors group"
              onClick={() => (mode.value = "web")}
            >
              <span className="material-symbols-outlined text-4xl text-blue-600 mb-3">public</span>
              <span className="text-blue-600 font-medium text-lg">Adicionar camada web</span>
            </div>
            <div 
              className="flex flex-col items-center justify-center p-6 border rounded-xl hover:bg-muted/50 cursor-pointer transition-colors group"
              onClick={() => (mode.value = "upload")}
            >
              <span className="material-symbols-outlined text-4xl text-blue-600 mb-3">cloud_upload</span>
              <span className="text-blue-600 font-medium text-lg">Upload de dados</span>
            </div>
          </div>
        )}

        {mode.value === "web" && (
          <WebLayer onBack={() => (mode.value = "select")} onClose={() => handleOpenChange(false)} />
        )}

        {mode.value === "upload" && (
          <UploadLayer onBack={() => (mode.value = "select")} onClose={() => handleOpenChange(false)} />
        )}

      </DialogContent>
    </Dialog>
  );
};
