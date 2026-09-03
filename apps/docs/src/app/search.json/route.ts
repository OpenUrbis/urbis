import { createFromSource } from "fumadocs-core/search/server";
import { source } from "@/lib/source";

export const dynamic = "force-static";
export const revalidate = false;

const server = createFromSource(source, {
  language: "portuguese",
});

export const GET = server.staticGET;
