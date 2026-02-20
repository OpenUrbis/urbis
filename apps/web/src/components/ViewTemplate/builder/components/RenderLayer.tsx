// RenderLayer.tsx - Handles the visual rendering of the builder canvas
import { useDroppable } from "@dnd-kit/core";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@open-urbis/map-ui";
import { Copy, Edit, Plus, Trash } from "lucide-react";
import { ContextMenu } from "radix-ui";
import { useMemo } from "react";
import { TemplateRegistryProvider } from "../../TemplateRegistryContext";
import {
  ITemplate,
  ITemplateProps,
  ITemplatesDeclaration,
} from "../../types/templates-type";
import { ViewTemplateEngine } from "../../ViewTemplateEngine";
import { useBuilder } from "../BuilderContext";
import { BUILDER_TEMPLATES } from "../registry";
import { IBuilderTemplateConfig } from "../types";

// Internal component for the Add Button injected into templates
const AddButtonComponent = (props: ITemplateProps) => {
  const { addItem } = useBuilder();
  const { template } = props;
  const { parentId, allowedChildren, parentType } = template.properties as any;

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

  return (
    <div
      className="flex justify-center p-2 opacity-50 hover:opacity-100 transition-opacity border-2 border-dashed border-transparent hover:border-muted-foreground/20 rounded-md m-1 w-full"
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
                const newItem: ITemplate = {
                  type: t.name,
                  templates: [],
                  ...(t.defaultProps || {}),
                };
                addItem(parentId || null, newItem);
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
  } = useBuilder();
  // eslint-disable-next-line react/prop-types
  const { template } = props;
  const isSelected = selectedId === template!.id;

  // Make it droppable if it's a wrapper
  const builderConfig = originalTemplate as IBuilderTemplateConfig;
  const isWrapper =
    builderConfig.isWrapper || originalTemplate.name.includes("wrapper"); // heuristic fallback

  const { setNodeRef, isOver } = useDroppable({
    id: template!.id || "unknown",
    disabled: !isWrapper,
    data: {
      type: "container",
      template,
    },
  });

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

    children.push({
      type: "builder-add-button",
      id: `add-btn-${template!.id}`,
      properties: {
        parentId: template!.id,
        parentType: originalTemplate.name,
        allowedChildren: builderConfig.allowedChildren,
      },
    });

    newTemplate[childrenProp] = children;
    return newTemplate;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, isWrapper, builderConfig]);

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={`
            relative group border-2 transition-all pb-2
            ${isSelected ? "border-primary" : "border-transparent hover:border-dashed hover:border-muted-foreground/50"}
            ${isOver ? "bg-accent/30 ring-2 ring-primary/50" : ""}
          `}
          style={{
            minHeight: isWrapper ? "50px" : undefined,
            pointerEvents: "auto",
          }}
        >
          {/* Label tag when selected or hovered */}
          {(isSelected || isOver) && (
            <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-t z-10">
              {builderConfig.friendlyName || originalTemplate.name}
            </div>
          )}

          {/* Render the original component with pointer-events: none to prevent internal clicks */}

          <div className="contents" style={{ pointerEvents: "none" }}>
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
  const { template, mockData } = useBuilder();

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

  return (
    <TemplateRegistryProvider value={{ templates: wrappedTemplates }}>
      <div className="h-full w-full p-8 bg-muted/10 overflow-auto">
        <div className="bg-background shadow-sm border rounded-lg min-h-[800px] p-8 max-w-4xl mx-auto">
          <ViewTemplateEngine
            template={template}
            data={mockData}
            rootTemplate={[template]}
          />
        </div>
      </div>
    </TemplateRegistryProvider>
  );
};
