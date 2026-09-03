import { AdminHeader } from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getLinkDiagnostics,
  DiagnosticsResponse,
} from "@/integrations/diagnostics-integration";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Layers,
  LayoutGrid,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  BookOpen,
  Sliders,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

type FilterStatus = "all" | "ok" | "broken";
type FilterSource =
  | "all"
  | "mosaico"
  | "legis"
  | "layer_schema"
  | "search_config";

const DiagnosticsPage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<DiagnosticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [sourceFilter, setSourceFilter] = useState<FilterSource>("all");

  const runCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getLinkDiagnostics();
      setData(response);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message ||
          "Erro ao executar o diagnóstico. Certifique-se de que o backend está ativo.",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = useMemo(() => {
    if (!data) return [];
    return data.results.filter((item) => {
      // 1. Search term
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        item.url.toLowerCase().includes(searchLower) ||
        item.sourceName.toLowerCase().includes(searchLower) ||
        (item.errorMessage &&
          item.errorMessage.toLowerCase().includes(searchLower));

      // 2. Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "ok" && item.status === "ok") ||
        (statusFilter === "broken" && item.status === "broken");

      // 3. Source filter
      const matchesSource =
        sourceFilter === "all" || item.sourceType === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [data, searchTerm, statusFilter, sourceFilter]);

  // Helper to render source badge
  const renderSourceBadge = (type: string) => {
    switch (type) {
      case "mosaico":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50">
            <LayoutGrid className="h-3 w-3" /> Mosaico
          </span>
        );
      case "legis":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50">
            <BookOpen className="h-3 w-3" /> Legis
          </span>
        );
      case "layer_schema":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50">
            <Layers className="h-3 w-3" /> Camada Map
          </span>
        );
      case "search_config":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50">
            <Sliders className="h-3 w-3" /> Pesquisa Map
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-gray-50 text-gray-700 border border-gray-100 dark:bg-gray-800 dark:text-gray-400">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-auto h-full flex flex-col bg-background">
      <AdminHeader
        title="Diagnóstico de Links"
        subtitle="Varredura e validação inteligente de links do Mosaico, Legis e chamadas/fontes de dados do mapa"
        className="mb-0 pb-0"
      />

      {/* Initial / Empty State */}
      {!data && !loading && !error && (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 bg-card text-card-foreground shadow-sm max-w-2xl mx-auto w-full">
          <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
            <Link2 className="h-10 w-10 animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            Análise de Links Quebrados
          </h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Esta ferramenta realiza uma consulta otimizada no banco de dados
            para extrair todas as URLs externas das páginas do Mosaico, Legis e
            os links de chamadas externas de camadas e buscas do mapa, validando
            quais estão online (200 OK) ou retornando erro.
          </p>
          <Button size="lg" onClick={runCheck} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Iniciar Varredura de Diagnóstico
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4 max-w-2xl mx-auto w-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h3 className="text-lg font-medium">Executando Diagnóstico...</h3>
          <p className="text-muted-foreground text-center max-w-md text-sm">
            Buscando todas as referências do Mosaico, Legis e fontes de mapas,
            extraindo URLs e testando conexões em paralelo. Por favor, aguarde
            alguns instantes.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex-1 flex flex-col items-center justify-center border border-destructive/20 rounded-lg p-8 bg-destructive/5 text-destructive max-w-2xl mx-auto w-full">
          <AlertTriangle className="h-10 w-10 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Falha na Execução</h3>
          <p className="text-sm text-center mb-6 max-w-md opacity-90">
            {error}
          </p>
          <Button
            variant="outline"
            onClick={runCheck}
            className="gap-2 border-destructive/20 hover:bg-destructive/10"
          >
            <RefreshCw className="h-4 w-4" /> Tentar Novamente
          </Button>
        </div>
      )}

      {/* Results View */}
      {data && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg bg-card shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Total Analisado
                </p>
                <h4 className="text-2xl font-bold mt-1">
                  {data.summary.total}
                </h4>
              </div>
              <div className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                <Link2 className="h-5 w-5" />
              </div>
            </div>

            <div className="p-4 border border-emerald-500/10 rounded-lg bg-emerald-500/5 dark:bg-emerald-950/10 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider">
                  Links OK (2xx)
                </p>
                <h4 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  {data.summary.ok}
                </h4>
              </div>
              <div className="p-2.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            <div className="p-4 border border-red-500/10 rounded-lg bg-red-500/5 dark:bg-red-950/10 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium uppercase tracking-wider">
                  Links Quebrados
                </p>
                <h4 className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">
                  {data.summary.broken}
                </h4>
              </div>
              <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                <XCircle className="h-5 w-5" />
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-card shadow-sm flex flex-col justify-center space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Fontes de Origem
              </p>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div className="flex justify-between">
                  <span>Mosaico:</span>
                  <span className="font-semibold text-foreground">
                    {data.summary.mosaicoCount ?? 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Legislação (Legis):</span>
                  <span className="font-semibold text-foreground">
                    {data.summary.legisCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Camadas do Mapa:</span>
                  <span className="font-semibold text-foreground">
                    {data.summary.layerSchemaCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Buscas do Mapa:</span>
                  <span className="font-semibold text-foreground">
                    {data.summary.searchConfigCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por URL, erro ou nome da origem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm((e.target as any).value)}
                className="pl-9"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <span className="text-muted-foreground">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter((e.target as any).value as FilterStatus)
                  }
                  className="bg-background border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">Todos</option>
                  <option value="ok">Apenas Online (OK)</option>
                  <option value="broken">Apenas Com Erro (Quebrados)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-sm font-medium">
                <span className="text-muted-foreground">Origem:</span>
                <select
                  value={sourceFilter}
                  onChange={(e) =>
                    setSourceFilter((e.target as any).value as FilterSource)
                  }
                  className="bg-background border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">Todas</option>
                  <option value="mosaico">Apenas Mosaico</option>
                  <option value="legis">Apenas Legis</option>
                  <option value="layer_schema">Apenas Camadas</option>
                  <option value="search_config">Apenas Buscas</option>
                </select>
              </div>

              <Button onClick={runCheck} variant="outline" className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Re-escanear
              </Button>
            </div>
          </div>

          {/* Results Table */}
          <div className="flex-1 rounded-md border bg-card text-card-foreground shadow-sm overflow-auto relative min-h-[300px]">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10 border-b">
                <tr>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-1/12">
                    Status
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-2/12">
                    Origem
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-3/12">
                    Nome da Seção/Página
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-4/12">
                    URL do Link
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-2/12">
                    Erro / HTTP Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhum link encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b transition-colors hover:bg-muted/30 align-middle"
                    >
                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {item.status === "ok" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="h-4 w-4" /> Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                            <XCircle className="h-4 w-4" /> Quebrado
                          </span>
                        )}
                      </td>

                      {/* Origin Badge */}
                      <td className="px-4 py-3.5">
                        {renderSourceBadge(item.sourceType)}
                      </td>

                      {/* Source Section/Page Title */}
                      <td className="px-4 py-3.5 font-medium max-w-[220px] truncate">
                        <span
                          title={`${item.sourceName} (ID: ${item.sourceId})`}
                        >
                          {item.sourceName}
                        </span>
                        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          ID: {item.sourceId}
                        </div>
                      </td>

                      {/* URL with external link */}
                      <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs max-w-[340px] truncate">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={item.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline text-primary truncate flex-1"
                            title={item.originalUrl}
                          >
                            {item.originalUrl}
                          </a>
                          <a
                            href={item.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary shrink-0"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* HTTP Status or Error Message */}
                      <td className="px-4 py-3.5">
                        {item.status === "ok" ? (
                          <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium">
                            {item.statusCode || "200"} OK
                          </span>
                        ) : (
                          <span
                            className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 font-medium truncate inline-block max-w-[200px]"
                            title={item.errorMessage || "Erro na conexão"}
                          >
                            {item.statusCode
                              ? `HTTP ${item.statusCode}`
                              : item.errorMessage || "Falha"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default DiagnosticsPage;
