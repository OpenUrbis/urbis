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
import { getLayerGroups } from "@/integrations/layer-group-integration";
import { IGetConfigLayerGroup } from "@/types/fetch-map-config-type";

interface GroupSelectProps {
  value: string;
  onChange: (value: string) => void;
  excludeId?: string;
  placeholder?: string;
}

export const GroupSelect = ({
  value,
  onChange,
  excludeId,
  placeholder = "Selecione um grupo...",
}: GroupSelectProps) => {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<IGetConfigLayerGroup[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    getLayerGroups(undefined, undefined, debouncedSearch).then((res) => {
      const data =
        res && typeof res === "object" && "data" in res
          ? (res.data as IGetConfigLayerGroup[])
          : Array.isArray(res)
            ? res
            : [];
      setGroups(excludeId ? data.filter((g) => g.id !== excludeId) : data);
    });
  }, [debouncedSearch, excludeId]);

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
            ? groups.find((group) => group.id === value)?.name || "Selecione..."
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="p-2">
          <Input
            placeholder="Buscar grupo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2"
          />
          <div className="max-h-60 overflow-y-auto">
            {groups.map((group) => (
              <div
                key={group.id}
                className={cn(
                  "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  value === group.id ? "bg-accent" : ""
                )}
                onClick={() => {
                  onChange(group.id === value ? "" : group.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === group.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {group.name}
              </div>
            ))}
            {groups.length === 0 && (
              <div className="p-2 text-sm text-muted-foreground">
                Nenhum grupo encontrado.
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
