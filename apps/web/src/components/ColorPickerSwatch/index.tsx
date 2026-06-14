import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ColorPicker,
  ColorPickerAlpha,
  ColorPickerEyeDropper,
  ColorPickerFormat,
  ColorPickerHue,
  ColorPickerOutput,
  ColorPickerSelection,
} from "@/components/ui/shadcn-io/color-picker";
import { getPatternStyle, ILayerPattern } from "@/lib/layer-patterns";
import { cn } from "@/lib/utils";
import Color, { ColorInstance, ColorLike } from "color";
import { Pencil } from "lucide-react";
import { useDeferredValue } from "preact/compat";
import { useEffect, useState } from "react";

interface ColorPickerSwatchProps {
  color: ColorInstance | string | number[];
  onChange: (color: ColorInstance) => void;
  className?: string;
  children?: React.ReactNode;
  pattern?: ILayerPattern;
}

export function ColorPickerSwatch({
  color,
  onChange,
  className,
  children,
  pattern,
}: ColorPickerSwatchProps) {
  // Local state for input to allow typing without jitter if controlled
  const [internalColor, setInternalColor] = useState(color);
  const [opacity, setOpacity] = useState(Color(color).alpha());
  const deferredColor = useDeferredValue(internalColor);
  const deferredOpacity = useDeferredValue(opacity);

  const handleColorChange = (newColor: ColorLike) => {
    const c = Color(newColor);
    setInternalColor(c.hex());
    setOpacity(c.alpha());

    onChange(c.rgb());
  };

  useEffect(() => {
    setInternalColor(color);
    setOpacity(Color(color).alpha());
  }, [color]);

  const isLight = Color(deferredColor).isLight();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "w-8 h-8 rounded-md cursor-pointer border border-input shadow-sm transition-colors relative grid place-items-center overflow-hidden dark:border-white/40 hover:border-accent-foreground/50",
            className
          )}
          style={{ backgroundColor: isLight ? "#000" : "#fff" }}
          title={Color(internalColor).hex()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.currentTarget.click();
            }
          }}
        >
          <div
            className="col-start-1 row-start-1 w-full h-full pointer-events-none"
            style={{
              ...(pattern && pattern !== "full"
                ? getPatternStyle(pattern, Color(deferredColor).hex())
                : { backgroundColor: Color(deferredColor).hex() }),
              opacity: deferredOpacity,
            }}
          />
          <Pencil
            className={cn(
              "col-start-1 row-start-1 h-3 w-3 z-10 pointer-events-none",
              pattern && pattern !== "full"
                ? isLight
                  ? "text-white"
                  : "text-black"
                : isLight
                  ? "text-black"
                  : "text-white",
            )}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64 h-auto p-3" align="start" side="top">
        <ColorPicker
          onChange={handleColorChange}
          value={Color(internalColor).alpha(opacity).rgb().string()}
          className="gap-3"
        >
          <div className="h-32 w-full rounded-md border overflow-hidden">
            <ColorPickerSelection />
          </div>
          <div className="flex items-center gap-4">
            <ColorPickerEyeDropper />
            <div className="grid w-full gap-1">
              <ColorPickerHue />
              <ColorPickerAlpha />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ColorPickerOutput />
            <ColorPickerFormat />
          </div>
          {children && <div className="mt-2 pt-2 border-t">{children}</div>}
        </ColorPicker>
      </PopoverContent>
    </Popover>
  );
}
