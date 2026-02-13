import React, { useEffect, useState } from 'react';
import { Page, PageType } from '../types/page';
import { usePage } from '../hooks/use-page';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Badge } from '@open-urbis/map-ui';
import { Link, useLocation } from 'wouter';
import { Plus, Search, Trash2, Edit, FileText, Book, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { JSONContent } from '@tiptap/core';
import { usePermission } from '../hooks/use-permission';
import { Globe, Lock } from 'lucide-react';

export default function PageList() {
    const { getPages, deletePage, loading } = usePage();
    const { canCreate, canDelete } = usePermission();
    const [pages, setPages] = useState<Page[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<PageType | 'all'>('all');
    const [, setLocation] = useLocation();

    useEffect(() => {
        loadPages();
    }, []);

    const loadPages = async () => {
        try {
            const data = await getPages();
            setPages(data);
        } catch (error) {
            console.error('Failed to load pages', error);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Tem certeza que deseja excluir esta página?')) {
            try {
                await deletePage(id);
                loadPages();
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

    const filteredPages = pages.filter(page => {
        const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || page.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            <div className="sticky top-0 z-40 px-8 py-4 bg-background/80 backdrop-blur-sm border-b space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Páginas</h1>
                        <p className="text-muted-foreground text-sm">Gerencie suas publicações e normas.</p>
                    </div>
                    {canCreate && (
                        <Button onClick={() => setLocation('/pages/new')} size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nova Página
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Pesquisar..."
                            className="pl-8 h-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-muted/50 p-1 rounded-lg">
                        <button 
                            onClick={() => setFilterType('all')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterType === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Todos
                        </button>
                        <button 
                            onClick={() => setFilterType('page')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterType === 'page' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Páginas
                        </button>
                        <button 
                            onClick={() => setFilterType('normative')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterType === 'normative' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Normativas
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-8 min-h-[calc(100vh-200px)]">
                    {loading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Card key={i} className="animate-pulse h-48 bg-muted/20 border-none" />
                            ))}
                        </div>
                    ) : filteredPages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-xl bg-muted/5">
                            <h3 className="text-lg font-medium">Nenhum documento encontrado</h3>
                            <p className="text-muted-foreground mb-4 text-sm">Comece criando sua primeira página ou norma.</p>
                            <Button variant="outline" onClick={() => setLocation('/pages/new')}>
                                Criar Página
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredPages.map((page) => (
                                <Link key={page.id} href={`/pages/${page.id}`}>
                                    <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between border bg-card">
                                        <CardHeader className="p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                {page.type === 'normative' ? (
                                                    <Badge variant="secondary" className="text-[10px] px-1.5 h-5 gap-1 bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300">
                                                        <Book className="h-3 w-3" /> Normativa
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-[10px] px-1.5 h-5 gap-1 text-muted-foreground bg-muted/50 hover:bg-muted/50">
                                                        <FileText className="h-3 w-3" /> Página
                                                    </Badge>
                                                )}
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(page.updatedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <CardTitle className="line-clamp-2 text-base font-semibold leading-tight group-hover:text-primary transition-colors">
                                                {page.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <p className="text-xs text-muted-foreground line-clamp-3">
                                                {page.content ? getExcerpt(page.content) : 'Sem conteúdo...'}
                                            </p>
                                        </CardContent>
                                        <CardFooter className="p-4 pt-0 flex items-center justify-between mt-auto">
                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                <User className="h-3 w-3" />
                                                <span className="truncate max-w-[100px]">{page.author}</span>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {canCreate && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setLocation(`/pages/${page.id}/edit`);
                                                    }}>
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => handleDelete(e, page.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </CardFooter>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
