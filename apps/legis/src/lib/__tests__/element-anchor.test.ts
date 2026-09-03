import { describe, expect, it } from "vitest";
import {
  elementAnchorAttributes,
  elementAnchorHref,
  elementAnchorId,
  elementAnchorOffset,
  findElementAnchorNode,
  parseElementAnchor,
  withElementAnchor,
} from "../element-anchor";

const ELEMENT_ID = "28348a9a-d41c-4d83-ac2b-733d0add4ada";

/** Raiz de busca falsa: o objetivo é a precedência dos seletores, não o DOM. */
const rootWith = (matches: Record<string, unknown>) =>
  ({
    querySelector: (selector: string) => matches[selector] ?? null,
  }) as unknown as ParentNode;

describe("parseElementAnchor", () => {
  it("reads the device id from the location hash", () => {
    expect(parseElementAnchor(`#el-${ELEMENT_ID}`)).toBe(ELEMENT_ID);
    expect(parseElementAnchor(`el-${ELEMENT_ID}`)).toBe(ELEMENT_ID);
  });

  it("decodes hashes escaped by the browser", () => {
    expect(
      parseElementAnchor(`#${encodeURIComponent(`el-${ELEMENT_ID}`)}`),
    ).toBe(ELEMENT_ID);
  });

  it("ignores hashes that do not address a device", () => {
    expect(parseElementAnchor("#ficha")).toBeNull();
    expect(parseElementAnchor("#el-")).toBeNull();
    expect(parseElementAnchor("")).toBeNull();
    expect(parseElementAnchor(undefined)).toBeNull();
  });
});

describe("element anchor targets", () => {
  it("keeps href, id and target attributes in the same shape", () => {
    expect(elementAnchorId(ELEMENT_ID)).toBe(`el-${ELEMENT_ID}`);
    expect(elementAnchorHref(ELEMENT_ID)).toBe(`#el-${ELEMENT_ID}`);
    expect(elementAnchorAttributes(ELEMENT_ID)).toEqual({
      id: `el-${ELEMENT_ID}`,
      "data-element-anchor": ELEMENT_ID,
    });
  });
});

describe("withElementAnchor", () => {
  it("carries the anchor across screens", () => {
    expect(withElementAnchor("/pages/abc/edit", `#el-${ELEMENT_ID}`)).toBe(
      `/pages/abc/edit#el-${ELEMENT_ID}`,
    );
  });

  it("leaves the url alone without a device in the hash", () => {
    expect(withElementAnchor("/pages/abc/edit", "#ficha")).toBe(
      "/pages/abc/edit",
    );
    expect(withElementAnchor("/pages/abc/edit")).toBe("/pages/abc/edit");
  });

  it("does not stack anchors on a url that already has one", () => {
    expect(withElementAnchor("/pages/abc#el-1", `#el-${ELEMENT_ID}`)).toBe(
      "/pages/abc#el-1",
    );
  });
});

describe("elementAnchorOffset", () => {
  it("stacks the app header, the measured page bar and the breathing room", () => {
    expect(elementAnchorOffset(56.4)).toBe(
      "calc(var(--header-height, 0px) + 56px + 1.5rem)",
    );
  });

  it("drops the app header where the scroll is internal to the screen", () => {
    expect(elementAnchorOffset(0, { includeAppHeader: false })).toBe(
      "calc(0px + 1.5rem)",
    );
  });

  it("survives an unmeasured bar", () => {
    expect(elementAnchorOffset(Number.NaN)).toBe(
      "calc(var(--header-height, 0px) + 0px + 1.5rem)",
    );
    expect(elementAnchorOffset(-10)).toBe(
      "calc(var(--header-height, 0px) + 0px + 1.5rem)",
    );
  });
});

describe("findElementAnchorNode", () => {
  it("prefers the reader anchor", () => {
    const target = { anchor: true };
    const node = findElementAnchorNode(
      ELEMENT_ID,
      rootWith({
        [`[data-element-anchor="${ELEMENT_ID}"]`]: target,
        [`[data-normative-id="${ELEMENT_ID}"]`]: { other: true },
      }),
    );

    expect(node).toBe(target);
  });

  it("falls back to the id, for markup that only carries the hash target", () => {
    const target = { byId: true };
    const node = findElementAnchorNode(
      ELEMENT_ID,
      rootWith({
        [`[id="el-${ELEMENT_ID}"]`]: target,
      }),
    );

    expect(node).toBe(target);
  });

  it("finds the device as an editor block", () => {
    const target = { block: true };
    const node = findElementAnchorNode(
      ELEMENT_ID,
      rootWith({
        [`[data-normative-id="${ELEMENT_ID}"]`]: target,
      }),
    );

    expect(node).toBe(target);
  });

  it("escapes ids that would break the selector", () => {
    const target = { quoted: true };
    const node = findElementAnchorNode(
      'el"ug',
      rootWith({
        '[data-element-anchor="el\\"ug"]': target,
      }),
    );

    expect(node).toBe(target);
  });

  it("returns nothing when there is no document to search", () => {
    expect(findElementAnchorNode(ELEMENT_ID, null)).toBeNull();
    expect(findElementAnchorNode("", rootWith({}))).toBeNull();
  });
});
