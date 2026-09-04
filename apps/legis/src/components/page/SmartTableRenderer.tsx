import React from "react";
import { TableData, TableRow } from "../../domain/types";
import { cn } from "@open-urbis/map-ui";

interface SmartTableRendererProps {
  data: TableData;
  onSelect?: () => void;
}

/**
 * Simplified Smart Table Renderer.
 * Renders a standard HTML table based on the rows and cells data.
 * Merging is supported via colSpan and rowSpan in cell data.
 * Header cells are told apart by weight and a bottom rule, not by a grey fill.
 */
export function SmartTableRenderer({
  data,
  onSelect,
}: SmartTableRendererProps) {
  const { rows, cols, cells, footer } = data;

  /*
   * Everything derived from the data is computed in a single memo, ABOVE the
   * early return below.
   *
   * Two reasons. First, a hook must not sit after a conditional return: a
   * table whose rows disappear between renders would change the hook count and
   * React would tear the tree down ("rendered fewer hooks than expected").
   * Second, the sorted rows and columns are inputs of the merge, so computing
   * them here is what makes `[rows, cols, cells]` a complete dependency list.
   */
  const { sortedRows, sortedCols, processedCells } = React.useMemo(() => {
    const sortedRows = [...(rows ?? [])].sort(
      (a, b) => (a.index || 0) - (b.index || 0),
    );
    const sortedCols = [...(cols ?? [])].sort(
      (a, b) => (a.index || 0) - (b.index || 0),
    );
    const sourceCells = cells ?? [];

    // 1. Create Grid
    const grid: any[][] = [];
    const cellMap = new Map<string, any>(); // key: rowId-colId

    sortedRows.forEach((row, rIdx) => {
      grid[rIdx] = [];
      sortedCols.forEach((col, cIdx) => {
        const originalCell = sourceCells.find(
          (c) => c.rowId === row.id && c.colId === col.id,
        );
        const cell = {
          ...originalCell,
          rowId: row.id,
          colId: col.id,
          // Clean text for comparison (strip HTML tags and whitespace)
          cleanContent: (originalCell?.text || "")
            .replace(/<[^>]*>/g, "")
            .trim(),
          // Keep original HTML for display
          displayText: (originalCell?.text || "").replace(/\.\.\./g, "").trim(),
          rowSpan: 1,
          colSpan: 1,
          hidden: false,
        };
        grid[rIdx][cIdx] = cell;
        cellMap.set(`${row.id}-${col.id}`, cell);
      });
    });

    /*
     * 2. Horizontal merge.
     *
     * Each run of neighbouring cells holding the same words becomes one cell:
     * the first of the run carries the span, the rest are hidden. Walking the
     * run in an inner loop is what makes three identical cells collapse into
     * one span of 3 rather than into two spans of 2.
     */
    for (let r = 0; r < sortedRows.length; r++) {
      let c = 0;
      while (c < sortedCols.length) {
        const current = grid[r][c];
        let span = 1;
        while (c + span < sortedCols.length) {
          const next = grid[r][c + span];
          if (
            current.cleanContent === next.cleanContent &&
            current.cleanContent !== ""
          ) {
            next.hidden = true;
            span++;
          } else {
            break;
          }
        }
        current.colSpan = span;
        c += span;
      }
    }

    /*
     * 3. Vertical merge.
     *
     * Only rectangles are merged: the cell below must hold the same words AND
     * span the same number of columns. A cell already hidden belongs to a
     * horizontal run to its left, so it stops the block — merging across it
     * would attribute one row's value to another.
     */
    for (let c = 0; c < sortedCols.length; c++) {
      let r = 0;
      while (r < sortedRows.length) {
        const current = grid[r][c];
        if (current.hidden) {
          r++;
          continue;
        }

        let span = 1;
        while (r + span < sortedRows.length) {
          const next = grid[r + span][c];

          if (next.hidden) break;

          if (
            current.cleanContent === next.cleanContent &&
            current.cleanContent !== "" &&
            current.colSpan === next.colSpan
          ) {
            next.hidden = true;
            span++;
          } else {
            break;
          }
        }
        current.rowSpan = span;
        r += span;
      }
    }

    return { sortedRows, sortedCols, processedCells: cellMap };
  }, [rows, cols, cells]);

  if (!rows || rows.length === 0) return null;

  const headerRows = sortedRows.filter((row) => row.type === "Cabeçalho");
  const bodyRows = sortedRows.filter((row) => row.type !== "Cabeçalho");

  const renderRow = (row: TableRow) => (
    <tr key={row.id} className="border-b last:border-0 group">
      {sortedCols.map((col) => {
        const cell = processedCells.get(`${row.id}-${col.id}`);

        if (!cell || cell.hidden) return null;

        const isHeader =
          row.type === "Cabeçalho" || col.type === "Cabeçalho" || cell.isHeader;
        const Tag = isHeader ? "th" : "td";

        const hasVeto =
          cell.specialSituations?.some((s: any) => s.type === "Veto") ||
          cell.text?.toLowerCase().includes("(vetado)") ||
          /<(s|strike)\b[^>]*>/i.test(cell.text || "");
        const hasRevoked =
          cell.specialSituations?.some((s: any) =>
            ["Revogação", "Anulação", "Cassação"].includes(s.type),
          ) ||
          cell.text?.toLowerCase().includes("(revogado)") ||
          cell.text?.toLowerCase().includes("(anulado)") ||
          cell.text?.toLowerCase().includes("(cassado)");

        const isCellStruck = hasVeto || hasRevoked;

        return (
          <Tag
            key={col.id}
            rowSpan={cell.rowSpan}
            colSpan={cell.colSpan}
            className={cn(
              "border last:border-0 px-3 py-2 text-justify align-middle transition-colors",
              isHeader && "border-b font-medium text-center bg-muted/30",
              isCellStruck && "line-through text-muted-foreground opacity-80",
              "hover:bg-muted/40",
              onSelect && "cursor-pointer",
            )}
            onClick={onSelect}
            dangerouslySetInnerHTML={{ __html: cell.displayText }}
          />
        );
      })}
    </tr>
  );

  return (
    <div className="overflow-x-auto my-4 border">
      <table className="w-full border-collapse text-sm">
        {headerRows.length > 0 && (
          <thead>
            {headerRows.map(renderRow)}
          </thead>
        )}
        <tbody>
          {(bodyRows.length > 0 ? bodyRows : sortedRows).map(renderRow)}
        </tbody>
      </table>
      {footer && (
        <div className="p-3 text-xs text-muted-foreground italic border-t">
          {footer}
        </div>
      )}
    </div>
  );
}
