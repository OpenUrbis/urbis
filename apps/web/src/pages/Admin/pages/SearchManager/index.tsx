import { Button } from "@/components/ui/button";
import { deleteSearchConfig, getSearchConfigs } from "@/integrations/search-integration";
import { useQuery } from "@preact-signals/query";
import { ChevronLeft, ChevronRight, Edit2, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import { AdminHeader } from "@/components/AdminHeader";
import { useLocation } from "wouter";
import { IGetSearchConfigResponse } from "@/types/fetch-search-config-type";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SearchManagerPage = () => {
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchToDelete, setSearchToDelete] = useState<string | null>(null);
  const { toastSuccess, toastError } = useToast();

  const {
    data: response,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ["search-configs", currentPage, itemsPerPage],
    queryFn: () => getSearchConfigs(currentPage, itemsPerPage),
  });

  const handleDelete = async () => {
    if (!searchToDelete) return;
    try {
      await deleteSearchConfig(searchToDelete);
      toastSuccess("Pesquisa excluída com sucesso");
      refetch();
    } catch (error) {
      console.error("Failed to delete search", error);
      toastError("Erro ao excluir pesquisa");
    } finally {
      setDeleteDialogOpen(false);
      setSearchToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-auto">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return <div className="p-4 text-red-500">Erro ao carregar pesquisas.</div>;
  }

  // Handle server-side pagination (Object) or fallback (Array)
  const searchConfigs: IGetSearchConfigResponse[] = (response && typeof response === 'object' && 'data' in response) 
    ? (response as { data: IGetSearchConfigResponse[] }).data 
    : (Array.isArray(response) ? response : []);
  
  const totalItems = (response && typeof response === 'object' && 'total' in response)
    ? (response as { total: number }).total
    : searchConfigs.length;

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const currentItems = searchConfigs;

  // startIndex for display "Showing X to Y"
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + searchConfigs.length;

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="p-6 space-y-4 overflow-auto h-full flex flex-col">
      <AdminHeader title="Pesquisas do sistema" subtitle="Configurações de pesquisa">
        <Button onClick={() => setLocation("~/admin/search-manager/handle")}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Pesquisa
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
                Método
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Camada Vinculada
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Status
              </th>
              <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {currentItems.map((item) => (
              <tr
                key={item.id}
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
              >
                <td className="p-4 align-middle font-medium">{item.name}</td>
                <td className="p-4 align-middle">{item.method || "GET"}</td>
                <td className="p-4 align-middle">{item.layerSchema?.name || "-"}</td>
                <td className="p-4 align-middle">
                  {item.isActive ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      Ativa
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                      Inativa
                    </span>
                  )}
                </td>
                <td className="p-4 flex align-middle justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLocation(`~/admin/search-manager/${item.id}`)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setSearchToDelete(item.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {currentItems.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-4 text-center text-muted-foreground"
                >
                  Nenhuma pesquisa encontrada.
                </td>
              </tr>
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
            <DialogTitle>Excluir Pesquisa</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta pesquisa? Esta ação não pode ser desfeita.
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

export default SearchManagerPage;
