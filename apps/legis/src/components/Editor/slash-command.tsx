import { createSuggestionItems } from "novel";
import { Command, Heading1, Heading2, Heading3, Text, List, ListOrdered, CheckSquare, Image, Code } from "lucide-react";

export const suggestionItems = createSuggestionItems([
  {
    title: "Texto",
    description: "Comece a escrever com texto simples.",
    searchTerms: ["p", "paragraph"],
    icon: <Text size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run();
    },
  },
  {
    title: "Título 1",
    description: "Cabeçalho grande.",
    searchTerms: ["h1", "header", "heading"],
    icon: <Heading1 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    title: "Título 2",
    description: "Cabeçalho médio.",
    searchTerms: ["h2", "header", "heading"],
    icon: <Heading2 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    title: "Título 3",
    description: "Cabeçalho pequeno.",
    searchTerms: ["h3", "header", "heading"],
    icon: <Heading3 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
    },
  },
  {
    title: "Lista de Itens",
    description: "Lista simples com marcadores.",
    searchTerms: ["list", "ul"],
    icon: <List size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Lista Numerada",
    description: "Lista com números.",
    searchTerms: ["ordered", "list", "ol"],
    icon: <ListOrdered size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Lista de Tarefas",
    description: "Lista de afazeres.",
    searchTerms: ["todo", "task", "list"],
    icon: <CheckSquare size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Código",
    description: "Bloco de código.",
    searchTerms: ["code", "block"],
    icon: <Code size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
]);
