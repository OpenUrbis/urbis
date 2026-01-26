import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getPatternStyle, ILayerPattern, patterns } from "@/lib/layer-patterns";
import { Info, Plus, Trash2 } from "lucide-react";
import { Fragment, useCallback } from "react";
import { ColorPickerSwatch } from "../ColorPickerSwatch";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import Color from "color";

export interface ILayerColor {
  fillColor: number[];
  borderColor: number[];
  textColor: number[];
  pattern?: ILayerPattern;
  label?: string;
  value?: string;
}

interface LayerColorManagerProps {
  colors: ILayerColor[];
  onChange: (colors: ILayerColor[]) => void;
  dynamic?: boolean;
}

const LayerColorManager = ({
  colors,
  onChange,
  dynamic = false,
}: LayerColorManagerProps) => {
  const updateColor = useCallback(
    (index: number, field: keyof ILayerColor, newValue: any) => {
      const nextColors = [...colors];

      let processedValue = newValue;

      if (
        field === "fillColor" ||
        field === "borderColor" ||
        field === "textColor"
      ) {
        processedValue = [
          ...Color(newValue).rgb().array(),
          Color(newValue).alpha(),
        ];
      }

      nextColors[index] = {
        ...nextColors[index],
        [field]: processedValue,
      };
      onChange(nextColors);
    },
    [colors, onChange]
  );

  const handleAddColor = () => {
    const getRandomColor = () => {
      let newColor;
      let isDuplicate = true;

      while (isDuplicate) {
        newColor = [
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          0.5,
        ];

        isDuplicate = colors.some(
          (c) =>
            c.fillColor[0] === newColor![0] &&
            c.fillColor[1] === newColor![1] &&
            c.fillColor[2] === newColor![2]
        );
      }

      return newColor as number[];
    };

    const newColor: ILayerColor = {
      fillColor: getRandomColor(),
      borderColor: [0, 0, 0, 1],
      textColor: [255, 255, 255, 1],
      pattern: "full",
      label: "",
      value: "",
    };
    onChange([...colors, newColor]);
  };

  const handleRemoveColor = (index: number) => {
    if (colors.length <= 1) return;
    const nextColors = colors.filter((_, i) => i !== index);
    onChange(nextColors);
  };

  const renderPatternSelector = (
    currentPattern: ILayerPattern | undefined,
    fillColor: number[],
    onSelect: (p: ILayerPattern) => void
  ) => {
    return (
      <div className="grid grid-cols-4 gap-2 mt-2">
        {patterns.map((p) => {
          const isSelected = (currentPattern || "full") === p.value;
          const isLight = Color(fillColor).isLight();

          return (
            <div
              key={p.value}
              onClick={() => onSelect(p.value)}
              className="flex flex-col items-center gap-1 cursor-pointer group"
            >
              <div
                className={`w-12 h-12 border rounded-md transition-all overflow-hidden ${isSelected ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"}`}
                style={{ backgroundColor: isLight ? "#000" : "#fff" }}
                title={p.label}
              >
                <div
                  className="w-full h-full"
                  style={
                    p.value === "full"
                      ? { backgroundColor: Color(fillColor).hex() }
                      : getPatternStyle(p.value, Color(fillColor).hex(), 0.4)
                  }
                />
              </div>
              <span
                className={`text-[9px] text-center w-full truncate ${isSelected ? "font-medium" : "text-muted-foreground"}`}
              >
                {p.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderColorHandler = (value: ILayerColor, index: number) => {
    return (
      <div className="grid gap-4 border p-4 rounded-lg relative">
        {dynamic && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveColor(index)}
            disabled={colors.length <= 1}
            className="absolute top-2 right-2 h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}

        {dynamic && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs flex items-center h-5">
                Valor Exato
              </Label>
              <Input
                value={value.value || ""}
                onChange={(e) => updateColor(index, "value", e.target.value)}
                placeholder="Ex: residencial"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1 h-5">
                Texto da Legenda
                <Popover>
                  <PopoverTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2 text-xs" side="top">
                    <p>Texto que aparecerá na legenda do mapa</p>
                  </PopoverContent>
                </Popover>
              </Label>
              <Input
                value={value.label || ""}
                onChange={(e) => updateColor(index, "label", e.target.value)}
                placeholder="Ex: Zona Residencial"
                className="h-8"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 items-end">
          <div className="space-y-1 flex flex-col items-center">
            <Label className="text-xs">Preenchimento</Label>
            <ColorPickerSwatch
              color={value.fillColor}
              pattern={value.pattern}
              onChange={(c) => updateColor(index, "fillColor", c)}
            >
              <>
                <Label className="text-xs mb-2 block font-semibold text-muted-foreground">
                  Padrão
                </Label>
                {renderPatternSelector(value.pattern, value.fillColor, (p) =>
                  updateColor(index, "pattern", p)
                )}
              </>
            </ColorPickerSwatch>
          </div>
          <div className="space-y-1 flex flex-col items-center">
            <Label className="text-xs">Borda</Label>
            <ColorPickerSwatch
              color={value.borderColor}
              onChange={(c) => updateColor(index, "borderColor", c)}
            />
          </div>
          <div className="space-y-1 flex flex-col items-center">
            <Label className="text-xs">Texto</Label>
            <ColorPickerSwatch
              color={value.textColor}
              onChange={(c) => updateColor(index, "textColor", c)}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {colors.map((value, index) => (
        <Fragment key={index}>{renderColorHandler(value, index)}</Fragment>
      ))}

      {dynamic && (
        <Button
          onClick={handleAddColor}
          variant="outline"
          type="button"
          size="sm"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Cor
        </Button>
      )}
    </div>
  );
};

export default LayerColorManager;
