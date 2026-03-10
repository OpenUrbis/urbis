import React, { useEffect } from 'react';
import { useEditor, EditorContent, Editor, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough, List, ListOrdered, Undo, Redo } from 'lucide-react';
import { cn } from '@open-urbis/map-ui';

interface SimpleEditorProps {
    initialContent?: JSONContent | string;
    onChange?: (content: any) => void;
    className?: string;
    readOnly?: boolean;
    placeholder?: string;
    outputFormat?: 'json' | 'html';
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="flex items-center gap-1 p-1 border-b bg-muted/20">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={cn("p-1.5 rounded hover:bg-muted transition-colors", editor.isActive('bold') ? 'bg-muted text-primary' : 'text-muted-foreground')}
                title="Negrito"
                type="button"
            >
                <Bold className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={cn("p-1.5 rounded hover:bg-muted transition-colors", editor.isActive('italic') ? 'bg-muted text-primary' : 'text-muted-foreground')}
                title="Itálico"
                type="button"
            >
                <Italic className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
                className={cn("p-1.5 rounded hover:bg-muted transition-colors", editor.isActive('strike') ? 'bg-muted text-primary' : 'text-muted-foreground')}
                title="Tachado"
                type="button"
            >
                <Strikethrough className="w-3.5 h-3.5" />
            </button>
            
            <div className="w-px h-4 bg-border mx-1" />
            
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn("p-1.5 rounded hover:bg-muted transition-colors", editor.isActive('bulletList') ? 'bg-muted text-primary' : 'text-muted-foreground')}
                title="Lista com marcadores"
                type="button"
            >
                <List className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn("p-1.5 rounded hover:bg-muted transition-colors", editor.isActive('orderedList') ? 'bg-muted text-primary' : 'text-muted-foreground')}
                title="Lista numerada"
                type="button"
            >
                <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-4 bg-border mx-1" />

            <button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
                className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
                title="Desfazer"
                type="button"
            >
                <Undo className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().chain().focus().redo().run()}
                className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
                title="Refazer"
                type="button"
            >
                <Redo className="w-3.5 h-3.5" />
            </button>
        </div>
    );
};

export const SimpleEditor = ({ initialContent, onChange, className, readOnly, placeholder, outputFormat = 'json' }: SimpleEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Digite aqui...',
                emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:pointer-events-none before:h-0',
            }),
        ],
        content: initialContent,
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            if (onChange) {
                if (outputFormat === 'html') {
                    onChange(editor.getHTML());
                } else {
                    onChange(editor.getJSON());
                }
            }
        },
        editorProps: {
            attributes: {
                class: cn('prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[100px] p-3 text-sm leading-relaxed', className),
            },
        },
    });

    useEffect(() => {
        if (editor && initialContent && !editor.isDestroyed) {
            // Only update if content is different to avoid cursor jumps/loops
            // But checking deep equality is expensive. 
            // For metadata forms, initialContent usually changes only on load.
            // If the parent updates initialContent on every keystroke, this will cause issues.
            // Assuming initialContent is stable or we trust the parent not to update it while editing.
            // editor.commands.setContent(initialContent); 
        }
    }, [initialContent, editor]);

    return (
        <div className="border rounded-md bg-background overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-all">
            {!readOnly && <MenuBar editor={editor} />}
            <EditorContent editor={editor} />
        </div>
    );
};
