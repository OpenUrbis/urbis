import { describe, expect, it } from "vitest";

import { buildExpandedTableData } from "../table-utils";

/** Gera ids previsíveis (`id-1`, `id-2`, ...) na ordem em que são solicitados. */
function sequentialIds() {
  let counter = 0;

  return () => `id-${++counter}`;
}

const textsOf = (tableData: ReturnType<typeof buildExpandedTableData>) =>
  tableData.cells.map((cell) => cell.text);

describe("buildExpandedTableData - tabelas degeneradas", () => {
  it("returns an empty table for an empty source", () => {
    const tableData = buildExpandedTableData([], sequentialIds());

    expect(tableData).toEqual({ rows: [], cols: [], cells: [] });
  });

  it("builds a single cell table", () => {
    const tableData = buildExpandedTableData(
      [{ type: "Corpo", cells: [{ text: "Único" }] }],
      sequentialIds(),
    );

    expect(tableData).toEqual({
      rows: [{ id: "id-1", type: "Corpo", index: 1 }],
      cols: [{ id: "id-2", type: "Corpo", index: 1 }],
      cells: [
        { rowId: "id-1", colId: "id-2", text: "Único", rowSpan: 1, colSpan: 1 },
      ],
    });
  });

  it("builds a single column table with a header row", () => {
    const tableData = buildExpandedTableData(
      [
        { type: "Cabeçalho", cells: [{ text: "Zona", isHeader: true }] },
        { type: "Corpo", cells: [{ text: "ZR1" }] },
      ],
      sequentialIds(),
    );

    expect(tableData.rows.map((row) => row.type)).toEqual([
      "Cabeçalho",
      "Corpo",
    ]);
    expect(tableData.cols).toHaveLength(1);
    expect(tableData.cols[0].type).toBe("Corpo");
    expect(textsOf(tableData)).toEqual(["Zona", "ZR1"]);
  });

  it("keeps a row without cells, which then has no columns at all", () => {
    const tableData = buildExpandedTableData(
      [{ type: "Corpo", cells: [] }],
      sequentialIds(),
    );

    expect(tableData.rows).toEqual([{ id: "id-1", type: "Corpo", index: 1 }]);
    expect(tableData.cols).toEqual([]);
    expect(tableData.cells).toEqual([]);
  });

  it("pads a row without cells with empty strings when other rows are wider", () => {
    const tableData = buildExpandedTableData(
      [
        { type: "Corpo", cells: [{ text: "A" }, { text: "B" }] },
        { type: "Corpo", cells: [] },
      ],
      sequentialIds(),
    );

    expect(tableData.rows).toHaveLength(2);
    expect(tableData.cols).toHaveLength(2);
    expect(textsOf(tableData)).toEqual(["A", "B", "", ""]);
  });

  it("never populates the optional footer", () => {
    const tableData = buildExpandedTableData(
      [{ type: "Corpo", cells: [{ text: "Fonte na origem" }] }],
      sequentialIds(),
    );

    expect(tableData.footer).toBeUndefined();
    expect("footer" in tableData).toBe(false);
  });
});

describe("buildExpandedTableData - normalização de spans", () => {
  it("treats zero, negative, fractional and NaN spans as at least one cell", () => {
    const tableData = buildExpandedTableData(
      [
        {
          type: "Corpo",
          cells: [
            { text: "A", colSpan: 0 },
            { text: "B", colSpan: 2.9 },
          ],
        },
        {
          type: "Corpo",
          cells: [
            { text: "C", rowSpan: -1 },
            { text: "D", rowSpan: Number.NaN, colSpan: 2 },
          ],
        },
      ],
      sequentialIds(),
    );

    expect(tableData.rows).toHaveLength(2);
    expect(tableData.cols).toHaveLength(3);
    expect(textsOf(tableData)).toEqual(["A", "B", "B", "C", "D", "D"]);
  });

  it("creates the extra rows demanded by a rowSpan longer than the source", () => {
    const tableData = buildExpandedTableData(
      [{ type: "Corpo", cells: [{ text: "X", rowSpan: 3 }] }],
      sequentialIds(),
    );

    expect(tableData.rows.map((row) => row.index)).toEqual([1, 2, 3]);
    expect(tableData.rows.map((row) => row.type)).toEqual([
      "Corpo",
      "Corpo",
      "Corpo",
    ]);
    expect(textsOf(tableData)).toEqual(["X", "X", "X"]);
  });

  it("propagates the header row type to the rows created by the rowSpan", () => {
    const tableData = buildExpandedTableData(
      [
        {
          type: "Cabeçalho",
          cells: [{ text: "Zona" }, { text: "Índice", rowSpan: 2 }],
        },
      ],
      sequentialIds(),
    );

    expect(tableData.rows.map((row) => row.type)).toEqual([
      "Cabeçalho",
      "Cabeçalho",
    ]);
    expect(tableData.cols.map((col) => col.type)).toEqual(["Corpo", "Corpo"]);
    expect(textsOf(tableData)).toEqual(["Zona", "Índice", "", "Índice"]);
  });

  it("frees the column again once the rowSpan is over", () => {
    const tableData = buildExpandedTableData(
      [
        {
          type: "Cabeçalho",
          cells: [{ text: "A", rowSpan: 2 }, { text: "B" }],
        },
        { type: "Corpo", cells: [{ text: "C" }] },
        { type: "Corpo", cells: [{ text: "D" }, { text: "E" }] },
      ],
      sequentialIds(),
    );

    expect(tableData.rows).toHaveLength(3);
    expect(tableData.cols).toHaveLength(2);
    expect(textsOf(tableData)).toEqual(["A", "B", "A", "C", "D", "E"]);
  });
});

describe("buildExpandedTableData - cabeçalhos de linha e de coluna", () => {
  it("promotes a body row whose every cell is flagged as header", () => {
    const tableData = buildExpandedTableData(
      [
        {
          type: "Corpo",
          cells: [
            { text: "Zona", isHeader: true },
            { text: "Índice", isHeader: true },
          ],
        },
        { type: "Corpo", cells: [{ text: "ZR1" }, { text: "1,0" }] },
      ],
      sequentialIds(),
    );

    expect(tableData.rows.map((row) => row.type)).toEqual([
      "Cabeçalho",
      "Corpo",
    ]);
  });

  it("keeps the declared type when only part of the row is flagged as header", () => {
    const tableData = buildExpandedTableData(
      [
        {
          type: "Corpo",
          cells: [{ text: "Zona", isHeader: true }, { text: "ZR1" }],
        },
      ],
      sequentialIds(),
    );

    expect(tableData.rows.map((row) => row.type)).toEqual(["Corpo"]);
  });

  it("marks a column as header only when every row is a header in that column", () => {
    const tableData = buildExpandedTableData(
      [
        {
          type: "Cabeçalho",
          cells: [{ text: "Zona", isHeader: true }, { text: "Coeficiente" }],
        },
        {
          type: "Corpo",
          cells: [{ text: "ZR1", isHeader: true }, { text: "1,0" }],
        },
      ],
      sequentialIds(),
    );

    expect(tableData.cols.map((col) => col.type)).toEqual([
      "Cabeçalho",
      "Corpo",
    ]);
    expect(tableData.rows.map((row) => row.type)).toEqual([
      "Cabeçalho",
      "Corpo",
    ]);
  });

  it("spreads the header flag of a spanning cell over the rows it occupies", () => {
    const tableData = buildExpandedTableData(
      [
        {
          type: "Cabeçalho",
          cells: [
            { text: "Zona", rowSpan: 2, isHeader: true },
            { text: "Coeficiente", isHeader: true },
          ],
        },
        { type: "Corpo", cells: [{ text: "Taxa", isHeader: true }] },
      ],
      sequentialIds(),
    );

    expect(textsOf(tableData)).toEqual(["Zona", "Coeficiente", "Zona", "Taxa"]);
    expect(tableData.rows.map((row) => row.type)).toEqual([
      "Cabeçalho",
      "Cabeçalho",
    ]);
    expect(tableData.cols.map((col) => col.type)).toEqual([
      "Cabeçalho",
      "Cabeçalho",
    ]);
  });

  it("counts columns beyond a shorter row as headers of that column", () => {
    const tableData = buildExpandedTableData(
      [
        {
          type: "Cabeçalho",
          cells: [
            { text: "A", isHeader: true },
            { text: "B", isHeader: true },
            { text: "C", isHeader: true },
          ],
        },
        { type: "Corpo", cells: [{ text: "x" }, { text: "y" }] },
      ],
      sequentialIds(),
    );

    expect(tableData.cols.map((col) => col.type)).toEqual([
      "Corpo",
      "Corpo",
      "Cabeçalho",
    ]);
    expect(textsOf(tableData)).toEqual(["A", "B", "C", "x", "y", ""]);
  });
});

describe("buildExpandedTableData - identificadores e ordenação", () => {
  it("numbers rows and columns sequentially and allocates row ids before column ids", () => {
    const tableData = buildExpandedTableData(
      [
        { type: "Cabeçalho", cells: [{ text: "A" }, { text: "B" }] },
        { type: "Corpo", cells: [{ text: "C" }, { text: "D" }] },
      ],
      sequentialIds(),
    );

    expect(tableData.rows.map((row) => [row.id, row.index])).toEqual([
      ["id-1", 1],
      ["id-2", 2],
    ]);
    expect(tableData.cols.map((col) => [col.id, col.index])).toEqual([
      ["id-3", 1],
      ["id-4", 2],
    ]);
    expect(tableData.cells.map((cell) => [cell.rowId, cell.colId])).toEqual([
      ["id-1", "id-3"],
      ["id-1", "id-4"],
      ["id-2", "id-3"],
      ["id-2", "id-4"],
    ]);
  });

  it("emits one cell per row/column pair, always with unitary spans", () => {
    const tableData = buildExpandedTableData(
      [
        { type: "Cabeçalho", cells: [{ text: "A", colSpan: 3 }] },
        { type: "Corpo", cells: [{ text: "B" }] },
      ],
      sequentialIds(),
    );

    expect(tableData.cells).toHaveLength(
      tableData.rows.length * tableData.cols.length,
    );
    expect(
      tableData.cells.every((cell) => cell.rowSpan === 1 && cell.colSpan === 1),
    ).toBe(true);
    expect(textsOf(tableData)).toEqual(["A", "A", "A", "B", "", ""]);
  });

  it("generates unique ids when no id factory is provided", () => {
    const tableData = buildExpandedTableData([
      { type: "Corpo", cells: [{ text: "a" }, { text: "b" }] },
    ]);

    const ids = [
      ...tableData.rows.map((row) => row.id),
      ...tableData.cols.map((col) => col.id),
    ];

    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => typeof id === "string" && id.length > 0)).toBe(
      true,
    );
  });
});
