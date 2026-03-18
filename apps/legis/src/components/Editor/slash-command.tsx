import { createSuggestionItems } from "novel";
import { Command, Heading1, Heading2, Heading3, Text, Image, Table, Map } from "lucide-react";

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
    title: "Tabela",
    description: "Inserir tabela.",
    searchTerms: ["table"],
    icon: <Table size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
  },
  {
    title: "Figura",
    description: "Inserir uma figura/imagem.",
    searchTerms: ["figura", "image", "figure", "imagem"],
    icon: <Image size={18} />,
    command: ({ editor, range }) => {
      const url = window.prompt("URL da Imagem");
      if (url) {
        editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
      }
    },
  },
  {
    title: "Mapa",
    description: "Inserir um mapa (imagem).",
    searchTerms: ["mapa", "map"],
    icon: <Map size={18} />,
    command: ({ editor, range }) => {
      const url = window.prompt("URL da Imagem do Mapa");
      if (url) {
        editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
      }
    },
  },
]);
