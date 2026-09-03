import React, { useState, useRef, useEffect } from "react";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

const CustomSlider = React.forwardRef<HTMLDivElement, any>(
  (
    {
      min = 0,
      max = 100,
      step = 1,
      value,
      defaultValue,
      onValueChange,
      className,
      ...props
    },
    ref,
  ) => {
    // Handle both controlled and uncontrolled modes (simplistic)
    const [internalValue, setInternalValue] = useState(
      value || defaultValue || [min, max],
    );
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (value) setInternalValue(value);
    }, [value]);

    const getPercentage = (val: number) => ((val - min) / (max - min)) * 100;

    const handlePointerDown = (event: React.PointerEvent, index: number) => {
      event.preventDefault();
      event.stopPropagation();

      // We capture on the thumb itself or window? Window is better for dragging outside.
      // But we need container rect.
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      // Create handlers
      const handleMove = (e: PointerEvent) => {
        e.preventDefault();
        const clientX = e.clientX;
        const percentage = Math.min(
          Math.max((clientX - rect.left) / rect.width, 0),
          1,
        );
        let newValue = min + percentage * (max - min);

        if (step) {
          newValue = Math.round(newValue / step) * step;
        }
        newValue = Math.min(Math.max(newValue, min), max);

        // Avoid mutating state directly in loop, create new array
        setInternalValue((prev: number[]) => {
          const newValues = [...prev];
          newValues[index] = newValue;

          // Simple collision prevention
          if (newValues.length === 2) {
            if (index === 0 && newValues[0] > newValues[1])
              newValues[0] = newValues[1];
            if (index === 1 && newValues[1] < newValues[0])
              newValues[1] = newValues[0];
          }

          if (onValueChange) onValueChange(newValues);
          return newValues;
        });
      };

      const handleUp = (e: PointerEvent) => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    };

    return (
      <div
        ref={(node) => {
          (containerRef as any).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as any).current = node;
        }}
        className={cn(
          "relative flex w-full touch-none select-none items-center h-5",
          className,
        )}
        {...props}
      >
        {/* Track */}
        <div className="absolute w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          {/* Range */}
          <div
            className="absolute h-full bg-slate-900"
            style={{
              left: `${getPercentage(Math.min(...internalValue))}%`,
              width: `${Math.abs(getPercentage(internalValue[1]) - getPercentage(internalValue[0]))}%`,
            }}
          />
        </div>

        {/* Thumbs */}
        {internalValue.map((val: number, i: number) => (
          <div
            key={i}
            className="absolute block h-5 w-5 rounded-full border-2 border-slate-900 bg-white shadow-md cursor-grab active:cursor-grabbing hover:scale-110 z-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
            style={{
              left: `${getPercentage(val)}%`,
              transform: "translateX(-50%)",
              // Top 0 if container is h-5 (20px)
              top: 0,
            }}
            onPointerDown={(e) => handlePointerDown(e, i)}
          />
        ))}
      </div>
    );
  },
);
CustomSlider.displayName = "CustomSlider";

export default function SliderTestPage() {
  const [val, setVal] = useState([20, 80]);

  return (
    <div
      className="p-10 w-full h-full bg-white text-black overflow-auto"
      style={{ zIndex: 9999, position: "relative" }}
    >
      <h1 className="text-2xl mb-4 font-bold">
        Slider Debug Reproduction (Custom Slider)
      </h1>

      <div className="w-[300px] border border-gray-300 p-4 mb-8 bg-gray-50">
        <h2 className="mb-2 font-semibold">CustomSlider</h2>
        <CustomSlider
          value={val}
          onValueChange={setVal}
          min={0}
          max={100}
          step={1}
          className="my-4"
        />
        <div className="mt-2">Value: {JSON.stringify(val)}</div>
      </div>
    </div>
  );
}
