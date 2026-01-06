import * as Base from "fumadocs-ui/components/codeblock";
import { cn } from "src/lib/cn";

export interface CodeBlockProps {
  code: string;
  wrapper?: Base.CodeBlockProps;
  lang: string;
}

export function CodeBlock({ code, wrapper, lang }: CodeBlockProps) {
  return (
    <Base.CodeBlock
      {...wrapper}
      className={cn("my-0 pl-4", wrapper?.className)}
    >
      <Base.Pre lang={lang}>{code}</Base.Pre>
    </Base.CodeBlock>
  );
}
