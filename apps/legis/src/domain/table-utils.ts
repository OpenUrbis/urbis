import { TableData, TableRow } from "./types";

export interface SourceTableCell {
  text: string;
  rowSpan?: number;
  colSpan?: number;
  isHeader?: boolean;
}

export interface SourceTableRow {
  type: TableRow["type"];
  cells: SourceTableCell[];
}

const normalizeSpan = (value?: number) => {
  if (!value || value < 1) return 1;

  return Math.floor(value);
};

export function buildExpandedTableData(
  sourceRows: SourceTableRow[],
  createId: () => string = () => crypto.randomUUID(),
): TableData {
  const grid: string[][] = [];
  const rowTypes: TableRow["type"][] = [];
  const headerGrid: boolean[][] = [];
  const occupiedUntilRowByCol: number[] = [];

  sourceRows.forEach((row, rowIndex) => {
    if (!grid[rowIndex]) {
      grid[rowIndex] = [];
    }

    rowTypes[rowIndex] = row.type;

    let colIndex = 0;

    row.cells.forEach((cell) => {
      while ((occupiedUntilRowByCol[colIndex] ?? -1) > rowIndex) {
        colIndex += 1;
      }

      const rowSpan = normalizeSpan(cell.rowSpan);
      const colSpan = normalizeSpan(cell.colSpan);

      for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
        const targetRowIndex = rowIndex + rowOffset;

        if (!grid[targetRowIndex]) {
          grid[targetRowIndex] = [];
        }

        if (!headerGrid[targetRowIndex]) {
          headerGrid[targetRowIndex] = [];
        }

        if (!rowTypes[targetRowIndex]) {
          rowTypes[targetRowIndex] =
            row.type === "Cabeçalho" ? "Cabeçalho" : "Corpo";
        }

        for (let colOffset = 0; colOffset < colSpan; colOffset += 1) {
          const targetColIndex = colIndex + colOffset;
          grid[targetRowIndex][targetColIndex] = cell.text;
          headerGrid[targetRowIndex][targetColIndex] = Boolean(cell.isHeader);

          if (rowSpan > 1) {
            occupiedUntilRowByCol[targetColIndex] = Math.max(
              occupiedUntilRowByCol[targetColIndex] ?? -1,
              rowIndex + rowSpan,
            );
          }
        }
      }

      colIndex += colSpan;
    });
  });

  const maxCols = grid.reduce((max, row) => Math.max(max, row.length), 0);
  const resolvedRowTypes = grid.map((row, index) => {
    const headerCells = row.reduce((count, _cell, colIndex) => {
      return count + (headerGrid[index]?.[colIndex] ? 1 : 0);
    }, 0);

    if (rowTypes[index] === "Cabeçalho" || (headerCells > 0 && headerCells === row.length)) {
      return "Cabeçalho" as const;
    }

    return rowTypes[index] ?? "Corpo";
  });

  const rows = grid.map((_, index) => ({
    id: createId(),
    type: resolvedRowTypes[index] ?? "Corpo",
    index: index + 1,
  }));
  const cols = Array.from({ length: maxCols }, (_, index) => ({
    id: createId(),
    type: grid.every((row, rowIndex) => {
      if (index >= row.length) return true;
      return Boolean(headerGrid[rowIndex]?.[index]);
    })
      ? ("Cabeçalho" as const)
      : ("Corpo" as const),
    index: index + 1,
  }));

  const cells = rows.flatMap((row, rowIndex) =>
    cols.map((col, colIndex) => ({
      rowId: row.id,
      colId: col.id,
      text: grid[rowIndex]?.[colIndex] ?? "",
      rowSpan: 1,
      colSpan: 1,
    })),
  );

  return {
    rows,
    cols,
    cells,
  };
}
