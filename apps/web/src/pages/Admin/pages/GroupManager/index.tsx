import { Button } from "@/components/ui/button";
import { deleteLayerGroup, getLayerGroups } from "@/integrations/layer-group-integration";
import { useQuery } from "@preact-signals/query";
import { ChevronLeft, ChevronRight, Edit2, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { AdminHeader } from "@/components/AdminHeader";
import { IGetConfigLayerGroup } from "@/types/fetch-map-config-type";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const GroupManagerPage = () => {
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["layer-groups", currentPage, itemsPerPage],
    queryFn: () => getLayerGroups(currentPage, itemsPerPage),
  });

  const handleDelete = async () => {
    if (!groupToDelete) return;
    try {
      await deleteLayerGroup(groupToDelete);
      refetch();
    } catch (error) {
      console.error("Failed to delete group", error);
    } finally {
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return <div className="p-4 text-red-500">Erro ao carregar grupos.</div>;
  }

  const groups: IGetConfigLayerGroup[] =
    response && typeof response === "object" && "data" in response
      ? (response as { data: IGetConfigLayerGroup[] }).data
      : Array.isArray(response)
        ? response
        : [];

  const totalItems =
    response && typeof response === "object" && "total" in response
      ? (response as { total: number }).total
      : groups.length;

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentGroups = groups;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + groups.length;

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="p-6 space-y-4 overflow-auto h-full flex flex-col">
      <AdminHeader title="Grupos de Camadas" subtitle="Gerenciamento de grupos">
        <Button onClick={() => setLocation("/handle")}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Grupo
        </Button>
      </AdminHeader>

      <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Nome
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Grupo pai
              </th>
              <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {currentGroups.map((group) => (
              <tr
                key={group.id}
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
              >
                <td className="p-4 align-middle font-medium">{group.name}</td>
                <td className="p-4 align-middle font-medium">
                  {group?.parentGroup?.name ?? "-"}
                </td>
                <td className="p-4 flex align-middle text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLocation(`/${group.id}`)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setGroupToDelete(group.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {currentGroups.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="p-4 text-center text-muted-foreground"
                >
                  Nenhum grupo encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalItems > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} até {Math.min(endIndex, totalItems)} de{" "}
            {totalItems} resultados
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <div className="text-sm font-medium">
              Página {currentPage} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Grupo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este grupo? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupManagerPage;
