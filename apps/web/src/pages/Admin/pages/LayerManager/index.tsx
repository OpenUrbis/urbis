import { Button } from "@/components/ui/button";
import {
  deleteLayerSchema,
  getLayerSchemas,
} from "@/integrations/layer-schema-integration";
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
import { useToast } from "@/hooks/useToast";
import { AdminHeader } from "@/components/AdminHeader";
import { useLocation } from "wouter";
import { IGetConfigLayerSchema } from "@/types/fetch-map-config-type";
import { HasPermission } from "@/components/AccessControl/HasPermission";
import { RolePermissionScopeEnum } from "@/utils/access-control";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Helper for domain
const getDomain = (url: string) => {
  try {
    const { hostname } = new URL(url);
    return hostname;
  } catch {
    return url;
  }
};

type SortOrder = "ASC" | "DESC";

const LayerManagerPage = () => {
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [layerToDelete, setLayerToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sorting state
  const [sortBy, setSortBy] = useState<string>("isActive");
  const [sortOrder, setSortOrder] = useState<SortOrder>("DESC");

  const { toastSuccess, toastError } = useToast();

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["layer-schemas", currentPage, itemsPerPage, sortBy, sortOrder],
    queryFn: () =>
      getLayerSchemas(currentPage, itemsPerPage, undefined, sortBy, sortOrder),
  });

  const handleDelete = async () => {
    if (!layerToDelete) return;
    setIsDeleting(true);
    try {
      await deleteLayerSchema(layerToDelete);
      toastSuccess("Camada excluída com sucesso");
      refetch();
    } catch (error) {
      console.error("Failed to delete layer", error);
      toastError(
        error instanceof Error ? error.message : "Erro ao excluir camada",
      );
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setLayerToDelete(null);
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
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-destructive">Erro ao carregar camadas.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Handle server-side pagination (Object) or fallback (Array)
  const layers: IGetConfigLayerSchema[] =
    response && typeof response === "object" && "data" in response
      ? (response as { data: IGetConfigLayerSchema[] }).data
      : Array.isArray(response)
        ? response
        : [];

  const totalItems =
    response && typeof response === "object" && "total" in response
      ? (response as { total: number }).total
      : layers.length;

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const currentLayers = layers;

  // startIndex for display "Showing X to Y"
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + layers.length;

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="p-6 space-y-2 overflow-auto h-full flex flex-col">
      <AdminHeader
        title="Camadas do sistema"
        subtitle="Camadas globais do mapa"
        className="mb-0 pb-0"
      >
        <HasPermission
          permissions={{
            id: "layer-schema:create",
            action: "create",
            resource: "layer-schema",
            scope: RolePermissionScopeEnum.ANY,
          }}
        >
          <Button onClick={() => setLocation("~/admin/layer-manager/handle")}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Camada
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
              <th
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort("origin")}
              >
                <div className="flex items-center">
                  Origem
                  {renderSortIcon("origin")}
                </div>
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Grupo
              </th>
              <th
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort("type")}
              >
                <div className="flex items-center">
                  Tipo
                  {renderSortIcon("type")}
                </div>
              </th>
              <th
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort("isVisible")}
              >
                <div className="flex items-center">
                  Visível por padrão
                  {renderSortIcon("isVisible")}
                </div>
              </th>
              <th
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort("isActive")}
              >
                <div className="flex items-center">
                  Status
                  {renderSortIcon("isActive")}
                </div>
              </th>
              <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {currentLayers.map((layer) => (
                  <tr
                    key={layer.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <td className="p-4 align-middle font-medium">
                      {layer.name}
                    </td>
                    <td className="p-4 align-middle">
                      {getDomain(layer.origin)}
                    </td>
                    <td className="p-4 align-middle">
                      {layer.layerGroup?.name ?? "Sem grupo"}
                    </td>
                    <td className="p-4 align-middle">{layer.type}</td>
                    <td className="p-4 align-middle">
                      {layer.isVisible ? "Sim" : "Não"}
                    </td>
                    <td className="p-4 align-middle">
                      {(layer.isActive as any) === true ||
                      (layer.isActive as any) === "active" ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                          Inativa
                        </span>
                      )}
                    </td>
                    <td className="p-4 align-middle text-right">
                      <div className="flex items-center justify-end space-x-2">
                      <HasPermission
                        permissions={{
                          id: "layer-schema:update",
                          action: "update",
                          resource: "layer-schema",
                          scope: RolePermissionScopeEnum.ANY,
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setLocation(`~/admin/layer-manager/${layer.id}`)
                          }
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </HasPermission>
                      <HasPermission
                        permissions={{
                          id: "layer-schema:delete",
                          action: "delete",
                          resource: "layer-schema",
                          scope: RolePermissionScopeEnum.ANY,
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setLayerToDelete(layer.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </HasPermission>
                      </div>
                    </td>
                  </tr>
                ))}
                {currentLayers.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-4 text-center text-muted-foreground"
                    >
                      Nenhuma camada encontrada.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
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
            <DialogTitle>Excluir Camada</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta camada? Esta ação não pode ser
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
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LayerManagerPage;
