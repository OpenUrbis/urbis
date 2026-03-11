import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  MouseSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Button, Textarea } from "@open-urbis/map-ui";
import * as Popover from "@radix-ui/react-popover";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Database,
  Download,
  Eye,
  Upload,
  Map as MapIcon,
  Loader2,
  X
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { ITemplate } from "../types/templates-type";
import { BuilderProvider, useBuilder } from "./BuilderContext";
import { ComponentPalette } from "./components/ComponentPalette";
import { ConfigPanel } from "./components/ConfigPanel";
import { RenderLayer } from "./components/RenderLayer";
import { cn } from "@/lib/utils";
import { IBuilderTemplateConfig } from "./types";
import { BUILDER_TEMPLATES } from "./registry";
import { useToast } from "@/hooks/useToast";

// Helper to find a node by ID
const findNode = (root: ITemplate | ITemplate[], id: string): ITemplate | null => {
  if (Array.isArray(root)) {
    for (const child of root) {
      const found = findNode(child, id);
      if (found) return found;
    }
    return null;
  }

  if (root.id === id) return root;
  
  const config = BUILDER_TEMPLATES.find((t) => t.name === root.type);
  const childrenProp = config?.childrenProp || "templates";
  
  // @ts-ignore
  if (root[childrenProp] && Array.isArray(root[childrenProp])) {
    // @ts-ignore
    for (const child of root[childrenProp]) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  
  return null;
};

interface ViewTemplateBuilderProps {
  initialTemplate?: ITemplate[];
  onSave?: (template: ITemplate[]) => void;
  onLoad?: (template: ITemplate[]) => void;
  onChange?: (template: ITemplate[]) => void;
  initialGeoUrl?: string;
  initialGeoLayer?: string;
  initialMockData?: any;
  title?: string;
  subtitle?: string;
  standalone?: boolean;
}

const DEFAULT_TEMPLATE: ITemplate[] = [];

const BuilderHeader = ({
  onSave,
  onLoad,
  initialGeoUrl,
  initialGeoLayer,
  title = "Editor de ViewTemplate",
  subtitle,
  standalone = true,
}: {
  onSave?: (t: ITemplate[]) => void;
  onLoad?: (t: ITemplate[]) => void;
  initialGeoUrl?: string;
  initialGeoLayer?: string;
  title?: string;
  subtitle?: string;
  standalone?: boolean;
}) => {
  const { template, setTemplate, mockData, setMockData } = useBuilder();
  const [jsonInput, setJsonInput] = useState("");
  const [dataInput, setDataInput] = useState("");

  // GeoServer Import State
  const [geoUrl, setGeoUrl] = useState(
    initialGeoUrl || "https://geoserver.slui.dev/geoserver/slui/ows",
  );
  const [geoLayers, setGeoLayers] = useState<{ name: string; title: string }[]>(
    initialGeoLayer ? [{ name: initialGeoLayer, title: initialGeoLayer }] : [],
  );
  const [selectedGeoLayer, setSelectedGeoLayer] = useState(initialGeoLayer || "");
  const [isFetchingGeo, setIsFetchingGeo] = useState(false);
  const [isImportingGeo, setIsImportingGeo] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const handleFetchGeoCapabilities = async () => {
    if (!geoUrl) return;
    setIsFetchingGeo(true);
    setGeoError("");
    setGeoLayers([]);

    try {
      let baseUrl = geoUrl;
      try {
        const urlObj = new URL(geoUrl);
        baseUrl = `${urlObj.origin}${urlObj.pathname}`;
      } catch (e) {
        // use as is
      }

      const environment = import.meta.env.VITE_API_URL || "/api";
      const response = await axios.get(`${environment}/maps/proxy`, {
        params: {
          url: baseUrl,
          service: "WMS",
          version: "1.3.0",
          request: "GetCapabilities",
        },
      });

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data, "text/xml");

      const extractedLayers: { name: string; title: string }[] = [];
      const layerNodes = xmlDoc.getElementsByTagName("Layer");

      for (let i = 0; i < layerNodes.length; i++) {
        const node = layerNodes[i];
        const nameNode = node.getElementsByTagName("Name")[0];
        const titleNode = node.getElementsByTagName("Title")[0];

        if (nameNode && titleNode) {
          const name = nameNode.textContent || "";
          const title = titleNode.textContent || "";
          if (name && !extractedLayers.some((l) => l.name === name)) {
            extractedLayers.push({ name, title });
          }
        }
      }

      if (extractedLayers.length === 0) {
        setGeoError("Nenhuma camada encontrada.");
      } else {
        setGeoLayers(extractedLayers);
      }
    } catch (e) {
      console.error(e);
      setGeoError("Erro ao buscar capacidades.");
    } finally {
      setIsFetchingGeo(false);
    }
  };

  const handleImportGeoProperties = async () => {
    if (!geoUrl || !selectedGeoLayer) return;
    setIsImportingGeo(true);
    setGeoError("");

    try {
      let baseUrl = geoUrl;
      try {
        const urlObj = new URL(geoUrl);
        baseUrl = `${urlObj.origin}${urlObj.pathname}`;
      } catch (e) {
        // use as is
      }

      const environment = import.meta.env.VITE_API_URL || "/api";
      const response = await axios.get(`${environment}/maps/proxy`, {
        params: {
          url: baseUrl,
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: selectedGeoLayer,
          maxFeatures: 1,
          outputFormat: "application/json",
        },
      });

      if (
        response.data &&
        response.data.features &&
        response.data.features.length > 0
      ) {
        const feature = response.data.features[0];
        setMockData(feature.properties || {});
        alert("Propriedades importadas com sucesso!");
      } else {
        setGeoError("Nenhuma feição encontrada na camada.");
      }
    } catch (e) {
      console.error(e);
      setGeoError("Erro ao buscar dados da camada.");
    } finally {
      setIsImportingGeo(false);
    }
  };

  useEffect(() => {
    setDataInput(JSON.stringify(mockData, null, 2));
  }, [mockData]);

  const handleImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);

      const addIds = (item: any, pId?: string): ITemplate => {
        const newItem = { ...item, id: item.id || crypto.randomUUID() };

        if (pId) {
          const props = (newItem.properties || {}) as any;
          newItem.properties = { ...props, parentId: pId };
        }

        if (newItem.templates && Array.isArray(newItem.templates)) {
          newItem.templates = newItem.templates.map((child: any) =>
            addIds(child, newItem.id),
          );
        }
        if (newItem.polygonTemplate && Array.isArray(newItem.polygonTemplate)) {
          newItem.polygonTemplate = newItem.polygonTemplate.map((child: any) =>
            addIds(child, newItem.id),
          );
        }
        return newItem;
      };

      let importedTemplate: ITemplate[];
      if (Array.isArray(parsed)) {
        importedTemplate = parsed.map((item) => addIds(item));
      } else {
        importedTemplate = [addIds(parsed)];
      }

      setTemplate(importedTemplate);
      if (onLoad) onLoad(importedTemplate);
    } catch (e) {
      alert("JSON inválido");
    }
  };

  const handleUpdateData = () => {
    try {
      const parsed = JSON.parse(dataInput);
      setMockData(parsed);
    } catch (e) {
      alert("JSON de dados inválido");
    }
  };

  const handlePreview = () => {
    const dataToSave = {
      template,
      mockData,
    };
    localStorage.setItem(
      "view-template-preview-data",
      JSON.stringify(dataToSave),
    );
    setPreviewModalOpen(true);
  };

  return (
    <header className={cn("flex items-center p-4 border-b bg-background shrink-0", standalone ? "justify-between" : "justify-end")}>
      {standalone && (
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Popover.Root>
          <Popover.Trigger asChild>
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <Database className="h-4 w-4" />
              Dados
            </Button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="w-96 bg-popover p-4 rounded-md shadow-lg border z-50"
              sideOffset={5}
            >
              <div className="space-y-2">
                <h4 className="font-medium text-sm">
                  Dados Mock (Variável &apos;data&apos;)
                </h4>
                <Textarea
                  value={dataInput}
                  onChange={(e) => setDataInput(e.target.value)}
                  placeholder="{ properties: { ... } }"
                  className="font-mono text-xs h-64"
                />
                <Button type="button" onClick={handleUpdateData} size="sm" className="w-full">
                  Atualizar Visualização
                </Button>
              </div>
              <Popover.Arrow className="fill-popover" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        <div className="w-px h-6 bg-border mx-2" />

        <Popover.Root>
          <Popover.Trigger asChild>
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <MapIcon className="h-4 w-4" />
              GeoServer
            </Button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="w-80 bg-popover p-4 rounded-md shadow-lg border z-50 flex flex-col gap-3"
              sideOffset={5}
            >
              <div>
                <h4 className="font-medium text-sm mb-1">URL do GeoServer</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={geoUrl}
                    onChange={(e) => setGeoUrl(e.target.value)}
                    placeholder="https://geoserver.exemplo.com/wms"
                    className="flex-1 px-2 py-1 text-xs border rounded bg-background"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleFetchGeoCapabilities}
                    disabled={isFetchingGeo || !geoUrl}
                  >
                    {isFetchingGeo ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Buscar"
                    )}
                  </Button>
                </div>
              </div>

              {geoError && (
                <p className="text-xs text-destructive">{geoError}</p>
              )}

              {geoLayers.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Camada</h4>
                  <select
                    value={selectedGeoLayer}
                    onChange={(e) => setSelectedGeoLayer(e.target.value)}
                    className="w-full px-2 py-1 text-xs border rounded bg-background mb-2"
                  >
                    <option value="">Selecione uma camada...</option>
                    {geoLayers.map((layer) => (
                      <option key={layer.name} value={layer.name}>
                        {layer.title}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    onClick={handleImportGeoProperties}
                    disabled={isImportingGeo || !selectedGeoLayer}
                  >
                    {isImportingGeo ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    ) : null}
                    Importar Propriedades de Exemplo
                  </Button>
                </div>
              )}

              <Popover.Arrow className="fill-popover" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {standalone && (
          <>
            <Popover.Root>
              <Popover.Trigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Importar
                </Button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  className="w-80 bg-popover p-4 rounded-md shadow-lg border z-50"
                  sideOffset={5}
                >
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Importar Template JSON</h4>
                    <Textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder="Cole o JSON aqui..."
                      className="font-mono text-xs h-32"
                    />
                    <Button type="button" onClick={handleImport} size="sm" className="w-full">
                      Carregar
                    </Button>
                  </div>
                  <Popover.Arrow className="fill-popover" />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            <Button type="button" size="sm" className="gap-2" onClick={() => onSave?.(template)}>
              <Download className="h-4 w-4" />
              Exportar
            </Button>

            <div className="w-px h-6 bg-border mx-2" />
          </>
        )}

        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="gap-2"
          onClick={handlePreview}
        >
          <Eye className="h-4 w-4" />
          Pré-visualizar
        </Button>
      </div>

      <Dialog.Root open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[90vw] max-w-4xl h-[80vh] translate-x-[-50%] translate-y-[-50%] border bg-background p-0 shadow-lg sm:rounded-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <Dialog.Title className="text-lg font-semibold">Pré-visualização do Template</Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="rounded-full p-1.5 hover:bg-muted transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <div className="flex-1 bg-muted/30">
              {previewModalOpen && (
                <iframe 
                  src="/view-template/preview" 
                  className="w-full h-full border-none"
                  title="Preview"
                />
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  );
};

const ResizeHandle = ({
  onMouseDown,
}: {
  onMouseDown: (e: React.MouseEvent) => void;
}) => (
  <div
    className="w-1 hover:bg-primary/50 cursor-col-resize transition-colors bg-border shrink-0 z-10"
    onMouseDown={onMouseDown}
  />
);

const BuilderContent = ({
  onSave,
  onLoad,
  onChange,
  initialGeoUrl,
  initialGeoLayer,
  initialMockData,
  title,
  subtitle,
  standalone,
}: {
  onSave?: (t: ITemplate[]) => void;
  onLoad?: (t: ITemplate[]) => void;
  onChange?: (template: ITemplate[]) => void;
  initialGeoUrl?: string;
  initialGeoLayer?: string;
  initialMockData?: any;
  title?: string;
  subtitle?: string;
  standalone?: boolean;
}) => {
  const { template, addItem, moveItem, setMockData } = useBuilder();
  const { toastError } = useToast();

  useEffect(() => {
    if (initialMockData) {
      setMockData(initialMockData);
    }
  }, [initialMockData, setMockData]);

  useEffect(() => {
    if (onChange) {
      // Use stringified compare to only trigger onChange when actual data mutates
      // avoiding referential equality infinite loops with parent components
      onChange(template);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(template)]);
  const [activeDragItem, setActiveDragItem] =
    useState<IBuilderTemplateConfig | null>(null);

  // Resize state
  const [leftWidth, setLeftWidth] = useState(320);
  const [rightWidth, setRightWidth] = useState(256);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback(
    (direction: "left" | "right") => (mouseDownEvent: React.MouseEvent) => {
      mouseDownEvent.preventDefault();

      const startX = mouseDownEvent.clientX;
      const startWidth = direction === "left" ? leftWidth : rightWidth;

      const doDrag = (mouseMoveEvent: MouseEvent) => {
        if (direction === "left") {
          setLeftWidth(
            Math.max(
              200,
              Math.min(600, startWidth + mouseMoveEvent.clientX - startX),
            ),
          );
        } else {
          setRightWidth(
            Math.max(
              200,
              Math.min(600, startWidth - (mouseMoveEvent.clientX - startX)),
            ),
          );
        }
      };

      const stopDrag = () => {
        document.removeEventListener("mousemove", doDrag);
        document.removeEventListener("mouseup", stopDrag);
        document.body.style.cursor = "";
      };

      document.addEventListener("mousemove", doDrag);
      document.addEventListener("mouseup", stopDrag);
      document.body.style.cursor = "col-resize";
    },
    [leftWidth, rightWidth],
  );

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    const activeData = active.data.current as any;
    if (activeData?.type === "new-item") {
      setActiveDragItem(activeData.template);
    } else if (activeData?.type === "existing-item") {
      setActiveDragItem(activeData.template); // can use same state, just need an overlay
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const activeData = active.data.current as any;

    let targetParentType: string | null = null;
    let targetConfig: IBuilderTemplateConfig | null = null;

    if (over.id !== "root-droppable") {
      const targetNode = findNode(template, over.id as string);
      
      if (targetNode) {
         targetConfig = BUILDER_TEMPLATES.find((t) => t.name === targetNode.type) || null;
         
         // Se o target for wrapper, ele é o pai. Se for um componente normal, o pai do novo item será o mesmo do target
         if (targetConfig?.isWrapper || targetNode.type.includes("wrapper")) {
            targetParentType = targetNode.type;
         } else {
            // Find parent of the sibling
            const findParentOf = (items: ITemplate[], targetId: string, currentParentType: string | null): string | null => {
               for (const item of items) {
                  if (item.id === targetId) return currentParentType;
                  const config = BUILDER_TEMPLATES.find((t) => t.name === item.type);
                  const childrenProp = config?.childrenProp || "templates";
                  // @ts-ignore
                  if (item[childrenProp] && Array.isArray(item[childrenProp])) {
                      // @ts-ignore
                      const p = findParentOf(item[childrenProp], targetId, item.type);
                      if (p !== null) return p;
                  }
               }
               return null;
            };
            targetParentType = findParentOf(template, over.id as string, null);
            
            if (targetParentType) {
                targetConfig = BUILDER_TEMPLATES.find((t) => t.name === targetParentType) || null;
            } else {
                targetConfig = null; // if it goes to root
            }
         }
      }
    }

    const checkConstraints = (itemType: string, parentType: string | null): boolean => {
      const draggedConfig = BUILDER_TEMPLATES.find(t => t.name === itemType);
      
      if (!parentType) {
        if (draggedConfig?.validParents && draggedConfig.validParents.length > 0) {
           toastError(`Este componente só pode ser inserido dentro de um ${draggedConfig.validParents.join(" ou ")}.`);
           return false;
        }
        return true;
      }

      if (draggedConfig?.validParents && !draggedConfig.validParents.includes(parentType)) {
         toastError(`O componente '${draggedConfig.friendlyName || itemType}' não pode ser inserido em um '${targetConfig?.friendlyName || parentType}'. Ele requer: ${draggedConfig.validParents.join(", ")}`);
         return false;
      }

      if (targetConfig?.allowedChildren && !targetConfig.allowedChildren.includes(itemType)) {
         toastError(`O container '${targetConfig.friendlyName || parentType}' não aceita componentes do tipo '${draggedConfig?.friendlyName || itemType}'.`);
         return false;
      }

      return true;
    };

    if (activeData?.type === "new-item") {
      const templateConfig = activeData.template as IBuilderTemplateConfig;
      
      if (!checkConstraints(templateConfig.name, targetParentType)) {
        return;
      }

      const newItem: ITemplate = {
        type: templateConfig.name,
        templates: [],
        ...(templateConfig.defaultProps || {}),
      };

      if (over.id === "root-droppable") {
        addItem(null, newItem);
      } else {
        addItem(over.id as string, newItem);
      }
    } else if (activeData?.type === "existing-item") {
      const draggedTemplate = activeData.template as ITemplate;
      
      if (!checkConstraints(draggedTemplate.type, targetParentType)) {
        return;
      }

      moveItem(active.id as string, over.id as string);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground"
        ref={containerRef}
      >
        <BuilderHeader 
          onSave={onSave} 
          onLoad={onLoad} 
          initialGeoUrl={initialGeoUrl} 
          initialGeoLayer={initialGeoLayer} 
          title={title}
          subtitle={subtitle}
          standalone={standalone}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Configuration */}
          <div style={{ width: leftWidth }} className="shrink-0 flex flex-col overflow-y-auto">
            <ConfigPanel />
          </div>

          <ResizeHandle onMouseDown={startResizing("left")} />

          {/* Center: Preview/Canvas */}
          <div className="flex-1 relative overflow-y-auto flex flex-col">
            <RenderLayer />
          </div>

          <ResizeHandle onMouseDown={startResizing("right")} />

          {/* Right: Palette */}
          <div style={{ width: rightWidth }} className="shrink-0 flex flex-col overflow-y-auto">
            <ComponentPalette />
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeDragItem ? (
          <div className="p-2 bg-background border rounded shadow opacity-80 cursor-grabbing text-xs">
            {/* @ts-ignore */}
            {activeDragItem.friendlyName || activeDragItem.name || activeDragItem.type}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export const ViewTemplateBuilder = ({
  initialTemplate,
  onSave,
  onLoad,
  onChange,
  initialGeoUrl,
  initialGeoLayer,
  initialMockData,
  title,
  subtitle,
  standalone,
}: ViewTemplateBuilderProps) => {
  return (
    <BuilderProvider initialTemplate={initialTemplate || DEFAULT_TEMPLATE}>
      <BuilderContent 
        onSave={onSave} 
        onLoad={onLoad} 
        onChange={onChange}
        initialGeoUrl={initialGeoUrl}
        initialGeoLayer={initialGeoLayer}
        initialMockData={initialMockData}
        title={title}
        subtitle={subtitle}
        standalone={standalone}
      />
    </BuilderProvider>
  );
};
