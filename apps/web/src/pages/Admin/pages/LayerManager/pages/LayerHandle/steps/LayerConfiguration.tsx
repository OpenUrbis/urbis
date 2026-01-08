import { CodeEditor } from "@/components/CodeEditor";
import { GroupSelect } from "@/components/GroupSelect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { viewTemplateSchema } from "@/components/ViewTemplateSchema";
import { ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

interface LayerConfigurationProps {
  onNext: () => void;
  onBack: () => void;
}

export const LayerConfiguration = ({
  onNext,
  onBack,
}: LayerConfigurationProps) => {
  const form = useFormContext();
  const [isAdvancedEditorOpen, setIsAdvancedEditorOpen] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  const handleAdvancedEditorSave = (value: string) => {
    form.setValue("clickActionParams.template", value);
  };

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
                <SelectItem value="CustomWMSLayer">WMS (Imagem)</SelectItem>
                <SelectItem value="GeoJsonLayer">WFS (Vetorial)</SelectItem>
                <SelectItem value="Stream">Vector Tile (PBF)</SelectItem>
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

      <FormField
        control={form.control}
        name="clickAction"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ação ao Clicar</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                <SelectItem value="SelectFeature">
                  Selecionar Polígono
                </SelectItem>
                <SelectItem value="setZoom">Definir Zoom</SelectItem>
                <SelectItem value="openFeature">Abrir Detalhes</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch("clickAction") === "setZoom" && (
        <FormField
          control={form.control}
          name="clickActionParams.zoom"
          render={({ field }) => (
            <FormItem className="animate-in fade-in slide-in-from-top-2">
              <FormLabel>Nível de Zoom</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 17.5"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {form.watch("clickAction") === "openFeature" && (
        <>
          <FormField
            control={form.control}
            name="clickActionParams.template"
            render={({ field }) => {
              const isRoot = field.value === "root";
              const isCustom = !isRoot && field.value;
              const selectValue = isRoot ? "root" : "custom";

              return (
                <FormItem className="animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <FormLabel>Tipo de Template</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0"
                            onClick={() => setIsInfoDialogOpen(true)}
                            type="button"
                          >
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Clique para mais informações sobre templates</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={selectValue}
                      onValueChange={(val) => {
                        if (val === "root") {
                          field.onChange("root");
                        } else {
                          // If switching to custom, clear value or set empty JSON if currently "root"
                          // If already custom (has value and not "root"), keep it
                          if (field.value === "root") {
                            field.onChange("{}");
                            setIsAdvancedEditorOpen(true);
                          } else if (!field.value) {
                            field.onChange("{}");
                            setIsAdvancedEditorOpen(true);
                          }
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="root">Padrão (Root)</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>

                    {selectValue === "custom" && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAdvancedEditorOpen(true)}
                        className="flex-1"
                      >
                        {field.value && field.value !== "{}"
                          ? "Editar JSON"
                          : "Criar JSON"}
                      </Button>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configuração de Templates</DialogTitle>
                <DialogDescription>
                  Saiba como configurar a visualização de detalhes ao clicar na
                  feature.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <p>
                  A ação <strong>openFeature</strong> permite abrir um painel de
                  detalhes quando o usuário clica em um polígono no mapa.
                </p>
                <p>Você pode configurar o template de duas formas:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>"root"</strong>: Utiliza o template padrão definido
                    nas configurações da camada (`viewTemplate`).
                  </li>
                  <li>
                    <strong>Objeto JSON</strong>: Você pode fornecer um objeto
                    de configuração personalizado para definir exatamente quais
                    informações exibir.
                  </li>
                </ul>
                <div className="bg-muted p-4 rounded-md">
                  <p className="font-mono text-xs mb-2">Exemplo de JSON:</p>
                  <pre className="text-xs overflow-auto">
                    {`{
  "type": "wrapper-card",
  "label": "Detalhes",
  "templates": [
    {
      "type": "label-value",
      "label": "Nome",
      "value": "<%- properties.name %>"
    }
  ]
}`}
                  </pre>
                </div>
                <p>
                  Use o <strong>Editor Avançado</strong> para escrever e validar
                  seu JSON com mais facilidade.
                </p>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isAdvancedEditorOpen}
            onOpenChange={setIsAdvancedEditorOpen}
          >
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Editor de Template</DialogTitle>
                <DialogDescription>
                  Edite o objeto de configuração do template.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 min-h-0">
                <CodeEditor
                  value={form.getValues("clickActionParams.template") || ""}
                  onChange={handleAdvancedEditorSave}
                  language="json"
                  schema={viewTemplateSchema}
                  className="h-full border rounded-md"
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => setIsAdvancedEditorOpen(false)}>
                  Concluir
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

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

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Ativa</FormLabel>
                <div className="text-[0.8rem] text-muted-foreground">
                  Se a camada está disponível para uso
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
        <FormField
          control={form.control}
          name="isVisible"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Visível por padrão</FormLabel>
                <div className="text-[0.8rem] text-muted-foreground">
                  Se a camada inicia visível no mapa
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
