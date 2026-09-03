import { useSignal } from "@preact/signals";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  UrbisIcon,
} from "@open-urbis/map-ui";
import { Button } from "@open-urbis/map-ui";
import { Check, Code2, Globe } from "lucide-react";
import { IGetConfigLayerSchema } from "../../../types/fetch-map-config-type";
import { getLayerNameFromConfig } from "../../../utils/layer-utils";

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
  const activeTab = useSignal<"metadata" | "layer" | "integration">("metadata");
  const [copiedCql, setCopiedCql] = useState(false);
  const [copiedWms, setCopiedWms] = useState(false);

  const { properties } = layer;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metadata = properties?.metadata || {};

  const keywords = metadata.keywords || properties.keywords || [];
  const links = metadata.links || properties.links || [];

  const isWmsLayer = layer.type === "CustomWMSLayer" || !!properties?.wms;

  const handleCopyCql = async () => {
    const cql = layer.cqlFilter || "";
    await navigator.clipboard.writeText(cql);
    setCopiedCql(true);
    setTimeout(() => setCopiedCql(false), 2000);
  };

  const handleCopyWms = async () => {
    const fullLayerName = getLayerNameFromConfig(layer) || layer.id;
    const baseUrl = layer.origin || "";
    if (!baseUrl) return;
    let wmsUrl = baseUrl;
    try {
      const urlObj = new URL(baseUrl, window.location.href);
      urlObj.searchParams.set("service", "WMS");
      urlObj.searchParams.set("version", "1.1.1");
      urlObj.searchParams.set("request", "GetMap");
      urlObj.searchParams.set("layers", fullLayerName);
      if (layer.cqlFilter) {
        urlObj.searchParams.set("CQL_FILTER", layer.cqlFilter);
      }
      wmsUrl = urlObj.toString();
    } catch {
      const filterParam = layer.cqlFilter ? `&CQL_FILTER=${encodeURIComponent(layer.cqlFilter)}` : "";
      wmsUrl = `${baseUrl}?service=WMS&version=1.1.1&request=GetMap&layers=${encodeURIComponent(fullLayerName)}${filterParam}`;
    }
    await navigator.clipboard.writeText(wmsUrl);
    setCopiedWms(true);
    setTimeout(() => setCopiedWms(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Informações da Camada</DialogTitle>
        </DialogHeader>

        {activeTab.value === "metadata" && (
          <div className="space-y-6 pt-2">
            <div>
              <h2 className="text-2xl font-bold">{layer.name}</h2>
            </div>

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
                        <UrbisIcon
                          name="link"
                          className="text-sm"
                          aria-hidden="true"
                        />
                        {link.label || link.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {activeTab.value === "layer" && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Detalhes Técnicos</h3>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCql}
                  className="h-7 text-xs gap-1.5 rounded-lg border-dashed text-muted-foreground hover:text-foreground"
                  title="Copiar expressão CQL da camada"
                >
                  {copiedCql ? <Check className="h-3 w-3 text-green-500" /> : <Code2 className="h-3 w-3" />}
                  {copiedCql ? "CQL Copiado" : "Copiar CQL"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyWms}
                  className="h-7 text-xs gap-1.5 rounded-lg border-dashed text-muted-foreground hover:text-foreground"
                  title="Copiar URL do serviço WMS"
                >
                  {copiedWms ? <Check className="h-3 w-3 text-green-500" /> : <Globe className="h-3 w-3" />}
                  {copiedWms ? "WMS Copiado" : "Copiar WMS"}
                </Button>
              </div>
            </div>
            <pre className="bg-zinc-100 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-50 p-4 rounded text-xs overflow-auto whitespace-pre-wrap break-all border border-border">
              {JSON.stringify(layer, null, 2)}
            </pre>
          </div>
        )}

        {activeTab.value === "integration" && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b pb-1">
              <h3 className="font-semibold text-lg">
                Consumir em SIG Externo (API)
              </h3>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCql}
                  className="h-7 text-xs gap-1.5 rounded-lg border-dashed text-muted-foreground hover:text-foreground"
                  title="Copiar expressão CQL da camada"
                >
                  {copiedCql ? <Check className="h-3 w-3 text-green-500" /> : <Code2 className="h-3 w-3" />}
                  {copiedCql ? "CQL Copiado" : "Copiar CQL"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyWms}
                  className="h-7 text-xs gap-1.5 rounded-lg border-dashed text-muted-foreground hover:text-foreground"
                  title="Copiar URL do serviço WMS"
                >
                  {copiedWms ? <Check className="h-3 w-3 text-green-500" /> : <Globe className="h-3 w-3" />}
                  {copiedWms ? "WMS Copiado" : "Copiar WMS"}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Esta camada está disponível para integração via protocolos padrão{" "}
              <strong>WMS (Web Map Service)</strong> ou{" "}
              <strong>WFS (Web Feature Service)</strong>. Você pode conectá-la
              diretamente no QGIS, ArcGIS ou em seus próprios sistemas de mapas.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Parâmetros de Integração
                </span>
                <div className="border rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900/50 divide-y text-sm">
                  <div className="py-2 flex justify-between gap-4">
                    <span className="text-muted-foreground shrink-0">
                      URL do Serviço:
                    </span>
                    <span className="font-mono text-xs select-all text-right overflow-hidden text-ellipsis break-all">
                      {layer.origin || properties?.wms?.url || "Geoserver URL"}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between gap-4">
                    <span className="text-muted-foreground shrink-0">
                      Nome da Camada (Layer):
                    </span>
                    <span className="font-mono text-xs select-all text-right">
                      {getLayerNameFromConfig(layer) || layer.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex sm:justify-between items-center mt-6 border-t pt-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={activeTab.value === "metadata" ? "default" : "outline"}
              onClick={() => (activeTab.value = "metadata")}
              size="sm"
            >
              <UrbisIcon
                name="info"
                className="mr-2 text-base"
                aria-hidden="true"
              />
              Metadata
            </Button>
            {isWmsLayer && (
              <Button
                variant={
                  activeTab.value === "integration" ? "default" : "outline"
                }
                onClick={() => (activeTab.value = "integration")}
                size="sm"
              >
                <UrbisIcon
                  name="link"
                  className="mr-2 text-base"
                  aria-hidden="true"
                />
                Integração SIG
              </Button>
            )}
            <Button
              variant={activeTab.value === "layer" ? "default" : "outline"}
              onClick={() => (activeTab.value = "layer")}
              size="sm"
            >
              <UrbisIcon
                name="layers"
                className="mr-2 text-base"
                aria-hidden="true"
              />
              Configuração da Camada
            </Button>
          </div>
          <Button variant="ghost" onClick={() => onOpenChange(false)} size="sm">
            <UrbisIcon
              name="close"
              className="mr-2 text-base"
              aria-hidden="true"
            />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
