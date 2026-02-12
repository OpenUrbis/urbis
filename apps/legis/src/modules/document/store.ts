import { signal, computed } from '@preact/signals-react';
import { Block, PageData, EditorMode } from './types';
import { v4 as uuidv4 } from 'uuid';
import { RulesEngine } from '../../domain/rules-engine';
import { Editor } from '@tiptap/react';
import { MOCK_LEI_18080, MOCK_RESOLUCAO_18 } from '../../domain/mocks';
import { convertNormativeToBlocks } from './utils/converter';

// -- PARSER --
const engine = new RulesEngine();

// -- STATE --
const pageSignal = signal<PageData | null>(null);
const modeSignal = signal<EditorMode>('view');
const selectedBlockIdSignal = signal<string | null>(null);
const sidebarOpenSignal = signal<boolean>(true);
const activeEditorSignal = signal<Editor | null>(null);
const errorSignal = signal<string | null>(null);

// -- COMPUTED --
const selectedBlock = computed(() => {
    // If using Tiptap, we try to get selection from editor first
    const editor = activeEditorSignal.value;
    // We rely on editor events to trigger re-computation via activeEditorSignal updates
    // But computed signals might not track deep editor state changes automatically
    // unless we use a version number or similar trigger.
    // For now, we assume setEditor is called on selection update.
    
    if (editor && !editor.isDestroyed) {
        // Find the parent block node of the current selection
        const { $from } = editor.state.selection;
        
        // Traverse up to find a block node (depth 1 is usually the block level in doc)
        // If depth is 0, it's the doc itself.
        // We want the immediate child of doc or the block we are in.
        
        for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d);
            if (node.isBlock && node.type.name !== 'doc') {
                 const attrs = node.attrs;
            
                if (node.type.name === 'normative') {
                    return {
                        id: attrs.id || 'temp-id',
                        type: 'normative',
                        content: {
                            type: attrs.type,
                            index: attrs.index,
                            text: node.textContent
                        },
                        linkedDocumentId: attrs.linkedDocumentId
                    } as Block;
                }
                
                return {
                    id: attrs.id || 'temp-id',
                    type: 'paragraph', // Fallback
                    content: node.textContent,
                    linkedDocumentId: attrs.linkedDocumentId
                } as Block;
            }
        }
    }

    const page = pageSignal.value;
    const id = selectedBlockIdSignal.value;
    if (!page || !id) return null;
    return page.blocks.find(b => b.id === id) || null;
});

// -- ACTIONS --

function initPage(id: string) {
    console.log("[Store] initPage called with ID:", id);
    errorSignal.value = null;
    pageSignal.value = null; // Reset page to ensure loading state triggers correctly if re-entering

    try {
        if (id === 'new') {
            console.log("[Store] Creating new page structure");
            const newPage = {
                id: uuidv4(),
                title: '',
                isPublic: false,
                blocks: [createBlock('paragraph', '')],
                linkedLawIds: [],
                linkedReferenceIds: [],
                updatedAt: new Date().toISOString()
            };
            pageSignal.value = newPage;
            modeSignal.value = 'edit';
            console.log("[Store] New page set in signal");
        } else {
            console.log("[Store] Loading existing page:", id);
            // Mock fetch based on ID
            let title = 'Exemplo de Lei';
            let blocks: Block[] = [];
            let found = false;

            if (id === '18080') {
                title = `Lei ${MOCK_LEI_18080.number}`;
                blocks = convertNormativeToBlocks(MOCK_LEI_18080);
                found = true;
            } else if (id === '32154') {
                title = `Resolução ${MOCK_RESOLUCAO_18.number}`;
                blocks = convertNormativeToBlocks(MOCK_RESOLUCAO_18);
                found = true;
            } else if (id === 'demo-1') {
                 blocks = [
                    createBlock('heading-1', 'Lei Municipal nº 1234'),
                    createBlock('paragraph', 'Dispõe sobre o uso de solo urbano...'),
                    createBlock('normative', {
                        id: 'art-1',
                        type: 'Artigo',
                        index: '1º',
                        text: 'Esta lei regula o uso de solo.',
                        originalStartValidity: { date: '2024-01-01', deviceId: '1' }
                    })
                ];
                found = true;
            }

            if (!found) {
                console.error("[Store] Page not found:", id);
                errorSignal.value = `Página não encontrada: ${id}`;
                return;
            }

            const pageData = {
                id,
                title,
                isPublic: true,
                blocks,
                linkedLawIds: [],
                linkedReferenceIds: [],
                updatedAt: new Date().toISOString()
            };
            
            pageSignal.value = pageData;
            modeSignal.value = 'view';
            console.log("[Store] Existing page set in signal");
        }
    } catch (e: any) {
        console.error("[Store] Error initializing page:", e);
        errorSignal.value = `Erro ao carregar página: ${e.message}`;
    }
}

function createBlock(type: Block['type'], content: any): Block {
    return {
        id: uuidv4(),
        type,
        content
    };
}

function updateBlock(id: string, content: any) {
    const page = pageSignal.value;
    if (!page) return;

    const newBlocks = page.blocks.map(b => 
        b.id === id ? { ...b, content } : b
    );
    
    pageSignal.value = { ...page, blocks: newBlocks };
}

function addBlock(index: number, type: Block['type'] = 'paragraph') {
    const page = pageSignal.value;
    if (!page) return;

    const newBlock = createBlock(type, '');
    const newBlocks = [...page.blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    
    pageSignal.value = { ...page, blocks: newBlocks };
    selectedBlockIdSignal.value = newBlock.id;
}

function removeBlock(id: string) {
    const page = pageSignal.value;
    if (!page) return;
    
    // Don't delete the last block if it's the only one
    if (page.blocks.length <= 1) return;

    const newBlocks = page.blocks.filter(b => b.id !== id);
    pageSignal.value = { ...page, blocks: newBlocks };
}

function setMode(mode: EditorMode) {
    modeSignal.value = mode;
}

function togglePublic() {
    const page = pageSignal.value;
    if (!page) return;
    pageSignal.value = { ...page, isPublic: !page.isPublic };
}

function setSelectedBlock(id: string | null) {
    selectedBlockIdSignal.value = id;
    if (id) {
        sidebarOpenSignal.value = true;
    }
}

function updateTitle(title: string) {
    const page = pageSignal.value;
    if (!page) return;
    pageSignal.value = { ...page, title };
}

function setEditor(editor: Editor | null) {
    activeEditorSignal.value = editor;
}

function importText(text: string) {
    const page = pageSignal.value;
    const editor = activeEditorSignal.value;
    
    if (!page) return;

    // Use Rules Engine to parse text into blocks
    const lines = text.split('\n');
    
    // If Tiptap is active, we insert content into it
    if (editor) {
        // Build Tiptap JSON content from parsed lines
        const content = lines.map(line => {
            const parsed = engine.parseLine(line);
             if (parsed.type === 'Texto') {
                return { type: 'paragraph', content: [{ type: 'text', text: parsed.content }] };
            } else {
                return { 
                    type: 'normative', 
                    attrs: {
                        id: uuidv4(),
                        type: parsed.type,
                        index: parsed.index,
                        text: parsed.content // legacy
                    },
                    content: [{ type: 'text', text: parsed.content }]
                };
            }
        });

        editor.commands.insertContent(content);
        
        // Update page metadata
         pageSignal.value = {
            ...page,
            importSource: { type: 'text', date: new Date().toISOString() }
        };
        return;
    }

    // Fallback to legacy block array if editor not ready (shouldn't happen in new flow)
    const newBlocks: Block[] = lines.map(line => {
        const parsed = engine.parseLine(line);
        if (parsed.type === 'Texto') {
            return createBlock('paragraph', parsed.content);
        } else {
            return createBlock('normative', {
                id: uuidv4(),
                type: parsed.type,
                index: parsed.index,
                text: parsed.content,
                originalStartValidity: { date: 'generated', deviceId: 'gen' }
            });
        }
    });

    pageSignal.value = {
        ...page,
        blocks: [...page.blocks, ...newBlocks],
        importSource: { type: 'text', date: new Date().toISOString() }
    };
}

export const editorStore = {
    // Signals
    page: pageSignal,
    mode: modeSignal,
    selectedBlockId: selectedBlockIdSignal,
    selectedBlock,
    sidebarOpen: sidebarOpenSignal,
    activeEditor: activeEditorSignal,
    error: errorSignal,
    
    // Actions
    initPage,
    updateBlock,
    addBlock,
    removeBlock,
    setMode,
    togglePublic,
    setSelectedBlock,
    updateTitle,
    importText,
    setEditor
};
