import React, { useState, useEffect, useCallback } from "react";
import { Button, Input, cn } from "@open-urbis/map-ui";
import { Link, useLocation, useRoute, useSearch } from "wouter";
import {
  Search,
  Scale,
  HelpCircle,
  Database,
  ChevronRight,
  Loader2,
  Info,
  Plus,
  Book,
  ArrowRight,
  LayoutGrid,
  List,
  X,
  CheckSquare,
  Users,
} from "lucide-react";
import {
  pageService,
  AdvancedSearchQuery,
  SearchCondition,
  GlobalSearchResult,
} from "../services/page-service";
import { PageType } from "../types/page";
import { usePage } from "../hooks/use-page";
import { usePermission } from "../hooks/use-permission";
import { useLegisLayout } from "../components/layout/legis-layout";
import { PageResultCard } from "../components/page/PageResultCard";
import { PageResultListSkeleton } from "../components/page/PageResultCardSkeleton";

export default function Home() {
  const [, setLocation] = useLocation();
  const [matchPages] = useRoute("/pages");
  const searchString = useSearch(); // Query string
  const { setHelpOpen } = useLegisLayout();

  // If user is at /pages, they are in "Search/List" mode.
  // If user is at /, they are in "Landing" mode.
  const isSearchMode = matchPages;

  // Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<PageType | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<GlobalSearchResult[] | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid"); // Grid as default
  const [isMoreInfoOpen, setIsMoreInfoOpen] = useState(false);

  const getPageTypeLabel = (type: PageType) => {
    return type === "original_normativo"
      ? "Originais normativos"
      : "Coletâneas temáticas";
  };

  const buildPagesUrl = ({
    q,
    category,
    type,
    deleted,
  }: {
    q?: string;
    category?: string | null;
    type?: PageType | null;
    deleted?: boolean;
  }) => {
    const params = new URLSearchParams();

    if (q?.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    if (type) params.set("type", type);
    if (deleted) params.set("deleted", "true");

    const query = params.toString();
    return query ? `/pages?${query}` : "/pages";
  };

  const landingCategories = [
    {
      title: "Originais normativos",
      description: "normas completas (lei, decreto, portaria etc.)",
      icon: <Scale className="h-6 w-6" />,
      color: "text-blue-700 dark:text-blue-300",
      onClick: () => setLocation(buildPagesUrl({ type: "original_normativo" })),
    },
    {
      title: "Coletâneas temáticas",
      description:
        "trechos de um ou mais originais normativos sobre um tema específico",
      icon: <Book className="h-6 w-6" />,
      color: "text-sky-700 dark:text-sky-300",
      onClick: () => setLocation(buildPagesUrl({ type: "coletanea_tematica" })),
    },
    {
      title: "Exigências",
      description: "deveres e direitos (o que eu devo fazer)",
      icon: <CheckSquare className="h-6 w-6" />,
      color: "text-emerald-700 dark:text-emerald-300",
      onClick: () => setLocation(buildPagesUrl({ category: "Exigências" })),
    },
    {
      title: "Competências",
      description:
        "poderes e deveres dos órgãos ou instituições públicos (quem devo procurar)",
      icon: <Users className="h-6 w-6" />,
      color: "text-green-700 dark:text-green-300",
      onClick: () => setLocation(buildPagesUrl({ category: "Competências" })),
    },
    {
      title: "Definições",
      description:
        "entender um conceito técnico-jurídico, sistematicamente (o que significa isso)",
      icon: <Info className="h-6 w-6" />,
      color: "text-amber-700 dark:text-amber-300",
      onClick: () => setLocation(buildPagesUrl({ category: "Definições" })),
    },
    {
      title: "Fontes de Informação",
      description:
        "bases de dados previstas ou implementadas (onde eu posso pesquisar informações)",
      icon: <Database className="h-6 w-6" />,
      color: "text-purple-700 dark:text-purple-300",
      onClick: () =>
        setLocation(buildPagesUrl({ category: "Fontes de Informação" })),
    },
  ];

  // Manager/Admin Actions
  const { deletePage } = usePage();
  const { isAdmin, canCreate, canDelete } = usePermission();
  const [showDeleted, setShowDeleted] = useState(false);

  const loadRecentPages = useCallback(
    async (cat?: string | null, type?: PageType | null, deleted?: boolean) => {
      setIsSearching(true);
      try {
        let pages = await pageService.getAll({ withDeleted: deleted });

        if (type) {
          pages = pages.filter((p) => p.type === type);
        }

        if (cat) {
          pages = pages.filter(
            (p) =>
              p.type === "coletanea_tematica" &&
              (p.entity as any)?.collectionType === cat,
          );
        }
        setResults(pages.map((p) => ({ page: p, matches: [], score: 0 })));
      } catch (error) {
        console.error("Failed to load pages", error);
      } finally {
        setIsSearching(false);
      }
    },
    [],
  );

  const performSearch = useCallback(
    async (
      term: string,
      cat?: string | null,
      type?: PageType | null,
      deleted?: boolean,
    ) => {
      if (!term.trim()) {
        loadRecentPages(cat, type, deleted);
        return;
      }

      setIsSearching(true);
      try {
        const terms = term.split(" ").filter((t) => t.trim());
        const conditions: SearchCondition[] = terms.map((t, idx) => ({
          id: idx.toString(),
          field: "term",
          operator: "contains",
          value: t,
          connector: "AND",
        }));

        const query: AdvancedSearchQuery = { conditions, withDeleted: deleted };
        let searchResults = await pageService.searchPages(query);

        if (type) {
          searchResults = searchResults.filter((res) => res.page.type === type);
        }

        if (cat) {
          searchResults = searchResults.filter(
            (res) =>
              res.page.type === "coletanea_tematica" &&
              (res.page.entity as any)?.collectionType === cat,
          );
        }

        setResults(searchResults);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsSearching(false);
      }
    },
    [loadRecentPages],
  );

  // Parse query params for initial search
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const q = params.get("q");
    const cat = params.get("category");
    const type = params.get("type");
    const deleted = params.get("deleted") === "true";

    const parsedType =
      type === "original_normativo" || type === "coletanea_tematica"
        ? type
        : null;

    if (cat) setCategoryFilter(cat);
    else setCategoryFilter(null);

    if (parsedType) setTypeFilter(parsedType);
    else setTypeFilter(null);

    setShowDeleted(deleted);

    if (q) {
      setSearchTerm(q);
      performSearch(q, cat, parsedType, deleted);
    } else if (isSearchMode) {
      setSearchTerm("");
      loadRecentPages(cat, parsedType, deleted);
    }
  }, [isSearchMode, searchString, performSearch, loadRecentPages]);

  const handleSearchInput = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setLocation(
        buildPagesUrl({
          q: searchTerm,
          category: categoryFilter,
          type: typeFilter,
          deleted: showDeleted,
        }),
      );
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    const pageResult = results?.find((r) => r.page.id === id);
    const isAlreadyDeleted = Boolean(pageResult?.page.deletedAt);

    if (isAlreadyDeleted) {
      if (
        confirm(
          "ATENÇÃO: Deseja EXCLUIR DEFINITIVAMENTE esta página do banco de dados? Esta ação não pode ser desfeita.",
        )
      ) {
        try {
          await pageService.permanentDeletePage(id);
          if (searchTerm.trim()) {
            performSearch(searchTerm, categoryFilter, typeFilter, showDeleted);
          } else {
            loadRecentPages(categoryFilter, typeFilter, showDeleted);
          }
        } catch (error) {
          console.error("Failed to permanently delete page", error);
          alert("Erro ao excluir permanentemente a página");
        }
      }
    } else {
      if (confirm("Tem certeza que deseja mover esta página para a lixeira?")) {
        try {
          await deletePage(id);
          if (searchTerm.trim()) {
            performSearch(searchTerm, categoryFilter, typeFilter, showDeleted);
          } else {
            loadRecentPages(categoryFilter, typeFilter, showDeleted);
          }
        } catch (error) {
          console.error("Failed to delete page", error);
          alert("Erro ao excluir página");
        }
      }
    }
  };

  const handleRestore = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await pageService.restorePage(id);
      if (searchTerm.trim()) {
        performSearch(searchTerm, categoryFilter, typeFilter, showDeleted);
      } else {
        loadRecentPages(categoryFilter, typeFilter, showDeleted);
      }
    } catch (error) {
      console.error("Failed to restore page", error);
      alert("Erro ao restaurar página");
    }
  };

  const handlePermanentDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      confirm(
        "ATENÇÃO: Deseja EXCLUIR DEFINITIVAMENTE esta página do banco de dados? Esta ação não pode ser desfeita.",
      )
    ) {
      try {
        await pageService.permanentDeletePage(id);
        if (searchTerm.trim()) {
          performSearch(searchTerm, categoryFilter, typeFilter, showDeleted);
        } else {
          loadRecentPages(categoryFilter, typeFilter, showDeleted);
        }
      } catch (error) {
        console.error("Failed to permanently delete page", error);
        alert("Erro ao excluir permanentemente a página");
      }
    }
  };

  // ------------------------------------------------------------------
  // VIEW: Search / List Mode (/pages)
  // ------------------------------------------------------------------
  if (isSearchMode) {
    return (
      <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
        <div className="sticky top-[--header-height] z-40 bg-background/80 backdrop-blur-sm border-b">
          <div className="px-4 sm:px-6 py-4 space-y-4 max-w-[1400px] mx-auto w-full">
            {/* Header Top Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  Legis
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Link
                    href="/"
                    className="hover:text-primary transition-colors"
                  >
                    Início
                  </Link>
                  <ChevronRight className="h-3 w-3" />
                  <span>Pesquisa</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-md">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === "grid"
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    title="Grade"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-2 border-l transition-colors",
                      viewMode === "list"
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    title="Lista"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
                {canCreate && (
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/pages/new")}
                    size="sm"
                    className="h-9 px-3 text-xs font-normal"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Criar Página
                  </Button>
                )}
              </div>
            </div>

            {/* Search Row */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                  <Input
                    type="search"
                    placeholder="Pesquisar em títulos, ementas, resumos e dispositivos..."
                    className="pl-10 h-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearchInput}
                  />
                </div>
                <Button
                  onClick={() =>
                    setLocation(
                      buildPagesUrl({
                        q: searchTerm,
                        category: categoryFilter,
                        type: typeFilter,
                        deleted: showDeleted,
                      }),
                    )
                  }
                  disabled={isSearching}
                  variant="outline"
                  className="h-10 px-4 font-normal"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Pesquisar"
                  )}
                </Button>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
                  <input
                    id="show-deleted-toggle"
                    type="checkbox"
                    checked={showDeleted}
                    onChange={(e) => {
                      setLocation(
                        buildPagesUrl({
                          q: searchTerm,
                          category: categoryFilter,
                          type: typeFilter,
                          deleted: e.target.checked,
                        }),
                      );
                    }}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                  />
                  <label
                    htmlFor="show-deleted-toggle"
                    className="cursor-pointer select-none"
                  >
                    Ver itens excluídos
                  </label>
                </div>
              )}
            </div>

            {/* Filtros ativos */}
            {(categoryFilter || typeFilter) && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground animate-in fade-in duration-300">
                <span>Filtros:</span>
                {typeFilter && (
                  <span className="flex items-center gap-1 border rounded-md pl-2.5 pr-1 py-1">
                    {getPageTypeLabel(typeFilter)}
                    <button
                      onClick={() =>
                        setLocation(
                          buildPagesUrl({
                            q: searchTerm,
                            category: categoryFilter,
                            deleted: showDeleted,
                          }),
                        )
                      }
                      className="p-1 hover:text-foreground transition-colors"
                      title="Remover filtro de tipo"
                      aria-label="Remover filtro de tipo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
                {categoryFilter && (
                  <span className="flex items-center gap-1 border rounded-md pl-2.5 pr-1 py-1">
                    {categoryFilter}
                    <button
                      onClick={() =>
                        setLocation(
                          buildPagesUrl({
                            q: searchTerm,
                            type: typeFilter,
                            deleted: showDeleted,
                          }),
                        )
                      }
                      className="p-1 hover:text-foreground transition-colors"
                      title="Remover filtro de categoria"
                      aria-label="Remover filtro de categoria"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
                <button
                  onClick={() =>
                    setLocation(
                      buildPagesUrl({ q: searchTerm, deleted: showDeleted }),
                    )
                  }
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 py-5 min-h-[calc(100vh-200px)] max-w-[1400px] mx-auto w-full">
            {!results ? (
              <PageResultListSkeleton viewMode={viewMode} />
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <h3 className="text-base font-medium">
                  Nenhum documento encontrado
                </h3>
                <p className="text-muted-foreground text-sm">
                  Tente outros termos ou limpe a busca.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-normal"
                  onClick={() => {
                    setSearchTerm("");
                    setLocation("/pages");
                  }}
                >
                  Limpar Busca
                </Button>
              </div>
            ) : (
              <>
                {results && results.length > 0 && (
                  <div className="mb-3 flex items-center justify-between gap-3 border-b pb-2 text-xs text-muted-foreground">
                    <span>
                      {results.length}{" "}
                      {results.length === 1 ? "documento" : "documentos"}
                      {searchTerm.trim() && <> para “{searchTerm.trim()}”</>}
                    </span>
                    {isSearching && (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Atualizando resultados
                      </span>
                    )}
                  </div>
                )}

                <div
                  className={cn(
                    viewMode === "list"
                      ? "flex flex-col"
                      : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch",
                    "animate-in fade-in slide-in-from-bottom-8 duration-700",
                    isSearching &&
                      "pointer-events-none opacity-60 transition-opacity",
                  )}
                >
                  {results?.map((res) => (
                    <PageResultCard
                      key={res.page.id}
                      page={res.page}
                      matches={res.matches}
                      viewMode={viewMode}
                      canEdit={canCreate}
                      canDelete={canDelete}
                      onEdit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setLocation(`/pages/${res.page.id}/edit`);
                      }}
                      onDelete={(e) => handleDelete(e, res.page.id)}
                      onRestore={(e) => handleRestore(e, res.page.id)}
                      onPermanentDelete={(e) => handlePermanentDelete(e, res.page.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // VIEW: Landing Mode (/)
  // ------------------------------------------------------------------
  return (
    <div className="flex flex-col h-full bg-background min-h-screen">
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header / Intro Section (Unsegmented) */}
        <div className="space-y-4 max-w-3xl mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-xs text-muted-foreground">Legis.Urbis</div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground leading-tight">
            Legis
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            O Legis é um componente do Urbis voltado à compreensão e utilização
            de informações normativas (ou seja, sobre leis e similares)
            relacionadas aos seus conteúdos, em observância às diretrizes para a
            Linguagem Simples. Para começar, você pode{" "}
            <button
              onClick={() => setLocation("/pages")}
              className="inline-flex items-center gap-1 text-primary hover:underline font-semibold focus:outline-none align-baseline"
            >
              <Search className="h-3.5 w-3.5 inline" />
              Pesquisar
            </button>{" "}
            as normas ou entender{" "}
            <button
              onClick={() => setHelpOpen(true)}
              className="inline-flex items-center gap-1 text-primary hover:underline font-semibold focus:outline-none align-baseline"
            >
              <HelpCircle className="h-3.5 w-3.5 inline" />
              Como funciona
            </button>{" "}
            o componente.
          </p>
        </div>

        {/* Categories Grid */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {landingCategories.map((category) => (
              <CategoryCard
                key={category.title}
                title={category.title}
                description={category.description}
                icon={category.icon}
                color={category.color}
                onClick={category.onClick}
              />
            ))}
          </div>
        </section>

        <section className="border-t pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-medium tracking-tight">
                  Diferenciais do Legis
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Entenda melhor o que torna o Legis diferente de repositórios
                  normativos tradicionais.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="font-normal"
                onClick={() => setIsMoreInfoOpen((current) => !current)}
              >
                {isMoreInfoOpen
                  ? "Ocultar maiores informações"
                  : "Maiores informações"}
              </Button>
            </div>

            {isMoreInfoOpen && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 border-l pl-4 text-sm text-muted-foreground leading-relaxed space-y-4">
                <p>
                  Os repositórios normativos em geral costumam possuir apenas
                  normas com metadados (autoridade, tipo, número, data do ato,
                  data de publicação, nome, fontes etc.) e anotações manuais.
                </p>
                <div className="space-y-3">
                  <p className="font-medium text-foreground">
                    O Legis possui três grandes diferenciais:
                  </p>
                  <ul className="space-y-3 list-disc pl-5">
                    <li>
                      é voltado não para exibir as normas em sua organização
                      original (ex.: Código Civil, Código de Obras, Portaria nº
                      1/2026), mas para exibir coletâneas sobre temas
                      específicos (ex.: Coeficiente de Aproveitamento,
                      Logradouro Oficial, Órgão de Licenciamento Ambiental
                      estadual);
                    </li>
                    <li>
                      seus conteúdos são totalmente estruturados, o que
                      significa que cada parte da norma é identificada (ementa,
                      preâmbulo, assinatura e elementos normativos - artigo,
                      parágrafo, inciso etc.), e cada elemento normativo é
                      classificado (tipo, número, posição na estrutura,
                      vigência);
                    </li>
                    <li>
                      seus conteúdos são totalmente dinâmicos, significando com
                      isso que situações especiais como acréscimos, nova
                      redação, renumeração e revogação possuem vínculos
                      dinâmicos com sua norma de origem, permitindo sua
                      rastreabilidade, compreensão e atualização automatizadas.
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Disclaimer */}
        <footer className="pt-6 border-t text-center text-sm text-muted-foreground space-y-2">
          <p>
            <b>Atenção!</b> Os conteúdos do Legis são orientativos e não
            substituem as publicações oficiais.
            <a href="#" className="ml-1 text-primary hover:underline">
              Para maiores informações, clique aqui.
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

function CategoryCard({
  title,
  description,
  icon,
  color,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="border p-4 hover:border-foreground/30 transition-colors cursor-pointer h-full flex flex-col group"
    >
      <div className={`${color} flex items-center mb-3`}>{icon}</div>
      <h3 className="font-medium text-base mb-1 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
        {description}
      </p>
      <div className="mt-4 flex items-center text-sm text-muted-foreground group-hover:text-foreground transition-colors">
        Explorar{" "}
        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}
