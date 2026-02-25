import { EditorBubble, EditorBubbleItem, useEditor } from "novel";
import { 
  Bold, Italic, Strikethrough, Code, Underline, 
  Table as TableIcon, Trash2, Split, Merge, 
  ArrowLeftToLine, ArrowRightToLine, ArrowUpToLine, ArrowDownToLine,
  AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, Palette
} from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger, Input, Button } from "@open-urbis/map-ui";

const ColorSelector = ({ editor, isOpen, setIsOpen }: { editor: any, isOpen: boolean, setIsOpen: (v: boolean) => void }) => {
    const colors = [
        "#000000", "#4B5563", "#DC2626", "#D97706", "#059669", "#2563EB", "#7C3AED", "#DB2777"
    ];

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground flex items-center"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <Palette size={16} style={{ color: editor.getAttributes('textStyle').color }} />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
                <div className="flex gap-1 flex-wrap max-w-[150px]">
                    {colors.map(color => (
                        <button
                            key={color}
                            className="w-6 h-6 rounded-full border border-muted hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            onClick={() => {
                                editor.chain().focus().setColor(color).run();
                                setIsOpen(false);
                            }}
                        />
                    ))}
                    <button
                        className="w-6 h-6 rounded-full border border-muted flex items-center justify-center text-[10px] hover:bg-accent"
                        onClick={() => {
                            editor.chain().focus().unsetColor().run();
                            setIsOpen(false);
                        }}
                    >
                        <X size={12} />
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

const LinkSelector = ({ editor, isOpen, setIsOpen }: { editor: any, isOpen: boolean, setIsOpen: (v: boolean) => void }) => {
    const [url, setUrl] = useState(editor.getAttributes('link').href || '');

    const setLink = () => {
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if(open) setUrl(editor.getAttributes('link').href || '');
        }}>
            <PopoverTrigger asChild>
                <button
                    className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground data-[active=true]:bg-accent data-[active=true]:text-primary"
                    data-active={editor.isActive('link')}
                >
                    <LinkIcon size={16} />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-2" align="start">
                <div className="flex gap-2">
                    <Input 
                        value={url} 
                        onChange={(e) => setUrl(e.target.value)} 
                        placeholder="https://exemplo.com"
                        className="h-8 text-xs"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                setLink();
                            }
                        }}
                    />
                    <Button size="sm" onClick={setLink} className="h-8 px-2">Ok</Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

// Simple X icon for color clear
const X = ({ size = 16 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

export default function BubbleMenu() {
  const { editor } = useEditor();
  const [isColorOpen, setIsColorOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);

  if (!editor) {
    return null;
  }

  const isTable = editor.isActive("table");

  if (isTable) {
      return (
        <EditorBubble
          tippyOptions={{
            placement: "top",
          }}
          className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl items-center"
        >
             <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().mergeCells().run()}
                className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
             >
                <Merge size={16} />
             </EditorBubbleItem>
             <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().splitCell().run()}
                className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
             >
                <Split size={16} />
             </EditorBubbleItem>
             
             <div className="w-[1px] h-6 bg-muted mx-1" />

             <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().addColumnBefore().run()}
                className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
             >
                <ArrowLeftToLine size={16} />
             </EditorBubbleItem>
             <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().addColumnAfter().run()}
                className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
             >
                <ArrowRightToLine size={16} />
             </EditorBubbleItem>
             <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().deleteColumn().run()}
                className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground text-destructive"
             >
                <Trash2 size={16} className="rotate-90" />
             </EditorBubbleItem>

             <div className="w-[1px] h-6 bg-muted mx-1" />

             <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().addRowBefore().run()}
                className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
             >
                <ArrowUpToLine size={16} />
             </EditorBubbleItem>
             <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().addRowAfter().run()}
                className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
             >
                <ArrowDownToLine size={16} />
             </EditorBubbleItem>
             <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().deleteRow().run()}
                className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground text-destructive"
             >
                <Trash2 size={16} />
             </EditorBubbleItem>

             <div className="w-[1px] h-6 bg-muted mx-1" />

             <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().deleteTable().run()}
                className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground text-destructive"
             >
                <TableIcon size={16} className="strikethrough" />
             </EditorBubbleItem>
        </EditorBubble>
      )
  }

  const items = [
    {
      name: "bold",
      icon: <Bold size={16} />,
      command: (editor: any) => editor.chain().focus().toggleBold().run(),
      isActive: (editor: any) => editor.isActive("bold"),
    },
    {
      name: "italic",
      icon: <Italic size={16} />,
      command: (editor: any) => editor.chain().focus().toggleItalic().run(),
      isActive: (editor: any) => editor.isActive("italic"),
    },
    {
      name: "strike",
      icon: <Strikethrough size={16} />,
      command: (editor: any) => editor.chain().focus().toggleStrike().run(),
      isActive: (editor: any) => editor.isActive("strike"),
    },
    {
        name: "underline",
        icon: <Underline size={16} />,
        command: (editor: any) => editor.chain().focus().toggleUnderline().run(),
        isActive: (editor: any) => editor.isActive("underline"),
    },
    {
      name: "code",
      icon: <Code size={16} />,
      command: (editor: any) => editor.chain().focus().toggleCode().run(),
      isActive: (editor: any) => editor.isActive("code"),
    },
  ];

  return (
    <EditorBubble
      tippyOptions={{
        placement: "top",
      }}
      className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl items-center"
    >
      {items.map((item) => (
        <EditorBubbleItem
          key={item.name}
          onSelect={(editor) => {
            item.command(editor);
          }}
          className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground data-[active=true]:bg-accent data-[active=true]:text-primary"
        >
          {item.icon}
        </EditorBubbleItem>
      ))}
      
      <div className="w-[1px] h-4 bg-muted mx-1" />
      
      <LinkSelector editor={editor} isOpen={isLinkOpen} setIsOpen={setIsLinkOpen} />
      <ColorSelector editor={editor} isOpen={isColorOpen} setIsOpen={setIsColorOpen} />

    </EditorBubble>
  );
}
