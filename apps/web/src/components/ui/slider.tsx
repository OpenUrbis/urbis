"use client";

import * as React from "react";
import { SliderPrimitive } from "@open-urbis/map-ui";

import { cn } from "../../lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    className?: string;
  }
>(({ className, ...props }, ref) => {
  const value = props.value || props.defaultValue || [props.min ?? 0];
  const numberOfThumbs = Array.isArray(value) ? value.length : 1;
  const min = props.min ?? 0;
  const max = props.max ?? 100;
  const range = max - min || 1;

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {Array.from({ length: numberOfThumbs }).map((_, i) => {
        const currentValue = (Array.isArray(value) ? value[i] : value) ?? min;
        const percentage = Math.max(
          0,
          Math.min(100, ((Number(currentValue) - min) / range) * 100),
        );

        return (
          <SliderPrimitive.Thumb
            key={i}
            index={i}
            className="!block h-5 w-5 rounded-full border-2 border-primary bg-white ring-offset-background transition-colors hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 z-50 shadow-sm cursor-grab active:cursor-grabbing"
            style={{ left: `calc(${percentage}% - 10px)` }}
          />
        );
      })}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
