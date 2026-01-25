import { createOpenAPI } from "fumadocs-openapi/server";

const apiUrl = process.env.API_URL || "http://localhost:3000";

export const fallbackSchema: any = {
  openapi: "3.0.0",
  info: {
    title: "API Reference",
    version: "1.0.0",
  },
  paths: {
    "/api/health": {
      get: {
        operationId: "getHealth",
        responses: {
          "200": {
            description: "OK",
          },
        },
      },
    },
  },
  servers: [{ url: apiUrl }],
  components: {
    schemas: {},
  },
};

export const openapi = createOpenAPI({
  input: async () => {
    // Check if we are in build phase
    const isBuild =
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.NODE_ENV === "production";

    // During build time, always use fallback to avoid prerendering errors
    if (isBuild && !process.env.BUILD_FETCH_OPENAPI) {
      return fallbackSchema;
    }

    try {
      const res = await fetch(`${apiUrl}/swagger/docs-json`, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        return fallbackSchema;
      }

      const schema = await res.json();

      if (schema && schema.openapi) {
        // Ensure servers is a valid array with at least one element
        const servers =
          Array.isArray(schema.servers) && schema.servers.length > 0
            ? schema.servers
            : fallbackSchema.servers;

        // Ensure all required fields for rendering are present in the final object
        const result = {
          ...schema,
          info: schema.info || fallbackSchema.info,
          paths: schema.paths || fallbackSchema.paths,
          servers,
        };

        // fumadocs-openapi uses some internal logic that might depend on the object structure
        // Let's ensure it's a plain object and has the minimal required fields
        return JSON.parse(JSON.stringify(result));
      }

      return fallbackSchema;
    } catch (_error) {
      return fallbackSchema;
    }
  },
});
