// RenderLayer.tsx - Handles the visual rendering of the builder canvas
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@open-urbis/map-ui";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Copy,
  Edit,
  Plus,
  Trash,
  X,
} from "lucide-react";
import { ContextMenu } from "radix-ui";
import { useMemo, useState } from "react";
import { TemplateRegistryProvider } from "../../TemplateRegistryContext";
import {
  ITemplate,
  ITemplateProps,
  ITemplatesDeclaration,
} from "../../types/templates-type";
import { ViewTemplate } from "../../index";
import { ViewTemplateEngine } from "../../ViewTemplateEngine";
import { useBuilder } from "../BuilderContext";
import { BUILDER_TEMPLATES } from "../registry";
import { IBuilderTemplateConfig } from "../types";
import { ResizeOverlay } from "./ResizeOverlay";

// Helper to find template
const findTemplateRecursive = (
  root: ITemplate | ITemplate[],
  id: string,
): ITemplate | null => {
  if (Array.isArray(root)) {
    for (const t of root) {
      const found = findTemplateRecursive(t, id);
      if (found) return found;
    }
    return null;
  }

  if (root.id === id) return root;
  if (root.templates) {
    for (const t of root.templates) {
      const found = findTemplateRecursive(t, id);
      if (found) return found;
    }
  }
  return null;
};

const RootAddButton = () => {
  const { addItem } = useBuilder();

  const allowedTemplates = useMemo(() => {
    return BUILDER_TEMPLATES.filter((t) => {
      // Respect hiddenInPalette
      if (t.hiddenInPalette) return false;

      // Filter out items that require specific parents (unless they allow root, which we assume undefined validParents means allowed everywhere or we'd need explicit root support)
      // For now, if validParents is set, we exclude it from root.
      if (t.validParents && t.validParents.length > 0) return false;

      return true;
    });
  }, []);

  const handleAddItem = (templateConfig: any) => {
    const newItem: ITemplate = {
      type: templateConfig.name,
      templates: [],
      ...(templateConfig.defaultProps || {}),
    };
    addItem(null, newItem);
  };

  return (
    <div className="w-full flex justify-center py-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 border-dashed">
            <Plus className="h-4 w-4" />
            Adicionar Componente
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          className="max-h-60 overflow-y-auto"
        >
          {allowedTemplates.map((t) => (
            <DropdownMenuItem key={t.name} onClick={() => handleAddItem(t)}>
              {t.friendlyName || t.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// Internal component for the Add Button injected into templates
const AddButtonComponent = (props: ITemplateProps) => {
  const { addItem } = useBuilder();
  const { template } = props;
  const { parentId, allowedChildren, parentType, isEmpty } =
    template.properties as any;

  const parentConfig = useMemo(() => {
    return BUILDER_TEMPLATES.find((t) => t.name === parentType);
  }, [parentType]);

  const allowedTemplates = useMemo(() => {
    return BUILDER_TEMPLATES.filter((t) => {
      // Check parent constraint (allowedChildren)
      if (allowedChildren && !allowedChildren.includes(t.name)) return false;

      // Check child constraint (validParents)
      if (t.validParents && parentType && !t.validParents.includes(parentType))
        return false;

      return true;
    });
  }, [allowedChildren, parentType]);

  const handleAddItem = (templateConfig: any) => {
    const newItem: ITemplate = {
      type: templateConfig.name,
      templates: [],
      ...(templateConfig.defaultProps || {}),
    };
    addItem(parentId || null, newItem);
  };

  if (parentConfig?.customAddButton) {
    const CustomButton = parentConfig.customAddButton;
    return <CustomButton {...props} />;
  }

  if (isEmpty) {
    // Empty state - large placeholder
    if (allowedTemplates.length === 1) {
      const t = allowedTemplates[0];

      return (
        <div
          className="w-full h-full min-h-[120px] flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/50 hover:bg-muted/30 rounded-lg transition-all cursor-pointer p-4 group pointer-events-auto"
          style={{ pointerEvents: "auto" }}
          onClick={(e) => {
            e.stopPropagation();
            handleAddItem(t);
          }}
        >
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-background group-hover:shadow-sm transition-all mb-2">
            <Plus className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
          </div>
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
            {`Adicionar ${t.friendlyName || t.name}`}
          </span>
        </div>
      );
    }

    // Multiple options - Placeholder with Dropdown behavior
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="w-full h-full min-h-[120px] flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/50 hover:bg-muted/30 rounded-lg transition-all cursor-pointer p-4 group outline-none focus:ring-2 focus:ring-primary/50 pointer-events-auto"
            style={{ pointerEvents: "auto" }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-background group-hover:shadow-sm transition-all mb-2">
              <Plus className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
            </div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
              Adicionar Componente
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          className="max-h-60 overflow-y-auto"
        >
          {allowedTemplates.map((t) => (
            <DropdownMenuItem
              key={t.name}
              onClick={(e) => {
                e.stopPropagation();
                handleAddItem(t);
              }}
            >
              {t.friendlyName || t.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Not empty - small button at the end
  if (allowedTemplates.length === 1) {
    const t = allowedTemplates[0];

    return (
      <div
        className="flex justify-center p-2 opacity-50 hover:opacity-100 transition-opacity border-2 border-dashed border-transparent hover:border-muted-foreground/20 rounded-md m-1 w-full pointer-events-auto"
        style={{ pointerEvents: "auto" }}
        onClick={(e) => {
          e.stopPropagation();
          handleAddItem(t);
        }}
      >
        <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
          <Plus className="h-3 w-3" />
          {`Adicionar ${t.friendlyName || t.name}`}
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex justify-center p-2 opacity-50 hover:opacity-100 transition-opacity border-2 border-dashed border-transparent hover:border-muted-foreground/20 rounded-md m-1 w-full pointer-events-auto"
      style={{ pointerEvents: "auto" }}
      onClick={(e) => e.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
            <Plus className="h-3 w-3" />
            Adicionar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          className="max-h-60 overflow-y-auto"
        >
          {allowedTemplates.map((t) => (
            <DropdownMenuItem
              key={t.name}
              onClick={(e) => {
                e.stopPropagation();
                handleAddItem(t);
              }}
            >
              {t.friendlyName || t.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// Wrapper for each component in the builder - Handles Context Menu and Selection
const BuilderComponentWrapper = ({
  originalTemplate,
  props,
}: {
  originalTemplate: ITemplatesDeclaration;
  props: ITemplateProps;
}) => {
  const {
    setSelectedId,
    selectedId,
    removeItem,
    triggerHighlightConfig,
    addItem,
    template: rootTemplate,
    updateItem,
  } = useBuilder();
  // eslint-disable-next-line react/prop-types
  const { template } = props;
  const isSelected = selectedId === template!.id;
  const [node, setNode] = useState<HTMLElement | null>(null);

  // Make it droppable if it's a wrapper
  const builderConfig = originalTemplate as IBuilderTemplateConfig;
  const isWrapper =
    builderConfig.isWrapper || originalTemplate.name.includes("wrapper"); // heuristic fallback

  // Grid specific logic
  const isGridColumn = originalTemplate.name === "wrapper-grid-column";
  const parentId = (template?.properties as any)?.parentId;

  const gridParent = useMemo(() => {
    if (!isGridColumn || !parentId || !rootTemplate) return null;
    return findTemplateRecursive(rootTemplate, parentId);
  }, [isGridColumn, parentId, rootTemplate]);

  const handleGridAction = (action: string) => {
    if (!gridParent) return;

    const columns = (gridParent.properties as any).columns || ["1fr"];
    const templates = gridParent.templates || [];
    const numCols = columns.length;

    // Find index of current cell
    const cellIndex = templates.findIndex((t) => t.id === template!.id);
    if (cellIndex === -1) return;

    const currentRow = Math.floor(cellIndex / numCols);
    const currentCol = cellIndex % numCols;

    const updateGrid = (newColumns: number[], newTemplates: ITemplate[]) => {
      const properties = (gridParent.properties || {}) as any;
      updateItem(gridParent.id!, {
        templates: newTemplates,
        properties: {
          ...properties,
          columns: newColumns,
        },
      });
    };

    if (action === "add-row-above" || action === "add-row-below") {
      const insertRowIndex =
        action === "add-row-above" ? currentRow : currentRow + 1;
      const insertIndex = insertRowIndex * numCols;

      const newCells: ITemplate[] = [];
      for (let i = 0; i < numCols; i++) {
        newCells.push({
          type: "wrapper-grid-column",
          templates: [],
          id: crypto.randomUUID(),
          properties: {
            parentId: gridParent.id,
          },
        });
      }

      const newTemplates = [...templates];
      newTemplates.splice(insertIndex, 0, ...newCells);
      updateGrid(columns, newTemplates);
    } else if (action === "add-col-left" || action === "add-col-right") {
      if (numCols >= 12) return; // Max columns check

      const insertColIndex =
        action === "add-col-left" ? currentCol : currentCol + 1;

      // Calc new columns
      const newCount = numCols + 1;
      const baseSpan = Math.floor(12 / newCount);
      const remainder = 12 % newCount;
      const newColumns = Array(newCount).fill(baseSpan);
      for (let i = 0; i < remainder; i++) newColumns[i]++;

      // Insert cells
      const newTemplates = [...templates];
      const numRows = Math.ceil(templates.length / numCols);

      for (let r = numRows - 1; r >= 0; r--) {
        const index = r * numCols + insertColIndex;
        newTemplates.splice(index, 0, {
          type: "wrapper-grid-column",
          templates: [],
          id: crypto.randomUUID(),
          properties: {
            parentId: gridParent.id,
          },
        });
      }
      updateGrid(newColumns, newTemplates);
    } else if (action === "del-row") {
      const startIndex = currentRow * numCols;
      const newTemplates = [...templates];
      newTemplates.splice(startIndex, numCols);
      updateGrid(columns, newTemplates);
    } else if (action === "del-col") {
      if (numCols <= 1) return; // Min columns check

      // Calc new columns
      const newCount = numCols - 1;
      const baseSpan = Math.floor(12 / newCount);
      const remainder = 12 % newCount;
      const newColumns = Array(newCount).fill(baseSpan);
      for (let i = 0; i < remainder; i++) newColumns[i]++;

      const newTemplates = [...templates];
      const numRows = Math.ceil(templates.length / numCols);

      // Remove cells from bottom to top to avoid index shifting issues
      for (let r = numRows - 1; r >= 0; r--) {
        const index = r * numCols + currentCol;
        newTemplates.splice(index, 1);
      }
      updateGrid(newColumns, newTemplates);
    }
  };

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: template!.id || "unknown",
    disabled: !isWrapper || builderConfig.disableDrop,
    data: {
      type: "container",
      template,
    },
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: template!.id || "unknown",
    data: {
      type: "existing-item",
      template,
    },
  });

  const setRef = (element: HTMLElement | null) => {
    // Para resolver o conflito entre Draggable e Droppable, o elemento root do componente
    // se torna apenas o Draggable para que ele possa ser arrastado.
    // E o Droppable envolve o conteudo ou a mesma div atraves do ref consolidado.
    // O dnd-kit aceita setNodeRef multiplas vezes, mas se houver conflitos no drag over,
    // as vezes nao registra o container.
    setDroppableRef(element);
    setDraggableRef(element);
    setNode(element);
  };

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (template!.id) {
      setSelectedId(template!.id);
    }
  };

  const OriginalRender = originalTemplate.render;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(template, null, 2));
  };

  const allowedTemplates = useMemo(() => {
    return BUILDER_TEMPLATES.filter((t) => {
      // Check parent constraint
      if (
        builderConfig.allowedChildren &&
        !builderConfig.allowedChildren.includes(t.name)
      )
        return false;

      // Check child constraint
      if (t.validParents && !t.validParents.includes(originalTemplate.name))
        return false;

      return true;
    });
  }, [builderConfig.allowedChildren, originalTemplate.name]);

  // Inject Add Button if wrapper
  const modifiedTemplate = useMemo(() => {
    if (!isWrapper) return template;
    const childrenProp = builderConfig.childrenProp || "templates";
    const newTemplate: any = { ...template };
    const children = newTemplate[childrenProp]
      ? [...newTemplate[childrenProp]]
      : [];

    const isEmpty = children.length === 0;

    children.push({
      type: "builder-add-button",
      id: `add-btn-${template!.id}`,
      properties: {
        parentId: template!.id,
        parentType: originalTemplate.name,
        allowedChildren: builderConfig.allowedChildren,
        isEmpty,
      },
    });

    newTemplate[childrenProp] = children;
    return newTemplate;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, isWrapper, builderConfig]);

  const isGrid = originalTemplate.name === "wrapper-grid";

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div
          ref={setDraggableRef}
          onClick={handleClick}
          className={`
            relative group border-2 transition-all pb-2
            ${isSelected ? "border-primary mt-6" : "border-transparent hover:border-dashed hover:border-muted-foreground/50"}
            ${isOver ? "bg-accent/30 ring-2 ring-primary/50" : ""}
          `}
          style={{
            minHeight: isWrapper ? "50px" : undefined,
            pointerEvents: "auto",
            ...style,
          }}
        >
          {/* Container Droppable invisível que engloba o elemento para receber drops.
              Usar ref={setDroppableRef} na mesma div principal pode conflitar com draggable
              durante o hover no DndKit, então inserimos ele envolvendo o conteudo. */}
          <div
            ref={setDroppableRef}
            className="absolute inset-0 z-0 pointer-events-none"
          />

          {/* Label tag when selected or hovered */}
          {(isSelected || isOver) && (
            <div
              className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-t z-10 cursor-grab active:cursor-grabbing flex items-center gap-1 pointer-events-auto"
              {...attributes}
              {...listeners}
            >
              <div className="w-2 h-2 rounded-full bg-primary-foreground/50 mr-1" />
              {builderConfig.friendlyName || originalTemplate.name}
            </div>
          )}

          {/* Resize Overlay for Grid */}
          {isGrid && template && node && (
            <ResizeOverlay template={template} nodeRef={node} />
          )}

          {/* Render the original component with pointer-events: none to prevent internal clicks */}

          <div
            className="contents"
            style={{ pointerEvents: "none", position: "relative", zIndex: 1 }}
          >
            <OriginalRender {...props} template={modifiedTemplate} />
          </div>
        </div>
      </ContextMenu.Trigger>
      <ContextMenu.Content className="min-w-[12rem] bg-popover text-popover-foreground rounded-md border p-1 shadow-md z-50">
        <ContextMenu.Item
          className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm outline-none cursor-default hover:bg-accent hover:text-accent-foreground"
          onSelect={() => {
            setSelectedId(template!.id || null);
            triggerHighlightConfig();
          }}
        >
          <Edit className="h-4 w-4" />
          Editar
        </ContextMenu.Item>

        {isGridColumn && gridParent && (
          <>
            <ContextMenu.Separator className="h-px bg-muted my-1" />
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm outline-none cursor-default hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
                <Plus className="h-4 w-4" />
                Inserir Linha/Coluna
              </ContextMenu.SubTrigger>
              <ContextMenu.SubContent className="min-w-[12rem] bg-popover text-popover-foreground rounded-md border p-1 shadow-md z-50">
                <ContextMenu.Item
                  className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm outline-none cursor-default hover:bg-accent hover:text-accent-foreground"
                  onSelect={() => handleGridAction("add-row-above")}
                >
                  <ArrowUp className="h-4 w-4" />
                  Linha Acima
                </ContextMenu.Item>
                <ContextMenu.Item
                  className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm outline-none cursor-default hover:bg-accent hover:text-accent-foreground"
                  onSelect={() => handleGridAction("add-row-below")}
                >
                  <ArrowDown className="h-4 w-4" />
                  Linha Abaixo
                </ContextMenu.Item>
                <ContextMenu.Separator className="h-px bg-muted my-1" />
                <ContextMenu.Item
                  className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm outline-none cursor-default hover:bg-accent hover:text-accent-foreground"
                  onSelect={() => handleGridAction("add-col-left")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Coluna à Esquerda
                </ContextMenu.Item>
                <ContextMenu.Item
                  className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm outline-none cursor-default hover:bg-accent hover:text-accent-foreground"
                  onSelect={() => handleGridAction("add-col-right")}
                >
                  <ArrowRight className="h-4 w-4" />
                  Coluna à Direita
                </ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Sub>

            <ContextMenu.Sub>
              <ContextMenu.SubTrigger className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm outline-none cursor-default hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
                <Trash className="h-4 w-4" />
                Excluir Linha/Coluna
              </ContextMenu.SubTrigger>
              <ContextMenu.SubContent className="min-w-[12rem] bg-popover text-popover-foreground rounded-md border p-1 shadow-md z-50">
                <ContextMenu.Item
                  className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm outline-none cursor-default hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground"
                  onSelect={() => handleGridAction("del-row")}
                >
                  <X className="h-4 w-4" />
                  Excluir Linha
                </ContextMenu.Item>
                <ContextMenu.Item
                  className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm outline-none cursor-default hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground"
                  onSelect={() => handleGridAction("del-col")}
                >
                  <X className="h-4 w-4" />
                  Excluir Coluna
                </ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Sub>
          </>
        )}

        {isWrapper && (
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm outline-none cursor-default hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
              <Plus className="h-4 w-4" />
              Adicionar
            </ContextMenu.SubTrigger>
            <ContextMenu.SubContent className="min-w-[12rem] bg-popover text-popover-foreground rounded-md border p-1 shadow-md z-50">
              {allowedTemplates.map((t) => (
                <ContextMenu.Item
                  key={t.name}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm outline-none cursor-default hover:bg-accent hover:text-accent-foreground"
                  onSelect={() => {
                    const newItem: ITemplate = {
                      type: t.name,
                      templates: [],
                      ...(t.defaultProps || {}),
                    };
                    addItem(template!.id || null, newItem);
                  }}
                >
                  {t.friendlyName || t.name}
                </ContextMenu.Item>
              ))}
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        )}

        <ContextMenu.Item
          className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm outline-none cursor-default hover:bg-accent hover:text-accent-foreground"
          onSelect={handleCopy}
        >
          <Copy className="h-4 w-4" />
          Copiar JSON
        </ContextMenu.Item>
        <ContextMenu.Separator className="h-px bg-muted my-1" />
        <ContextMenu.Item
          className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm outline-none cursor-default hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground"
          onSelect={() => template!.id && removeItem(template!.id)}
        >
          <Trash className="h-4 w-4" />
          Remover
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
};

export const RenderLayer = () => {
  const { template, mockData, addItem } = useBuilder();
  const [previewMode, setPreviewMode] = useState<"edit" | "fiu">("edit");

  // Create wrapped templates
  const wrappedTemplates = useMemo(() => {
    const wrappers = BUILDER_TEMPLATES.map((t) => ({
      ...t,
      render: (props: ITemplateProps) => (
        <BuilderComponentWrapper originalTemplate={t} props={props} />
      ),
    }));

    // Add virtual template for add button
    wrappers.push({
      name: "builder-add-button",
      render: AddButtonComponent,
      friendlyName: "Add Button",
    } as any);

    return wrappers;
  }, []);

  const { setNodeRef, isOver } = useDroppable({
    id: "root-droppable",
    data: {
      type: "root",
    },
  });

  const content =
    template.length === 0 ? (
      <div className="h-full min-h-[700px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-md gap-4">
        <p>Arraste componentes aqui para começar ou</p>
        <RootAddButton />
      </div>
    ) : previewMode === "fiu" ? (
      <ViewTemplate
        templates={template}
        data={mockData}
        rootTemplate={template}
        isPrint
        layoutMode="semantic-grid"
      />
    ) : (
      <TemplateRegistryProvider value={{ templates: wrappedTemplates }}>
        {template.map((t, i) => (
          <ViewTemplateEngine
            key={t.id || `root-${i}`}
            template={t}
            data={mockData}
            rootTemplate={template}
          />
        ))}
        <RootAddButton />
      </TemplateRegistryProvider>
    );

  return (
    <div className="h-full w-full p-8 bg-muted/10 overflow-auto">
      <div className="mx-auto mb-3 flex max-w-6xl items-center justify-between rounded-lg border bg-background p-2 shadow-sm">
        <div>
          <p className="text-sm font-semibold">Visualização do template</p>
          <p className="text-xs text-muted-foreground">
            Use “Prévia FIU” para conferir largura, cards compactos e abas como
            aparecem no print/painel, sem os wrappers de edição.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={previewMode === "edit" ? "default" : "outline"}
            onClick={() => setPreviewMode("edit")}
          >
            Edição
          </Button>
          <Button
            type="button"
            size="sm"
            variant={previewMode === "fiu" ? "default" : "outline"}
            onClick={() => setPreviewMode("fiu")}
          >
            Prévia FIU
          </Button>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`bg-background shadow-sm border rounded-lg min-h-[800px] p-8 mx-auto transition-colors ${
          previewMode === "fiu" ? "max-w-6xl" : "max-w-4xl"
        } ${isOver ? "bg-accent/10 ring-2 ring-primary/20" : ""}`}
      >
        {content}
      </div>
    </div>
  );
};
