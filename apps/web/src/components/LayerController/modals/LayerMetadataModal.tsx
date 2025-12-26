import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IGetConfigLayerSchema } from "../../../types/fetch-map-config-type";
import { useState } from "react";

interface LayerMetadataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layer: IGetConfigLayerSchema;
}

export const LayerMetadataModal = ({
  open,
  onOpenChange,
  layer,
}: LayerMetadataModalProps) => {
  const [activeTab, setActiveTab] = useState<"metadata" | "layer">("metadata");

  const { properties } = layer;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metadata = properties?.metadata || {};

  const description =
    metadata.description || properties.description || "Descrição não disponível.";
  const keywords = metadata.keywords || properties.keywords || [];
  const attribution =
    metadata.attribution || properties.attribution || "© Autor desconhecido";
  const links = metadata.links || properties.links || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Informações da Camada</DialogTitle>
        </DialogHeader>

        {activeTab === "metadata" && (
          <div className="space-y-6 pt-2">
            <div>
              <h2 className="text-2xl font-bold">{layer.name}</h2>
            </div>

            <section>
              <h3 className="font-semibold text-lg border-b pb-1 mb-2">
                Descrição
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </section>

            {keywords.length > 0 && (
              <section>
                <h3 className="font-semibold text-lg border-b pb-1 mb-2">
                  Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(keywords) ? (
                    keywords.map((k: string) => (
                      <span
                        key={k}
                        className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-medium"
                      >
                        {k}
                      </span>
                    ))
                  ) : (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
                      {keywords}
                    </span>
                  )}
                </div>
              </section>
            )}

            <section>
              <h3 className="font-semibold text-lg border-b pb-1 mb-2">
                Attribution
              </h3>
              <p className="text-xs text-muted-foreground">{attribution}</p>
            </section>

            {links.length > 0 && (
              <section>
                <h3 className="font-semibold text-lg border-b pb-1 mb-2">
                  Data Links
                </h3>
                <ul className="space-y-1">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {links.map((link: any, i: number) => (
                    <li key={i}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">
                          link
                        </span>
                        {link.label || link.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {activeTab === "layer" && (
          <div className="space-y-4 pt-2">
            <h3 className="font-semibold">Detalhes Técnicos</h3>
            <pre className="bg-zinc-100 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-50 p-4 rounded text-xs overflow-auto whitespace-pre-wrap break-all border border-border">
              {JSON.stringify(layer, null, 2)}
            </pre>
          </div>
        )}

        <DialogFooter className="flex sm:justify-between items-center mt-6 border-t pt-4">
          <div className="flex gap-2">
            <Button
              variant={activeTab === "metadata" ? "default" : "outline"}
              onClick={() => setActiveTab("metadata")}
              size="sm"
            >
              <span className="material-symbols-outlined mr-2 text-base">
                info
              </span>
              Metadata
            </Button>
            <Button
              variant={activeTab === "layer" ? "default" : "outline"}
              onClick={() => setActiveTab("layer")}
              size="sm"
            >
              <span className="material-symbols-outlined mr-2 text-base">
                layers
              </span>
              Layer
            </Button>
          </div>
          <Button variant="ghost" onClick={() => onOpenChange(false)} size="sm">
            <span className="material-symbols-outlined mr-2 text-base">
              close
            </span>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
