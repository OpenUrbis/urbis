import { HasPermission } from "@/components/AccessControl/HasPermission";
import { AdminHeader } from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAdminMapConfigs } from "@/integrations/map-config-integration";
import { IMapConfigAdminItem } from "@/types/map-config-admin-type";
import { RolePermissionScopeEnum } from "@/utils/access-control";
import { useQuery } from "@preact-signals/query";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

type SortColumn = "id" | "description";
type SortOrder = "ASC" | "DESC";

const formatValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
};

const MAX_PREVIEW_LENGTH = 600;

const MapConfigManagerPage = () => {
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState<SortColumn>("id");
  const [sortOrder, setSortOrder] = useState<SortOrder>("ASC");
  const [selectedConfig, setSelectedConfig] =
    useState<IMapConfigAdminItem | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-map-configs"],
    queryFn: getAdminMapConfigs,
  });

  const mapConfigs = useMemo(() => {
    const items = [...(data ?? [])];

    items.sort((current, next) => {
      const currentValue = String(current[sortBy] ?? "").toLocaleLowerCase();
      const nextValue = String(next[sortBy] ?? "").toLocaleLowerCase();

      const comparison = currentValue.localeCompare(nextValue, "pt-BR");

      return sortOrder === "ASC" ? comparison : -comparison;
    });

    return items;
  }, [data, sortBy, sortOrder]);

  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder((current) => (current === "ASC" ? "DESC" : "ASC"));
      return;
    }

    setSortBy(column);
    setSortOrder("ASC");
  };

  const renderSortIcon = (column: SortColumn) => {
    if (sortBy !== column) return null;

    return sortOrder === "ASC" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  if (isError) {
    return (
      <div className="p-4 text-red-500">
        Erro ao carregar propriedades de configuração do mapa.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-2 overflow-auto h-full flex flex-col">
      <AdminHeader
        title="Parâmetros do mapa"
        subtitle="Propriedades administrativas da configuração global do mapa"
        className="mb-0 pb-0"
      >
        <HasPermission
          permissions={{
            id: "map-config:update",
            action: "update",
            resource: "map-config",
            scope: RolePermissionScopeEnum.ANY,
          }}
        >
          <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
            Edição habilitada por tipagem persistida
          </div>
        </HasPermission>
      </AdminHeader>

      <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-auto relative min-h-[200px]">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort("id")}
              >
                <div className="flex items-center">
                  Identificador
                  {renderSortIcon("id")}
                </div>
              </th>
              <th
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort("description")}
              >
                <div className="flex items-center">
                  Descrição
                  {renderSortIcon("description")}
                </div>
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Valor
              </th>
              <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {mapConfigs.map((item: IMapConfigAdminItem) => {
                  const formattedValue = formatValue(item.value);
                  const shouldCollapse =
                    formattedValue.length > MAX_PREVIEW_LENGTH;
                  const previewValue = shouldCollapse
                    ? `${formattedValue.slice(0, MAX_PREVIEW_LENGTH)}...`
                    : formattedValue;

                  return (
                    <tr
                      key={item.id}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <td className="p-4 align-top font-medium whitespace-nowrap">
                        {item.id}
                      </td>
                      <td className="p-4 align-top min-w-[280px]">
                        {item.description}
                      </td>
                      <td className="p-4 align-top w-full">
                        <div
                          className="group relative"
                          onClick={
                            shouldCollapse
                              ? () => setSelectedConfig(item)
                              : undefined
                          }
                        >
                          <pre className="whitespace-pre-wrap break-words text-xs text-muted-foreground font-mono bg-muted/40 rounded-md p-3 max-w-[720px] overflow-hidden max-h-40">
                            {previewValue}
                          </pre>

                          {shouldCollapse && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-background/10 opacity-0 transition-opacity group-hover:bg-background/25 group-hover:opacity-100">
                              <span className="rounded-md bg-background/40 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
                                Clique para visualizar o conteúdo completo
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-top text-right whitespace-nowrap">
                        <HasPermission
                          permissions={{
                            id: "map-config:update",
                            action: "update",
                            resource: "map-config",
                            scope: RolePermissionScopeEnum.ANY,
                          }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setLocation(
                                `~/admin/map-config-manager/${item.id}`,
                              )
                            }
                          >
                            Editar
                          </Button>
                        </HasPermission>
                      </td>
                    </tr>
                  );
                })}

                {mapConfigs.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-4 text-center text-muted-foreground"
                    >
                      Nenhum parâmetro encontrado.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={selectedConfig !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedConfig(null);
          }
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              Valor completo de{" "}
              <span className="font-mono">{selectedConfig?.id}</span>
            </DialogTitle>
            <DialogDescription>
              Visualização integral do conteúdo armazenado para este parâmetro.
            </DialogDescription>
          </DialogHeader>

          <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted/40 p-4 text-xs text-muted-foreground font-mono">
            {selectedConfig ? formatValue(selectedConfig.value) : ""}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MapConfigManagerPage;
