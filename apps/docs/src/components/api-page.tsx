import { dereference } from "@scalar/openapi-parser";
import { createAPIPage } from "fumadocs-openapi/ui";
import { fallbackSchema, openapi } from "@/lib/openapi";
import client from "./api-page.client";

export async function APIPage(props: any) {
  const Component = await createAPIPage(openapi, { client });

  // Fetch and wrap the document manually to ensure it is available and avoids internal processing errors
  let rawDocument = fallbackSchema;
  try {
    const res = await fetch(
      "https://api.mapa.urbis.sampa.br/swagger/docs-json",
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
      },
    );
    if (res.ok) {
      const schema = await res.json();
      if (schema?.openapi) {
        schema.servers =
          Array.isArray(schema.servers) && schema.servers.length > 0
            ? schema.servers
            : fallbackSchema.servers;
        rawDocument = schema;
      }
    }
  } catch (e) {
    console.error("Failed to fetch API document on server", e);
  }

  let dereferencedDoc = rawDocument;
  try {
    const { schema } = await dereference(rawDocument);
    if (schema) dereferencedDoc = schema;
  } catch (e) {
    console.error("Failed to dereference API document", e);
  }

  const processedDoc = {
    dereferenced: dereferencedDoc,
    bundled: rawDocument,
    getRawRef: () => undefined,
    _internal_idToSchema: () => new Map(),
  };

  // Generate operations list manually since we bypassed processing
  const operations: { path: string; method: any }[] = [];
  if (rawDocument.paths) {
    for (const [path, item] of Object.entries(rawDocument.paths)) {
      if (!item) continue;
      const methods = [
        "get",
        "post",
        "put",
        "delete",
        "patch",
        "head",
        "options",
        "trace",
      ];
      for (const method of methods) {
        if ((item as any)[method]) {
          operations.push({
            path,
            method,
          });
        }
      }
    }
  }

  // Pass document and operations explicitly to bypass internal resolution
  return (
    <Component {...props} document={processedDoc} operations={operations} />
  );
}
