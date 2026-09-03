import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DEFAULT_LAYER_BORDER_COLOR,
  DEFAULT_LAYER_BACKGROUND_COLOR,
  DEFAULT_LAYER_FILL_COLOR,
  DEFAULT_LAYER_FORM_COLOR,
  DEFAULT_LAYER_TEXT_COLOR,
  DYNAMIC_LAYER_COLOR_PALETTE,
} from "@/lib/layer-style-defaults";
import { getPatternStyle, ILayerPattern, patterns } from "@/lib/layer-patterns";
import { Info, Plus, Trash2 } from "lucide-react";
import { Fragment, useCallback } from "react";
import { ColorPickerSwatch } from "../ColorPickerSwatch";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import Color, { ColorInstance, ColorLike } from "color";

export interface ILayerColor {
  fillColor: number[];
  borderColor: number[];
  textColor: number[];
  pattern?: ILayerPattern;
  patternConfig?: {
    fillPatternMask?: boolean;
    fillPatternAtlas?: string;
    fillPatternMapping?: string;
    getFillPatternScale?: number;
    getFillPatternOffset?: [number, number];
    getFillPatternAngle?: number;
    backgroundColor?: number[];
  };
  label?: string;
  value?: string;
  legisUrl?: string;
}

interface LayerColorManagerProps {
  colors?: ILayerColor[];
  onChange: (colors: ILayerColor[]) => void;
  dynamic?: boolean;
  showTextColor?: boolean;
}

const normalizeColorValue = (color: ColorInstance | ColorLike) => {
  const parsedColor = Color(color);
  const [red, green, blue] = parsedColor.rgb().array();

  return [red, green, blue, parsedColor.alpha()];
};

const normalizeOpacity = (color: number[] | undefined, fallback = 100) => {
  const alpha = color?.[3];
  if (!Number.isFinite(Number(alpha))) return fallback;

  return alpha! > 1
    ? Math.round((alpha! / 255) * 100)
    : Math.round(alpha! * 100);
};

const updateOpacity = (color: number[], opacityPercent: number) => {
  const clampedOpacity = Math.min(100, Math.max(0, opacityPercent));

  return [color[0], color[1], color[2], clampedOpacity / 100];
};

const normalizeLayerColor = (
  color?: Partial<ILayerColor>,
  dynamic?: boolean,
): ILayerColor => {
  const fillColor = [...(color?.fillColor ?? DEFAULT_LAYER_FILL_COLOR)];
  const defaultBorder = dynamic ? fillColor : DEFAULT_LAYER_BORDER_COLOR;
  return {
    ...DEFAULT_LAYER_FORM_COLOR,
    ...color,
    fillColor,
    borderColor: [...(color?.borderColor ?? defaultBorder)],
    textColor: [...(color?.textColor ?? DEFAULT_LAYER_TEXT_COLOR)],
    legisUrl: color?.legisUrl ?? "",
  };
};

const LayerColorManager = ({
  colors,
  onChange,
  dynamic = false,
  showTextColor = true,
}: LayerColorManagerProps) => {
  const normalizedColors =
    Array.isArray(colors) && colors.length > 0
      ? colors.map((color) => normalizeLayerColor(color, dynamic))
      : [normalizeLayerColor(undefined, dynamic)];

  const updateColor = useCallback(
    (index: number, field: keyof ILayerColor, newValue: any) => {
      const nextColors = [...normalizedColors];

      let processedValue = newValue;

      if (
        field === "fillColor" ||
        field === "borderColor" ||
        field === "textColor"
      ) {
        processedValue = normalizeColorValue(newValue);
      }

      nextColors[index] = {
        ...nextColors[index],
        [field]: processedValue,
      };
      onChange(nextColors);
    },
    [normalizedColors, onChange],
  );

  const handleAddColor = () => {
    const nextPaletteColor =
      DYNAMIC_LAYER_COLOR_PALETTE.find(
        (paletteColor) =>
          !normalizedColors.some(
            (color) =>
              color.fillColor[0] === paletteColor[0] &&
              color.fillColor[1] === paletteColor[1] &&
              color.fillColor[2] === paletteColor[2],
          ),
      ) ??
      DYNAMIC_LAYER_COLOR_PALETTE[
        normalizedColors.length % DYNAMIC_LAYER_COLOR_PALETTE.length
      ];

    const newColor: ILayerColor = {
      fillColor: [...nextPaletteColor],
      borderColor: dynamic
        ? [...nextPaletteColor]
        : [...DEFAULT_LAYER_BORDER_COLOR],
      textColor: [...DEFAULT_LAYER_TEXT_COLOR],
      pattern: "full",
      label: "",
      value: "",
      legisUrl: "",
    };
    onChange([...normalizedColors, newColor]);
  };

  const handleRemoveColor = (index: number) => {
    if (normalizedColors.length <= 1) return;
    const nextColors = normalizedColors.filter((_, i) => i !== index);
    onChange(nextColors);
  };

  const updatePatternConfig = (
    index: number,
    config: NonNullable<ILayerColor["patternConfig"]>,
  ) => {
    updateColor(index, "patternConfig", {
      ...normalizedColors[index]?.patternConfig,
      ...config,
    });
  };

  const updatePatternBackgroundColor = (index: number, color: ColorLike) => {
    updatePatternConfig(index, {
      backgroundColor: normalizeColorValue(color),
    });
  };

  const renderOpacityControl = (
    index: number,
    field: "fillColor" | "borderColor" | "textColor",
    label: string,
    color: number[],
  ) => {
    const opacity = normalizeOpacity(color);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label className="text-[10px] text-muted-foreground">{label}</Label>
          <span className="w-10 text-right text-[10px] tabular-nums text-muted-foreground">
            {opacity}%
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[opacity]}
          onValueChange={([nextOpacity]) =>
            updateColor(
              index,
              field,
              updateOpacity(color, nextOpacity ?? opacity),
            )
          }
          aria-label={`Opacidade de ${label}`}
        />
      </div>
    );
  };

  const renderPatternSelector = (
    currentPattern: ILayerPattern | undefined,
    fillColor: number[],
    onSelect: (p: ILayerPattern) => void,
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
                title={p.description}
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
                title={p.description}
              >
                {p.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderColorChannel = (
    index: number,
    field: "fillColor" | "borderColor" | "textColor",
    label: string,
    color: number[],
    swatch: React.ReactNode,
  ) => {
    const opacity = normalizeOpacity(color);

    return (
      <div className="space-y-2 rounded-md border bg-muted/10 p-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs font-medium">{label}</Label>
          {swatch}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
            <span>Opacidade</span>
            <span className="tabular-nums">{opacity}%</span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[opacity]}
            onValueChange={([nextOpacity]) =>
              updateColor(
                index,
                field,
                updateOpacity(color, nextOpacity ?? opacity),
              )
            }
            aria-label={`Opacidade de ${label}`}
          />
        </div>
      </div>
    );
  };

  const renderColorHandler = (value: ILayerColor, index: number) => {
    return (
      <div
        className={
          dynamic
            ? "relative space-y-3 rounded-lg border bg-background p-3"
            : "space-y-3"
        }
      >
        {dynamic && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveColor(index)}
            disabled={normalizedColors.length <= 1}
            className="absolute right-1.5 top-1.5 h-7 w-7 text-muted-foreground hover:text-destructive"
            aria-label="Remover cor dinâmica"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}

        {dynamic && (
          <div className="grid gap-3 pr-8 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="flex h-5 items-center text-xs">
                Valor do atributo
              </Label>
              <Input
                value={value.value || ""}
                onChange={(e) => updateColor(index, "value", e.target.value)}
                placeholder="Ex: residencial"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="flex h-5 items-center gap-1 text-xs">
                Legenda
                <Popover>
                  <PopoverTrigger asChild>
                    <Info className="h-3 w-3 cursor-pointer text-muted-foreground transition-colors hover:text-foreground" />
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
            <div className="space-y-1">
              <Label className="flex h-5 items-center gap-1 text-xs">
                URL do Legis
                <Popover>
                  <PopoverTrigger asChild>
                    <Info className="h-3 w-3 cursor-pointer text-muted-foreground transition-colors hover:text-foreground" />
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2.5 text-xs" side="top">
                    <p>URL da página do Legis associada a este valor para exibir a caixa de legislação nas informações da camada.</p>
                  </PopoverContent>
                </Popover>
              </Label>
              <Input
                value={value.legisUrl || ""}
                onChange={(e) => updateColor(index, "legisUrl", e.target.value)}
                placeholder="Ex: https://legis.urbis.prefeitura.sp.gov.br/pages/zeu"
                className="h-8"
              />
            </div>
          </div>
        )}

        <div
          className={
            showTextColor
              ? "grid gap-2 md:grid-cols-3"
              : "grid gap-2 md:grid-cols-2"
          }
        >
          {renderColorChannel(
            index,
            "fillColor",
            "Preenchimento",
            value.fillColor,
            <ColorPickerSwatch
              color={value.fillColor}
              pattern={value.pattern}
              onChange={(c) => updateColor(index, "fillColor", c)}
            >
              <>
                <Label className="mb-2 block text-xs font-semibold text-muted-foreground">
                  Hachura
                </Label>
                {renderPatternSelector(value.pattern, value.fillColor, (p) =>
                  updateColor(index, "pattern", p),
                )}
              </>
            </ColorPickerSwatch>,
          )}
          {renderColorChannel(
            index,
            "borderColor",
            "Borda",
            value.borderColor,
            <ColorPickerSwatch
              color={value.borderColor}
              onChange={(c) => updateColor(index, "borderColor", c)}
            />,
          )}
          {showTextColor &&
            renderColorChannel(
              index,
              "textColor",
              "Texto",
              value.textColor,
              <ColorPickerSwatch
                color={value.textColor}
                onChange={(c) => updateColor(index, "textColor", c)}
              />,
            )}
        </div>

        {value.pattern && value.pattern !== "full" && (
          <div className="mt-2 w-full border-t pt-3">
            <div className="grid gap-3 md:grid-cols-[auto_1fr] md:items-center">
              <div className="flex flex-col items-center gap-1 md:items-start">
                <Label className="text-xs font-medium">Fundo da hachura</Label>
                <ColorPickerSwatch
                  color={
                    value.patternConfig?.backgroundColor ?? [
                      ...DEFAULT_LAYER_BACKGROUND_COLOR,
                    ]
                  }
                  onChange={(c) => updatePatternBackgroundColor(index, c)}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Cor abaixo do traço. Use opacidade 0% para fundo transparente.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {normalizedColors.map((value, index) => (
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
          <Plus className="mr-2 h-4 w-4" />
          Adicionar cor
        </Button>
      )}
    </div>
  );
};

export default LayerColorManager;
