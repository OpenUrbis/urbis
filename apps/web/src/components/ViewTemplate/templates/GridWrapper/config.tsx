import { Button, Label } from "@open-urbis/map-ui";
import { Minus, Plus } from "lucide-react";
import { useMemo } from "react";
import { useBuilder } from "../../builder/BuilderContext";
import { IBuilderTemplateConfig } from "../../builder/types";
import { ITemplate, ITemplateProps } from "../../types/templates-type";

const MAX_COLUMNS = 12;

const ConfigForm = ({
  template,
  onChange,
}: {
  template: ITemplate;
  onChange: (newTemplate: ITemplate) => void;
}) => {
  const properties = (template.properties || {}) as any;
  const columns: number[] = properties.columns || [12];
  const templates = template.templates || [];

  const rowCount = Math.ceil(templates.length / columns.length) || 1;

  // Sidebar controls can remain simple or mimic the canvas logic if needed
  // For now keeping them as append-only for simplicity
  const handleAddColumn = () => {
    if (columns.length >= MAX_COLUMNS) return;

    const newCount = columns.length + 1;
    const baseSpan = Math.floor(12 / newCount);
    const remainder = 12 % newCount;

    const newColumns = Array(newCount).fill(baseSpan);
    for (let i = 0; i < remainder; i++) {
      newColumns[i]++;
    }

    let newTemplates = [...templates];

    if (templates.length === 0) {
      newTemplates = [
        {
          type: "wrapper-grid-column",
          templates: [],
          id: crypto.randomUUID(),
          properties: { parentId: template.id },
        },
      ];
    } else {
      const currentRowCount = Math.ceil(templates.length / columns.length);
      for (let r = currentRowCount - 1; r >= 0; r--) {
        const insertIndex = (r + 1) * columns.length;
        const actualInsertIndex = Math.min(insertIndex, newTemplates.length);

        newTemplates.splice(actualInsertIndex, 0, {
          type: "wrapper-grid-column",
          templates: [],
          id: crypto.randomUUID(),
          properties: { parentId: template.id },
        });
      }
    }

    onChange({
      ...template,
      templates: newTemplates,
      properties: {
        ...properties,
        columns: newColumns,
      },
    });
  };

  const handleAddRow = () => {
    const newTemplates = [...templates];
    for (let i = 0; i < columns.length; i++) {
      newTemplates.push({
        type: "wrapper-grid-column",
        templates: [],
        id: crypto.randomUUID(),
        properties: { parentId: template.id },
      });
    }

    onChange({
      ...template,
      templates: newTemplates,
    });
  };

  const handleRemoveColumn = () => {
    if (columns.length <= 1) return;

    // Recalculate columns to fill space (12 units)
    const newCount = columns.length - 1;
    const baseSpan = Math.floor(12 / newCount);
    const remainder = 12 % newCount;

    const newColumns = Array(newCount).fill(baseSpan);
    for (let i = 0; i < remainder; i++) {
      newColumns[i]++;
    }

    // Remove last cell from each row
    const newTemplates = [...templates];
    const currentRowCount = Math.ceil(templates.length / columns.length);

    for (let r = currentRowCount - 1; r >= 0; r--) {
      // Index of the last cell in this row
      const deleteIndex = r * columns.length + (columns.length - 1);
      if (deleteIndex < newTemplates.length) {
        newTemplates.splice(deleteIndex, 1);
      }
    }

    onChange({
      ...template,
      templates: newTemplates,
      properties: {
        ...properties,
        columns: newColumns,
      },
    });
  };

  const handleRemoveRow = () => {
    if (rowCount <= 1) return;

    const newTemplates = [...templates];
    // Remove last N cells (one row)
    for (let i = 0; i < columns.length; i++) {
      newTemplates.pop();
    }

    onChange({
      ...template,
      templates: newTemplates,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Estrutura da Tabela</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Colunas</Label>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveColumn}
                disabled={columns.length <= 1}
                className="flex-1"
                title="Remover última coluna"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddColumn}
                disabled={columns.length >= MAX_COLUMNS}
                className="flex-1"
                title="Adicionar coluna"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-center text-xs text-muted-foreground">
              {columns.length} / {MAX_COLUMNS}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Linhas</Label>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveRow}
                disabled={rowCount <= 1}
                className="flex-1"
                title="Remover última linha"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="flex-1"
                title="Adicionar linha"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-center text-xs text-muted-foreground">
              {rowCount}
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground mt-4 space-y-1">
          <p>Use as alças na visualização para redimensionar colunas.</p>
          <p className="opacity-80">
            <strong>Dica:</strong> Clique com o botão direito nas células para
            opções avançadas de inserção e remoção (meio, acima, abaixo).
          </p>
        </div>
      </div>
    </div>
  );
};

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

const GridCanvasActions = (props: ITemplateProps) => {
  const { template: rootTemplate, updateItem } = useBuilder();
  const { parentId } = props.template.properties as any;

  // Retrieve current parent state
  const parent = useMemo(() => {
    if (!rootTemplate || !parentId) return null;
    // @ts-ignore
    return findTemplateRecursive(rootTemplate, parentId);
  }, [rootTemplate, parentId]);

  const currentColumns = (parent?.properties as any)?.columns || [];
  const isMaxColumns = currentColumns.length >= MAX_COLUMNS;

  // Generic helper to update grid
  const updateGrid = (newColumns: number[], newTemplates: ITemplate[]) => {
    if (!parent) return;
    const properties = (parent.properties || {}) as any;
    updateItem(parentId, {
      templates: newTemplates,
      properties: {
        ...properties,
        columns: newColumns,
      },
    });
  };

  // --- Actions ---

  const handleAddColumnRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!parent || isMaxColumns) return;

    const columns = (parent.properties as any).columns || ["1fr"];
    const templates = parent.templates || [];

    // Redistribute
    const newCount = columns.length + 1;
    const baseSpan = Math.floor(12 / newCount);
    const remainder = 12 % newCount;
    const newColumns = Array(newCount).fill(baseSpan);
    for (let i = 0; i < remainder; i++) newColumns[i]++;

    let newTemplates = [...templates];
    if (templates.length === 0) {
      newTemplates = [
        {
          type: "wrapper-grid-column",
          templates: [],
          id: crypto.randomUUID(),
          properties: { parentId: parent?.id },
        },
      ];
    } else {
      const currentRowCount = Math.ceil(templates.length / columns.length);
      for (let r = currentRowCount - 1; r >= 0; r--) {
        // Append to end of row
        const insertIndex = (r + 1) * columns.length;
        const actualInsertIndex = Math.min(insertIndex, newTemplates.length);
        newTemplates.splice(actualInsertIndex, 0, {
          type: "wrapper-grid-column",
          templates: [],
          id: crypto.randomUUID(),
          properties: { parentId: parent?.id },
        });
      }
    }
    updateGrid(newColumns, newTemplates);
  };

  const handleAddColumnLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!parent || isMaxColumns) return;

    const columns = (parent.properties as any).columns || ["1fr"];
    const templates = parent.templates || [];

    // Redistribute
    const newCount = columns.length + 1;
    const baseSpan = Math.floor(12 / newCount);
    const remainder = 12 % newCount;
    const newColumns = Array(newCount).fill(baseSpan);
    for (let i = 0; i < remainder; i++) newColumns[i]++;

    let newTemplates = [...templates];
    if (templates.length === 0) {
      newTemplates = [
        {
          type: "wrapper-grid-column",
          templates: [],
          id: crypto.randomUUID(),
          properties: { parentId: parent?.id },
        },
      ];
    } else {
      const currentRowCount = Math.ceil(templates.length / columns.length);
      for (let r = currentRowCount - 1; r >= 0; r--) {
        // Prepend to start of row
        // Row starts at r * oldCols
        const insertIndex = r * columns.length;
        const actualInsertIndex = Math.min(insertIndex, newTemplates.length);
        newTemplates.splice(actualInsertIndex, 0, {
          type: "wrapper-grid-column",
          templates: [],
          id: crypto.randomUUID(),
          properties: { parentId: parent?.id },
        });
      }
    }
    updateGrid(newColumns, newTemplates);
  };

  const handleAddRowBottom = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!parent) return;
    const columns = (parent.properties as any).columns || ["1fr"];
    const templates = parent.templates || [];

    // Append N cells
    const newTemplates = [...templates];
    for (let i = 0; i < columns.length; i++) {
      newTemplates.push({
        type: "wrapper-grid-column",
        templates: [],
        id: crypto.randomUUID(),
        properties: { parentId: parent?.id },
      });
    }
    // Columns don't change
    updateGrid(columns, newTemplates);
  };

  const handleAddRowTop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!parent) return;
    const columns = (parent.properties as any).columns || ["1fr"];
    const templates = parent.templates || [];

    // Prepend N cells
    const newCells: ITemplate[] = [];
    for (let i = 0; i < columns.length; i++) {
      newCells.push({
        type: "wrapper-grid-column",
        templates: [],
        id: crypto.randomUUID(),
        properties: { parentId: parent?.id },
      });
    }
    const newTemplates = [...newCells, ...templates];
    updateGrid(columns, newTemplates);
  };

  const buttonClass =
    "h-8 w-8 rounded-full shadow-md bg-background border border-border hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center";
  const containerClass =
    "pointer-events-auto opacity-0 group-hover/grid:opacity-100 transition-opacity duration-200 z-50 absolute";

  return (
    <>
      {/* Right */}
      {!isMaxColumns && (
        <div
          className={`${containerClass} top-1/2 -translate-y-1/2 right-0 translate-x-1/2`}
          style={{ pointerEvents: "auto" }}
        >
          <Button
            variant="outline"
            size="icon"
            className={buttonClass}
            onClick={handleAddColumnRight}
            title="Adicionar Coluna (Direita)"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Left */}
      {!isMaxColumns && (
        <div
          className={`${containerClass} top-1/2 -translate-y-1/2 left-0 -translate-x-1/2`}
          style={{ pointerEvents: "auto" }}
        >
          <Button
            variant="outline"
            size="icon"
            className={buttonClass}
            onClick={handleAddColumnLeft}
            title="Adicionar Coluna (Esquerda)"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Bottom */}
      <div
        className={`${containerClass} bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2`}
        style={{ pointerEvents: "auto" }}
      >
        <Button
          variant="outline"
          size="icon"
          className={buttonClass}
          onClick={handleAddRowBottom}
          title="Adicionar Linha (Abaixo)"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Top */}
      <div
        className={`${containerClass} top-0 left-1/2 -translate-x-1/2 -translate-y-1/2`}
        style={{ pointerEvents: "auto" }}
      >
        <Button
          variant="outline"
          size="icon"
          className={buttonClass}
          onClick={handleAddRowTop}
          title="Adicionar Linha (Acima)"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
};

export const GridWrapperConfig: Partial<IBuilderTemplateConfig> = {
  friendlyName: "Grade",
  description: "Grade com colunas redimensionáveis.",
  isWrapper: true,
  configComponent: ConfigForm,
  allowedChildren: ["wrapper-grid-column"],
  disableDrop: true,
  customAddButton: GridCanvasActions,
  defaultProps: {
    properties: {
      columns: [6, 6], // Default 2 cols (50/50)
    },
    templates: [
      { type: "wrapper-grid-column", templates: [], id: "c1" },
      { type: "wrapper-grid-column", templates: [], id: "c2" },
    ],
  },
};
