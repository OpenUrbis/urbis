import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bold, Italic, Link, List, ListOrdered, Image as ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { S3ImageModal } from "./S3ImageModal";

interface RichTextFieldProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeightClassName?: string;
}

const commands = [
  { command: "bold", label: "Negrito", icon: Bold },
  { command: "italic", label: "Itálico", icon: Italic },
  { command: "insertUnorderedList", label: "Lista", icon: List },
  { command: "insertOrderedList", label: "Lista numerada", icon: ListOrdered },
];

export const RichTextField = ({
  value = "",
  onChange,
  placeholder,
  className,
  minHeightClassName = "min-h-[112px]",
}: RichTextFieldProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    if (
      !isFocused &&
      editorRef.current &&
      editorRef.current.innerHTML !== value
    ) {
      editorRef.current.innerHTML = value || "";
    }
  }, [isFocused, value]);

  const emitChange = () => {
    onChange(editorRef.current?.innerHTML ?? "");
  };

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  };

  const handleTransformCase = (type: "upper" | "lower") => {
    editorRef.current?.focus();
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString() : "";

    if (selectedText) {
      const newText =
        type === "upper"
          ? selectedText.toUpperCase()
          : selectedText.toLowerCase();
      document.execCommand("insertText", false, newText);
    } else if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      if (type === "upper") {
        editorRef.current.innerHTML = currentHtml.toUpperCase();
      } else {
        editorRef.current.innerHTML = currentHtml.toLowerCase();
      }
    }
    emitChange();
  };

  const addLink = () => {
    const href = window.prompt("Cole a URL do vínculo");
    if (!href) return;
    runCommand("createLink", href);
  };

  const handleInsertImage = (imageUrl: string, altText?: string) => {
    if (!imageUrl || !editorRef.current) return;
    editorRef.current.focus();

    const imgHtml = `<img src="${imageUrl}" alt="${altText || ""}" class="my-2 max-w-full h-auto rounded-md shadow-sm" />`;

    try {
      const inserted = document.execCommand("insertHTML", false, imgHtml);
      if (!inserted) {
        editorRef.current.innerHTML += imgHtml;
      }
    } catch {
      editorRef.current.innerHTML += imgHtml;
    }
    emitChange();
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border bg-background",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-1">
        {commands.map(({ command, label, icon: Icon }) => (
          <Button
            key={command}
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={label}
            title={label}
            onClick={() => runCommand(command)}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}

        <div className="mx-0.5 h-4 w-[1px] bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 font-mono text-xs font-bold"
          aria-label="MAIÚSCULAS"
          title="Converter para MAIÚSCULAS (Upper)"
          onClick={() => handleTransformCase("upper")}
        >
          AA
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 font-mono text-xs font-bold text-muted-foreground"
          aria-label="minúsculas"
          title="Converter para minúsculas (Lower)"
          onClick={() => handleTransformCase("lower")}
        >
          aa
        </Button>

        <div className="mx-0.5 h-4 w-[1px] bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Inserir vínculo"
          title="Inserir vínculo"
          onClick={addLink}
        >
          <Link className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Inserir imagem (S3)"
          title="Inserir imagem (S3)"
          onClick={() => setIsImageModalOpen(true)}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          emitChange();
        }}
        onInput={emitChange}
        className={cn(
          "prose prose-sm max-w-none px-3 py-2 text-sm outline-none dark:prose-invert empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]",
          minHeightClassName,
        )}
      />

      <S3ImageModal
        open={isImageModalOpen}
        onOpenChange={setIsImageModalOpen}
        onInsertImage={handleInsertImage}
      />
    </div>
  );
};
