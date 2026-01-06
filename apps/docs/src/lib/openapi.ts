import { createOpenAPI } from "fumadocs-openapi/server";

export const openapi = createOpenAPI({
  // the OpenAPI schema, you can also give it an external URL.
  input: async () => {
    const apiUrl = process.env.API_URL || "http://localhost:3000";

    try {
      const res = await fetch(`${apiUrl}/swagger/docs-json`);

      if (!res.ok) {
        throw new Error(`Failed to fetch OpenAPI schema: ${res.statusText}`);
      }

      const schema = await res.json();

      // Explicitly set the server URL to ensure consistency between server and client rendering
      schema.servers = [{ url: apiUrl }];

      return {
        api: schema,
      };
    } catch (_error) {
      console.warn("Could not fetch OpenAPI schema, using empty schema:");
      return {
        api: {
          openapi: "3.0.0",
          info: {
            title: "API",
            version: "0.0.0",
          },
          paths: {},
        },
      };
    }
  },
});
