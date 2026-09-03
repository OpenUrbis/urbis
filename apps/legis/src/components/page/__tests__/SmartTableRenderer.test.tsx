import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  TableCell,
  TableCol,
  TableData,
  TableRow,
} from "../../../domain/types";
import { SmartTableRenderer } from "../SmartTableRenderer";

/**
 * Rendering of the normative tables (Anexos, quadros de usos, tabelas de
 * parâmetros).
 *
 * These tables carry planning parameters, so a wrong merge is a wrong rule: two
 * cells collapsed by mistake attribute one zone's coefficient to another. The
 * renderer auto-merges neighbouring cells with identical content, which is what
 * these tests pin down.
 */

function row(
  id: string,
  index: number,
  type: TableRow["type"] = "Corpo",
): TableRow {
  return { id, index, type };
}

function col(
  id: string,
  index: number,
  type: TableCol["type"] = "Corpo",
): TableCol {
  return { id, index, type };
}

function cell(rowId: string, colId: string, text: string): TableCell {
  return { rowId, colId, text };
}

function table(overrides: Partial<TableData> = {}): TableData {
  return {
    rows: [row("r1", 1), row("r2", 2)],
    cols: [col("c1", 1), col("c2", 2)],
    cells: [
      cell("r1", "c1", "Zona"),
      cell("r1", "c2", "Coeficiente"),
      cell("r2", "c1", "ZEU"),
      cell("r2", "c2", "4,0"),
    ],
    ...overrides,
  };
}

function render(data: TableData, onSelect?: () => void) {
  return renderToStaticMarkup(
    <SmartTableRenderer data={data} onSelect={onSelect} />,
  );
}

/** Cell contents in document order, tag included, so merges are visible. */
function cellsOf(html: string): string[] {
  return [...html.matchAll(/<(t[hd])\b[^>]*>(.*?)<\/\1>/g)].map(
    (match) => match[2],
  );
}

/**
 * `rowspan`x`colspan` of each rendered cell.
 *
 * Read case-insensitively and order-independently on purpose: React lowercases
 * `rowSpan` but emits `colSpan` as written, so the markup mixes both spellings.
 * HTML attribute names are case-insensitive, so this is cosmetic — but a test
 * that depended on the spelling would break on any React upgrade.
 */
function spansOf(html: string): string[] {
  return [...html.matchAll(/<t[hd]\b([^>]*)>/gi)].map(([, attributes]) => {
    const rowSpan = /\browspan="(\d+)"/i.exec(attributes)?.[1] ?? "1";
    const colSpan = /\bcolspan="(\d+)"/i.exec(attributes)?.[1] ?? "1";
    return `${rowSpan}x${colSpan}`;
  });
}

describe("a table with nothing to show", () => {
  it("renders nothing when there are no rows", () => {
    expect(render(table({ rows: [] }))).toBe("");
  });

  it("renders nothing when the rows are missing altogether", () => {
    expect(render(table({ rows: undefined as unknown as TableRow[] }))).toBe(
      "",
    );
  });

  it("survives a table whose rows disappear between renders", () => {
    // The hook count must not depend on the data, otherwise React tears the
    // component down with "rendered fewer hooks than expected".
    expect(() => {
      render(table());
      render(table({ rows: [] }));
      render(table());
    }).not.toThrow();
  });
});

describe("structure", () => {
  it("renders one cell per row and column", () => {
    expect(cellsOf(render(table()))).toEqual([
      "Zona",
      "Coeficiente",
      "ZEU",
      "4,0",
    ]);
  });

  it("marks the cells of a header row as headers", () => {
    const html = render(
      table({
        rows: [row("r1", 1, "Cabeçalho"), row("r2", 2)],
      }),
    );

    expect(html).toContain("<th");
    expect((html.match(/<th\b/g) ?? []).length).toBe(2);
    expect((html.match(/<td\b/g) ?? []).length).toBe(2);
  });

  it("marks the cells of a header column as headers", () => {
    const html = render(
      table({
        cols: [col("c1", 1, "Cabeçalho"), col("c2", 2)],
      }),
    );

    expect((html.match(/<th/g) ?? []).length).toBe(2);
    expect((html.match(/<td/g) ?? []).length).toBe(2);
  });

  it("orders rows and columns by their index, not by array position", () => {
    const html = render(
      table({
        rows: [row("r2", 2), row("r1", 1)],
        cols: [col("c2", 2), col("c1", 1)],
      }),
    );

    expect(cellsOf(html)).toEqual(["Zona", "Coeficiente", "ZEU", "4,0"]);
  });

  it("renders an empty cell where the data has none, keeping the grid aligned", () => {
    const html = render(
      table({
        cells: [cell("r1", "c1", "Zona"), cell("r2", "c2", "4,0")],
      }),
    );

    expect(cellsOf(html)).toEqual(["Zona", "", "", "4,0"]);
  });

  it("shows the source note under the table", () => {
    expect(render(table({ footer: "Fonte: SMUL, 2016." }))).toContain(
      "Fonte: SMUL, 2016.",
    );
  });

  it("omits the note area when there is no source", () => {
    expect(render(table())).not.toContain("border-t");
  });
});

describe("cell content", () => {
  it("keeps the formatting of the cell", () => {
    expect(
      cellsOf(
        render(
          table({
            cells: [cell("r1", "c1", "<strong>ZEU</strong>")],
          }),
        ),
      )[0],
    ).toBe("<strong>ZEU</strong>");
  });

  it("drops the ellipsis used as a filler in imported tables", () => {
    expect(
      cellsOf(
        render(
          table({
            cells: [cell("r1", "c1", "ZEU...")],
          }),
        ),
      )[0],
    ).toBe("ZEU");
  });

  it("trims the stored text", () => {
    expect(
      cellsOf(
        render(
          table({
            cells: [cell("r1", "c1", "   ZEU   ")],
          }),
        ),
      )[0],
    ).toBe("ZEU");
  });
});

describe("merging neighbouring cells with identical content", () => {
  it("merges a run of identical cells across a row", () => {
    const html = render(
      table({
        cols: [col("c1", 1), col("c2", 2), col("c3", 3)],
        rows: [row("r1", 1)],
        cells: [
          cell("r1", "c1", "Não aplicável"),
          cell("r1", "c2", "Não aplicável"),
          cell("r1", "c3", "Não aplicável"),
        ],
      }),
    );

    // One cell spanning three columns, instead of the same words three times.
    expect(cellsOf(html)).toEqual(["Não aplicável"]);
    expect(spansOf(html)).toEqual(["1x3"]);
  });

  it("merges a run of identical cells down a column", () => {
    const html = render(
      table({
        rows: [row("r1", 1), row("r2", 2), row("r3", 3)],
        cols: [col("c1", 1)],
        cells: [
          cell("r1", "c1", "ZEU"),
          cell("r2", "c1", "ZEU"),
          cell("r3", "c1", "ZEU"),
        ],
      }),
    );

    expect(cellsOf(html)).toEqual(["ZEU"]);
    expect(spansOf(html)).toEqual(["3x1"]);
  });

  it("never merges empty cells, which would collapse the grid", () => {
    const html = render(
      table({
        rows: [row("r1", 1)],
        cols: [col("c1", 1), col("c2", 2), col("c3", 3)],
        cells: [
          cell("r1", "c1", ""),
          cell("r1", "c2", ""),
          cell("r1", "c3", ""),
        ],
      }),
    );

    expect(cellsOf(html)).toEqual(["", "", ""]);
    expect(spansOf(html)).toEqual(["1x1", "1x1", "1x1"]);
  });

  it("compares the words, ignoring the formatting around them", () => {
    const html = render(
      table({
        rows: [row("r1", 1)],
        cols: [col("c1", 1), col("c2", 2)],
        cells: [cell("r1", "c1", "<b>ZEU</b>"), cell("r1", "c2", "ZEU")],
      }),
    );

    expect(spansOf(html)).toEqual(["1x2"]);
  });

  it("starts a new run when the content changes", () => {
    const html = render(
      table({
        rows: [row("r1", 1)],
        cols: [col("c1", 1), col("c2", 2), col("c3", 3), col("c4", 4)],
        cells: [
          cell("r1", "c1", "ZEU"),
          cell("r1", "c2", "ZEU"),
          cell("r1", "c3", "ZEM"),
          cell("r1", "c4", "ZEM"),
        ],
      }),
    );

    expect(cellsOf(html)).toEqual(["ZEU", "ZEM"]);
    expect(spansOf(html)).toEqual(["1x2", "1x2"]);
  });

  it("merges a block down only when the rows have the same shape", () => {
    // Same content, same colSpan on both rows: the block is a rectangle.
    const html = render(
      table({
        rows: [row("r1", 1), row("r2", 2)],
        cols: [col("c1", 1), col("c2", 2)],
        cells: [
          cell("r1", "c1", "ZEU"),
          cell("r1", "c2", "ZEU"),
          cell("r2", "c1", "ZEU"),
          cell("r2", "c2", "ZEU"),
        ],
      }),
    );

    expect(cellsOf(html)).toEqual(["ZEU"]);
    expect(spansOf(html)).toEqual(["2x2"]);
  });

  it("does not merge down when the run widths differ", () => {
    const html = render(
      table({
        rows: [row("r1", 1), row("r2", 2)],
        cols: [col("c1", 1), col("c2", 2)],
        cells: [
          cell("r1", "c1", "ZEU"),
          cell("r1", "c2", "ZEU"),
          cell("r2", "c1", "ZEU"),
          cell("r2", "c2", "ZEM"),
        ],
      }),
    );

    expect(cellsOf(html)).toEqual(["ZEU", "ZEU", "ZEM"]);
  });

  it("keeps a single cell unmerged", () => {
    const html = render(
      table({
        rows: [row("r1", 1)],
        cols: [col("c1", 1)],
        cells: [cell("r1", "c1", "ZEU")],
      }),
    );

    expect(cellsOf(html)).toEqual(["ZEU"]);
    expect(spansOf(html)).toEqual(["1x1"]);
  });
});

describe("selection", () => {
  it("offers the pointer only when the table can be selected", () => {
    expect(render(table(), () => undefined)).toContain("cursor-pointer");
    expect(render(table())).not.toContain("cursor-pointer");
  });
});
