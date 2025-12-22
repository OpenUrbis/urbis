import { useMapContext } from "../../hooks/useMapContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const MAP_STYLES = [
  { id: "standard", label: "Padrão", icon: "map" },
  { id: "light", label: "Claro", icon: "light_mode" },
  { id: "dark", label: "Escuro", icon: "dark_mode" },
  { id: "outdoors", label: "Ar Livre", icon: "forest" },
  { id: "satellite", label: "Satélite", icon: "satellite" },
  { id: "satellite-streets", label: "Híbrido", icon: "public" },
] as const;

export const BaseMapSelector = () => {
  const { selectedBaseMap, is3DActive } = useMapContext();

  return (
    <Card className="rounded-xl border shadow-sm">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-lg font-medium">Estilo do Mapa</CardTitle>
      </CardHeader>
      <CardContent className="p-3 grid gap-4">
        <div className="grid grid-cols-3 gap-2">
          {MAP_STYLES.map((style) => (
            <div
              key={style.id}
              className={cn(
                "cursor-pointer rounded-lg border-2 p-2 flex flex-col items-center justify-center gap-2 transition-all hover:bg-muted/50 h-[84px] text-center",
                selectedBaseMap.value === style.id
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-card"
              )}
              onClick={() => (selectedBaseMap.value = style.id)}
            >
              <span className="material-symbols-outlined text-2xl">
                {style.icon}
              </span>
              <span className="text-xs font-medium">{style.label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-muted-foreground">
              view_in_ar
            </span>
            <Label htmlFor="3d-mode" className="font-medium">
              Visualização 3D
            </Label>
          </div>
          <Switch
            id="3d-mode"
            checked={is3DActive.value}
            onCheckedChange={(checked) => (is3DActive.value = checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
