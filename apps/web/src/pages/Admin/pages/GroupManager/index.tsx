import { HasPermission } from "@/components/AccessControl/HasPermission";
import { AdminHeader } from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import {
  deleteLayerGroup,
  getLayerGroups,
} from "@/integrations/layer-group-integration";
import { IGetConfigLayerGroup } from "@/types/fetch-map-config-type";
import { RolePermissionScopeEnum } from "@/utils/access-control";
import { useQuery } from "@preact-signals/query";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

type SortOrder = "ASC" | "DESC";

const GroupManagerPage = () => {
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  // Sorting state
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("ASC");

  const { toastSuccess, toastError } = useToast();

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["layer-groups", currentPage, itemsPerPage, sortBy, sortOrder],
    queryFn: () =>
      getLayerGroups(currentPage, itemsPerPage, undefined, sortBy, sortOrder),
  });

  const handleDelete = async () => {
    if (!groupToDelete) return;
    try {
      await deleteLayerGroup(groupToDelete);
      toastSuccess("Grupo excluído com sucesso");
      refetch();
    } catch (error) {
      console.error("Failed to delete group", error);
      toastError("Erro ao excluir grupo");
    } finally {
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(column);
      setSortOrder("ASC");
    }
  };

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === "ASC" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

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
    <div className="p-6 space-y-2 overflow-auto h-full flex flex-col">
      <AdminHeader
        title="Grupos de Camadas"
        subtitle="Gerenciamento de grupos"
        className="mb-0 pb-0"
      >
        <HasPermission
          permissions={{
            id: "layer-group:create",
            action: "create",
            resource: "layer-group",
            scope: RolePermissionScopeEnum.ANY,
          }}
        >
          <Button onClick={() => setLocation("/handle")}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Grupo
          </Button>
        </HasPermission>
      </AdminHeader>

      <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-auto relative min-h-[200px]">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Nome
                  {renderSortIcon("name")}
                </div>
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
            {isLoading ? (
              <tr>
                <td colSpan={3} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {currentGroups.map((group) => (
                  <tr
                    key={group.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <td className="p-4 align-middle font-medium">
                      {group.name}
                    </td>
                    <td className="p-4 align-middle font-medium">
                      {group?.parentGroup?.name ?? "-"}
                    </td>
                    <td className="p-4 flex align-middle text-right space-x-2">
                      <HasPermission
                        permissions={{
                          id: "layer-group:update",
                          action: "update",
                          resource: "layer-group",
                          scope: RolePermissionScopeEnum.ANY,
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setLocation(`/${group.id}`)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </HasPermission>
                      <HasPermission
                        permissions={{
                          id: "layer-group:delete",
                          action: "delete",
                          resource: "layer-group",
                          scope: RolePermissionScopeEnum.ANY,
                        }}
                      >
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
                      </HasPermission>
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
              </>
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
              disabled={currentPage === 1 || isLoading}
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
              disabled={currentPage === totalPages || isLoading}
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
              Tem certeza que deseja excluir este grupo? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupManagerPage;
