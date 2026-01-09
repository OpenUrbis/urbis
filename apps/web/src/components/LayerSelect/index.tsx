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

  useEffect(() => {
    // Using search term in getLayerSchemas if it supports it
    getLayerSchemas(1, 100, debouncedSearch).then((res) => {
      const data =
        res && typeof res === "object" && "data" in res
          ? (res.data as IGetConfigLayerSchema[])
          : Array.isArray(res)
            ? res
            : [];
      setLayers(data);
    });
  }, [debouncedSearch]);

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
                  value === layer.id ? "bg-accent" : ""
                )}
                onClick={() => {
                  onChange(layer.id === value ? "" : layer.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === layer.id ? "opacity-100" : "opacity-0"
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
