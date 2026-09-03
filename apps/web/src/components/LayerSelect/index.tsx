import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getLayerSchemas } from "@/integrations/layer-schema-integration";
import { IGetConfigLayerSchema } from "@/types/fetch-map-config-type";
import { useMapContext } from "@/hooks/useMapContext";

interface LayerSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const LayerSelect = ({
  value,
  onChange,
  placeholder = "Selecione uma camada...",
}: LayerSelectProps) => {
  const [open, setOpen] = useState(false);
  const [layers, setLayers] = useState<IGetConfigLayerSchema[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Try to get from context first if available, otherwise fetch
  let contextLayers: any = null;
  try {
    const context = useMapContext();
    contextLayers = context.layerSchemas.value;
  } catch (e) {
    // Ignore if not in provider
  }

  useEffect(() => {
    // If contextLayers is available and populated, use it
    if (contextLayers && contextLayers.length > 0) {
      if (debouncedSearch) {
        setLayers(
          contextLayers.filter((l: any) =>
            l.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
          ),
        );
      } else {
        setLayers(contextLayers);
      }
    } else {
      // Otherwise fetch from API
      const fetchLayers = async () => {
        try {
          const res = await getLayerSchemas(1, 100, debouncedSearch);
          const data =
            res && typeof res === "object" && "data" in res
              ? (res.data as IGetConfigLayerSchema[])
              : Array.isArray(res)
                ? res
                : [];
          setLayers(data);
        } catch (error) {
          console.error("Failed to fetch layers for select", error);
          setLayers([]);
        }
      };

      fetchLayers();
    }
  }, [debouncedSearch, contextLayers]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? layers.find((layer) => layer.id === value)?.name || "Selecione..."
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="p-2">
          <Input
            placeholder="Buscar camada..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2"
          />
          <div className="max-h-60 overflow-y-auto">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className={cn(
                  "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  value === layer.id ? "bg-accent" : "",
                )}
                onClick={() => {
                  onChange(layer.id === value ? "" : layer.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === layer.id ? "opacity-100" : "opacity-0",
                  )}
                />
                {layer.name}
              </div>
            ))}
            {layers.length === 0 && (
              <div className="p-2 text-sm text-muted-foreground">
                Nenhuma camada encontrada.
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
