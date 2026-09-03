// @ts-nocheck
import { useSignal } from "@preact/signals";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  UrbisIcon,
} from "@open-urbis/map-ui";
import { Button } from "@open-urbis/map-ui";
import { Label } from "@open-urbis/map-ui";

interface ExportOptionsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  layers: { id: string; name: string }[];
  bounds: number[];
  onConfirm: (format: "geojson" | "dwg") => void;
}

export const ExportOptionsModal = ({
  isOpen,
  onOpenChange,
  layers,
  bounds,
  onConfirm,
}: ExportOptionsModalProps) => {
  const format = useSignal<"geojson" | "dwg">("geojson");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Opções de Exportação</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-900 flex gap-3 text-sm text-yellow-800 dark:text-yellow-200">
            <UrbisIcon
              name="info"
              className="text-lg shrink-0"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <p>
                O limite de exportação é de 1000 feições. Caso exceda, aproxime
                o mapa.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              Camadas Selecionadas ({layers.length})
            </h4>
            <div className="max-h-[100px] overflow-y-auto text-xs text-muted-foreground border rounded p-2 bg-muted/20">
              {layers.map((l) => (
                <div key={l.id}>{l.name}</div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Formato do Arquivo</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-start space-x-2">
                <input
                  type="radio"
                  id="geojson"
                  name="format"
                  value="geojson"
                  checked={format.value === "geojson"}
                  onChange={() => (format.value = "geojson")}
                  className="mt-1"
                />
                <div className="grid gap-1.5">
                  <Label htmlFor="geojson" className="font-medium">
                    GeoJSON
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Formato padrão para dados geoespaciais na web. Projeção:
                    WGS84 (Lat/Lon).
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <input
                  type="radio"
                  id="dwg"
                  name="format"
                  value="dwg"
                  checked={format.value === "dwg"}
                  onChange={() => (format.value = "dwg")}
                  className="mt-1"
                />
                <div className="grid gap-1.5">
                  <Label htmlFor="dwg" className="font-medium">
                    DWG / DXF
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Formato para CAD. Os dados serão convertidos para SIRGAS
                    2000 / UTM Zone 23S (EPSG:31983).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onConfirm(format.value);
              onOpenChange(false);
            }}
          >
            Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
