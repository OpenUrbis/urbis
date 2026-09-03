import { describe, expect, it } from "vitest";
import { buildExpandedTableData } from "./table-utils";

describe("buildExpandedTableData", () => {
  it("expands colSpan into repeated individual cells", () => {
    let idCounter = 0;

    const tableData = buildExpandedTableData(
      [
        {
          type: "Cabeçalho",
          cells: [
            { text: "Valores", colSpan: 2 },
            { text: "Total", colSpan: 1 },
          ],
        },
      ],
      () => `id-${++idCounter}`,
    );

    expect(tableData.cols).toHaveLength(3);
    expect(tableData.cells.map((cell) => cell.text)).toEqual([
      "Valores",
      "Valores",
      "Total",
    ]);
    expect(
      tableData.cells.every((cell) => cell.colSpan === 1 && cell.rowSpan === 1),
    ).toBe(true);
  });

  it("expands rowSpan into repeated individual cells on subsequent rows", () => {
    let idCounter = 0;

    const tableData = buildExpandedTableData(
      [
        {
          type: "Cabeçalho",
          cells: [{ text: "Categoria", rowSpan: 2 }, { text: "Valor A" }],
        },
        {
          type: "Corpo",
          cells: [{ text: "Valor B" }],
        },
      ],
      () => `id-${++idCounter}`,
    );

    const row1 = tableData.cells.slice(0, 2).map((cell) => cell.text);
    const row2 = tableData.cells.slice(2, 4).map((cell) => cell.text);

    expect(tableData.rows).toHaveLength(2);
    expect(tableData.cols).toHaveLength(2);
    expect(row1).toEqual(["Categoria", "Valor A"]);
    expect(row2).toEqual(["Categoria", "Valor B"]);
    expect(
      tableData.cells.every((cell) => cell.colSpan === 1 && cell.rowSpan === 1),
    ).toBe(true);
  });

  it("expands combined rowSpan and colSpan across the full occupied grid", () => {
    let idCounter = 0;

    const tableData = buildExpandedTableData(
      [
        {
          type: "Cabeçalho",
          cells: [{ text: "Bloco", rowSpan: 2, colSpan: 2 }, { text: "Fim" }],
        },
        {
          type: "Corpo",
          cells: [{ text: "Linha 2" }],
        },
      ],
      () => `id-${++idCounter}`,
    );

    const row1 = tableData.cells.slice(0, 3).map((cell) => cell.text);
    const row2 = tableData.cells.slice(3, 6).map((cell) => cell.text);

    expect(tableData.cols).toHaveLength(3);
    expect(row1).toEqual(["Bloco", "Bloco", "Fim"]);
    expect(row2).toEqual(["Bloco", "Bloco", "Linha 2"]);
  });
});
