// @ts-nocheck
import { useSignal } from "@preact/signals-react";
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
            {mode.value === "select" ? "Adicionar Camada" : 
             mode.value === "web" ? "Integração GeoServer" : "Upload de Dados"}
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground pt-2">
            {mode.value === "select" ? "Adicione camadas personalizadas ao seu mapa de forma rápida. Estas camadas são temporárias e ficam disponíveis apenas durante a sua sessão atual." : 
             mode.value === "web" ? "Conecte-se a serviços externos via WMS ou WFS para visualizar dados geográficos em tempo real." : "Envie arquivos geográficos diretamente do seu computador (máx. 400MB)."}
          </DialogDescription>
        </DialogHeader>
        
        {mode.value === "select" && (
          <div className="grid grid-cols-2 gap-4 py-6">
            <div 
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl hover:bg-primary/5 hover:border-primary/50 cursor-pointer transition-all group gap-4 text-center"
              onClick={() => (mode.value = "web")}
            >
              <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl text-blue-600">dns</span>
              </div>
              <div className="space-y-1">
                <span className="text-foreground font-bold text-lg block">GeoServer</span>
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">WMS / WFS Integration</span>
              </div>
            </div>
            <div 
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl hover:bg-primary/5 hover:border-primary/50 cursor-pointer transition-all group gap-4 text-center"
              onClick={() => (mode.value = "upload")}
            >
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl text-green-600">cloud_upload</span>
              </div>
              <div className="space-y-1">
                <span className="text-foreground font-bold text-lg block">Local File</span>
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Upload de Dados</span>
              </div>
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
