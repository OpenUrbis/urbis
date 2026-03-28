import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, useRoute } from "wouter";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { AdminHeader } from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GroupSelect } from "@/components/GroupSelect";
import {
  createLayerGroup,
  updateLayerGroup,
  getLayerGroup,
} from "@/integrations/layer-group-integration";
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
  const { toastSuccess, toastError } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      ownerGroup: "",
    },
  });

  useEffect(() => {
    if (isEditing && id) {
      setIsLoading(true);
      getLayerGroup(id)
        .then((data) => {
          form.setValue("name", data.name);
          form.setValue("ownerGroup", data.ownerGroup || "");
        })
        .catch((err) => {
          console.error(err);
          toastError("Erro ao carregar grupo");
        })
        .finally(() => setIsLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, id]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      const { name, ownerGroup } = values;

      if (isEditing && id) {
        await updateLayerGroup(id, {
          name,
          ownerGroup: ownerGroup ? ownerGroup : undefined,
          id,
        });
        toastSuccess("Grupo atualizado com sucesso");
      } else {
        const generatedId = `${name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")}-${Date.now()}`;
        await createLayerGroup({
          name,
          ownerGroup: ownerGroup ? ownerGroup : undefined,
          id: generatedId,
        });
        toastSuccess("Grupo criado com sucesso");
      }
      setLocation("~/admin/group-manager");
    } catch (error) {
      console.error(error);
      toastError("Erro ao salvar grupo");
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
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full"
          >
            <CardHeader>
              <CardTitle>
                {isEditing ? "Informações do Grupo" : "Novo Grupo"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Digite o nome do grupo"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 flex flex-col">
                <Label>Grupo pai</Label>
                <GroupSelect
                  value={form.watch("ownerGroup") || ""}
                  onChange={(val) => form.setValue("ownerGroup", val)}
                  excludeId={id}
                  placeholder="Selecione um grupo pai..."
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2 border-t pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("~/admin/group-manager")}
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
