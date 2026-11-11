import { createSuggestionItems } from "novel";
import {
  Heading1,
  Heading2,
  Heading3,
  Text,
  Image,
  Table,
  Map,
  Paperclip,
} from "lucide-react";
import { uploadFileToS3, isImageUrl } from "../../services/file-service";

export const suggestionItems = createSuggestionItems([
  {
    title: "Texto",
    description: "Comece a escrever com texto simples.",
    searchTerms: ["p", "paragraph"],
    icon: <Text size={18} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleNode("paragraph", "paragraph")
        .run();
    },
  },
  {
    title: "Título 1",
    description: "Cabeçalho grande.",
    searchTerms: ["h1", "header", "heading"],
    icon: <Heading1 size={18} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 1 })
        .run();
    },
  },
  {
    title: "Título 2",
    description: "Cabeçalho médio.",
    searchTerms: ["h2", "header", "heading"],
    icon: <Heading2 size={18} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 2 })
        .run();
    },
  },
  {
    title: "Título 3",
    description: "Cabeçalho pequeno.",
    searchTerms: ["h3", "header", "heading"],
    icon: <Heading3 size={18} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 3 })
        .run();
    },
  },
  {
    title: "Tabela",
    description: "Inserir tabela.",
    searchTerms: ["table"],
    icon: <Table size={18} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    title: "Figura / Imagem",
    description: "Enviar imagem ou figura para o repositório.",
    searchTerms: ["figura", "image", "figure", "imagem", "upload"],
    icon: <Image size={18} />,
    command: ({ editor, range }) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (file) {
          try {
            const result = await uploadFileToS3(file, "legis/figuras");
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .setImage({ src: result.url })
              .run();
          } catch (err: any) {
            alert(err?.message || "Erro ao fazer upload da imagem.");
          }
        }
      };
      input.click();
    },
  },
  {
    title: "Mapa",
    description: "Enviar mapa (imagem) para o repositório.",
    searchTerms: ["mapa", "map", "upload"],
    icon: <Map size={18} />,
    command: ({ editor, range }) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (file) {
          try {
            const result = await uploadFileToS3(file, "legis/mapas");
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .setImage({ src: result.url })
              .run();
          } catch (err: any) {
            alert(err?.message || "Erro ao fazer upload da imagem do mapa.");
          }
        }
      };
      input.click();
    },
  },
  {
    title: "Arquivo / Anexo",
    description: "Enviar arquivo ou anexo para o repositório.",
    searchTerms: ["arquivo", "anexo", "upload", "file", "pdf"],
    icon: <Paperclip size={18} />,
    command: ({ editor, range }) => {
      const input = document.createElement("input");
      input.type = "file";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (file) {
          try {
            const result = await uploadFileToS3(file, "legis/anexos");
            if (isImageUrl(result.url || result.name)) {
              editor
                .chain()
                .focus()
                .deleteRange(range)
                .setImage({ src: result.url })
                .run();
            } else {
              editor
                .chain()
                .focus()
                .deleteRange(range)
                .setLink({ href: result.url })
                .insertContent(`📎 [Arquivo: ${result.name}]`)
                .run();
            }
          } catch (err: any) {
            alert(err?.message || "Erro ao fazer upload do arquivo.");
          }
        }
      };
      input.click();
    },
  },
]);
