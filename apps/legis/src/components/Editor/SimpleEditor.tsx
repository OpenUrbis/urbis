import React, { useEffect, useState, useRef } from "react";
import {
  useEditor,
  EditorContent,
  Editor,
  JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import { Extension, Mark, Node } from "@tiptap/core";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo,
  Redo,
  Link as LinkIcon,
  Palette,
  Image as ImageIcon,
  Video as VideoIcon,
  Type,
  X,
  Upload,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Input,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from "@open-urbis/map-ui";
import { uploadFileToS3 } from "../../services/file-service";

/* -------------------------------------------------------------------------- */
/* Custom Extensions for SimpleEditor                                         */
/* -------------------------------------------------------------------------- */

export const UnderlineExtension = Mark.create({
  name: "underline",

  parseHTML() {
    return [
      { tag: "u" },
      {
        style: "text-decoration",
        consuming: false,
        getAttrs: (value) =>
          typeof value === "string" && value.includes("underline") ? {} : false,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["u", HTMLAttributes, 0];
  },

  addCommands(): any {
    return {
      toggleUnderline:
        () =>
        ({ commands }: any) =>
          commands.toggleMark(this.name),
      setUnderline:
        () =>
        ({ commands }: any) =>
          commands.setMark(this.name),
      unsetUnderline:
        () =>
        ({ commands }: any) =>
          commands.unsetMark(this.name),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-u": () => (this.editor as any).commands.toggleUnderline(),
      "Mod-U": () => (this.editor as any).commands.toggleUnderline(),
    };
  },
});

export const SubscriptExtension = Mark.create({
  name: "subscript",

  parseHTML() {
    return [{ tag: "sub" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["sub", HTMLAttributes, 0];
  },

  addCommands(): any {
    return {
      toggleSubscript:
        () =>
        ({ commands }: any) =>
          commands.toggleMark(this.name),
      setSubscript:
        () =>
        ({ commands }: any) =>
          commands.setMark(this.name),
      unsetSubscript:
        () =>
        ({ commands }: any) =>
          commands.unsetMark(this.name),
    };
  },
});

export const SuperscriptExtension = Mark.create({
  name: "superscript",

  parseHTML() {
    return [{ tag: "sup" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["sup", HTMLAttributes, 0];
  },

  addCommands(): any {
    return {
      toggleSuperscript:
        () =>
        ({ commands }: any) =>
          commands.toggleMark(this.name),
      setSuperscript:
        () =>
        ({ commands }: any) =>
          commands.setMark(this.name),
      unsetSuperscript:
        () =>
        ({ commands }: any) =>
          commands.unsetMark(this.name),
    };
  },
});

export const FontSizeExtension = Extension.create({
  name: "fontSize",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) =>
              element.style.fontSize?.replace(/['"]+/g, "") || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands(): any {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { fontSize: null }).run(),
    };
  },
});

export const IframeExtension = Node.create({
  name: "iframe",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      frameborder: { default: "0" },
      allowfullscreen: { default: "true" },
      allow: {
        default:
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
      },
      width: { default: "100%" },
      height: { default: "360" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "iframe",
        getAttrs: (element: HTMLElement) => ({
          src: element.getAttribute("src"),
          frameborder: element.getAttribute("frameborder") || "0",
          allowfullscreen: element.getAttribute("allowfullscreen") || "true",
          allow: element.getAttribute("allow"),
          width: element.getAttribute("width") || "100%",
          height: element.getAttribute("height") || "360",
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { class: "video-wrapper my-3 w-full aspect-video rounded overflow-hidden border border-muted" },
      ["iframe", { ...HTMLAttributes, class: "w-full h-full border-0" }],
    ];
  },

  addCommands(): any {
    return {
      setIframe:
        (options: { src: string }) =>
        ({ tr, dispatch }: any) => {
          const { selection } = tr;
          const node = this.type.create(options);
          if (dispatch) {
            tr.replaceRangeWith(selection.from, selection.to, node);
          }
          return true;
        },
    };
  },
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeVideoEmbedUrl(input: string): string {
  const trimmed = input.trim();
  // If input is an iframe snippet, extract src
  const iframeSrcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch?.[1]) {
    return iframeSrcMatch[1];
  }

  // YouTube watch URL
  const ytWatchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/i);
  if (ytWatchMatch?.[1]) {
    return `https://www.youtube.com/embed/${ytWatchMatch[1]}`;
  }

  // Vimeo URL
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/i);
  if (vimeoMatch?.[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return trimmed;
}

/* -------------------------------------------------------------------------- */
/* Sub-components for MenuBar                                                 */
/* -------------------------------------------------------------------------- */

const ToolbarTooltip = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent side="top" className="text-xs">
      <p>{label}</p>
    </TooltipContent>
  </Tooltip>
);

const ColorSelector = ({ editor }: { editor: Editor }) => {
  const [isOpen, setIsOpen] = useState(false);
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
      <ToolbarTooltip label="Cor do texto">
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground",
              editor.getAttributes("textStyle").color && "bg-muted text-primary",
            )}
            onClick={() => setIsOpen(!isOpen)}
          >
            <Palette
              size={14}
              style={{ color: editor.getAttributes("textStyle").color }}
            />
          </button>
        </PopoverTrigger>
      </ToolbarTooltip>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-1 flex-wrap max-w-[150px]">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              title={`Aplicar cor ${color}`}
              aria-label={`Aplicar cor ${color}`}
              className="w-5 h-5 rounded-full border border-muted hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => {
                (editor.chain().focus() as any).setColor(color).run();
                setIsOpen(false);
              }}
            />
          ))}
          <button
            type="button"
            title="Remover cor"
            aria-label="Remover cor"
            className="w-5 h-5 rounded-full border border-muted flex items-center justify-center text-[10px] hover:bg-accent"
            onClick={() => {
              (editor.chain().focus() as any).unsetColor().run();
              setIsOpen(false);
            }}
          >
            <X size={10} />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const LinkSelector = ({ editor }: { editor: Editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState(editor.getAttributes("link").href || "");

  const setLink = () => {
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url.trim() })
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
      <ToolbarTooltip label="Inserir Link">
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive("link")
                ? "bg-muted text-primary"
                : "text-muted-foreground",
            )}
          >
            <LinkIcon size={14} />
          </button>
        </PopoverTrigger>
      </ToolbarTooltip>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="flex gap-1.5">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://exemplo.com"
            className="h-7 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setLink();
              }
            }}
          />
          <Button size="sm" onClick={setLink} className="h-7 px-2 text-xs">
            Ok
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const FontSizeSelector = ({ editor }: { editor: Editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentSize = editor.getAttributes("textStyle").fontSize;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <ToolbarTooltip label="Tamanho do texto">
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors flex items-center gap-0.5 text-xs",
              currentSize ? "bg-muted text-primary" : "text-muted-foreground",
            )}
          >
            <Type size={14} />
          </button>
        </PopoverTrigger>
      </ToolbarTooltip>
      <PopoverContent className="w-36 p-1" align="start">
        <div className="flex flex-col gap-0.5 text-xs">
          <button
            type="button"
            onClick={() => {
              (editor.chain().focus() as any).setFontSize("0.85em").run();
              setIsOpen(false);
            }}
            className={cn(
              "px-2 py-1 text-left rounded hover:bg-muted transition-colors text-xs",
              currentSize === "0.85em" && "bg-muted text-primary font-semibold",
            )}
          >
            Pequeno (menor)
          </button>
          <button
            type="button"
            onClick={() => {
              (editor.chain().focus() as any).unsetFontSize().run();
              setIsOpen(false);
            }}
            className={cn(
              "px-2 py-1 text-left rounded hover:bg-muted transition-colors text-xs",
              !currentSize && "bg-muted text-primary font-semibold",
            )}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => {
              (editor.chain().focus() as any).setFontSize("1.25em").run();
              setIsOpen(false);
            }}
            className={cn(
              "px-2 py-1 text-left rounded hover:bg-muted transition-colors text-xs",
              currentSize === "1.25em" && "bg-muted text-primary font-semibold",
            )}
          >
            Grande (maior)
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ImageSelector = ({ editor }: { editor: Editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const insertImage = (src: string) => {
    if (src.trim()) {
      editor.chain().focus().setImage({ src: src.trim() }).run();
      setUrl("");
      setIsOpen(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadFileToS3(file, "legis/figuras");
      insertImage(result.url);
    } catch (err: any) {
      alert(err?.message || "Erro ao fazer upload da imagem.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <ToolbarTooltip label="Inserir Imagem">
        <PopoverTrigger asChild>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"
          >
            <ImageIcon size={14} />
          </button>
        </PopoverTrigger>
      </ToolbarTooltip>
      <PopoverContent className="w-64 p-2.5 space-y-2" align="start">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">
            URL da imagem
          </label>
          <div className="flex gap-1.5">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  insertImage(url);
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => insertImage(url)}
              className="h-7 px-2 text-xs"
            >
              Ok
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between border-t pt-2">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="h-7 text-xs w-full gap-1.5"
          >
            <Upload size={12} />
            {uploading ? "Enviando..." : "Upload do arquivo"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const VideoSelector = ({ editor }: { editor: Editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");

  const insertVideo = () => {
    const embedUrl = normalizeVideoEmbedUrl(input);
    if (embedUrl) {
      (editor.chain().focus() as any).setIframe({ src: embedUrl }).run();
      setInput("");
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <ToolbarTooltip label="Inserir Vídeo / Iframe">
        <PopoverTrigger asChild>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"
          >
            <VideoIcon size={14} />
          </button>
        </PopoverTrigger>
      </ToolbarTooltip>
      <PopoverContent className="w-72 p-2.5 space-y-2" align="start">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">
            URL do vídeo (YouTube/Vimeo) ou código iframe
          </label>
          <div className="flex gap-1.5">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  insertVideo();
                }
              }}
            />
            <Button
              size="sm"
              onClick={insertVideo}
              className="h-7 px-2 text-xs"
            >
              Ok
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-wrap items-center gap-0.5 p-1 border-b bg-muted/20">
        {/* Undo / Redo */}
        <ToolbarTooltip label="Desfazer">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40"
            type="button"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
        </ToolbarTooltip>
        <ToolbarTooltip label="Refazer">
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40"
            type="button"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </ToolbarTooltip>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Basic formatting */}
        <ToolbarTooltip label="Negrito (Ctrl+B)">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive("bold")
                ? "bg-muted text-primary"
                : "text-muted-foreground",
            )}
            type="button"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
        </ToolbarTooltip>

        <ToolbarTooltip label="Itálico (Ctrl+I)">
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive("italic")
                ? "bg-muted text-primary"
                : "text-muted-foreground",
            )}
            type="button"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
        </ToolbarTooltip>

        <ToolbarTooltip label="Sublinhado (Ctrl+U)">
          <button
            onClick={() => (editor.chain().focus() as any).toggleUnderline().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive("underline")
                ? "bg-muted text-primary"
                : "text-muted-foreground",
            )}
            type="button"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>
        </ToolbarTooltip>

        <ToolbarTooltip label="Tachado">
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive("strike")
                ? "bg-muted text-primary"
                : "text-muted-foreground",
            )}
            type="button"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
        </ToolbarTooltip>

        <ToolbarTooltip label="Subscrito">
          <button
            onClick={() => (editor.chain().focus() as any).toggleSubscript().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive("subscript")
                ? "bg-muted text-primary"
                : "text-muted-foreground",
            )}
            type="button"
          >
            <SubscriptIcon className="w-3.5 h-3.5" />
          </button>
        </ToolbarTooltip>

        <ToolbarTooltip label="Sobrescrito">
          <button
            onClick={() => (editor.chain().focus() as any).toggleSuperscript().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive("superscript")
                ? "bg-muted text-primary"
                : "text-muted-foreground",
            )}
            type="button"
          >
            <SuperscriptIcon className="w-3.5 h-3.5" />
          </button>
        </ToolbarTooltip>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Font size and Color */}
        <FontSizeSelector editor={editor} />
        <ColorSelector editor={editor} />

        <div className="w-px h-4 bg-border mx-1" />

        {/* Alignments */}
        <ToolbarTooltip label="Alinhar à esquerda">
          <button
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive({ textAlign: "left" })
                ? "bg-muted text-primary"
                : "text-muted-foreground",
            )}
            type="button"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
        </ToolbarTooltip>

        <ToolbarTooltip label="Centralizar">
          <button
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive({ textAlign: "center" })
                ? "bg-muted text-primary"
                : "text-muted-foreground",
            )}
            type="button"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
        </ToolbarTooltip>

        <ToolbarTooltip label="Alinhar à direita">
          <button
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive({ textAlign: "right" })
                ? "bg-muted text-primary"
                : "text-muted-foreground",
            )}
            type="button"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </ToolbarTooltip>

        <ToolbarTooltip label="Justificar">
          <button
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive({ textAlign: "justify" })
                ? "bg-muted text-primary"
                : "text-muted-foreground",
            )}
            type="button"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
        </ToolbarTooltip>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Lists */}
        <ToolbarTooltip label="Lista com marcadores">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive("bulletList")
                ? "bg-muted text-primary"
                : "text-muted-foreground",
            )}
            type="button"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </ToolbarTooltip>

        <ToolbarTooltip label="Lista numerada">
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive("orderedList")
                ? "bg-muted text-primary"
                : "text-muted-foreground",
            )}
            type="button"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
        </ToolbarTooltip>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Links, Media */}
        <LinkSelector editor={editor} />
        <ImageSelector editor={editor} />
        <VideoSelector editor={editor} />
      </div>
    </TooltipProvider>
  );
};

/* -------------------------------------------------------------------------- */
/* Main SimpleEditor Component                                               */
/* -------------------------------------------------------------------------- */

export interface SimpleEditorProps {
  initialContent?: JSONContent | string;
  onChange?: (content: any) => void;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
  outputFormat?: "json" | "html";
}

export const SimpleEditor = ({
  initialContent,
  onChange,
  className,
  readOnly,
  placeholder,
  outputFormat = "json",
}: SimpleEditorProps) => {
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
        placeholder: placeholder || "Digite aqui...",
        emptyEditorClass:
          "is-editor-empty before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:pointer-events-none before:h-0",
      }),
      UnderlineExtension,
      SubscriptExtension,
      SuperscriptExtension,
      TextStyle,
      FontSizeExtension,
      Color.configure({
        types: ["textStyle"],
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
        defaultAlignment: "left",
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            "text-primary underline underline-offset-2 hover:opacity-80 transition-opacity cursor-pointer",
        },
      }),
      TiptapImage.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded border border-muted max-w-full my-2",
        },
      }),
      IframeExtension,
    ] as any,
    content: initialContent || "",
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (onChange) {
        if (outputFormat === "html") {
          onChange(editor.getHTML());
        } else {
          onChange(editor.getJSON());
        }
      }
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[100px] p-3 text-sm leading-relaxed",
          className,
        ),
      },
    },
  });

  // Keep editor content in sync if initialContent changes and editor is empty or updated from parent
  useEffect(() => {
    if (editor && initialContent !== undefined && !editor.isDestroyed) {
      if (typeof initialContent === "string") {
        if (initialContent.trim() !== "" && editor.isEmpty) {
          editor.commands.setContent(initialContent);
        }
      } else if (initialContent && editor.isEmpty) {
        editor.commands.setContent(initialContent);
      }
    }
  }, [initialContent, editor]);

  return (
    <div className="border rounded-md bg-background overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-all">
      {!readOnly && <MenuBar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
};
