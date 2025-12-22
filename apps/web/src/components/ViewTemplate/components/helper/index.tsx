import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const Helper = ({
  properties,
  children,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any;
}) => {
  const { helper } = properties ?? {};

  return helper ? (
    <div className="flex items-center">
      {children}
      <section className="ml-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="material-symbols-outlined text-sm text-muted-foreground cursor-help">info</span>
            </TooltipTrigger>
            <TooltipContent align="end" className="max-w-[300px]">
              <p className="font-semibold">Ajuda</p>
              <p className="text-sm">{helper}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </section>
    </div>
  ) : (
    children
  );
};
