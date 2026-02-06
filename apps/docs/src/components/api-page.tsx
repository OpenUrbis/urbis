"use client";

import dynamic from "next/dynamic";
import { openapi } from "@/lib/openapi";
import client from "./api-page.client";

const BaseAPIPage = dynamic(
  async () => {
    const { createAPIPage } = await import("fumadocs-openapi/ui");
    const Component = await createAPIPage(openapi, { client });
    return () => Component as any;
  },
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>
    ),
  },
);

export function APIPage(props: any) {
  return <BaseAPIPage {...props} />;
}
