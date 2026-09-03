import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ValidityInputFields } from "../ValidityInputFields";
import { createEmptyValidity } from "../../../domain/validity";

describe("ValidityInputFields", () => {
  it("renders with disabled date input", () => {
    const html = renderToStaticMarkup(
      <ValidityInputFields
        value={createEmptyValidity()}
        onChange={vi.fn()}
        onOpenLinkManager={vi.fn()}
      />,
    );

    expect(html).toContain("disabled");
    expect(html).toContain("Selecionar elemento");
  });

  it("displays linked element label when validity is linked", () => {
    const validity = {
      date: "15.05.2016",
      deviceId: "Art. 1º",
      normativeElementId: "el-123",
    };

    const html = renderToStaticMarkup(
      <ValidityInputFields
        value={validity}
        onChange={vi.fn()}
        onOpenLinkManager={vi.fn()}
        linkLabel="Lei 1.234 - Art. 1º"
      />,
    );

    expect(html).toContain("15/05/2016");
    expect(html).toContain("Lei 1.234 - Art. 1º");
    expect(html).toContain("(do elemento vinculado)");
  });
});
