import { docs } from "fumadocs-mdx:collections/server";
import { type InferPageType, loader, multiple } from "fumadocs-core/source";
import { openapiPlugin } from "fumadocs-openapi/server";
import { icons } from "lucide-react";
import { createElement } from "react";

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader(
  multiple({
    docs: docs.toFumadocsSource(),
  }),
  {
    baseUrl: "/docs",
    plugins: [openapiPlugin()],
    icon(icon) {
      if (!icon) return;
      if (icon in icons) {
        return createElement(icons[icon as keyof typeof icons]);
      }
      const pascalCase = icon
        .split("-")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join("");
      if (pascalCase in icons) {
        return createElement(icons[pascalCase as keyof typeof icons]);
      }
    },
  },
);

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, "image.png"];

  return {
    segments,
    url: `/og/docs/${segments.join("/")}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await (page.data as any).getText("processed");

  return `# ${(page.data as any).title}

${processed}`;
}
