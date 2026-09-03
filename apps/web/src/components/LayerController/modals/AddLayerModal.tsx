// @ts-nocheck
import { useSignal } from "@preact/signals";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  UrbisIcon,
} from "@open-urbis/map-ui";
import { UploadLayer } from "../AddLayer/UploadLayer";
import { WebLayer } from "../AddLayer/WebLayer";

type AddLayerMode = "select" | "web" | "upload";

interface AddLayerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: AddLayerMode;
}

export const AddLayerModal = ({
  isOpen,
  onOpenChange,
  initialMode = "select",
}: AddLayerModalProps) => {
  const mode = useSignal<AddLayerMode>(initialMode);

  const reset = () => {
    mode.value = initialMode;
  };

  useEffect(() => {
    if (isOpen) mode.value = initialMode;
  }, [isOpen, initialMode]);

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {mode.value === "select"
              ? "Adicionar camada"
              : mode.value === "web"
                ? "GeoServer"
                : "GeoJSON"}
          </DialogTitle>
          <DialogDescription className="pt-1 text-sm text-muted-foreground">
            {mode.value === "select"
              ? "Adicione uma camada temporária ao mapa."
              : mode.value === "web"
                ? "Escolha um serviço WMS/WFS e uma camada publicada."
                : "Importe um arquivo GeoJSON do seu computador."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {mode.value === "select" && (
            <div className="grid grid-cols-2 gap-2 py-3">
              <div
                className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-center transition-all hover:border-primary/50 hover:bg-primary/5"
                onClick={() => (mode.value = "web")}
              >
                <div className="rounded-full bg-blue-100 p-2 transition-transform group-hover:scale-105 dark:bg-blue-900/30">
                  <UrbisIcon
                    name="dns"
                    className="text-2xl text-blue-600"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-foreground">
                    GeoServer
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    WMS / WFS
                  </span>
                </div>
              </div>
              <div
                className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-center transition-all hover:border-primary/50 hover:bg-primary/5"
                onClick={() => (mode.value = "upload")}
              >
                <div className="rounded-full bg-green-100 p-2 transition-transform group-hover:scale-105 dark:bg-green-900/30">
                  <span
                    className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0"
                    style={{
                      backgroundColor: "currentColor",
                      mask: "url(/importar_arquivo_georreferenciado.svg) no-repeat center / contain",
                      WebkitMask: "url(/importar_arquivo_georreferenciado.svg) no-repeat center / contain",
                    }}
                  />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-foreground">
                    GeoJSON
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Importar
                  </span>
                </div>
              </div>
            </div>
          )}

          {mode.value === "web" && (
            <WebLayer
              onBack={() => (mode.value = "select")}
              onClose={() => handleOpenChange(false)}
            />
          )}

          {mode.value === "upload" && (
            <UploadLayer
              onBack={() => (mode.value = "select")}
              onClose={() => handleOpenChange(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
