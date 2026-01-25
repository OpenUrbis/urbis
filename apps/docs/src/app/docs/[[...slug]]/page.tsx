import { APIPage } from "@/components/api-page";
import { fallbackSchema } from "@/lib/openapi";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMDXComponents } from "src/mdx-components";
import { getPageImage, source } from "src/lib/source";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;

  // Check if it's an OpenAPI page by slug
  const isOpenApiSlug = params.slug && params.slug[0] === "openapi";

  if (isOpenApiSlug) {
    return (
      <DocsPage full>
        <h1 className="text-[1.75em] font-semibold">API Reference</h1>
        <DocsBody>
          <APIPage document={fallbackSchema as any} />
        </DocsBody>
      </DocsPage>
    );
  }

  const page = source.getPage(params.slug);
  if (!page) notFound();

  // Handle virtual pages correctly
  if ((page.data as any).type === "openapi") {
    return (
      <DocsPage full>
        <h1 className="text-[1.75em] font-semibold">
          {(page.data as any).title ?? "API Reference"}
        </h1>
        <DocsBody>
          <APIPage document={fallbackSchema as any} />
        </DocsBody>
      </DocsPage>
    );
  }

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  const params = await source.generateParams();
  // Filter out any params that start with openapi
  return params.filter((p) => !p.slug || p.slug[0] !== "openapi");
}

export async function generateMetadata(
  props: PageProps<"/docs/[[...slug]]">,
): Promise<Metadata> {
  const params = await props.params;

  if (params.slug && params.slug[0] === "openapi") {
    return {
      title: "API Reference",
      description: "API Reference document",
    };
  }

  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
