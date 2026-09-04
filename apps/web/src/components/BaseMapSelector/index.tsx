import { useEffect } from "react";
import { useMapContext } from "../../hooks/useMapContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  UrbisIcon,
} from "@open-urbis/map-ui";
import { cn } from "@open-urbis/map-ui";
import { Switch } from "@open-urbis/map-ui";
import { Label } from "@open-urbis/map-ui";
import { Slider } from "../ui/slider";
import { BASE_MAPS_CONFIG, BaseMapStyleId } from "../MapView/base-map-styles";
import { useSignal } from "@preact/signals";

export const BaseMapSelector = () => {
  const {
    selectedBaseMap,
    selectedBaseMaps,
    baseMapOpacity,
    baseMapOpacities,
    baseMapSaturation,
    baseMap3DOpacity,
    is3DActive,
  } = useMapContext();

  const isMultiSelect = useSignal<boolean>(
    (selectedBaseMaps?.value?.length ?? 0) > 1,
  );

  useEffect(() => {
    isMultiSelect.value = (selectedBaseMaps?.value?.length ?? 0) > 1;
  }, [selectedBaseMaps?.value?.length]);

  const activeBaseMaps = selectedBaseMaps?.value ?? [selectedBaseMap.value];
  const saturation = baseMapSaturation?.value ?? 100;

  const getOpacityForStyle = (styleId: string) => {
    return baseMapOpacities?.value?.[styleId] ?? 100;
  };

  const setOpacityForStyle = (styleId: string, value: number) => {
    if (baseMapOpacities) {
      baseMapOpacities.value = {
        ...baseMapOpacities.value,
        [styleId]: value,
      };
    }
    if (baseMapOpacity && activeBaseMaps.length === 1) {
      baseMapOpacity.value = value;
    }
  };

  const handleToggleBaseMap = (styleId: BaseMapStyleId) => {
    if (isMultiSelect.value) {
      const current = [...activeBaseMaps];
      const index = current.indexOf(styleId);
      if (index >= 0) {
        if (current.length > 1) {
          current.splice(index, 1);
        }
      } else {
        current.push(styleId);
      }
      if (selectedBaseMaps) selectedBaseMaps.value = current;
      if (current.length > 0) selectedBaseMap.value = current[0];
    } else {
      if (selectedBaseMaps) selectedBaseMaps.value = [styleId];
      selectedBaseMap.value = styleId;
    }
  };

  const handleMultiSelectChange = (checked: boolean) => {
    isMultiSelect.value = checked;
    if (!checked && activeBaseMaps.length > 1) {
      const first = activeBaseMaps[0];
      if (selectedBaseMaps) selectedBaseMaps.value = [first];
      selectedBaseMap.value = first;
    }
  };

  return (
    <Card className="rounded-xl border shadow-sm">
      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Mapa Base</CardTitle>
      </CardHeader>

      <CardContent className="p-3 pt-0 grid gap-2.5">
        {/* Controles do Mapa Base */}
        <div className="space-y-1.5 text-xs">
          <label
            htmlFor="multi-base-mode"
            className="flex items-center justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors select-none"
          >
            <span className="flex items-center gap-2 font-medium">
              <UrbisIcon
                name="layers"
                className="text-muted-foreground text-base shrink-0"
                aria-hidden="true"
              />
              Sobrepor mapas base
            </span>
            <Switch
              id="multi-base-mode"
              checked={isMultiSelect.value}
              onCheckedChange={handleMultiSelectChange}
            />
          </label>
        </div>

        {/* Ajustes de Opacidade e Saturação */}
        <div className="space-y-2 rounded-lg border bg-muted/20 p-2.5 text-xs">
          {activeBaseMaps.map((styleId, idx) => {
            const itemConfig = BASE_MAPS_CONFIG.find((c) => c.id === styleId);
            const name = itemConfig?.nome ?? styleId;
            const opacityVal = getOpacityForStyle(styleId);

            return (
              <div key={styleId} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-foreground truncate max-w-[200px]">
                    {activeBaseMaps.length > 1 && (
                      <span className="inline-flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground px-1 shrink-0">
                        {idx + 1}º
                      </span>
                    )}
                    <span className="truncate">Opacidade {activeBaseMaps.length > 1 ? `(${name})` : ""}</span>
                  </span>
                  <span className="tabular-nums font-medium text-muted-foreground">{opacityVal}%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[opacityVal]}
                  onValueChange={([val]) => {
                    if (val !== undefined) setOpacityForStyle(styleId, val);
                  }}
                  aria-label={`Opacidade de ${name}`}
                />
              </div>
            );
          })}

          <div className="space-y-1 pt-1.5 border-t border-border/40">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-muted-foreground">
                <UrbisIcon name="palette" className="text-sm shrink-0" aria-hidden="true" />
                Saturação
              </span>
              <span className="tabular-nums font-medium text-muted-foreground">{saturation}%</span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[saturation]}
              onValueChange={([val]) => {
                if (baseMapSaturation && val !== undefined) baseMapSaturation.value = val;
              }}
              aria-label="Saturação do mapa base"
            />
          </div>
        </div>

        {/* Base Maps Grid */}
        <div className="grid grid-cols-4 gap-1.5">
          {BASE_MAPS_CONFIG.map((style) => {
            const isSelected = activeBaseMaps.includes(style.id);
            const selectedIndex = activeBaseMaps.indexOf(style.id);
            const iconName =
              style.tipo === "ortofoto"
                ? "photo_camera"
                : style.tipo === "satélite"
                ? "satellite_alt"
                : "map";

            return (
              <div
                key={style.id}
                className={cn(
                  "relative cursor-pointer rounded-lg border p-1.5 flex flex-col items-center justify-center gap-1 transition-all hover:bg-muted/50 h-[72px] text-center select-none",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-xs font-semibold"
                    : "border-border/60 bg-card text-muted-foreground hover:text-foreground",
                )}
                onClick={() => handleToggleBaseMap(style.id as BaseMapStyleId)}
              >
                {isSelected && (
                  <span className="absolute top-1 right-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-primary px-1 text-[8px] font-bold text-primary-foreground">
                    {activeBaseMaps.length > 1 ? `${selectedIndex + 1}º` : "✓"}
                  </span>
                )}
                <UrbisIcon
                  name={iconName}
                  className="text-lg shrink-0"
                  aria-hidden="true"
                />
                <span className="text-[10px] leading-tight line-clamp-2">
                  {style.nome}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
