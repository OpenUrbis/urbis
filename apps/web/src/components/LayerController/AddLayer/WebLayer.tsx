// @ts-nocheck
import { useSignal, useComputed } from "@preact/signals";
import { createElement } from "react";
import ReactJson from "react-json-view";
import { Button } from "@open-urbis/map-ui";
import { Input } from "@open-urbis/map-ui";
import { Label } from "@open-urbis/map-ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@open-urbis/map-ui";
import { useMapContext } from "../../../hooks/useMapContext";
import { IGetConfigLayerSchema, IGetConfigLayerSchemaTypeEnum } from "../../../types/fetch-map-config-type";
import axios from "axios";
import { flattenLayerGroups } from "../../../utils/layer-utils";

interface WebLayerProps {
  onBack: () => void;
  onClose: () => void;
}

type ServiceType = "WMS" | "WFS";

export const WebLayer = ({ onBack, onClose }: WebLayerProps) => {
  const { layerSchemas, layerGroups } = useMapContext();
  const url = useSignal("");
  const serviceType = useSignal<ServiceType>("WMS");
  const loading = useSignal(false);
  const error = useSignal("");
  const layers = useSignal<{ name: string, title: string }[]>([]);
  const selectedLayer = useSignal("");
  const selectedGroupId = useSignal<string>("");
  const pendingSchema = useSignal<IGetConfigLayerSchema | null>(null);

  const flatGroups = useComputed(() => flattenLayerGroups(layerGroups.value));

  const getBaseUrl = (inputUrl: string) => {
    try {
      const urlObj = new URL(inputUrl);
      return `${urlObj.origin}${urlObj.pathname}`;
    } catch (e) {
      return inputUrl;
    }
  };

  const handleFetchCapabilities = async () => {
    if (!url.value) return;
    loading.value = true;
    error.value = "";
    layers.value = [];

    try {
      const baseUrl = getBaseUrl(url.value);
      const environment = import.meta.env.VITE_API_URL || "/api";
      
      let params = "";
      if (serviceType.value === "WMS") {
        params = `service=WMS&version=1.3.0&request=GetCapabilities`;
      } else {
        params = `service=WFS&version=1.1.0&request=GetCapabilities`;
      }

      const response = await axios.get(`${environment}/maps/proxy`, {
        params: {
          url: baseUrl,
          service: serviceType.value,
          version: serviceType.value === "WMS" ? "1.3.0" : "1.1.0",
          request: "GetCapabilities"
        }
      });

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data, "text/xml");
      
      const extractedLayers: { name: string, title: string }[] = [];
      
      if (serviceType.value === "WMS") {
        const layerNodes = xmlDoc.getElementsByTagName("Layer");
        for (let i = 0; i < layerNodes.length; i++) {
          const node = layerNodes[i];
          const nameNode = node.getElementsByTagName("Name")[0];
          const titleNode = node.getElementsByTagName("Title")[0];
          
          if (nameNode && titleNode) {
             const name = nameNode.textContent || "";
             const title = titleNode.textContent || "";
             
             if (name && !extractedLayers.some(l => l.name === name)) {
                 extractedLayers.push({ name, title });
             }
          }
        }
      } else {
        const featureTypeNodes = xmlDoc.getElementsByTagName("FeatureType");
        for (let i = 0; i < featureTypeNodes.length; i++) {
          const node = featureTypeNodes[i];
          const nameNode = node.getElementsByTagName("Name")[0];
          const titleNode = node.getElementsByTagName("Title")[0];
          
          if (nameNode && titleNode) {
             const name = nameNode.textContent || "";
             const title = titleNode.textContent || "";
             
             if (name && !extractedLayers.some(l => l.name === name)) {
                 extractedLayers.push({ name, title });
             }
          }
        }
      }

      if (extractedLayers.length === 0) {
        error.value = `Nenhuma camada ${serviceType.value} encontrada ou resposta inválida.`;
      } else {
        layers.value = extractedLayers;
      }

    } catch (e) {
      console.error(`${serviceType.value} Error`, e);
      error.value = `Falha ao buscar capacidades. Verifique a URL e se é um serviço ${serviceType.value} válido.`;
    } finally {
      loading.value = false;
    }
  };

  const handlePrepare = () => {
    if (!selectedLayer.value || !selectedGroupId.value) return;

    const layerInfo = layers.value.find(l => l.name === selectedLayer.value);
    const baseUrl = getBaseUrl(url.value);
    
    let newLayer: IGetConfigLayerSchema;

    if (serviceType.value === "WMS") {
        newLayer = {
          id: `wms-${Date.now()}`,
          name: layerInfo?.title || selectedLayer.value,
          origin: `${baseUrl}`,
          isActive: true,
          type: IGetConfigLayerSchemaTypeEnum.CustomWMSLayer,
          isVisible: true,
          groupId: selectedGroupId.value,
          colors: [],
          clickAction: { action: "info" as any, params: {} },
          properties: {
             metadata: { 
                description: "Camada WMS adicionada pelo usuário",
                links: [{ label: "URL do Serviço", url: url.value }]
             },
             wms: {
                url: baseUrl,
                layers: selectedLayer.value,
                version: "1.3.0",
                transparent: true,
                format: "image/png"
             }
          }
        };
    } else {
        // WFS
        newLayer = {
          id: `wfs-${Date.now()}`,
          name: layerInfo?.title || selectedLayer.value,
          origin: `${baseUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=${encodeURIComponent(selectedLayer.value)}&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326`,
          isActive: true,
          type: IGetConfigLayerSchemaTypeEnum.GeoJsonLayer,
          isVisible: true,
          groupId: selectedGroupId.value,
          colors: [
            {
              id: Date.now(),
              color: [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), 200],
              pattern: "full",
              label: "padrão",
              value: "",
              layerSchemaId: `wfs-${Date.now()}` 
            }
          ],
          clickAction: { action: "SelectFeature" as any, params: {} },
          properties: {
            filled: true,
            stroked: true,
            pickable: true,
            getLineWidth: 2,
            autoHighlight: true,
            highlightColor: [255, 255, 0, 150]
          }
        };
        newLayer.colors[0].layerSchemaId = newLayer.id;
    }

    pendingSchema.value = newLayer;
  };

  const handleConfirm = () => {
    if (pendingSchema.value) {
        layerSchemas.value = [...layerSchemas.value, pendingSchema.value];
        onClose();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <span className="material-symbols-outlined">arrow_back</span>
        </Button>
        <h3 className="font-semibold text-lg">Adicionar Camada Web</h3>
      </div>

      {!pendingSchema.value ? (
        <div className="grid w-full gap-4">
            
            <div className="grid gap-1.5">
                <Label>Tipo de Serviço</Label>
                {/* @ts-ignore */}
                <Select 
                    value={serviceType.value} 
                    onValueChange={(val) => {
                        serviceType.value = val as ServiceType;
                        layers.value = []; 
                        selectedLayer.value = "";
                        error.value = "";
                    }}
                >
                    {/* @ts-ignore */}
                    <SelectTrigger>
                        {/* @ts-ignore */}
                        <SelectValue placeholder="Selecione o tipo de serviço" />
                    </SelectTrigger>
                    {/* @ts-ignore */}
                    <SelectContent>
                        {/* @ts-ignore */}
                        <SelectItem value="WMS">WMS (Web Map Service)</SelectItem>
                        {/* @ts-ignore */}
                        <SelectItem value="WFS">WFS (Web Feature Service)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {serviceType.value === "WFS" && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 text-sm" role="alert">
                    <p className="font-bold">Atenção</p>
                    <p>O serviço WFS carrega todos os dados vetoriais no navegador, o que pode causar lentidão ou travamentos em camadas com muitos elementos. Use com cautela ou prefira WMS para visualização.</p>
                </div>
            )}

            <div className="grid gap-1.5">
                <Label htmlFor="url">URL do Serviço</Label>
                <div className="flex gap-2">
                    <Input 
                        id="url" 
                        placeholder={serviceType.value === "WMS" ? "https://geoserver.exemplo.com/geoserver/wms" : "https://geoserver.exemplo.com/geoserver/ows"}
                        value={url.value}
                        onInput={(e) => (url.value = (e.currentTarget as HTMLInputElement).value)}
                    />
                    <Button onClick={handleFetchCapabilities} disabled={loading.value || !url.value}>
                        {loading.value ? "Buscando..." : "Buscar"}
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                    Insira a URL base do seu serviço {serviceType.value}.
                </p>
            </div>

            {layers.value.length > 0 && (
                <>
                    <div className="grid gap-1.5 animate-in fade-in slide-in-from-top-2">
                        <Label>Selecionar Camada</Label>
                        <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-1">
                            {layers.value.map(l => (
                                <div 
                                    key={l.name}
                                    className={`p-2 rounded cursor-pointer text-sm ${selectedLayer.value === l.name ? "bg-blue-100 text-blue-900" : "hover:bg-muted"}`}
                                    onClick={() => (selectedLayer.value = l.name)}
                                >
                                    <div className="font-medium">{l.title}</div>
                                    <div className="text-xs text-muted-foreground">{l.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-1.5 animate-in fade-in slide-in-from-top-2">
                        <Label>Selecionar Grupo</Label>
                        {/* @ts-ignore */}
                        <Select 
                            value={selectedGroupId.value} 
                            onValueChange={(val) => (selectedGroupId.value = val)}
                        >
                            {/* @ts-ignore */}
                            <SelectTrigger>
                                {/* @ts-ignore */}
                                <SelectValue placeholder="Escolha um grupo para esta camada" />
                            </SelectTrigger>
                            {/* @ts-ignore */}
                            <SelectContent>
                                {flatGroups.value.map(group => (
                                    // @ts-ignore
                                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </>
            )}
        </div>
      ) : (
          <div className="space-y-2 animate-in fade-in slide-in-from-right-4 w-full relative">
              <Label>Revisar Configuração</Label>
              <div className="max-h-[400px] w-full overflow-auto border rounded-md bg-muted/20">
                   <div className="min-w-full w-fit p-4">
                   {createElement(ReactJson, {
                     collapsed: 2,
                     collapseStringsAfterLength: 60,
                     src: pendingSchema.value,
                     style: { backgroundColor: 'transparent', wordBreak: 'break-all' },
                     name: false,
                     displayDataTypes: false
                   })}
                   </div>
              </div>
          </div>
      )}

      {error.value && (
        <div className="text-red-500 text-sm">{error.value}</div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        {!pendingSchema.value ? (
            <Button onClick={handlePrepare} disabled={!selectedLayer.value || !selectedGroupId.value}>
                Próximo
            </Button>
        ) : (
            <>
                <Button variant="secondary" onClick={() => (pendingSchema.value = null)}>Voltar</Button>
                <Button onClick={handleConfirm}>Adicionar ao Mapa</Button>
            </>
        )}
      </div>
    </div>
  );
};
