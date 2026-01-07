import { Button } from "@/components/ui/button";
import { getLayerSchemas } from "@/integrations/layer-schema-integration";
import { useQuery } from "@preact-signals/query";
import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { useLocation } from "wouter";
import { IGetConfigLayerSchema } from "@/types/fetch-map-config-type";

// Helper for domain
const getDomain = (url: string) => {
  try {
    const { hostname } = new URL(url);
    return hostname;
  } catch {
    return url;
  }
};

const LayerManagerPage = () => {
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["layer-schemas", currentPage, itemsPerPage],
    queryFn: () => getLayerSchemas(currentPage, itemsPerPage),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-auto">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return <div className="p-4 text-red-500">Erro ao carregar camadas.</div>;
  }

  // Handle server-side pagination (Object) or fallback (Array)
  const layers: IGetConfigLayerSchema[] = (response && typeof response === 'object' && 'data' in response) 
    ? (response as { data: IGetConfigLayerSchema[] }).data 
    : (Array.isArray(response) ? response : []);
  
  const totalItems = (response && typeof response === 'object' && 'total' in response)
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
    <div className="p-6 space-y-4 overflow-auto h-full flex flex-col">
      <AdminHeader title="Camadas do sistema" subtitle="Camadas globais do mapa">
        <Button onClick={() => setLocation("~/admin/layer-manager/handle")}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Camada
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
                Origem
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Grupo
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Tipo
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Visível por padrão
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {currentLayers.map((layer) => (
              <tr
                key={layer.id}
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer"
                onClick={() =>
                  setLocation(`~/admin/layer-manager/${layer.id}`)
                }
              >
                <td className="p-4 align-middle font-medium">{layer.name}</td>
                <td className="p-4 align-middle">{getDomain(layer.origin)}</td>
                <td className="p-4 align-middle">{layer.layerGroup.name}</td>
                <td className="p-4 align-middle">{layer.type}</td>
                <td className="p-4 align-middle">
                  {layer.isVisible ? "Sim" : "Não"}
                </td>
                <td className="p-4 align-middle">
                  {/* @ts-expect-error: handling potential string type mismatch from user requirement */}
                  {layer.isActive === true || layer.isActive === "active" ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      Ativa
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                      Inativa
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {currentLayers.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-4 text-center text-muted-foreground"
                >
                  Nenhuma camada encontrada.
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
    </div>
  );
};

export default LayerManagerPage;
