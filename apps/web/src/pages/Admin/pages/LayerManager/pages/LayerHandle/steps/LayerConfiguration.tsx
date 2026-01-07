import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { GroupSelect } from "@/components/GroupSelect";

interface LayerConfigurationProps {
  onNext: () => void;
  onBack: () => void;
}

export const LayerConfiguration = ({
  onNext,
  onBack,
}: LayerConfigurationProps) => {
  const form = useFormContext();

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
      <FormField
        control={form.control}
        name="loadingMethod"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Forma de carregar os dados</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="wms">WMS (Imagem)</SelectItem>
                <SelectItem value="wfs">WFS (Vetorial)</SelectItem>
                <SelectItem value="pbf">Vector Tile (PBF)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="groupId"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Grupo</FormLabel>
            <GroupSelect value={field.value} onChange={field.onChange} />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="layerName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome da Camada</FormLabel>
            <FormControl>
              <Input placeholder="Nome da camada" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="minZoom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min Zoom (Opcional)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ex: 10" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maxZoom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Zoom (Opcional)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ex: 18" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button type="button" onClick={onNext}>
          Próximo <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
