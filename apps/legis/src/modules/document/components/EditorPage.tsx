import React, { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { editorStore } from '../store';
import { EditorSidebar } from './EditorSidebar';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Textarea } from '@open-urbis/map-ui';
import { ChevronLeft, Edit3, Eye, Save, Upload } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { NormativeExtension } from '../extensions/NormativeExtension';
import { v4 as uuidv4 } from 'uuid';

function ImportDialog() {
    const [text, setText] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleImport = () => {
        editorStore.importText(text);
        setIsOpen(false);
        setText('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" /> Importar Texto
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Importar Texto Normativo</DialogTitle>
                    <DialogDescription>
                        Cole o texto da lei abaixo. O sistema identificará automaticamente artigos, parágrafos, incisos, etc.
                    </DialogDescription>
                </DialogHeader>
                <Textarea 
                    className="min-h-[300px] font-mono text-sm" 
                    placeholder="Cole o texto aqui..." 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <DialogFooter>
                    <Button onClick={handleImport}>Importar e Processar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function EditorPage() {
    const [matchEdit, paramsEdit] = useRoute("/editor/:id");
    const [matchView, paramsView] = useRoute("/view/:id");
    const [_, setLocation] = useLocation();

    const id = matchEdit ? paramsEdit?.id : matchView ? paramsView?.id : 'new';
    const initialMode = matchEdit ? 'edit' : 'view';
    
    // Subscribe to signals
    const page = editorStore.page.value;
    const mode = editorStore.mode.value;
    const isEditing = mode === 'edit';

    // Initialize mode based on URL route on mount
    useEffect(() => {
        editorStore.setMode(initialMode);
    }, [initialMode]);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: "Digite '/' para comandos..." }),
            NormativeExtension
        ],
        editable: isEditing,
        editorProps: {
            attributes: {
                class: 'outline-none prose prose-stone max-w-none dark:prose-invert',
            },
        },
        onSelectionUpdate: ({ editor }) => {
            // Force re-evaluation of selectedBlock computed property
            // In a real app we might update a specific signal here
             editorStore.setEditor(editor); // This triggers the signal update
        },
        onCreate: ({ editor }) => {
            editorStore.setEditor(editor);
        }
    });

    // Update editable state when mode changes
    useEffect(() => {
        if (editor) {
            editor.setEditable(isEditing);
        }
    }, [isEditing, editor]);

    useEffect(() => {
        if (id) {
            editorStore.initPage(id);
        }
        return () => {
            editorStore.setSelectedBlock(null);
            editorStore.setEditor(null);
        };
    }, [id]);

    // Error state from store
    const error = editorStore.error.value;

    // Hydrate editor with content when page loads
    // We use a ref to track if we have already hydrated this specific page instance to avoid loops
    const hydratedRef = React.useRef<string | null>(null);

    useEffect(() => {
        if (page && editor && !editor.isDestroyed && hydratedRef.current !== page.id) {
             console.log("Hydrating editor for page:", page.id);
             
             const content = page.blocks.map(block => {
                if (block.type === 'normative') {
                    const data = block.content as any;
                    return {
                        type: 'normative',
                        attrs: {
                            id: block.id,
                            type: data.type,
                            index: data.index,
                            text: data.text,
                            linkedDocumentId: block.linkedDocumentId
                        },
                        content: [{ type: 'text', text: data.text }]
                    };
                } else if (block.type.startsWith('heading')) {
                     const level = parseInt(block.type.split('-')[1]);
                     return {
                        type: 'heading',
                        attrs: { level },
                        content: [{ type: 'text', text: block.content }]
                     };
                } else {
                     return {
                        type: 'paragraph',
                        content: [{ type: 'text', text: block.content }]
                     };
                }
             });
             
             editor.commands.setContent({
                 type: 'doc',
                 content
             });
             
             hydratedRef.current = page.id;
        }
    }, [page, editor]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-destructive">
                <h2 className="text-xl font-bold">Erro</h2>
                <p>{error}</p>
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                    Voltar para Início
                </Button>
            </div>
        );
    }

    if (!page || !editor) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <div className="text-muted-foreground text-sm">
                    {!page && "Carregando dados da página..."}
                    {!editor && "Inicializando editor..."}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-background relative overflow-hidden">
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300">
                
                {/* Toolbar / Header */}
                <div className="flex items-center justify-between px-8 py-3 border-b bg-background/95 backdrop-blur z-10">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => setLocation('/')}>
                            <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                        </Button>
                        <div className="h-6 w-px bg-border" />
                        
                        {isEditing ? (
                            <input 
                                className="bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground/50"
                                value={page.title}
                                onChange={(e) => editorStore.updateTitle(e.target.value)}
                                placeholder="Título da Página..."
                            />
                        ) : (
                            <h1 className="text-lg font-semibold">{page.title || "Sem título"}</h1>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="mr-4 text-xs text-muted-foreground">
                            {page.isPublic ? "Pública" : "Privada"}
                        </div>

                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                                const newMode = isEditing ? 'view' : 'edit';
                                editorStore.setMode(newMode);
                                if (editor) {
                                    editor.setEditable(newMode === 'edit');
                                }
                            }}
                        >
                            {isEditing ? <><Eye className="mr-2 h-4 w-4" /> Visualizar</> : <><Edit3 className="mr-2 h-4 w-4" /> Editar</>}
                        </Button>
                        
                        {isEditing && (
                            <>
                                <ImportDialog />
                                <Button size="sm">
                                    <Save className="mr-2 h-4 w-4" /> Salvar
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Scrollable Document Area */}
                <div className="flex-1 overflow-y-auto cursor-text" onClick={() => editor?.commands.focus()}>
                    <div className="max-w-4xl mx-auto px-12 py-12 pb-32 min-h-full bg-background shadow-sm border-x border-dashed border-border/40">
                        
                        <EditorContent editor={editor} />

                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <EditorSidebar />
        </div>
    );
}
