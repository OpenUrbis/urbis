import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, useRoute } from "wouter";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  createLayerGroup,
  updateLayerGroup,
  getLayerGroup,
  getLayerGroups,
} from "@/integrations/layer-schema-integration";
import { IGetConfigLayerGroup } from "@/types/fetch-map-config-type";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  ownerGroup: z.string().optional(),
});

const GroupHandlePage = () => {
  const [, setLocation] = useLocation();
  const [isEditMatch, editParams] = useRoute("/:id");

  const isEditing = !!isEditMatch && editParams?.id !== "handle";
  const id = isEditing ? editParams?.id : undefined;

  const [isLoading, setIsLoading] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [groups, setGroups] = useState<IGetConfigLayerGroup[]>([]);
  const [searchGroup, setSearchGroup] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      ownerGroup: "",
    },
  });

  useEffect(() => {
    console.log(id)
    if (isEditing && id) {
      setIsLoading(true);
      getLayerGroup(id)
        .then((data) => {
          form.setValue("name", data.name);
          form.setValue("ownerGroup", data.ownerGroup || "");
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [isEditing, id, form]);

  useEffect(() => {
    getLayerGroups(undefined, undefined, searchGroup).then((res) => {
      const data =
        res && typeof res === "object" && "data" in res
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
      setGroups(isEditing ? data.filter((g) => g.id !== id) : data);
    });
  }, [searchGroup, isEditing, id]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      if (isEditing && id) {
        await updateLayerGroup(id, { ...values, id });
      } else {
        const generatedId = values.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        await createLayerGroup({ ...values, id: generatedId });
      }
      setLocation("/admin/group-manager");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEditing) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background/50">
      <div className="p-6">
        <AdminHeader
          title={isEditing ? "Editar Grupo" : "Criar Grupo"}
          subtitle={isEditing ? `Editando: ${id}` : "Novo grupo de camadas"}
        />
      </div>

      <div className=" flex items-center justify-center p-0 md:p-6">
        <Card className="w-full md:max-w-lg border-0 md:border shadow-none md:shadow-sm h-full md:h-auto rounded-none md:rounded-lg">
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <CardHeader>
              <CardTitle>{isEditing ? "Informações do Grupo" : "Novo Grupo"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" {...form.register("name")} placeholder="Digite o nome do grupo" />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 flex flex-col">
                <Label>Grupo pai</Label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className="w-full justify-between"
                    >
                      {form.watch("ownerGroup")
                        ? groups.find(
                            (group) => group.id === form.watch("ownerGroup")
                          )?.name || "Selecione..."
                        : "Selecione um grupo..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <div className="p-2">
                      <Input
                        placeholder="Buscar grupo..."
                        value={searchGroup}
                        onChange={(e) => setSearchGroup(e.target.value)}
                        className="mb-2"
                      />
                      <div className="max-h-60 overflow-y-auto">
                        {groups.map((group) => (
                          <div
                            key={group.id}
                            className={cn(
                              "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                              form.watch("ownerGroup") === group.id
                                ? "bg-accent"
                                : ""
                            )}
                            onClick={() => {
                              form.setValue(
                                "ownerGroup",
                                group.id === form.watch("ownerGroup")
                                  ? ""
                                  : group.id
                              );
                              setOpenCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                form.watch("ownerGroup") === group.id
                                  ? "opacity-100"
                                  : "opacity-0"
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
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2 border-t pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/admin/group-manager")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Atualizar" : "Salvar"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default GroupHandlePage;
