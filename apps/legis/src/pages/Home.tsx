import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from '@open-urbis/map-ui';
import { Link, useLocation, useRoute, useSearch } from 'wouter';
import { FileText, Search, BookOpen, Scale, HelpCircle, Database, ChevronRight, Loader2, Info, Plus, Trash2, Edit, Book, Calendar, User, ArrowRight, LayoutGrid, List, X } from 'lucide-react';
import { pageService, AdvancedSearchQuery, SearchCondition, GlobalSearchResult } from '../services/page-service';
import { Page, PageType } from '../types/page';
import { usePage } from '../hooks/use-page';
import { usePermission } from '../hooks/use-permission';
import { JSONContent } from '@tiptap/core';
import { useLegisLayout } from '../components/layout/legis-layout';
import { cn } from '@open-urbis/map-ui';

export default function Home() {
  const [, setLocation] = useLocation();
  const [matchPages] = useRoute('/pages');
  const searchString = useSearch(); // Query string
  const { setHelpOpen } = useLegisLayout();
  
  // If user is at /pages, they are in "Search/List" mode.
  // If user is at /, they are in "Landing" mode.
  const isSearchMode = matchPages;

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<GlobalSearchResult[] | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Grid as default

  // Parse query params for initial search
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const q = params.get('q');
    const cat = params.get('category');

    if (cat) setCategoryFilter(cat);
    else setCategoryFilter(null);

    if (q) {
      setSearchTerm(q);
      performSearch(q, cat);
    } else if (isSearchMode) {
      loadRecentPages(cat);
    }
  }, [isSearchMode, searchString]);

  // Manager/Admin Actions
  const { deletePage } = usePage();
  const { canCreate, canDelete } = usePermission();

  const loadRecentPages = async (cat?: string | null) => {
    setIsSearching(true);
    try {
      let pages = await pageService.getAll();
      if (cat) {
        pages = pages.filter(
          (p) =>
            p.type === 'coletanea_tematica' &&
            (p.entity as any)?.collectionType === cat
        );
      }
      setResults(pages.map((p) => ({ page: p, matches: [], score: 0 })));
    } catch (error) {
          console.error("Failed to load pages", error);
      } finally {
          setIsSearching(false);
      }
  };

  const performSearch = async (term: string, cat?: string | null) => {
    if (!term.trim() && !cat) {
      loadRecentPages(cat);
      return;
    }

    setIsSearching(true);
    try {
      const terms = term.split(' ').filter((t) => t.trim());
      const conditions: SearchCondition[] = terms.map((t, idx) => ({
        id: idx.toString(),
        field: 'term',
        operator: 'contains',
        value: t,
        connector: 'AND',
      }));

      const query: AdvancedSearchQuery = { conditions };
      let searchResults = await pageService.searchPages(query);

      if (cat) {
        searchResults = searchResults.filter(
          (res) =>
            res.page.type === 'coletanea_tematica' &&
            (res.page.entity as any)?.collectionType === cat
        );
      }

      setResults(searchResults);
    } catch (error) {
          console.error("Search failed", error);
      } finally {
          setIsSearching(false);
      }
  };

  const handleSearchInput = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          setLocation(`/pages?q=${encodeURIComponent(searchTerm)}`);
      }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm('Tem certeza que deseja excluir esta página?')) {
          try {
              await deletePage(id);
              if (searchTerm) performSearch(searchTerm);
              else loadRecentPages();
          } catch (error) {
              console.error('Failed to delete page', error);
              alert('Erro ao excluir página');
          }
      }
  };

  const getExcerpt = (contentStr: string) => {
      try {
          const json = JSON.parse(contentStr);
          let text = '';
          const traverse = (node: JSONContent) => {
              if (node.text) text += node.text + ' ';
              if (node.content) node.content.forEach(traverse);
          };
          if (json) traverse(json);
          return text.substring(0, 120) + (text.length > 120 ? '...' : '');
      } catch {
          return contentStr.substring(0, 120).replace(/<[^>]*>?/gm, '') + (contentStr.length > 120 ? '...' : '');
      }
  };

  // ------------------------------------------------------------------
  // VIEW: Search / List Mode (/pages)
  // ------------------------------------------------------------------
  if (isSearchMode) {
      return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            <div className="sticky top-[4rem] z-40 bg-background/80 backdrop-blur-sm border-b">
                <div className="px-8 py-6 space-y-6 max-w-7xl mx-auto">
                    {/* Header Top Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Acervo Legis</h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Link href="/" className="hover:text-primary transition-colors">Início</Link>
                                <ChevronRight className="h-3 w-3" />
                                <span>Pesquisa e Gerenciamento</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center bg-muted/50 p-1 rounded-full border border-border/50">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={cn(
                                        "p-2 rounded-full transition-all duration-200",
                                        viewMode === 'grid' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                    )}
                                    title="Grade"
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={cn(
                                        "p-2 rounded-full transition-all duration-200",
                                        viewMode === 'list' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                    )}
                                    title="Lista"
                                >
                                    <List className="h-4 w-4" />
                                </button>
                            </div>
                            {canCreate && (
                                <Button onClick={() => setLocation('/pages/new')} size="sm" className="h-9 rounded-full px-4 text-xs font-medium shadow-sm hover:shadow-md transition-all">
                                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                                    Nova Página
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Search Row */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                type="search"
                                placeholder="Pesquisar em Títulos, Resumos e Conteúdo..."
                                className="pl-10 h-11 w-full rounded-2xl bg-muted/30 border-transparent focus:bg-background focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all shadow-sm group-hover:bg-muted/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearchInput}
                            />
                        </div>
                        {categoryFilter && (
                            <div className="flex items-center gap-2 bg-primary/5 text-primary border border-primary/10 pl-3 pr-1 py-1 rounded-full text-xs font-semibold animate-in fade-in slide-in-from-right-4 duration-300">
                                <span>{categoryFilter}</span>
                                <button 
                                    onClick={() => setLocation('/pages')}
                                    className="hover:bg-primary/10 rounded-full p-1 transition-colors"
                                    title="Remover filtro"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}
                        <Button 
                            onClick={() => setLocation(`/pages?q=${encodeURIComponent(searchTerm)}`)} 
                            disabled={isSearching} 
                            size="lg"
                            className="h-11 px-6 rounded-2xl shadow-sm hover:shadow-md transition-all"
                        >
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="px-8 py-8 min-h-[calc(100vh-200px)] max-w-7xl mx-auto w-full">
                    {isSearching && !results ? (
                        <div className="grid gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="animate-pulse h-32 bg-muted/20 rounded-lg" />
                            ))}
                        </div>
                    ) : results?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-xl bg-muted/5">
                            <h3 className="text-lg font-medium">Nenhum documento encontrado</h3>
                            <p className="text-muted-foreground mb-4 text-sm">Tente outros termos ou limpe a busca.</p>
                            <Button variant="outline" onClick={() => { setSearchTerm(''); setLocation('/pages'); }}>
                                Limpar Busca
                            </Button>
                        </div>
                    ) : (
                        <div className={cn(
                            viewMode === 'list' ? "flex flex-col gap-4" : "grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
                            "animate-in fade-in slide-in-from-bottom-8 duration-700"
                        )}>
                            {results?.map((res) => (
                                <Link key={res.page.id} href={`/pages/${res.page.id}`}>
                                    <div className={cn(
                                        "block bg-card border-0 shadow-sm rounded-2xl p-4 hover:shadow-lg transition-all cursor-pointer group relative ring-1 ring-border/50 hover:ring-primary/20 hover:-translate-y-0.5 duration-300",
                                        viewMode === 'grid' && "h-full flex flex-col justify-between"
                                    )}>
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                                                        res.page.type === 'original_normativo' 
                                                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                                                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                    }`}>
                                                        {res.page.type === 'original_normativo' ? 'Original Normativo' : 'Coletânea'}
                                                    </span>
                                                    {res.page.type === 'coletanea_tematica' && (res.page.entity as any)?.collectionType && (
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                                            {(res.page.entity as any).collectionType}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className={cn(
                                                    "font-bold group-hover:text-primary transition-colors leading-tight",
                                                    viewMode === 'list' ? "text-lg" : "text-sm line-clamp-2"
                                                )}>
                                                    {res.page.title}
                                                </h4>
                                            </div>
                                            
                                            {/* Actions */}
                                            <div className="flex gap-0.5 shrink-0 -mr-2 -mt-2">
                                                {canCreate && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-full" onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setLocation(`/pages/${res.page.id}/edit`);
                                                    }}>
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-full" onClick={(e) => handleDelete(e, res.page.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Matches Snippets */}
                                        {res.matches.length > 0 && viewMode === 'list' ? (
                                            <div className="space-y-1 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/50">
                                                {res.matches.map((match, i) => (
                                                    <div key={i} className="flex gap-2 items-start">
                                                        <span className="font-bold uppercase tracking-wider text-muted-foreground/70 min-w-[50px] text-right mt-0.5 text-[9px]">
                                                            {match.field}:
                                                        </span>
                                                        <div 
                                                            className="leading-relaxed"
                                                            dangerouslySetInnerHTML={{ __html: match.snippet }} 
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className={cn(
                                                "text-muted-foreground line-clamp-3",
                                                viewMode === 'list' ? "text-sm" : "text-[11px]"
                                            )}>
                                                {res.page.content ? getExcerpt(res.page.content) : 'Sem prévia...'}
                                            </p>
                                        )}

                                        {viewMode === 'grid' && (
                                            <div className="flex items-center justify-between mt-3 pt-3 border-t text-[10px] text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    <span className="truncate max-w-[80px]">{res.page.author}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{new Date(res.page.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
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
      {/* Header / Intro Section */}
      <div className="bg-gradient-to-b from-muted/50 to-background border-b flex-1 flex flex-col justify-center min-h-[30vh]">
          <div className="container max-w-5xl mx-auto px-6 py-10 space-y-6 text-center">
              <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="bg-primary/10 text-primary w-fit mx-auto px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
                      Legis.Urbis
                  </div>
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                      Simplificando o acesso às <span className="text-primary">normas urbanas</span>
                  </h1>
                  <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                      O Legis é um componente do Urbis voltado à compreensão e utilização de informações normativas (ou seja, sobre leis e similares) relacionadas aos seus conteúdos, em observância às diretrizes para a Linguagem Simples.
                  </p>
                  
                  <div className="pt-4 flex justify-center gap-3">
                      <Button size="lg" className="gap-2 h-12 px-8 text-base shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 rounded-full" onClick={() => setLocation('/pages')}>
                          <Search className="h-4 w-4" />
                          Pesquisar Normas
                      </Button>
                      <Button variant="outline" size="lg" className="gap-2 h-12 px-6 rounded-full border hover:bg-muted/50" onClick={() => setHelpOpen(true)}>
                          <HelpCircle className="h-4 w-4" />
                          Como funciona
                      </Button>
                  </div>
              </div>
          </div>
      </div>

      <div className="container max-w-5xl mx-auto px-8 py-16 space-y-12">
          
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
              <p className="text-lg text-muted-foreground">
                  Por aqui, podem ser navegadas as suas páginas, categorizadas de acordo com seu foco:
              </p>
          </div>

          {/* Categories Grid */}
          <section>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CategoryCard 
            title="Exigências" 
            description="deveres e direitos (o que eu devo fazer)"
            icon={<Scale className="h-6 w-6" />}
            color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            onClick={() => setLocation('/pages?category=Exigências')}
          />
          <CategoryCard 
            title="Competências" 
            description="poderes e deveres dos órgãos ou instituições públicos (quem devo procurar)"
            icon={<FileText className="h-6 w-6" />}
            color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
            onClick={() => setLocation('/pages?category=Competências')}
          />
          <CategoryCard 
            title="Definições" 
            description="entender um conceito técnico-jurídico, sistematicamente (o que significa isso)"
            icon={<Info className="h-6 w-6" />}
            color="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
            onClick={() => setLocation('/pages?category=Definições')}
          />
          <CategoryCard 
            title="Fontes de Informação" 
            description="Bases de dados previstas ou implementadas (onde eu posso pesquisar informações)"
            icon={<Database className="h-6 w-6" />}
            color="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
            onClick={() => setLocation('/pages?category=Fontes de Informação')}
          />
              </div>
          </section>

          <div className="text-center space-y-6 max-w-3xl mx-auto">
              <p className="text-muted-foreground">
                  A partir daqui, é possível navegar pela ferramenta de Pesquisa (ver manual na seção de Ajuda, no canto superior direito) e depois simplesmente clicando nos links entre uma página e outra.
              </p>
              <p className="text-muted-foreground">
                  Cada página possui um resumo e um conteúdo completo, que pode ser exibido no modo completo ou consolidado (apenas as normas atuais).
              </p>
          </div>

          {/* Disclaimer */}
          <footer className="pt-8 border-t text-center text-sm text-muted-foreground space-y-2">
              <p>
                  Os conteúdos do Legis são orientativas e não substituem as publicações oficiais. 
                  <a href="#" className="ml-1 text-primary hover:underline">Para maiores informações, clique aqui.</a>
              </p>
          </footer>
      </div>
    </div>
  );
}

function CategoryCard({ title, description, icon, color, onClick }: { title: string, description: string, icon: React.ReactNode, color: string, onClick?: () => void }) {
    return (
        <div 
            onClick={onClick}
            className="bg-card border-0 shadow-sm rounded-3xl p-6 hover:shadow-xl transition-all cursor-pointer h-full flex flex-col group hover:-translate-y-1 duration-300 ring-1 ring-border/50 hover:ring-primary/20"
        >
            <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-5 shadow-inner`}>
                {icon}
            </div>
            <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {description}
            </p>
            <div className="mt-6 flex items-center text-sm font-semibold text-primary/80 group-hover:text-primary transition-colors">
                Explorar <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    );
}
