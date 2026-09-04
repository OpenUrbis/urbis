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

  const activeBaseMaps = selectedBaseMaps?.value ?? [selectedBaseMap.value];
  const saturation = baseMapSaturation?.value ?? 100;

  const getOpacityForStyle = (styleId: string) =>
    baseMapOpacities?.value?.[styleId] ?? baseMapOpacity?.value ?? 100;

  const setOpacityForStyle = (styleId: string, value: number) => {
    if (baseMapOpacities) {
      baseMapOpacities.value = {
        ...baseMapOpacities.value,
        [styleId]: value,
      };
    }
    if (baseMapOpacity) {
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
        <CardTitle className="text-lg font-medium">Mapa Base</CardTitle>
      </CardHeader>

      <CardContent className="p-3 grid gap-3">
        {/* Visualização 3D (Switch + Slider integrado) */}
        <div className="space-y-2.5 rounded-lg border bg-muted/20 p-3 text-xs">
          <div className="flex items-center justify-between font-medium">
            <div className="flex items-center gap-2">
              <UrbisIcon
                name="view_in_ar"
                className="text-muted-foreground text-base shrink-0"
                aria-hidden="true"
              />
              <div className="flex flex-col">
                <Label htmlFor="3d-mode" className="font-medium cursor-pointer text-xs">
                  Visualização 3D
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  Projeta a volumetria 3D das edificações sobre qualquer mapa base
                </span>
              </div>
            </div>
            <Switch
              id="3d-mode"
              checked={is3DActive.value}
              onCheckedChange={(checked) => (is3DActive.value = checked)}
            />
          </div>

          {is3DActive.value && (
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-medium">
                  Opacidade das edificações 3D
                </span>
                <span className="tabular-nums font-semibold text-foreground">
                  {baseMap3DOpacity?.value ?? 45}%
                </span>
              </div>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[baseMap3DOpacity?.value ?? 45]}
                onValueChange={([val]) => {
                  if (baseMap3DOpacity && val !== undefined)
                    baseMap3DOpacity.value = val;
                }}
                aria-label="Opacidade das edificações 3D"
              />
            </div>
          )}
        </div>

        {/* Visual Adjustments: Opacidade Individual & Saturação */}
        <div className="space-y-3 rounded-lg border bg-muted/20 p-3 text-xs">
          <div className="space-y-3">
            <span className="text-[11px] font-medium text-muted-foreground">
              {activeBaseMaps.length > 1
                ? "Opacidade individual por mapa base"
                : "Opacidade do mapa base"}
            </span>
            {activeBaseMaps.map((styleId, idx) => {
              const itemConfig = BASE_MAPS_CONFIG.find((c) => c.id === styleId);
              const name = itemConfig?.nome ?? styleId;
              const opacityVal = getOpacityForStyle(styleId);

              return (
                <div key={styleId} className="space-y-1.5 border-b border-border/40 pb-2.5 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between font-medium">
                    <span className="flex items-center gap-1.5 text-foreground truncate max-w-[200px]">
                      {activeBaseMaps.length > 1 && (
                        <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1 shrink-0">
                          {idx + 1}º
                        </span>
                      )}
                      <UrbisIcon name="opacity" className="text-base text-muted-foreground shrink-0" aria-hidden="true" />
                      <span className="truncate">{name}</span>
                    </span>
                    <span className="tabular-nums font-semibold shrink-0">{opacityVal}%</span>
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
          </div>

          {/* Saturação */}
          <div className="space-y-1.5 pt-1 border-t border-border/40">
            <div className="flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <UrbisIcon name="palette" className="text-base" aria-hidden="true" />
                Saturação Global
              </span>
              <span className="tabular-nums font-semibold">{saturation}%</span>
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

        {/* Multi-select toggle ("Sobre" / Vários mapas base) */}
        <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <UrbisIcon name="layers" className="text-muted-foreground text-base" aria-hidden="true" />
            <div className="flex flex-col">
              <Label htmlFor="multi-base-mode" className="font-medium cursor-pointer">
                Vários mapas base (Sobre)
              </Label>
              <span className="text-[10px] text-muted-foreground">
                Sobrepor múltiplos mapas base
              </span>
            </div>
          </div>
          <Switch
            id="multi-base-mode"
            checked={isMultiSelect.value}
            onCheckedChange={handleMultiSelectChange}
          />
        </div>

        {/* Base Maps Grid */}
        <div className="grid grid-cols-4 gap-2">
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
                  "relative cursor-pointer rounded-lg border-2 p-2 flex flex-col items-center justify-center gap-1.5 transition-all hover:bg-muted/50 h-[84px] text-center select-none",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-transparent bg-card",
                )}
                onClick={() => handleToggleBaseMap(style.id as BaseMapStyleId)}
              >
                {isSelected && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                    {activeBaseMaps.length > 1 ? `${selectedIndex + 1}º` : "✓"}
                  </span>
                )}
                <UrbisIcon
                  name={iconName}
                  className="text-xl"
                  aria-hidden="true"
                />
                <span className="text-[10px] leading-tight font-medium line-clamp-2">
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
