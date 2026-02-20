import { ScrollArea } from "@open-urbis/map-ui";
import { useDraggable } from "@dnd-kit/core";
import { IBuilderTemplateConfig } from "../types";
import { BUILDER_TEMPLATES } from "../registry";

const DraggableItem = ({ template }: { template: IBuilderTemplateConfig }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `new-${template.name}`,
    data: {
      type: "new-item",
      templateType: template.name,
      template,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="p-3 mb-2 border rounded bg-card hover:bg-accent cursor-grab active:cursor-grabbing flex items-center gap-2 select-none"
    >
      {/* Icon placeholder */}
      <div className="w-6 h-6 bg-muted rounded flex items-center justify-center text-xs shrink-0">
        ?
      </div>
      <div className="overflow-hidden">
        <div className="font-medium text-sm truncate">
          {template.friendlyName || template.name}
        </div>
        {template.description && (
          <div className="text-xs text-muted-foreground truncate" title={template.description}>
            {template.description}
          </div>
        )}
      </div>
    </div>
  );
};

export const ComponentPalette = () => {
  const wrappers = BUILDER_TEMPLATES.filter((t) => t.isWrapper);
  const components = BUILDER_TEMPLATES.filter((t) => !t.isWrapper);

  return (
    <div className="flex h-full flex-col border-l bg-background">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Componentes</h2>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Wrappers</h3>
            <div className="space-y-1">
              {wrappers.map((t) => (
                <DraggableItem key={t.name} template={t} />
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Templates</h3>
            <div className="space-y-1">
              {components.map((t) => (
                <DraggableItem key={t.name} template={t} />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
