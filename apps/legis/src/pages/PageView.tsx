import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useRoute } from 'wouter';
import { usePage } from '../hooks/use-page';
import { Page } from '../types/page';
import { Button, Separator, Badge } from '@open-urbis/map-ui';
import { Edit, Calendar, Clock, User, Tag, Book, FileText, ChevronRight, Globe, Lock, Link as LinkIcon } from 'lucide-react';
import NovelEditorWrapper from '../components/Editor';
import { usePermission } from '../hooks/use-permission';
import { JSONContent, type Editor as TiptapEditor } from '@tiptap/core';
import { RulesEngine } from '../domain/rules-engine';
import { NormativeElement } from '../domain/types';
import { PropertiesPanel } from '../components/page/PropertiesPanel';
import { safeJSONParse } from '@/lib/content';
import { UrbisFooter } from '../components/layout/urbis-footer';

export default function PageView() {
    const [, setLocation] = useLocation();
    const [match, params] = useRoute('/pages/:id');
    const { getPage } = usePage();
    const { canEdit } = usePermission();
    const [page, setPage] = useState<Page | null>(null);
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState<JSONContent | undefined>(undefined);
    
    // Parsing State
    const [editor, setEditor] = useState<TiptapEditor | null>(null);
    const [selectedElement, setSelectedElement] = useState<NormativeElement | null>(null);
    const rulesEngine = useMemo(() => new RulesEngine(), []);

    useEffect(() => {
        if (params?.id) {
            loadPage(params.id);
        }
    }, [params?.id]);

    // Selection/Parsing Logic (Same as PageForm)
    useEffect(() => {
        if (editor && page?.type === 'normative') {
            const updateHandler = () => {
                const { state } = editor;
                const { selection } = state;
                const parent = state.doc.resolve(selection.from).parent;
                if (parent && parent.textContent) {
                     const parsed = rulesEngine.parseLine(parent.textContent);
                     const element: NormativeElement = {
                         id: 'view-id',
                         type: parsed.type,
                         index: parsed.index,
                         text: parsed.content,
                         originalStartValidity: { date: '01.01.2024', deviceId: '1' }
                     };
                     setSelectedElement(element);
                } else {
                    setSelectedElement(null);
                }
            };
            
            // In read-only, selectionUpdate should still fire on click/navigation
            editor.on('selectionUpdate', updateHandler);
            
            return () => {
                editor.off('selectionUpdate', updateHandler);
            };
        }
    }, [editor, page?.type, rulesEngine]);

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
                    <div className="h-4 bg-muted/20 w-2/3 rounded"></div>
                </div>
            </div>
        );
    }

    if (!page) return null;

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
                <div className="w-full px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link href="/pages" className="hover:text-foreground transition-colors">Páginas</Link>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                        <span className="truncate max-w-[200px] text-foreground font-medium">{page.title}</span>
                        {page.isPublic ? (
                            <Badge variant="outline" className="ml-2 gap-1 text-[10px] h-5 border-green-200 text-green-700 bg-green-50">
                                <Globe className="h-3 w-3" /> Pública
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="ml-2 gap-1 text-[10px] h-5 border-amber-200 text-amber-700 bg-amber-50">
                                <Lock className="h-3 w-3" /> Privada
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <Button variant="ghost" size="sm" onClick={() => setLocation(`/pages/${page.id}/edit`)} className="gap-2">
                                <Edit className="h-4 w-4" />
                                Editar
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="container max-w-4xl mx-auto px-8 py-12 space-y-8">
                        
                        <header className="space-y-6">
                            {/* Icon/Type */}
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                {page.type === 'normative' ? (
                                    <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                                        <Book className="h-3 w-3" />
                                        Normativa
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="gap-1">
                                        <FileText className="h-3 w-3" />
                                        Página
                                    </Badge>
                                )}
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
                                {page.updatedAt !== page.createdAt && (
                                    <div className="flex items-center gap-2" title={`Atualizado em ${new Date(page.updatedAt).toLocaleString()}`}>
                                    <Clock className="h-4 w-4" />
                                    <span>Atualizado</span>
                                </div>
                            )}
                            {page.source?.url && (
                                <div className="flex items-center gap-2 text-primary hover:underline cursor-pointer" onClick={() => window.open(page.source!.url, '_blank')}>
                                    <LinkIcon className="h-4 w-4" />
                                    <span>Fonte: {page.source.type.toUpperCase()}</span>
                                </div>
                            )}
                        </div>
                    </header>

                        <article className="min-h-[200px]">
                            <NovelEditorWrapper
                                key={page.id} 
                                initialValue={content}
                                editable={false}
                                onEditorReady={setEditor}
                                isNormative={page.type === 'normative'}
                            />
                        </article>
                    </div>
                    <UrbisFooter />
                </div>

                {/* Properties Panel */}
                {page.type === 'normative' && (
                    <PropertiesPanel element={selectedElement} rawNode={null} />
                )}
            </div>
        </div>
    );
}
