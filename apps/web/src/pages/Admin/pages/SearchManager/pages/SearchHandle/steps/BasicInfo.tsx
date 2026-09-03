import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useFormContext } from "react-hook-form";
import { SearchSchemaFormValues } from "../utils";
import { HelpCircle } from "lucide-react";
import { ClickActionConfiguration } from "@/pages/Admin/components/ClickActionConfiguration";
import { LayerSelect } from "@/components/LayerSelect";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

interface BasicInfoProps {
  onNext: () => void;
}

export const BasicInfo = ({ onNext }: BasicInfoProps) => {
  const form = useFormContext<SearchSchemaFormValues>();
  const [tooltipOpen, setTooltipOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Pesquisa</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Pesquisa de Lotes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Método HTTP</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="origin"
          render={({ field }) => (
            <FormItem className="col-span-1 md:col-span-2">
              <FormLabel>Origem (URL)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://api.exemplo.com/search"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="layerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Camada Vinculada (Opcional)</FormLabel>
              <FormControl>
                <LayerSelect
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="index"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel>Índice de Ordenação</FormLabel>
                <TooltipProvider>
                  <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0"
                        type="button"
                        onClick={() => setTooltipOpen((prev) => !prev)}
                      >
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Define a ordem de exibição dos resultados na listagem.
                      </p>
                      <p>Valores menores aparecem primeiro.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <FormControl>
                <Input type="number" placeholder="Ex: 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ClickActionConfiguration />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Ativa</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Habilita ou desabilita esta pesquisa no sistema.
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} type="button">
          Próximo
        </Button>
      </div>
    </div>
  );
};
