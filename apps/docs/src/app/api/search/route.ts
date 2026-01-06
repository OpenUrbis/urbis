import { createFromSource } from "fumadocs-core/search/server";
import { source } from "src/lib/source";

export const { GET } = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: "english",
  buildIndex: (page) => {
    if (page.data.type === "openapi") {
      return {
        id: page.url,
        title: page.data.title ?? "",
        description: page.data.description,
        url: page.url,
        structuredData: {
          headings: [],
          contents: [
            {
              content: page.data.description ?? "",
              heading: undefined,
            },
          ],
        },
      };
    }

    return {
      id: page.url,
      title: page.data.title,
      description: page.data.description,
      url: page.url,
      structuredData: page.data.structuredData,
    };
  },
});
