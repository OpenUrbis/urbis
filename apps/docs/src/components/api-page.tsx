"use client";

import { createAPIPage } from "fumadocs-openapi/ui";
import { fallbackSchema, openapi } from "@/lib/openapi";
import client from "./api-page.client";

// Ensure openapi has required fields for createAPIPage
const safeOpenapi = {
  ...openapi,
  servers: (openapi as any).servers ?? fallbackSchema.servers,
};

const BaseAPIPage = createAPIPage(safeOpenapi as any, {
  client,
});

export function APIPage(props: any) {
  // Always use fallbackSchema during prerendering/hydration to avoid issues
  // The client will eventually re-render with the correct data if needed.
  const safeProps = {
    ...props,
    document:
      props.document ??
      (typeof window === "undefined"
        ? fallbackSchema
        : (props.document ?? safeOpenapi)),
  };

  return <BaseAPIPage {...safeProps} />;
}
