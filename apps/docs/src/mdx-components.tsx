import defaultMdxComponents from "fumadocs-ui/mdx";
import { icons } from "lucide-react";
import type { MDXComponents } from "mdx/types";
import {
  type ComponentProps,
  createElement,
  isValidElement,
  type ReactNode,
} from "react";
import { APIPage } from "./components/api-page";
import { Mermaid } from "./components/mermaid";

const BaseCard = defaultMdxComponents.Card;
const BasePre = defaultMdxComponents.pre;

function Card({ icon, ...props }: ComponentProps<typeof BaseCard>) {
  let resolvedIcon = icon;
  if (typeof icon === "string") {
    if (icon in icons) {
      resolvedIcon = createElement(icons[icon as keyof typeof icons]);
    } else {
      const pascalCase = icon
        .split("-")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join("");
      if (pascalCase in icons) {
        resolvedIcon = createElement(icons[pascalCase as keyof typeof icons]);
      }
    }
  }
  return <BaseCard icon={resolvedIcon} {...props} />;
}

function extractText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    if (props?.children) {
      return extractText(props.children);
    }
  }
  return "";
}

function Pre(props: ComponentProps<typeof BasePre>) {
  const lang = (props as any)["data-language"] || (props as any)["data-lang"];
  const className = (props as any).className || "";

  if (lang === "mermaid" || className.includes("language-mermaid")) {
    const code = extractText(props.children);
    return <Mermaid chart={code} />;
  }

  return <BasePre {...props} />;
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Card,
    pre: Pre,
    Mermaid,
    ...components,
    APIPage,
  };
}
