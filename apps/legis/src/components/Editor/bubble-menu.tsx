import { EditorBubble, EditorBubbleItem, useEditor } from "novel";
import { Bold, Italic, Strikethrough, Code, Underline } from "lucide-react";

export default function BubbleMenu() {
  const { editor } = useEditor();

  if (!editor) {
    return null;
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
      className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
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
    </EditorBubble>
  );
}
