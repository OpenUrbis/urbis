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
import { Database, Download, Eye, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ITemplate } from "../types/templates-type";
import { BuilderProvider, useBuilder } from "./BuilderContext";
import { ComponentPalette } from "./components/ComponentPalette";
import { ConfigPanel } from "./components/ConfigPanel";
import { RenderLayer } from "./components/RenderLayer";
import { IBuilderTemplateConfig } from "./types";

interface ViewTemplateBuilderProps {
  initialTemplate?: ITemplate[];
  onSave?: (template: ITemplate[]) => void;
  onLoad?: (template: ITemplate[]) => void;
}

const DEFAULT_TEMPLATE: ITemplate[] = [];

const BuilderHeader = ({
  onSave,
  onLoad,
}: {
  onSave?: (t: ITemplate[]) => void;
  onLoad?: (t: ITemplate[]) => void;
}) => {
  const { template, setTemplate, mockData, setMockData } = useBuilder();
  const [jsonInput, setJsonInput] = useState("");
  const [dataInput, setDataInput] = useState("");

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
    window.open("/view-template/preview", "_blank");
  };

  return (
    <header className="flex items-center justify-between p-4 border-b bg-background shrink-0">
      <h1 className="text-xl font-bold">Editor de ViewTemplate</h1>
      <div className="flex items-center gap-2">
        <Popover.Root>
          <Popover.Trigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
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
                <Button onClick={handleUpdateData} size="sm" className="w-full">
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
            <Button variant="outline" size="sm" className="gap-2">
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
                <Button onClick={handleImport} size="sm" className="w-full">
                  Carregar
                </Button>
              </div>
              <Popover.Arrow className="fill-popover" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        <Button size="sm" className="gap-2" onClick={() => onSave?.(template)}>
          <Download className="h-4 w-4" />
          Exportar
        </Button>

        <div className="w-px h-6 bg-border mx-2" />

        <Button size="sm" variant="secondary" className="gap-2" onClick={handlePreview}>
          <Eye className="h-4 w-4" />
          Visualizar
        </Button>
      </div>
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
}: {
  onSave?: (t: ITemplate[]) => void;
  onLoad?: (t: ITemplate[]) => void;
}) => {
  const { addItem } = useBuilder();
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
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const activeData = active.data.current as any;

    if (activeData?.type === "new-item") {
      const templateConfig = activeData.template as IBuilderTemplateConfig;
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
        <BuilderHeader onSave={onSave} onLoad={onLoad} />

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Configuration */}
          <div style={{ width: leftWidth }} className="shrink-0 flex flex-col">
            <ConfigPanel />
          </div>

          <ResizeHandle onMouseDown={startResizing("left")} />

          {/* Center: Preview/Canvas */}
          <div className="flex-1 relative overflow-hidden flex flex-col">
            <RenderLayer />
          </div>

          <ResizeHandle onMouseDown={startResizing("right")} />

          {/* Right: Palette */}
          <div style={{ width: rightWidth }} className="shrink-0 flex flex-col">
            <ComponentPalette />
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeDragItem ? (
          <div className="p-2 bg-background border rounded shadow opacity-80 cursor-grabbing">
            {activeDragItem.friendlyName || activeDragItem.name}
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
}: ViewTemplateBuilderProps) => {
  return (
    <BuilderProvider initialTemplate={initialTemplate || DEFAULT_TEMPLATE}>
      <BuilderContent onSave={onSave} onLoad={onLoad} />
    </BuilderProvider>
  );
};
