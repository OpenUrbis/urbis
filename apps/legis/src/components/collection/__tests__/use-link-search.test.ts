import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NormativeElementEntity } from "../../../domain/entities";
import type { SearchCondition } from "../../../services/page-service";
import { pageService } from "../../../services/page-service";
import {
  LOCAL_DOCUMENT_ID,
  buildConditions,
  runLinkSearch,
  searchLocalElements,
} from "../use-link-search";

vi.mock("../../../services/page-service", () => ({
  pageService: {
    searchNormativeElements: vi.fn(),
    getById: vi.fn(),
  },
}));

const searchSpy = vi.mocked(pageService.searchNormativeElements);

function makeElement(
  overrides: Partial<NormativeElementEntity> = {},
): NormativeElementEntity {
  return {
    id: "local-1",
    type: "Artigo",
    index: "1º",
    text: "<p>Art. 1º - Fica criado o teto verde municipal.</p>",
    originalStartValidity: { date: "", deviceId: "" },
    specialSituations: [],
    ...overrides,
  } as NormativeElementEntity;
}

const TERM_CONDITION: SearchCondition[] = [
  {
    id: "simple-term",
    field: "term",
    operator: "contains",
    value: "teto",
    connector: "AND",
  },
];

beforeEach(() => {
  searchSpy.mockReset();
  searchSpy.mockResolvedValue([]);
});

describe("buildConditions", () => {
  it("turns a plain term into a condition", () => {
    expect(buildConditions("teto", [])).toEqual([
      {
        id: "simple-term",
        field: "term",
        operator: "contains",
        value: "teto",
        connector: "AND",
      },
    ]);
  });

  it("appends the advanced filters and drops the empty ones", () => {
    const filters: SearchCondition[] = [
      {
        id: "a",
        field: "normativeType",
        operator: "equals",
        value: "L",
        connector: "AND",
      },
      {
        id: "b",
        field: "actDate",
        operator: "contains",
        value: "   ",
        connector: "AND",
      },
    ];

    expect(buildConditions("teto", filters)).toHaveLength(2);
  });

  it("returns nothing when there is neither term nor filter", () => {
    expect(buildConditions("", [])).toEqual([]);
  });
});

describe("searchLocalElements", () => {
  it("matches against the plain text of the element", () => {
    const found = searchLocalElements([makeElement()], TERM_CONDITION);

    expect(found).toHaveLength(1);
    expect(found[0].pageId).toBe(LOCAL_DOCUMENT_ID);
  });

  it("returns nothing without conditions, instead of every element", () => {
    expect(searchLocalElements([makeElement()], [])).toEqual([]);
  });
});

describe("runLinkSearch", () => {
  it("queries the backend even when local elements are provided", async () => {
    // Regression: the two scopes used to be an either/or, so supplying
    // `localElements` silently disabled the remote search entirely.
    await runLinkSearch([makeElement()], TERM_CONDITION);

    expect(searchSpy).toHaveBeenCalledTimes(1);
    expect(searchSpy).toHaveBeenCalledWith({ conditions: TERM_CONDITION });
  });

  it("queries the backend when there are no local elements", async () => {
    await runLinkSearch(undefined, TERM_CONDITION);

    expect(searchSpy).toHaveBeenCalledTimes(1);
  });

  it("merges local and remote results", async () => {
    searchSpy.mockResolvedValue([
      {
        pageId: "doc-9",
        pageTitle: "Lei 1",
        elementId: "remote-1",
        type: "Artigo",
        text: "teto",
      },
    ]);

    const { results } = await runLinkSearch([makeElement()], TERM_CONDITION);

    expect(results.map((result) => result.elementId)).toEqual([
      "local-1",
      "remote-1",
    ]);
  });

  it("puts local results first", async () => {
    searchSpy.mockResolvedValue([
      {
        pageId: "doc-9",
        pageTitle: "Lei 1",
        elementId: "remote-1",
        type: "Artigo",
        text: "teto",
      },
    ]);

    const { results } = await runLinkSearch([makeElement()], TERM_CONDITION);

    expect(results[0].pageId).toBe(LOCAL_DOCUMENT_ID);
  });

  it("does not duplicate an element returned by both scopes", async () => {
    searchSpy.mockResolvedValue([
      {
        pageId: "doc-9",
        pageTitle: "Lei 1",
        elementId: "local-1",
        type: "Artigo",
        text: "teto",
      },
    ]);

    const { results } = await runLinkSearch([makeElement()], TERM_CONDITION);

    expect(results).toHaveLength(1);
  });

  it("reports the local results early, before the network answers", async () => {
    const onLocal = vi.fn();
    await runLinkSearch([makeElement()], TERM_CONDITION, onLocal);

    expect(onLocal).toHaveBeenCalledTimes(1);
    expect(onLocal.mock.calls[0][0][0].elementId).toBe("local-1");
  });

  it("keeps the local results when the remote query fails", async () => {
    searchSpy.mockRejectedValue(new Error("offline"));

    const { results, error } = await runLinkSearch(
      [makeElement()],
      TERM_CONDITION,
    );

    expect(results).toHaveLength(1);
    expect(error).toBeTruthy();
  });

  it("surfaces the error when the remote query fails and there is no local match", async () => {
    searchSpy.mockRejectedValue(new Error("offline"));

    const { results, error } = await runLinkSearch(undefined, TERM_CONDITION);

    expect(results).toEqual([]);
    expect(error).toBeTruthy();
  });

  it("resolves even when called repeatedly, as StrictMode does on mount", async () => {
    // Regression: a "mounted" ref was cleared by StrictMode's double mount and
    // never restored, so every response was discarded and the spinner stayed on
    // "Buscando…" forever. The search itself must stay free of that state.
    searchSpy.mockResolvedValue([
      {
        pageId: "doc-9",
        pageTitle: "Lei 1",
        elementId: "remote-1",
        type: "Artigo",
        text: "teto",
      },
    ]);

    const first = await runLinkSearch(undefined, TERM_CONDITION);
    const second = await runLinkSearch(undefined, TERM_CONDITION);

    expect(first.results).toHaveLength(1);
    expect(second.results).toHaveLength(1);
    expect(searchSpy).toHaveBeenCalledTimes(2);
  });

  it("never leaves the outcome undefined, so the caller can always stop the spinner", async () => {
    searchSpy.mockRejectedValue(new Error("offline"));

    const outcome = await runLinkSearch([makeElement()], TERM_CONDITION);

    expect(outcome).toHaveProperty("results");
    expect(outcome).toHaveProperty("error");
  });
});
