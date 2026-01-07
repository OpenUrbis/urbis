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
import { useDeferredValue } from "preact/compat";
import { useEffect, useState } from "react";

interface ColorPickerSwatchProps {
  color: ColorInstance | string | any;
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
  const [opacity, setOpacity] = useState(1);
  const deferredColor = useDeferredValue(internalColor);
  const deferredOpacity = useDeferredValue(opacity);

  const handleColorChange = (newColor: ColorLike) => {
    setInternalColor(Color(newColor).hex());
    setOpacity(Color(newColor).alpha());

    onChange(Color(newColor).rgb());
  };

  useEffect(() => {
    setInternalColor(color);
  }, [color]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "w-8 h-8 rounded-md cursor-pointer border border-input shadow-sm transition-colors hover:border-accent-foreground/50",
            className
          )}
          style={{
            ...(pattern
              ? getPatternStyle(pattern, Color(deferredColor).hex())
              : { backgroundColor: Color(deferredColor).hex() }),
            opacity: deferredOpacity,
          }}
          title={Color(deferredColor).hex()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.currentTarget.click();
            }
          }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-64 h-auto p-3" align="start" side="top">
        <ColorPicker
          onChange={handleColorChange}
          defaultValue={Color(deferredColor).hex()}
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
