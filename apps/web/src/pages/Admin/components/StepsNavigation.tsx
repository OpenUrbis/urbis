import { cn } from "@/lib/utils";

interface Step {
  number: number;
  label: string;
}

interface StepsNavigationProps {
  steps: Step[];
  currentStep: number;
  maxReachedStep: number;
  onStepClick: (step: number) => void;
}

export const StepsNavigation = ({
  steps,
  currentStep,
  maxReachedStep,
  onStepClick,
}: StepsNavigationProps) => {
  return (
    <nav aria-label="Steps" className="flex justify-center w-full">
      <ol className="flex items-center w-full max-w-3xl">
        {steps.map((s, i) => (
          <li
            key={s.number}
            className={cn(
              "flex items-center relative",
              i !== steps.length - 1 ? "flex-1" : ""
            )}
          >
            <div className="flex flex-col items-center relative">
              <button
                type="button"
                onClick={() => onStepClick(s.number)}
                disabled={s.number > maxReachedStep}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors z-10",
                  currentStep === s.number
                    ? "border-primary bg-primary text-primary-foreground font-bold shadow-sm"
                    : s.number <= maxReachedStep
                    ? "border-primary bg-background text-primary"
                    : "border-muted bg-background text-muted-foreground cursor-not-allowed"
                )}
              >
                {s.number}
              </button>
              <span
                className={cn(
                  "absolute top-10 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap hidden min-[1200px]:block",
                  currentStep === s.number
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
            {i !== steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-full mx-2",
                  s.number < maxReachedStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
