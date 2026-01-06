import type { HTMLAttributes } from "react";
import { cn } from "src/lib/cn";

export interface ContributorCounterProps
  extends HTMLAttributes<HTMLDivElement> {
  repoOwner: string;
  repoName: string;
  displayCount?: number;
}

export default function ContributorCounter({
  repoOwner,
  repoName,
  displayCount = 20,
  ...props
}: ContributorCounterProps) {
  return (
    <div
      {...props}
      className={cn("flex flex-col items-center gap-4", props.className)}
    >
      <div className="flex flex-row flex-wrap items-center justify-center md:pe-4">
        {/* Mock contributors */}
        <div className="size-10 rounded-full bg-fd-muted border-4 border-fd-background" />
        <div className="size-10 rounded-full bg-fd-muted border-4 border-fd-background -ml-4" />
        <div className="size-10 rounded-full bg-fd-muted border-4 border-fd-background -ml-4" />
      </div>
      <div className="text-center text-sm text-fd-muted-foreground">
        Powered by open source contributors.
      </div>
    </div>
  );
}
