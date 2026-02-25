import { useEffect, useState } from 'react';
import { Link, useLocation, useRoute } from 'wouter';
import { usePage } from '../hooks/use-page';
import { Page } from '../types/page';
import { Button, Badge, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Sheet, SheetContent, SheetHeader, SheetTitle, Dialog, DialogContent, DialogHeader, DialogTitle, Separator } from '@open-urbis/map-ui';
import { Edit, Calendar, User, Book, FileText, ChevronRight, Globe, Lock, Link as LinkIcon, Info, ExternalLink } from 'lucide-react';
import { LegisEditor } from '../components/Editor/LegisEditor';
import { usePermission } from '../hooks/use-permission';
import { JSONContent, type Editor as TiptapEditor } from '@tiptap/core';
import { safeJSONParse } from '@/lib/content';
import { OriginalNormativo, ColetaneaTematica } from '../domain/entities';
import { AUTHORITIES } from '../data/authorities';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NormativeDocumentRenderer } from '../components/page/NormativeDocumentRenderer';
import { ColetaneaRenderer } from '../components/page/ColetaneaRenderer';
import { pageService } from '../services/page-service';

export default function PageView() {
    const [, setLocation] = useLocation();
    const [, params] = useRoute('/pages/:id');
    const { getPage } = usePage();
    const { canEdit } = usePermission();
    const [page, setPage] = useState<Page | null>(null);
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState<JSONContent | undefined>(undefined);
    const [fichaOpen, setFichaOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'full' | 'consolidated'>('full');
    
    // Coletanea State
    const [linkedPages, setLinkedPages] = useState<Page[]>([]);
    const [resumoModalOpen, setResumoModalOpen] = useState(false);
    const [selectedLinkedPage, setSelectedLinkedPage] = useState<Page | null>(null);

    // Parsing State
    const [, setEditor] = useState<TiptapEditor | null>(null);

    useEffect(() => {
        if (params?.id) {
            loadPage(params.id);
        }
    }, [params?.id]);

    // Handle scroll to hash after content is loaded
    useEffect(() => {
        if (!loading && window.location.hash) {
            const id = window.location.hash.substring(1); // Remove #
            // Small timeout to ensure DOM is rendered
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }, [loading, page]);

    const loadPage = async (id: string) => {
        try {
            const data = await getPage(id);
            if (data) {
                setPage(data);
                if (data.content) {
                    const parsed = safeJSONParse(data.content);
                    if (parsed) setContent(parsed);
                    else if (data.content.trim()) {
                        setContent({
                            type: 'doc',
                            content: [{ type: 'paragraph', content: [{ type: 'text', text: data.content }] }]
                        });
                    }
                }

                // Load Linked Pages for Coletanea
                if (data.type === 'coletanea_tematica' && data.entity) {
                    const col = data.entity as ColetaneaTematica;
                    if (col.links && col.links.length > 0) {
                        const ids = col.links.map(l => l.resourceId);
                        pageService.getPagesByIds(ids).then(setLinkedPages);
                    }
                }
            } else {
                setLocation('/pages');
            }
        } catch (error) {
            console.error('Failed to load page', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto max-w-4xl px-8 py-12 space-y-8 animate-pulse">
                <div className="h-12 bg-muted/20 w-3/4 rounded"></div>
                <div className="space-y-4">
                    <div className="h-4 bg-muted/20 w-full rounded"></div>
                    <div className="h-4 bg-muted/20 w-full rounded"></div>
                    <div className="h-4 bg-muted/20 w-2/3 rounded"></div>
                </div>
            </div>
        );
    }

    if (!page) return null;

    const isNormative = page.type === 'original_normativo';
    const isColetanea = page.type === 'coletanea_tematica';
    const normativeData = isNormative ? (page.entity as OriginalNormativo) : null;
    const coletaneaData = isColetanea ? (page.entity as ColetaneaTematica) : null;

    // Helper to format date
    const formatDate = (dateStr?: string, full: boolean = false) => {
        if (!dateStr) return 'sem data';
        try {
            // Try to parse DD.MM.YYYY
            const parsed = parse(dateStr, 'dd.MM.yyyy', new Date());
            if (!isValid(parsed)) return dateStr;
            
            if (full) {
                return format(parsed, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
            }
            return format(parsed, 'dd.MM.yyyy');
        } catch {
            return dateStr;
        }
    };

    const authority = normativeData ? AUTHORITIES.find(a => a.id === normativeData.authorityId) : null;

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Top Bar */}
            <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
                <div className="w-full px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link href="/pages" className="hover:text-foreground transition-colors">Acervo Legis</Link>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                        <span className="truncate max-w-[200px] text-foreground font-medium">{page.title}</span>
                        {page.isPublic ? (
                            <></>                        ) : (
                            <Badge variant="outline" className="ml-2 gap-1 text-[10px] h-5 border-amber-200 text-amber-700 bg-amber-50">
                                <Lock className="h-3 w-3" /> Privada
                            </Badge>
                        )}
                        {isNormative && (
                            <Badge variant="secondary" className="ml-2 gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                                <Book className="h-3 w-3" />
                                Original Normativo
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {isColetanea && (
                            <div className="flex items-center bg-muted/50 rounded-md p-1 border">
                                <Button 
                                    variant={viewMode === 'full' ? 'secondary' : 'ghost'} 
                                    size="sm" 
                                    onClick={() => setViewMode('full')}
                                    className="h-6 text-xs px-2"
                                >
                                    Completo
                                </Button>
                                <Button 
                                    variant={viewMode === 'consolidated' ? 'secondary' : 'ghost'} 
                                    size="sm" 
                                    onClick={() => setViewMode('consolidated')}
                                    className="h-6 text-xs px-2"
                                >
                                    Consolidado
                                </Button>
                            </div>
                        )}
                        {isNormative && (
                            <Button variant="outline" size="sm" onClick={() => setFichaOpen(true)} className="gap-2">
                                <Info className="h-4 w-4" />
                                Ficha Técnica
                            </Button>
                        )}
                        {canEdit && (
                            <Button variant="ghost" size="sm" onClick={() => setLocation(`/pages/${page.id}/edit`)} className="gap-2">
                                <Edit className="h-4 w-4" />
                                Editar
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-1">
                {isNormative && normativeData ? (
                    /* Original Normativo Custom View */
                    <div className="flex w-full justify-center bg-background">
                        <div className="w-full max-w-[1400px] px-4 py-8">
                            <NormativeDocumentRenderer data={normativeData} />
                        </div>
                    </div>
                ) : (
                <div className="flex-1 relative">
                    {isColetanea && coletaneaData ? (
                        /* Coletanea Tematica View */
                        <div className="container max-w-[1400px] mx-auto px-0 py-8 min-h-full relative">
                            <div className="relative">
                                {/* Background Layer */}
                                <div className="absolute top-0 bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border rounded-lg shadow-sm -z-10 transition-all duration-300" />
                                
                                <div className="py-8 pl-8 pr-8 xl:pl-12 xl:pr-12">
                                    <div className="flex flex-col gap-12 items-start">
                                        
                                        {/* Main Column */}
                                        <div className="w-full">
                                            {/* Ficha */}
                                            <header className="mb-8 border-b pb-6 space-y-4">
                                                <div className="space-y-1">
                                                    <Badge variant="outline" className="mb-2">{coletaneaData.category}</Badge>
                                                    <h1 className="text-3xl font-bold leading-tight">{coletaneaData.title}</h1>
                                                    <div className="flex gap-2 text-sm text-muted-foreground">
                                                        <span>Temas: {coletaneaData.theme}</span>
                                                    </div>
                                                </div>
                                            </header>

                                            {/* Vínculos (Moved from Sidebar) */}
                                            {linkedPages.length > 0 && (
                                                <section className="mb-12">
                                                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 border-l-4 border-primary pl-2">
                                                        Vínculos
                                                    </h2>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {linkedPages.map(lp => (
                                                            <div 
                                                                key={lp.id} 
                                                                className="group p-4 rounded-lg border bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all shadow-sm"
                                                                onClick={() => { setSelectedLinkedPage(lp); setResumoModalOpen(true); }}
                                                            >
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-normal">
                                                                        {lp.type === 'original_normativo' ? 'Original Normativo' : 'Coletânea'}
                                                                    </Badge>
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        {new Date(lp.updatedAt).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <div className="font-medium text-sm leading-snug group-hover:text-primary">
                                                                    {lp.title}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>
                                            )}

                                            {/* Resumo */}
                                            {coletaneaData.shortDescription && (
                                                <section className="mb-12">
                                                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 border-l-4 border-primary pl-2">
                                                        Resumo
                                                    </h2>
                                                    <div className="prose dark:prose-invert max-w-none text-justify whitespace-pre-wrap leading-relaxed bg-muted/10 p-6 rounded-lg border">
                                                        {coletaneaData.shortDescription}
                                                    </div>
                                                </section>
                                            )}

                                            {/* Conteúdo */}
                                            <section>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider border-l-4 border-primary pl-2">
                                                        Conteúdo
                                                    </h2>
                                                </div>
                                                <ColetaneaRenderer content={content} viewMode={viewMode} />
                                            </section>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* Resumo Modal */}
                            <Dialog open={resumoModalOpen} onOpenChange={setResumoModalOpen}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{selectedLinkedPage?.title}</DialogTitle>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Resumo</h4>
                                        <div className="text-sm leading-relaxed text-justify">
                                            {selectedLinkedPage?.type === 'coletanea_tematica' && (selectedLinkedPage.entity as ColetaneaTematica)?.shortDescription 
                                                ? (selectedLinkedPage.entity as ColetaneaTematica).shortDescription 
                                                : selectedLinkedPage?.type === 'original_normativo' 
                                                    ? (selectedLinkedPage?.entity as OriginalNormativo)?.ementa 
                                                    : "Sem resumo disponível."}
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t flex justify-end">
                                        {selectedLinkedPage && (
                                            <a 
                                                href={`/pages/${selectedLinkedPage.id}${coletaneaData?.links.find(l => l.resourceId === selectedLinkedPage.id)?.linkedElements?.[0]?.elementId ? '#el-' + coletaneaData.links.find(l => l.resourceId === selectedLinkedPage.id)?.linkedElements?.[0]?.elementId : ''}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                            >
                                                <Button className="gap-2">
                                                    Abrir Página Completa
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </a>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    ) : (
                        /* Standard View */
                        <div className="container max-w-4xl mx-auto px-8 py-12 space-y-8">
                            <header className="space-y-6">
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <Badge variant="secondary" className="gap-1">
                                        <FileText className="h-3 w-3" />
                                        Página
                                    </Badge>
                                    {page.tags?.map(tag => (
                                        <Badge key={tag} variant="outline" className="text-muted-foreground font-normal">
                                            #{tag}
                                        </Badge>
                                    ))}
                                </div>

                                <h1 className="text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                                    {page.title}
                                </h1>

                                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-b pb-6">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span>{page.author}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>{new Date(page.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </header>

                            <article className="min-h-[200px]">
                                <LegisEditor
                                    key={page.id}
                                    initialContent={content}
                                    readOnly={true}
                                    onEditorReady={setEditor}
                                    isNormative={false}
                                />
                            </article>
                        </div>
                    )}
                </div>
                )}

                {/* Properties Panel (Legacy) */}
                {!isNormative && !isColetanea && (
                    <div className="hidden md:block w-80 border-l relative">
                        <div className="sticky top-[4rem] h-[calc(100vh-4rem)] overflow-y-auto">
                            {/* <PropertiesPanel ... /> */}
                        </div>
                    </div>
                )}
            </div>

            {/* Ficha Sheet */}
            <Sheet open={fichaOpen} onOpenChange={setFichaOpen}>
                <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Ficha Técnica</SheetTitle>
                    </SheetHeader>
                    {isNormative && normativeData ? (
                        <div className="py-6 space-y-6 text-sm">
                            <div className="space-y-1">
                                <div className="text-xs font-semibold text-muted-foreground uppercase">ID</div>
                                <div className="font-mono bg-muted p-1 rounded inline-block text-xs">{page.id}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase">Data do Ato</div>
                                    <div>{formatDate(normativeData.actDate)}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase">Data de Publicação</div>
                                    <div>{formatDate(normativeData.publicationDate)}</div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-xs font-semibold text-muted-foreground uppercase">Autoridade</div>
                                {authority ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="font-medium underline decoration-dotted underline-offset-4 cursor-help">
                                                    {authority.commonRefAbbr}
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-[300px] p-4 space-y-2">
                                                <div>
                                                    <span className="font-semibold text-xs uppercase text-muted-foreground block">Nome por extenso</span>
                                                    <span>
                                                        {authority.complementFull ? `${authority.complementFull} - ` : ''}
                                                        {authority.commonRefFull}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-xs uppercase text-muted-foreground block">Abreviação</span>
                                                    <span>
                                                        {authority.complementAbbr ? `${authority.complementAbbr} - ` : ''}
                                                        {authority.commonRefAbbr}
                                                    </span>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : (
                                    <span className="text-muted-foreground italic">Autoridade não identificada ({normativeData.authorityId})</span>
                                )}
                            </div>

                            <div className="space-y-1">
                                <div className="text-xs font-semibold text-muted-foreground uppercase">Ementa</div>
                                <div className="text-justify text-xs text-muted-foreground leading-relaxed">
                                    {normativeData.ementa || "sem ementa"}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-xs font-semibold text-muted-foreground uppercase">Nome</div>
                                <div>{page.title || "sem nome"}</div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-xs font-semibold text-muted-foreground uppercase">Fontes</div>
                                <div className="space-y-1">
                                    {normativeData.sources && normativeData.sources.length > 0 ? (
                                        normativeData.sources.map((source, idx) => (
                                            <div key={idx}>
                                                <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                                    <LinkIcon className="h-3 w-3" />
                                                    {source.name || (page.title ? page.title : `Link ${idx + 1}`)}
                                                </a>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-muted-foreground italic">sem fontes</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-6 text-muted-foreground">Informações não disponíveis para este tipo de documento.</div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
