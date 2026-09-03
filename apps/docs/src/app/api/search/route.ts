import { createFromSource } from "fumadocs-core/search/server";
import { source } from "src/lib/source";

export const dynamic = "force-static";
export const revalidate = false;

const server = createFromSource(source, {
  language: "english",
  buildIndex: (page) => ({
    id: page.url,
    title: (page.data as any).title ?? "Untitled",
    description: (page.data as any).description ?? "",
    url: page.url,
    structuredData: (page.data as any).structuredData ?? {
      headings: [],
      contents: [],
    },
  }),
});

export const GET = server.staticGET;
