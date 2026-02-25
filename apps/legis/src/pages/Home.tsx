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
            <div className="sticky top-0 z-40 px-8 py-4 bg-background/80 backdrop-blur-sm border-b space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Acervo Legis</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Link href="/" className="hover:text-foreground">Início</Link>
                            <ChevronRight className="h-3 w-3" />
                            <span>Pesquisa e Gerenciamento</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-muted p-1 rounded-md mr-2">
                            <Button 
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                                size="icon" 
                                className="h-7 w-7" 
                                onClick={() => setViewMode('grid')}
                                title="Visualização em Grade"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                                size="icon" 
                                className="h-7 w-7" 
                                onClick={() => setViewMode('list')}
                                title="Visualização em Lista"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                        {canCreate && (
                            <Button onClick={() => setLocation('/pages/new')} size="sm" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Nova Página
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 max-w-3xl">
                    {categoryFilter && (
                        <div className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-2.5 py-1.5 rounded-full text-xs font-bold animate-in slide-in-from-left-2 duration-300 shadow-sm shrink-0">
                            {categoryFilter}
                            <button 
                                onClick={() => setLocation('/pages')}
                                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                title="Remover filtro"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Pesquisar em Títulos, Resumos e Conteúdo..."
                            className="pl-9 h-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearchInput}
                        />
                    </div>
                    <Button 
                        onClick={() => setLocation(`/pages?q=${encodeURIComponent(searchTerm)}`)} 
                        disabled={isSearching} 
                        size="sm"
                    >
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-8 min-h-[calc(100vh-200px)]">
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
                            viewMode === 'list' ? "flex flex-col gap-4 max-w-4xl mx-auto" : "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        )}>
                            {results?.map((res) => (
                                <Link key={res.page.id} href={`/pages/${res.page.id}`}>
                                    <div className={cn(
                                        "block bg-card border rounded-lg p-6 hover:shadow-md transition-all cursor-pointer group relative",
                                        viewMode === 'grid' && "h-full flex flex-col justify-between"
                                    )}>
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                                        res.page.type === 'original_normativo' 
                                                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                                                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                    }`}>
                                                        {res.page.type === 'original_normativo' ? 'Normativo' : 'Coletânea'}
                                                    </span>
                                                    {res.page.type === 'coletanea_tematica' && (res.page.entity as any)?.collectionType && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                                            {(res.page.entity as any).collectionType}
                                                        </span>
                                                    )}
                                                    {viewMode === 'list' && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(res.page.updatedAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className={cn(
                                                    "font-bold group-hover:text-primary transition-colors",
                                                    viewMode === 'list' ? "text-xl" : "text-base line-clamp-2"
                                                )}>
                                                    {res.page.title}
                                                </h4>
                                            </div>
                                            
                                            {/* Actions */}
                                            <div className="flex gap-1">
                                                {canCreate && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setLocation(`/pages/${res.page.id}/edit`);
                                                    }}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => handleDelete(e, res.page.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Matches Snippets */}
                                        {res.matches.length > 0 && viewMode === 'list' ? (
                                            <div className="space-y-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded border border-border/50">
                                                {res.matches.map((match, i) => (
                                                    <div key={i} className="flex gap-2 items-start">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 min-w-[60px] text-right mt-0.5">
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
                                                viewMode === 'list' ? "text-sm" : "text-xs"
                                            )}>
                                                {res.page.content ? getExcerpt(res.page.content) : 'Sem prévia...'}
                                            </p>
                                        )}

                                        {viewMode === 'grid' && (
                                            <div className="flex items-center justify-between mt-4 pt-4 border-t text-[10px] text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    <span>{res.page.author}</span>
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
      <div className="bg-muted/30 border-b flex-1 flex flex-col justify-center min-h-[40vh]">
          <div className="container max-w-5xl mx-auto px-8 py-16 space-y-8 text-center">
              <div className="space-y-6 max-w-3xl mx-auto">
                  <div className="bg-primary/10 text-primary w-fit mx-auto px-4 py-1.5 rounded-full text-sm font-medium">
                      Legis.Urbis
                  </div>
                  <h1 className="text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                      Compreensão e utilização de informações normativas
                  </h1>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                      O Legis é um componente do Urbis voltado à compreensão e utilização de informações normativas (ou seja, sobre leis e similares) relacionadas aos seus conteúdos, em observância às diretrizes para a Linguagem Simples.
                  </p>
                  
                  <div className="pt-8 flex justify-center gap-4">
                      <Button size="lg" className="gap-2 h-12 px-8 text-base shadow-lg" onClick={() => setLocation('/pages')}>
                          <Search className="h-5 w-5" />
                          Pesquisar Normas e Coletâneas
                      </Button>
                      <Button variant="outline" size="lg" className="gap-2 h-12" onClick={() => setHelpOpen(true)}>
                          <HelpCircle className="h-5 w-5" />
                          Manual de Ajuda
                      </Button>
                  </div>
              </div>
          </div>
      </div>

      <div className="container max-w-5xl mx-auto px-8 py-16 space-y-12">
          
          {/* Categories Grid */}
          <section>
              <h2 className="text-xl font-bold mb-8 flex items-center justify-center gap-2 text-muted-foreground uppercase tracking-widest text-sm">
                  <BookOpen className="h-4 w-4" />
                  Navegue por Categorias
              </h2>
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
            className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col group hover:-translate-y-1 duration-200"
        >
            <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4`}>
                {icon}
            </div>
            <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {description}
            </p>
            <div className="mt-4 flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Ver itens <ArrowRight className="h-3 w-3 ml-1" />
            </div>
        </div>
    );
}
