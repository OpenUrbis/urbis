import { Button, ScrollArea } from "@open-urbis/map-ui";
import { Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { ITemplate } from "../../types/templates-type";
import { useBuilder } from "../BuilderContext";
import { BUILDER_TEMPLATES } from "../registry";

// Helper to find a node by ID
const findNode = (
  root: ITemplate | ITemplate[],
  id: string,
): ITemplate | null => {
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

export const ConfigPanel = () => {
  const { selectedId, template, updateItem, removeItem, highlightConfig } =
    useBuilder();
  const [isHighlighting, setIsHighlighting] = useState(false);

  useEffect(() => {
    if (highlightConfig > 0) {
      setIsHighlighting(true);
      const timer = setTimeout(() => setIsHighlighting(false), 600);
      return () => clearTimeout(timer);
    }

    return () => {};
  }, [highlightConfig]);

  // @ts-ignore
  const selectedNode = selectedId ? findNode(template, selectedId) : null;
  const builderConfig = selectedNode
    ? BUILDER_TEMPLATES.find((t) => t.name === selectedNode.type)
    : null;

  const ConfigComponent = builderConfig?.configComponent;

  return (
    <div
      className={`flex h-full flex-col border-r bg-background transition-colors duration-300 ${isHighlighting ? "bg-primary/20 ring-2 ring-inset ring-primary" : ""}`}
    >
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Configuração</h2>
      </div>
      <ScrollArea className="flex-1 p-4">
        {selectedNode ? (
          <div>
            <div className="mb-4 pb-4 border-b flex justify-between items-start">
              <div>
                <h3 className="font-medium">
                  {builderConfig?.friendlyName || selectedNode.type}
                </h3>
                <p className="text-xs text-muted-foreground">
                  ID: {selectedNode.id}
                </p>
              </div>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => removeItem(selectedNode.id!)}
                title="Remover componente"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>

            {ConfigComponent ? (
              <ConfigComponent
                key={selectedNode.id}
                template={selectedNode}
                onChange={(newTemplate) =>
                  updateItem(selectedNode.id!, newTemplate)
                }
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Não há configurações disponíveis para este componente.
              </p>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center mt-10">
            Selecione um componente para editar
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
