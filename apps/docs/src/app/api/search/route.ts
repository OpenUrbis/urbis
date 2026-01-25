import { createFromSource } from "fumadocs-core/search/server";
import { source } from "src/lib/source";

export const { GET } = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: "english",
  buildIndex: (page) => {
    // During build, structuredData might be missing or incomplete for virtual pages
    // Ensure we provide fallbacks to avoid indexing failures
    return {
      id: page.url,
      title: (page.data as any).title ?? "Untitled",
      description: (page.data as any).description ?? "",
      url: page.url,
      structuredData: (page.data as any).structuredData ?? {
        headings: [],
        contents: [],
      },
    };
  },
});
