"use client"

import * as React from "react"
import * as SliderPrimitiveRaw from "./slider-primitive"

import { cn } from "../../lib/utils"

export const SliderPrimitive = SliderPrimitiveRaw;

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitiveRaw.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitiveRaw.Root> & { className?: string }
>(({ className, ...props }, ref) => {
  const value = props.value || props.defaultValue;
  const numberOfThumbs = Array.isArray(value) ? value.length : 1;

  return (
    <SliderPrimitiveRaw.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitiveRaw.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-200">
        <SliderPrimitiveRaw.Range className="absolute h-full bg-slate-900" />
      </SliderPrimitiveRaw.Track>
      {Array.from({ length: numberOfThumbs }).map((_, i) => {
        const val = (Array.isArray(value) ? value[i] : value) ?? 0;
        const sMin = props.min ?? 0;
        const sMax = props.max ?? 100;
        const percentage = Math.max(0, Math.min(100, ((val as number - sMin) / (sMax - sMin)) * 100));
        
        return (
          <SliderPrimitiveRaw.Thumb
            key={i}
            // Workaround for Preact issue where Radix cannot infer the index automatically
            index={i}
            className="!block h-5 w-5 rounded-full border-2 border-slate-900 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-md cursor-grab active:cursor-grabbing hover:scale-110 z-50"
            style={{ left: `calc(${percentage}% - 10px)` }}
          />
        );
      })}
    </SliderPrimitiveRaw.Root>
  )
})
Slider.displayName = SliderPrimitiveRaw.Root.displayName

export { Slider }
