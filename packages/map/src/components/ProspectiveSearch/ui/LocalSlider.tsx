import * as React from "react"
import { SliderPrimitive } from "@open-urbis/map-ui"

// Simplified class merger
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}

interface LocalSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Slider> {
  ticks?: number;
  tickLabels?: (string | number)[];
  min?: number;
  max?: number;
  step?: number;
  value?: number[];
  defaultValue?: number[];
}

const LocalSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Slider>,
  LocalSliderProps
>(({ className, ticks, tickLabels, min = 0, max = 100, step = 1, ...props }, ref) => {
  const value = props.value || props.defaultValue || [min];
  const numberOfThumbs = Array.isArray(value) ? value.length : 1;

  return (
    <SliderPrimitive.Slider
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center h-5",
        className
      )}
      min={min}
      max={max}
      step={step}
      {...props}
    >
      <SliderPrimitive.SliderTrack className="relative h-1 w-full grow rounded-full bg-slate-200 dark:bg-slate-800 overflow-visible">
        <SliderPrimitive.SliderRange className="absolute h-full bg-primary rounded-full" />
        {/* Visual Ticks - Absolute positioned for precision */}
       <div className="ml-4 ">
        <div className="relative">

         {ticks && ticks > 1 && (
          <div className="absolute left-2 right-2 inset-0 pointer-events-none">
            {Array.from({ length: ticks }).map((_, i) => {
              const tickPercentage = (i / (ticks - 1)) * 100;

              // Helper to get normalized percentage (0-100) of a value in current slider scale
              const getValPercentage = (val: number) => {
                if (val === -Infinity) return 0;
                if (val === Infinity) return 100;
                const sMin = min ?? 0;
                const sMax = max ?? 100;
                return ((val - sMin) / (sMax - sMin)) * 100;
              };

              // Check if this tick is within the selected range or at the selection point
              const isSelected = Array.isArray(value)
                ? (value.length === 2
                  ? (tickPercentage >= getValPercentage(value[0]) - 0.1 && tickPercentage <= getValPercentage(value[1]) + 0.1)
                  : (Math.abs(tickPercentage - getValPercentage(value[0])) < 0.5))
                : (Math.abs(tickPercentage - getValPercentage(value as number)) < 0.5);

              return (
                <div
                  key={i}
                  className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                  style={{ left: `calc(${tickPercentage}%)`, transform: 'translateX(-50%)' }}
                >
                  <div 
                    className={cn(
                      "w-[2px] h-2.5 rounded-full transition-all duration-300",
                      isSelected
                        ? "bg-white/90 z-20 scale-y-110 shadow-[0_0_3px_rgba(255,255,255,0.5)]"
                        : "bg-slate-400 dark:bg-slate-600 z-10"
                    )}
                  />
                  {tickLabels && tickLabels[i] !== undefined && (
                    <span className={cn(
                      "absolute top-4 text-[9px] font-medium transition-colors whitespace-nowrap",
                      isSelected ? "text-primary dark:text-primary" : " "
                    )}>
                      {tickLabels[i]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </div>

       </div>
      </SliderPrimitive.SliderTrack>
      {Array.from({ length: numberOfThumbs }).map((_, i) => {
        const val = (Array.isArray(value) ? value[i] : value) ?? 0;
        const sMin = min ?? 0;
        const sMax = max ?? 100;
        const percentage = Math.max(0, Math.min(100, ((val as number - sMin) / (sMax - sMin)) * 100));
          console.log("Rendering thumb", i, "with value", val, "at percentage", percentage);
        return (
          <SliderPrimitive.SliderThumb
            key={i}
            // @ts-ignore - Workaround for Preact issue where Radix cannot infer the index automatically
            index={i}
            className="!block h-4 w-4 rounded-full border border-slate-300 dark:border-slate-500 bg-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer z-30 ring-offset-background"
            style={{ left: `calc(${percentage}% - 8px)` }}
          />
        );
      })}
    </SliderPrimitive.Slider>
  )
})
LocalSlider.displayName = SliderPrimitive.Slider.displayName

export { LocalSlider }
