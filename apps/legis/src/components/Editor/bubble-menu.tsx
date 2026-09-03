import { EditorBubble, EditorBubbleItem, useEditor } from "novel";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline,
  Table as TableIcon,
  Trash2,
  Split,
  Merge,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  ArrowDownToLine,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Palette,
  CornerDownLeft,
  ListTree,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Input,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@open-urbis/map-ui";

const ToolbarTooltip = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent>
      <p>{label}</p>
    </TooltipContent>
  </Tooltip>
);

const ColorSelector = ({
  editor,
  isOpen,
  setIsOpen,
}: {
  editor: any;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}) => {
  const colors = [
    "#000000",
    "#4B5563",
    "#DC2626",
    "#D97706",
    "#059669",
    "#2563EB",
    "#7C3AED",
    "#DB2777",
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Cor do texto"
          aria-label="Cor do texto"
          className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground flex items-center"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Palette
            size={16}
            style={{ color: editor.getAttributes("textStyle").color }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-1 flex-wrap max-w-[150px]">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              title={`Aplicar cor ${color}`}
              aria-label={`Aplicar cor ${color}`}
              className="w-6 h-6 rounded-full border border-muted hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => {
                editor.chain().focus().setColor(color).run();
                setIsOpen(false);
              }}
            />
          ))}
          <button
            type="button"
            title="Remover cor"
            aria-label="Remover cor"
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

const LinkSelector = ({
  editor,
  isOpen,
  setIsOpen,
}: {
  editor: any;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}) => {
  const [url, setUrl] = useState(editor.getAttributes("link").href || "");

  const setLink = () => {
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
    setIsOpen(false);
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) setUrl(editor.getAttributes("link").href || "");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Inserir link"
          aria-label="Inserir link"
          className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground data-[active=true]:bg-accent data-[active=true]:text-primary"
          data-active={editor.isActive("link")}
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
              if (e.key === "Enter") {
                e.preventDefault();
                setLink();
              }
            }}
          />
          <Button size="sm" onClick={setLink} className="h-8 px-2">
            Ok
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Simple X icon for color clear
const X = ({ size = 16 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const BubbleDivider = () => <div className="w-[1px] h-6 bg-muted mx-1" />;

const HeaderColumnIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
    <path d="M15 4v16" />
    <path d="M3 4h6" />
  </svg>
);

const HeaderRowIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 10h18" />
    <path d="M3 16h18" />
    <path d="M3 4h18" />
  </svg>
);

const HeaderCellIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 10h18" />
    <path d="M9 4v16" />
    <rect
      x="3"
      y="4"
      width="6"
      height="6"
      fill="currentColor"
      stroke="none"
      opacity="0.2"
    />
  </svg>
);

export default function BubbleMenu() {
  const { editor } = useEditor();
  const [isColorOpen, setIsColorOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);

  if (!editor) {
    return null;
  }

  const isTable = editor.isActive("table");
  const alignmentItems = [
    {
      name: "align-left",
      label: "Alinhar à esquerda",
      icon: <AlignLeft size={16} />,
      command: (editor: any) =>
        editor.chain().focus().setTextAlign("left").run(),
      isActive: (editor: any) => editor.isActive({ textAlign: "left" }),
    },
    {
      name: "align-center",
      label: "Centralizar",
      icon: <AlignCenter size={16} />,
      command: (editor: any) =>
        editor.chain().focus().setTextAlign("center").run(),
      isActive: (editor: any) => editor.isActive({ textAlign: "center" }),
    },
    {
      name: "align-right",
      label: "Alinhar à direita",
      icon: <AlignRight size={16} />,
      command: (editor: any) =>
        editor.chain().focus().setTextAlign("right").run(),
      isActive: (editor: any) => editor.isActive({ textAlign: "right" }),
    },
    {
      name: "align-justify",
      label: "Justificar",
      icon: <AlignJustify size={16} />,
      command: (editor: any) =>
        editor.chain().focus().setTextAlign("justify").run(),
      isActive: (editor: any) => editor.isActive({ textAlign: "justify" }),
    },
  ];

  if (isTable) {
    const tableHeaderItems = [
      {
        name: "toggle-header-cell",
        label: "Alternar célula de cabeçalho",
        icon: <HeaderCellIcon size={16} />,
        command: (editor: any) =>
          editor.chain().focus().toggleHeaderCell().run(),
        isActive: (editor: any) => editor.isActive("tableHeader"),
      },
      {
        name: "toggle-header-row",
        label: "Alternar linha de cabeçalho",
        icon: <HeaderRowIcon size={16} />,
        command: (editor: any) =>
          editor.chain().focus().toggleHeaderRow().run(),
        isActive: (editor: any) => editor.isActive("tableHeader"),
      },
      {
        name: "toggle-header-column",
        label: "Alternar coluna de cabeçalho",
        icon: <HeaderColumnIcon size={16} />,
        command: (editor: any) =>
          editor.chain().focus().toggleHeaderColumn().run(),
        isActive: (editor: any) => editor.isActive("tableHeader"),
      },
    ];

    return (
      <TooltipProvider>
        <EditorBubble
          tippyOptions={{
            placement: "top",
          }}
          className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl items-center"
        >
          {alignmentItems.map((item) => (
            <ToolbarTooltip key={item.name} label={item.label}>
              <EditorBubbleItem
                onSelect={(editor) => item.command(editor)}
                className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground data-[active=true]:bg-accent data-[active=true]:text-primary"
                data-active={item.isActive(editor)}
              >
                {item.icon}
              </EditorBubbleItem>
            </ToolbarTooltip>
          ))}

          <BubbleDivider />

          {tableHeaderItems.map((item) => (
            <ToolbarTooltip key={item.name} label={item.label}>
              <EditorBubbleItem
                onSelect={(editor) => item.command(editor)}
                className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground data-[active=true]:bg-accent data-[active=true]:text-primary"
                data-active={item.isActive(editor)}
              >
                {item.icon}
              </EditorBubbleItem>
            </ToolbarTooltip>
          ))}

          <BubbleDivider />

          <ToolbarTooltip label="Mesclar células">
            <EditorBubbleItem
              onSelect={(editor) => editor.chain().focus().mergeCells().run()}
              className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Merge size={16} />
            </EditorBubbleItem>
          </ToolbarTooltip>
          <ToolbarTooltip label="Dividir célula">
            <EditorBubbleItem
              onSelect={(editor) => editor.chain().focus().splitCell().run()}
              className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Split size={16} />
            </EditorBubbleItem>
          </ToolbarTooltip>

          <BubbleDivider />

          <ToolbarTooltip label="Adicionar coluna antes">
            <EditorBubbleItem
              onSelect={(editor) =>
                editor.chain().focus().addColumnBefore().run()
              }
              className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ArrowLeftToLine size={16} />
            </EditorBubbleItem>
          </ToolbarTooltip>
          <ToolbarTooltip label="Adicionar coluna depois">
            <EditorBubbleItem
              onSelect={(editor) =>
                editor.chain().focus().addColumnAfter().run()
              }
              className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ArrowRightToLine size={16} />
            </EditorBubbleItem>
          </ToolbarTooltip>
          <ToolbarTooltip label="Excluir coluna">
            <EditorBubbleItem
              onSelect={(editor) => editor.chain().focus().deleteColumn().run()}
              className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground text-destructive"
            >
              <Trash2 size={16} className="rotate-90" />
            </EditorBubbleItem>
          </ToolbarTooltip>

          <BubbleDivider />

          <ToolbarTooltip label="Adicionar linha antes">
            <EditorBubbleItem
              onSelect={(editor) => editor.chain().focus().addRowBefore().run()}
              className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ArrowUpToLine size={16} />
            </EditorBubbleItem>
          </ToolbarTooltip>
          <ToolbarTooltip label="Adicionar linha depois">
            <EditorBubbleItem
              onSelect={(editor) => editor.chain().focus().addRowAfter().run()}
              className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ArrowDownToLine size={16} />
            </EditorBubbleItem>
          </ToolbarTooltip>
          <ToolbarTooltip label="Excluir linha">
            <EditorBubbleItem
              onSelect={(editor) => editor.chain().focus().deleteRow().run()}
              className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground text-destructive"
            >
              <Trash2 size={16} />
            </EditorBubbleItem>
          </ToolbarTooltip>

          <BubbleDivider />

          <ToolbarTooltip label="Excluir tabela">
            <EditorBubbleItem
              onSelect={(editor) => editor.chain().focus().deleteTable().run()}
              className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground text-destructive"
            >
              <TableIcon size={16} className="strikethrough" />
            </EditorBubbleItem>
          </ToolbarTooltip>
        </EditorBubble>
      </TooltipProvider>
    );
  }

  const items = [
    {
      name: "bold",
      label: "Negrito",
      icon: <Bold size={16} />,
      command: (editor: any) => editor.chain().focus().toggleBold().run(),
      isActive: (editor: any) => editor.isActive("bold"),
    },
    {
      name: "italic",
      label: "Itálico",
      icon: <Italic size={16} />,
      command: (editor: any) => editor.chain().focus().toggleItalic().run(),
      isActive: (editor: any) => editor.isActive("italic"),
    },
    {
      name: "strike",
      label: "Tachado",
      icon: <Strikethrough size={16} />,
      command: (editor: any) => editor.chain().focus().toggleStrike().run(),
      isActive: (editor: any) => editor.isActive("strike"),
    },
    {
      name: "underline",
      label: "Sublinhado",
      icon: <Underline size={16} />,
      command: (editor: any) => editor.chain().focus().toggleUnderline().run(),
      isActive: (editor: any) => editor.isActive("underline"),
    },
    ...alignmentItems,
  ];

  // Block ↔ normative element controls: only offered when they can actually run
  // (merge needs a multi-block selection, split needs a line break).
  // `any` because the bubble menu gets its editor from novel, which resolves a
  // different `@tiptap/core` copy than this app — same instance at runtime, but
  // the custom command types declared in `block-lines.ts` do not reach it.
  const blockCommands = editor as any;
  const canMergeBlocks = Boolean(blockCommands.can().mergeSelectedBlocks?.());
  const canSplitBlockLines = Boolean(
    blockCommands.can().splitSelectedBlockLines?.(),
  );

  return (
    <TooltipProvider>
      <EditorBubble
        tippyOptions={{
          placement: "top",
        }}
        className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl items-center"
      >
        {items.map((item) => (
          <ToolbarTooltip key={item.name} label={item.label}>
            <EditorBubbleItem
              onSelect={(editor) => {
                item.command(editor);
              }}
              className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground data-[active=true]:bg-accent data-[active=true]:text-primary"
              data-active={item.isActive(editor)}
            >
              {item.icon}
            </EditorBubbleItem>
          </ToolbarTooltip>
        ))}

        <div className="w-[1px] h-4 bg-muted mx-1" />

        <LinkSelector
          editor={editor}
          isOpen={isLinkOpen}
          setIsOpen={setIsLinkOpen}
        />
        <ColorSelector
          editor={editor}
          isOpen={isColorOpen}
          setIsOpen={setIsColorOpen}
        />

        {(canMergeBlocks || canSplitBlockLines) && <BubbleDivider />}

        {canMergeBlocks && (
          <ToolbarTooltip label="Unir em um elemento (Shift+Enter)">
            <EditorBubbleItem
              onSelect={(editor) =>
                (editor as any).chain().focus().mergeSelectedBlocks().run()
              }
              className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <CornerDownLeft size={16} />
            </EditorBubbleItem>
          </ToolbarTooltip>
        )}

        {canSplitBlockLines && (
          <ToolbarTooltip label="Separar linhas em elementos (Ctrl/⌘+Shift+Enter)">
            <EditorBubbleItem
              onSelect={(editor) =>
                (editor as any).chain().focus().splitSelectedBlockLines().run()
              }
              className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ListTree size={16} />
            </EditorBubbleItem>
          </ToolbarTooltip>
        )}
      </EditorBubble>
    </TooltipProvider>
  );
}
