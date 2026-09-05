import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Button,
  Input,
  Separator,
  Textarea,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Switch,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@open-urbis/map-ui";
import {
  ArrowLeft,
  Save,
  Loader2,
  Link as LinkIcon,
  Globe,
  Lock,
  ListTree,
  FileText,
  AlertCircle,
  CheckCircle2,
  ClipboardCopy,
  Check,
  HardDrive,
} from "lucide-react";
import { CreatePageDto, Page, PageType } from "../../types/page";
import { LegisEditor } from "../Editor/LegisEditor";
import { SimpleEditor } from "../Editor/SimpleEditor";
import { JSONContent, type Editor as TiptapEditor } from "@tiptap/core";
import { useAuth } from "@open-urbis/map-auth";
import { safeJSONParse } from "@/lib/content";
import {
  MAX_STORED_PAGE_BACKUPS,
  PAGE_BACKUP_STORAGE_KEY,
  readPageBackups,
  storePageBackup,
} from "@/lib/page-backup";
import { categoryService, Category } from "../../services/category-service";
import { ApiError } from "../../integrations/api-client";
import { toast } from "sonner";
import { RulesEngine } from "../../domain/rules-engine";
import { SpecialSituationsInspector as PropertiesPanel } from "../inspector/SpecialSituationsInspector";
import { InspectorHost } from "../inspector/InspectorHost";
import { InspectorTaskProvider } from "../inspector/inspector-task-context";
import { splitLineBreaksInFragment } from "../Editor/paste-line-breaks";
import {
  OriginalNormativo,
  NormativeElementEntity as NormativeElement,
  ColetaneaTematica,
  CollectionLink,
  ElementType,
} from "../../domain/entities";
import { NormativeMetadataForm } from "./NormativeMetadataForm";
import { UserChip } from "../common/UserChip";
import { InfoButton, InfoModal } from "../common/InfoModal";
import {
  DOCUMENT_TITLE_CLASS,
  DOCUMENT_TITLE_INPUT_RESET,
} from "./document-title";
import {
  DOMSerializer,
  Fragment,
  Node as ProseMirrorNode,
} from "@tiptap/pm/model";
import {
  validateNormativeStructure,
  ValidationIssue,
} from "../../domain/normative-validation";
import { htmlToPlainText, normalizeOrdinals } from "../../domain/text-utils";
import {
  buildExpandedTableData,
  SourceTableCell,
  SourceTableRow,
} from "../../domain/table-utils";
import {
  getFirstAutoStructureLine,
  registerHierarchicalNumericParent,
  resolveHierarchicalNumericParentId,
  shouldClearHierarchicalNumericParents,
} from "../../domain/auto-structure";
import { createEmptyValidity } from "../../domain/validity";
import { useElementAnchorFocus } from "../../hooks/use-element-anchor";

// Helper to extract links from content
const extractLinks = (content: JSONContent | undefined): CollectionLink[] => {
  if (!content) return [];
  const linksMap = new Map<string, CollectionLink>();

  const traverse = (node: JSONContent) => {
    if (node.type === "reference" && node.attrs) {
      const { pageId, elementId } = node.attrs;
      if (pageId) {
        if (!linksMap.has(pageId)) {
          linksMap.set(pageId, {
            resourceId: pageId,
            resourceType: "original_normativo",
            linkedElements: [],
          });
        }
        const link = linksMap.get(pageId)!;
        if (elementId && elementId !== "root") {
          if (!link.linkedElements?.find((e) => e.elementId === elementId)) {
            if (!link.linkedElements) link.linkedElements = [];
            link.linkedElements.push({ elementId });
          }
        }
      }
    }
    if (node.content) node.content.forEach(traverse);
  };

  if (content) traverse(content);
  return Array.from(linksMap.values());
};

// Helper to extract table data from a node
const extractTableDataFromNode = (
  node: ProseMirrorNode,
  serializer: DOMSerializer,
) => {
  const extractedRows: SourceTableRow[] = [];

  node.content.forEach(
    (row: ProseMirrorNode, _offset: number, rowIndex: number) => {
      const extractedCells: SourceTableCell[] = [];

      row.content.forEach((cell: ProseMirrorNode) => {
        const cellFragment = serializer.serializeFragment(cell.content);
        const tempDiv = document.createElement("div");
        tempDiv.appendChild(cellFragment);

        // Normalize ordinals in text nodes
        const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
        let textNode;
        while ((textNode = walker.nextNode()) !== null) {
          if (textNode.nodeValue) {
            textNode.nodeValue = normalizeOrdinals(textNode.nodeValue);
          }
        }

        const innerHtml = tempDiv.innerHTML || "";
        const cellSituations = cell.attrs.specialSituations ? [...cell.attrs.specialSituations] : [];
        if (
          !cellSituations.length &&
          (/<(s|strike)\b[^>]*>/i.test(innerHtml) ||
            /\(vetado\)/i.test(innerHtml))
        ) {
          cellSituations.push({
            type: /\(vetado\)/i.test(innerHtml) ? "Veto" : "Revogação",
            date: "",
          });
        }

        extractedCells.push({
          text: innerHtml,
          rowSpan: cell.attrs.rowspan || 1,
          colSpan: cell.attrs.colspan || 1,
          isHeader: cell.type.name === "tableHeader",
          specialSituations: cellSituations.length ? cellSituations : undefined,
        });
      });

      extractedRows.push({
        type:
          row.content.childCount > 0 &&
          row.content.content.every(
            (cell: ProseMirrorNode) => cell.type.name === "tableHeader",
          )
            ? "Cabeçalho"
            : rowIndex === 0
              ? "Cabeçalho"
              : "Corpo",
        cells: extractedCells,
      });
    },
  );

  return buildExpandedTableData(extractedRows);
};

const hasMeaningfulTextContent = (nodes?: JSONContent[]): boolean => {
  if (!nodes || nodes.length === 0) return false;

  return nodes.some((node): boolean => {
    if (!node) return false;

    if (node.type === "text") {
      return Boolean(node.text?.replace(/\u00a0/g, " ").trim());
    }

    if (node.type === "hardBreak") return false;

    if (node.content?.length) {
      return hasMeaningfulTextContent(node.content);
    }

    return false;
  });
};

const removeBlankTopLevelBlocks = (content?: JSONContent) => {
  if (!content?.content) {
    return { nextContent: content, changed: false };
  }

  const filteredContent = content.content.filter((node) => {
    if (!node) return false;

    if (node.type === "paragraph" || node.type === "heading") {
      return hasMeaningfulTextContent(node.content);
    }

    return true;
  });

  const changed = filteredContent.length !== content.content.length;

  return {
    nextContent: changed ? { ...content, content: filteredContent } : content,
    changed,
  };
};

const AUTO_STRUCTURE_PARSE_OPTIONS = {
  splitHardBreaks: true,
  collapseWhitespace: false,
};

const getAutoStructureParseText = (node: ProseMirrorNode): string => {
  const firstLine = splitLineBreaksInFragment(
    Fragment.from(node),
    AUTO_STRUCTURE_PARSE_OPTIONS,
  ).firstChild;

  return firstLine?.textContent || getFirstAutoStructureLine(node.textContent);
};
/**
 * Define a hierarquia de precedência para elementos legislativos/documentais.
 * * A chave representa o elemento atual e o array (value) contém todos os
 * elementos que podem atuar como "pais" ou "superiores" a ele.
 * * Exemplo: Um 'Artigo' pode estar dentro de uma 'Subseção', 'Seção', 'Capítulo', etc.
 */
const PARENT_HIERARCHY: Record<string, string[]> = {
  Parte: [],
  Livro: ["Parte"],
  Título: ["Livro", "Parte"],
  Capítulo: ["Título", "Livro", "Parte"],
  Seção: ["Capítulo", "Título", "Livro", "Parte"],
  Subseção: ["Seção"],
  Artigo: [
    "Subseção",
    "Seção",
    "Capítulo",
    "Título",
    "Livro",
    "Parte",
    "Anexo",
  ],
  Parágrafo: ["Artigo"],
  Inciso: ["Parágrafo", "Item", "Artigo"],
  Alínea: ["Inciso", "Parágrafo", "Artigo"],
  Item: ["Alínea", "Parágrafo", "Artigo"],
  Anexo: [],
  Tabela: [
    "Subseção",
    "Seção",
    "Capítulo",
    "Título",
    "Livro",
    "Parte",
    "Anexo",
  ],
  Figura: [
    "Subseção",
    "Seção",
    "Capítulo",
    "Título",
    "Livro",
    "Parte",
    "Anexo",
  ],
  Mapa: ["Subseção", "Seção", "Capítulo", "Título", "Livro", "Parte", "Anexo"],
  Nota: ["Tabela", "Anexo"],
  Texto: [],
  "Elemento desconforme": [],
  "Divisão desconforme": [],
};

/**
 * Define o "reset" de escopo para a numeração/contagem.
 * * A chave representa o elemento que, ao aparecer, reinicia a contagem dos
 * elementos listados no array (value).
 * * Exemplo: Ao iniciar uma nova 'Seção', a contagem de 'Subseção', 'Artigo' e 'Item'
 * geralmente deve recomeçar do 1 (dependendo da norma de redação).
 */
const SCOPE_RESETS: Record<string, string[]> = {
  Parte: [
    "Livro",
    "Título",
    "Capítulo",
    "Seção",
    "Subseção",
    "Artigo",
    "Parágrafo",
    "Inciso",
    "Alínea",
    "Item",
  ],
  Livro: [
    "Título",
    "Capítulo",
    "Seção",
    "Subseção",
    "Artigo",
    "Parágrafo",
    "Inciso",
    "Alínea",
    "Item",
  ],
  Título: [
    "Capítulo",
    "Seção",
    "Subseção",
    "Artigo",
    "Parágrafo",
    "Inciso",
    "Alínea",
    "Item",
  ],
  Capítulo: [
    "Seção",
    "Subseção",
    "Artigo",
    "Parágrafo",
    "Inciso",
    "Alínea",
    "Item",
  ],
  Seção: ["Subseção", "Artigo", "Parágrafo", "Inciso", "Alínea", "Item"],

  // Subseção agora só reseta Artigo para baixo (conforme sua hierarquia mais restrita)
  Subseção: ["Artigo", "Parágrafo", "Inciso", "Alínea", "Item"],

  // Artigo deve resetar tudo que pode estar dentro dele
  Artigo: ["Parágrafo", "Inciso", "Alínea", "Item"],

  // Parágrafo reseta Inciso, Alínea e Item (já que você permitiu Item ser filho de Parágrafo)
  Parágrafo: ["Inciso", "Alínea", "Item"],

  // Inciso reseta Alínea e Item
  Inciso: ["Alínea"],

  // ADICIONADO: Alínea precisa resetar Item, pois Item pode ser filho de Alínea
  Alínea: ["Item"],

  // Anexo reseta a estrutura interna
  Anexo: [
    "Artigo",
    "Parágrafo",
    "Inciso",
    "Alínea",
    "Item",
    "Seção",
    "Capítulo",
    "Subseção",
  ],
};

const COLETANEA_TYPES = [
  "Exigências",
  "Competências",
  "Definições",
  "Fontes de Informação",
];
const COLETANEA_CATEGORIES = [
  "Documentos e profissionais técnicos",
  "Documentos gerais",
  "Infraestrutura e obras públicas",
  "Urbanístico / parcelamento, uso e ocupação",
  "Edilício / obras e edificações",
  "Acessibilidade, salubridade e segurança",
  "Vegetação e áreas protegidas",
  "Preservação cultural",
];

interface PageFormProps {
  initialData?: Page;
  onSubmit: (data: CreatePageDto) => Promise<Page>;
  cancelLocation: string;
  loading?: boolean;
  title?: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

type SaveStepKey = "validating" | "syncing" | "persisting";

type SaveFeedbackState = {
  tone: "info" | "error" | "success";
  title: string;
  description: string;
};

const SAVE_STEPS: { key: SaveStepKey; label: string }[] = [
  {
    key: "validating",
    label: "Validando dados obrigatórios e estrutura normativa",
  },
  { key: "syncing", label: "Sincronizando conteúdo original do editor" },
  { key: "persisting", label: "Persistindo documento no servidor" },
];

type PendingNavigation = { kind: "route"; url: string } | { kind: "reload" };

const getCurrentRelativeUrl = () =>
  `${window.location.pathname}${window.location.search}${window.location.hash}`;

const normalizeRelativeUrl = (url: string | URL) => {
  const nextUrl = new URL(url.toString(), window.location.origin);
  return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
};

const normalizeTags = (tagsInput: string) =>
  tagsInput
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const formatBackupTimestamp = (isoDate: string) => {
  const parsed = new Date(isoDate);

  if (Number.isNaN(parsed.getTime())) return isoDate;

  return parsed.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  });
};

const buildFormSnapshot = ({
  title,
  type,
  author,
  tagsInput,
  categoryId,
  isPublic,
  sourceUrl,
  sourceType,
  content,
  normativeData,
  coletaneaData,
  structuredElements,
}: {
  title: string;
  type: PageType;
  author: string;
  tagsInput: string;
  categoryId: string;
  isPublic: boolean;
  sourceUrl: string;
  sourceType: "html" | "pdf" | "location";
  content: JSONContent | undefined;
  normativeData: Partial<OriginalNormativo>;
  coletaneaData: Partial<ColetaneaTematica>;
  structuredElements: NormativeElement[];
}) =>
  JSON.stringify({
    title: title.trim(),
    type,
    author: author.trim(),
    tags: normalizeTags(tagsInput),
    categoryId,
    isPublic,
    sourceUrl: sourceUrl.trim(),
    sourceType,
    content: content ?? null,
    normativeData: {
      ...normativeData,
      editorContent: undefined,
    },
    coletaneaData,
    structuredElements,
  });

export function PageForm({
  initialData,
  onSubmit,
  cancelLocation,
  loading = false,
  title: formTitle,
}: PageFormProps) {
  const auth = useAuth();
  const [location, setLocation] = useLocation();
  const [title, setTitle] = useState(initialData?.title || "");
  const [type, setType] = useState<PageType>(() => {
    if (!initialData) return "coletanea_tematica";
    return initialData.type === "page"
      ? "coletanea_tematica"
      : initialData.type === "normative"
        ? "original_normativo"
        : initialData.type;
  });

  /*
   * A autoria é vinculada ao usuário do sistema: em uma página nova crédito ao
   * usuário autenticado; ao editar, o autor original é preservado (inclusive
   * quando é conteúdo legado sem usuário vinculado) e quem edita fica
   * registrado em `updatedBy` pela API.
   */
  const [author, setAuthor] = useState(
    initialData?.author || auth.user?.profile.name || "",
  );
  const [authorId, setAuthorId] = useState<string | undefined>(
    initialData ? initialData.authorId : auth.user?.profile.sub,
  );
  const authorUser = initialData?.authorUser;
  const [tagsInput, setTagsInput] = useState(
    initialData?.tags?.join(", ") || "",
  );
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? false);
  const [sourceUrl, _setSourceUrl] = useState(initialData?.source?.url || "");
  const [sourceType, _setSourceType] = useState<"html" | "pdf" | "location">(
    initialData?.source?.type || "html",
  );
  const [content, setContent] = useState<JSONContent | undefined>(
    initialData?.content ? safeJSONParse(initialData.content) : undefined,
  );

  const [normativeData, setNormativeData] = useState<
    Partial<OriginalNormativo>
  >(() =>
    initialData?.type === "original_normativo" && initialData?.entity
      ? (initialData.entity as any)
      : {},
  );
  const [coletaneaData, setColetaneaData] = useState<
    Partial<ColetaneaTematica>
  >(() =>
    initialData?.type === "coletanea_tematica" && initialData?.entity
      ? (initialData.entity as any)
      : {},
  );

  useEffect(() => {
    if (!initialData && type === "coletanea_tematica") {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category");
      if (cat && COLETANEA_TYPES.includes(cat)) {
        setColetaneaData((prev) => ({ ...prev, collectionType: cat as any }));
      }
    }
  }, [initialData, type]);

  const [_categories, setCategories] = useState<Category[]>([]);
  const [editor, setEditor] = useState<TiptapEditor | null>(null);

  const [selectedElements, setSelectedElements] = useState<NormativeElement[]>(
    [],
  );
  const rulesEngine = useMemo(() => new RulesEngine(), []);
  const [structuredElements, setStructuredElements] = useState<
    NormativeElement[]
  >(() =>
    initialData?.type === "original_normativo" && initialData?.entity
      ? ((initialData.entity as any).elements || [])
      : [],
  );
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>(
    [],
  );
  const [saveConfirmationOpen, setSaveConfirmationOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [overwriteAutomation, setOverwriteAutomation] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSaveStep, setActiveSaveStep] = useState<SaveStepKey | null>(
    null,
  );
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedbackState | null>(
    null,
  );
  const [leavePromptOpen, setLeavePromptOpen] = useState(false);
  const [backupCopied, setBackupCopied] = useState(false);
  const [localBackupState, setLocalBackupState] = useState<{
    savedAt: string;
    storedCount: number;
  } | null>(null);
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation | null>(null);
  const [lastCommittedSnapshot, setLastCommittedSnapshot] = useState<
    string | null
  >(null);
  const saveToastIdRef = React.useRef<string | number | null>(null);
  const backupCopiedTimeoutRef = React.useRef<number | null>(null);
  const titleTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const hasInitializedSnapshotRef = React.useRef(false);
  const allowNavigationRef = React.useRef(false);
  const hasUnsavedChangesRef = React.useRef(false);
  const isSubmittingRef = React.useRef(false);
  const currentUrlRef = React.useRef(getCurrentRelativeUrl());

  const isNormative = type === "original_normativo";
  const isSubmitting = loading || isSaving;
  const blockingValidationIssues = useMemo(
    () => validationIssues.filter((issue) => issue.severity === "error"),
    [validationIssues],
  );
  const warningValidationIssues = useMemo(
    () => validationIssues.filter((issue) => issue.severity === "warning"),
    [validationIssues],
  );
  const hasNormativeAuthority = useMemo(() => {
    if (!isNormative) return true;

    return Boolean(normativeData.authorityId?.trim());
  }, [isNormative, normativeData.authorityId]);
  const hasNormativeType = useMemo(() => {
    if (!isNormative) return true;

    return Boolean(normativeData.normativeType?.trim());
  }, [isNormative, normativeData.normativeType]);
  const hasMinimumNormativeMetadata = useMemo(() => {
    if (!isNormative) return true;

    return Boolean(
      normativeData.number?.trim() ||
      normativeData.actDate?.trim() ||
      normativeData.publicationDate?.trim(),
    );
  }, [
    isNormative,
    normativeData.actDate,
    normativeData.number,
    normativeData.publicationDate,
  ]);
  const currentSnapshot = useMemo(
    () =>
      buildFormSnapshot({
        title,
        type,
        author,
        tagsInput,
        categoryId,
        isPublic,
        sourceUrl,
        sourceType,
        content,
        normativeData,
        coletaneaData,
        structuredElements,
      }),
    [
      author,
      categoryId,
      coletaneaData,
      content,
      isPublic,
      normativeData,
      sourceType,
      sourceUrl,
      structuredElements,
      tagsInput,
      title,
      type,
    ],
  );
  const hasUnsavedChanges =
    lastCommittedSnapshot !== null && currentSnapshot !== lastCommittedSnapshot;

  const resizeTitleTextarea = useCallback(() => {
    const textarea = titleTextareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  const getLastElementDescription = () => {
    const elements =
      structuredElements.length > 0
        ? structuredElements
        : normativeData.elements || [];
    if (elements.length === 0) return "Nenhum elemento";
    const idx = elements.findIndex((el) => el.type === "Anexo");
    const target =
      idx !== -1
        ? idx > 0
          ? elements[idx - 1]
          : elements[0]
        : elements[elements.length - 1];
    return target ? `${target.type} ${target.index || ""}`.trim() : "";
  };

  const performSync = useCallback(
    (
      editor: TiptapEditor,
      currentElements: NormativeElement[],
      options: { selectionOnly?: boolean; overwriteExisting?: boolean } = {},
    ) => {
      const blocks: any[] = [];
      const serializer = DOMSerializer.fromSchema(editor.schema);
      const { from, to } = editor.state.selection;
      const preserveExistingStructure = !options.overwriteExisting;

      editor.state.doc.descendants((node, pos, parent) => {
        // Só processamos nós de primeiro nível (filhos diretos do doc)
        if (parent?.type.name !== "doc") return true;

        // If selectionOnly is true, we only process nodes that are within the selection range
        // or already have a normativeId (to maintain full context)
        const isOutsideSelection =
          options.selectionOnly && (pos + node.nodeSize <= from || pos >= to);

        if (node.type.name === "paragraph" || node.type.name === "heading") {
          const text = node.textContent;
          if (text.trim()) {
            const fragment = serializer.serializeFragment(node.content);
            const tempDiv = document.createElement("div");
            tempDiv.appendChild(fragment);

            // Normalize ordinals in text nodes
            const walker = document.createTreeWalker(
              tempDiv,
              NodeFilter.SHOW_TEXT,
            );
            let textNode;
            while ((textNode = walker.nextNode()) !== null) {
              if (textNode.nodeValue) {
                textNode.nodeValue = normalizeOrdinals(textNode.nodeValue);
              }
            }

            blocks.push({
              text,
              parseText: getAutoStructureParseText(node),
              html: tempDiv.innerHTML,
              content: node.toJSON(),
              isTarget: !isOutsideSelection, // Mark if this block is a target for re-structuring
            });
          }
        } else if (node.type.name === "table") {
          // Reuse existing ID if available in editor attrs
          const tableId = node.attrs.normativeId || crypto.randomUUID();
          const tableData = extractTableDataFromNode(node, serializer);

          let tableTitle = "Tabela";
          let tableHtml = "Tabela";
          const lastBlock = blocks[blocks.length - 1];
          if (lastBlock && lastBlock.text.toLowerCase().includes("tabela")) {
            tableTitle = lastBlock.text;
            tableHtml = lastBlock.html;
          }

          blocks.push({
            text: tableTitle,
            html: tableHtml,
            content: {
              ...node.toJSON(),
              attrs: { ...node.attrs, normativeId: tableId },
            },
            type: "Tabela",
            tableData,
            isTarget: !isOutsideSelection,
          });
        } else if (node.type.name === "image") {
          const elementId = node.attrs.normativeId || crypto.randomUUID();

          // Smart Title detection for Image/Map
          let elementTitle = "Figura";
          let elementHtml = "Figura";
          let elementType: ElementType = "Figura";

          const lastBlock = blocks[blocks.length - 1];
          const isMapTitle =
            lastBlock && lastBlock.text.toLowerCase().includes("mapa");
          const isFigureTitle =
            lastBlock && lastBlock.text.toLowerCase().includes("figura");

          if (lastBlock && (isMapTitle || isFigureTitle)) {
            elementTitle = lastBlock.text;
            elementHtml = lastBlock.html;
            elementType = isMapTitle ? "Mapa" : "Figura";
          }

          const commonData = {
            text: elementTitle,
            html: elementHtml,
            content: {
              ...node.toJSON(),
              attrs: { ...node.attrs, normativeId: elementId },
            },
            type: elementType,
          };

          if (elementType === "Mapa") {
            blocks.push({
              ...commonData,
              mapData: {
                screen: {
                  url: node.attrs.src,
                  resolution: {
                    width: node.attrs.width,
                    height: node.attrs.height,
                  },
                },
                files: [],
              },
              isTarget: !isOutsideSelection,
            });
          } else {
            blocks.push({
              ...commonData,
              figureData: {
                url: node.attrs.src,
                resolution: {
                  width: node.attrs.width,
                  height: node.attrs.height,
                },
              },
              isTarget: !isOutsideSelection,
            });
          }
        }
        return false; // Não descer para filhos dos blocos de primeiro nível
      });

      const activeParents: Partial<Record<ElementType, string | undefined>> =
        {};
      const activeIndexedParents = new Map<string, string>();
      const usedIds = new Set<string>();

      const newElements: NormativeElement[] = blocks.map((block) => {
        const idFromEditor = block.content?.attrs?.normativeId as
          | string
          | undefined;
        let existing = currentElements.find((e) => e.id === idFromEditor);

        // Check if existing ID is already used (e.g. duplicate nodes in editor)
        if (existing && usedIds.has(existing.id)) {
          existing = undefined;
        }

        const parsed = rulesEngine.parseLine(
          block.parseText ?? getFirstAutoStructureLine(block.text),
        );

        // Priority: Block Type (Table/Figure/Map) > Parsed Type
        const detectedType = (block.type || parsed.type) as ElementType;
        const detectedIndex =
          block.type === "Tabela" ||
          block.type === "Figura" ||
          block.type === "Mapa"
            ? undefined
            : parsed.index;

        if (!existing && preserveExistingStructure) {
          // Se não achou pelo ID, tenta encontrar um elemento órfão (não vinculado a nenhum nó atual) que combine
          existing = currentElements.find(
            (e) =>
              !usedIds.has(e.id) &&
              e.type === detectedType &&
              e.index === detectedIndex &&
              (block.tableData ? true : e.text === block.html),
          );
        }

        const type = preserveExistingStructure
          ? existing?.type || detectedType
          : detectedType;
        const index = preserveExistingStructure
          ? existing?.index || detectedIndex
          : detectedIndex;

        const resetScope = (currentType: ElementType) => {
          const scopedTypes = SCOPE_RESETS[currentType] || [];
          for (const scopedType of scopedTypes) {
            activeParents[scopedType as ElementType] = undefined;
          }

          if (shouldClearHierarchicalNumericParents(currentType)) {
            activeIndexedParents.clear();
          }
        };

        // If it's NOT a target block and we have an ID from editor, we MUST stick to existing data
        if (!block.isTarget && existing) {
          const id = existing.id;

          resetScope(type);
          activeParents[type] = id;
          registerHierarchicalNumericParent(
            activeIndexedParents,
            type,
            index,
            id,
          );
          usedIds.add(id);

          return { ...existing, text: block.html };
        }

        let id = idFromEditor;
        // If idFromEditor is already used, or missing, try existing found by content, or generate new
        if (!id || usedIds.has(id)) {
          id = existing?.id || crypto.randomUUID();
        }
        // Ensure even the existing/random ID is not used (paranoid check)
        if (usedIds.has(id)) {
          id = crypto.randomUUID();
        }
        usedIds.add(id);

        resetScope(type);

        let parentId = preserveExistingStructure
          ? existing?.parentId
          : undefined;
        const hierarchicalParentId = resolveHierarchicalNumericParentId(
          type,
          index,
          activeIndexedParents,
        );

        if (hierarchicalParentId) {
          parentId = hierarchicalParentId;
        } else {
          const allowedParents = PARENT_HIERARCHY[type] || [];
          for (const parentType of allowedParents) {
            const activeParentId = activeParents[parentType as ElementType];
            if (activeParentId) {
              parentId = activeParentId;
              break;
            }
          }
        }

        activeParents[type] = id;
        registerHierarchicalNumericParent(
          activeIndexedParents,
          type,
          index,
          id,
        );

        return {
          id,
          type,
          index,
          text: block.html,
          parentId,
          originalStartValidity:
            existing?.originalStartValidity || createEmptyValidity(),
          specialSituations:
            existing?.specialSituations ||
            block.content?.attrs?.specialSituations ||
            [],
          tableData: block.tableData,
          figureData: block.figureData,
          mapData: block.mapData,
        };
      });

      // Only update states if changed to avoid infinite loops
      const elementsChanged =
        JSON.stringify(newElements) !== JSON.stringify(currentElements);
      if (elementsChanged) {
        setStructuredElements(newElements);
        setValidationIssues(validateNormativeStructure(newElements as any));
      }

      // Return the final blocks with their normative IDs to update the editor if necessary
      return { newElements, blocks, elementsChanged };
    },
    [rulesEngine],
  );

  const handleAutoStructure = () => {
    if (!editor) return;

    // If there's a selection, we only structure the selection
    const { from, to } = editor.state.selection;
    const selectionOnly = from !== to;

    const { newElements, blocks } = performSync(editor, structuredElements, {
      selectionOnly,
      overwriteExisting: overwriteAutomation,
    });

    // Update Editor Content with the IDs
    // We MUST preserve the node structure (marks, content) instead of raw HTML
    // Note: newElements and blocks are 1:1 mapped by index from blocks.map in performSync
    editor.commands.setContent({
      type: "doc",
      content: blocks.map((b, i) => {
        // IMPORTANT: The element at index 'i' in newElements corresponds to the block at index 'i'
        const elementId = newElements[i].id;

        return {
          ...b.content,
          attrs: { ...b.content.attrs, normativeId: elementId },
        };
      }),
    });

    // Restore selection
    try {
      editor.commands.setTextSelection({ from, to });
    } catch (e) {
      console.warn("Could not restore selection exactly", e);
    }

    toast.success(
      overwriteAutomation
        ? "Estrutura reprocessada com sobrescrita"
        : "Estrutura sincronizada",
    );
  };

  const syncNormativeContentBeforeSave = useCallback(() => {
    if (!editor || type !== "original_normativo") {
      return {
        syncedElements: structuredElements,
        syncedContent: content,
      };
    }

    const { from, to } = editor.state.selection;
    const { newElements, blocks } = performSync(editor, structuredElements, {
      selectionOnly: false,
      overwriteExisting: false,
    });

    editor.commands.setContent({
      type: "doc",
      content: blocks.map((block, index) => ({
        ...block.content,
        attrs: { ...block.content.attrs, normativeId: newElements[index].id },
      })),
    });

    try {
      editor.commands.setTextSelection({ from, to });
    } catch (error) {
      console.warn(
        "Could not restore selection exactly after save sync",
        error,
      );
    }

    const syncedContent = editor.getJSON();
    setContent(syncedContent);

    return {
      syncedElements: newElements,
      syncedContent,
    };
  }, [content, editor, performSync, structuredElements, type]);

  const handleAutoFormat = useCallback(() => {
    if (!editor) return;

    if (!overwriteAutomation) {
      toast.info(
        "Marque “Sobrescrever ao aplicar” para atualizar o conteúdo do editor.",
      );
      return;
    }

    const { from, to } = editor.state.selection;

    // Documents saved before the paste normalization may still carry literal
    // line breaks inside a single block (and therefore a single element).
    // `<br>`/hardBreak is left alone on purpose: it is how "unir elementos"
    // (Shift+Enter) represents an intentional line break inside one element.
    const splitFragment = splitLineBreaksInFragment(editor.state.doc.content, {
      splitHardBreaks: false,
      collapseWhitespace: false,
    });
    const lineBreaksChanged = splitFragment !== editor.state.doc.content;
    const currentContent = lineBreaksChanged
      ? editor.state.doc.copy(splitFragment).toJSON()
      : editor.getJSON();

    const { nextContent, changed: blankLinesChanged } =
      removeBlankTopLevelBlocks(currentContent);

    if (!nextContent || (!blankLinesChanged && !lineBreaksChanged)) {
      toast.info("Nenhuma linha em branco foi encontrada para formatar.");
      return;
    }

    editor.commands.setContent(nextContent);
    setContent(nextContent);

    try {
      const maxPosition = Math.max(1, editor.state.doc.nodeSize - 2);
      editor.commands.setTextSelection({
        from: Math.min(from, maxPosition),
        to: Math.min(to, maxPosition),
      });
    } catch (e) {
      console.warn("Could not restore selection exactly after auto-format", e);
    }

    toast.success(
      lineBreaksChanged
        ? "Conteúdo formatado: quebras de linha separadas em blocos e linhas em branco removidas."
        : "Conteúdo formatado: linhas em branco removidas.",
    );
  }, [editor, overwriteAutomation]);

  useEffect(() => {
    categoryService.getAll().then(setCategories);
  }, []);

  useEffect(() => {
    if (editor && type === "original_normativo") {
      const handler = () => {
        const selection: any = editor.state.selection;
        const { from, to, $from, $to } = selection;
        const selected: NormativeElement[] = [];
        const selectedIds = new Set<string>();

        const pushSelectedById = (id: string | null) => {
          if (!id || selectedIds.has(id)) return;

          const el = structuredElements.find((element) => element.id === id);
          if (!el) return;

          selectedIds.add(id);
          selected.push(el);
        };

        const findNormativeId = (pos: any) => {
          for (let i = pos.depth; i >= 0; i--) {
            const node = pos.node(i);
            if (node.attrs?.normativeId) return node.attrs.normativeId;
          }
          return null;
        };

        // 1. Node selections (e.g. clicking an image) keep the selected node
        // outside of the $from/$to ancestor walk, so we must inspect it directly.
        const directlySelectedNodeId =
          selection.node?.attrs?.normativeId ||
          editor.state.doc.nodeAt(from)?.attrs?.normativeId ||
          null;

        pushSelectedById(directlySelectedNodeId);

        // 2. Check start and end of selection for parent normativeId
        const startId = findNormativeId($from);
        const endId = findNormativeId($to);

        pushSelectedById(startId);
        pushSelectedById(endId);

        // 3. Also collect every normative block touched by the current selection.
        // This is important for bulk actions, otherwise only the first/last element
        // in the range receive the update and middle elements are skipped.
        editor.state.doc.nodesBetween(from, to, (node) => {
          if (node.attrs?.normativeId) {
            pushSelectedById(node.attrs.normativeId);
          }
        });

        setSelectedElements(selected);
      };
      editor.on("selectionUpdate", handler);

      // Sincronização leve de texto em tempo real
      const textUpdateHandler = () => {
        const serializer = DOMSerializer.fromSchema(editor.schema);
        const updates: Record<string, any> = {};

        editor.state.doc.descendants((node) => {
          if (node.attrs?.normativeId) {
            if (node.type.name === "table") {
              const tableData = extractTableDataFromNode(node, serializer);
              updates[node.attrs.normativeId] = {
                type: "table",
                data: tableData,
              };
            } else {
              const fragment = serializer.serializeFragment(node.content);
              const tempDiv = document.createElement("div");
              tempDiv.appendChild(fragment);
              updates[node.attrs.normativeId] = {
                type: "text",
                content: tempDiv.innerHTML,
              };
            }
          }
          return node.isBlock;
        });

        if (Object.keys(updates).length > 0) {
          setStructuredElements((prev) => {
            let hasChanged = false;
            const next = prev.map((el) => {
              const update = updates[el.id];
              if (!update) return el;

              if (update.type === "table") {
                if (
                  JSON.stringify(el.tableData) !== JSON.stringify(update.data)
                ) {
                  hasChanged = true;
                  return { ...el, tableData: update.data };
                }
              } else if (update.type === "text") {
                if (el.text !== update.content) {
                  hasChanged = true;
                  return { ...el, text: update.content };
                }
              }
              return el;
            });
            return hasChanged ? next : prev;
          });
        }
      };
      editor.on("update", textUpdateHandler);

      return () => {
        editor.off("selectionUpdate", handler);
        editor.off("update", textUpdateHandler);
      };
    }
  }, [editor, type, structuredElements]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setAuthor(initialData.author);
      setAuthorId(initialData.authorId);
      setTagsInput(initialData.tags?.join(", ") || "");
      setCategoryId(initialData.categoryId || "");
      setIsPublic(initialData.isPublic ?? false);
      if (initialData.entity) {
        if (initialData.type === "original_normativo") {
          setNormativeData(initialData.entity as any);
          setStructuredElements((initialData.entity as any).elements || []);
        } else {
          setColetaneaData(initialData.entity as any);
        }
      }
    }
  }, [initialData]);

  useEffect(() => {
    resizeTitleTextarea();
  }, [resizeTitleTextarea, title]);

  /*
      Ao entrar em `/pages/:id/edit#el-<id>` — do botão "Editar" da leitura ou de um
      link colado — a edição começa no mesmo dispositivo. O alvo é o bloco do
      ProseMirror (`data-normative-id`), que só existe depois de o editor montar.
    */
  useElementAnchorFocus(!!editor, initialData?.id);

  useEffect(() => {
    const normativeReady =
      !initialData || !isNormative || Object.keys(normativeData).length > 0;
    const coletaneaReady =
      !initialData || isNormative || Object.keys(coletaneaData).length > 0;

    if (
      !normativeReady ||
      !coletaneaReady ||
      hasInitializedSnapshotRef.current
    ) {
      return;
    }

    setLastCommittedSnapshot(currentSnapshot);
    hasInitializedSnapshotRef.current = true;
  }, [coletaneaData, currentSnapshot, initialData, isNormative, normativeData]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    if (!allowNavigationRef.current) {
      currentUrlRef.current = getCurrentRelativeUrl();
    }
  }, [location]);

  const proceedWithNavigation = useCallback(
    (navigation: PendingNavigation | null) => {
      if (!navigation) return;

      allowNavigationRef.current = true;
      setLeavePromptOpen(false);
      setPendingNavigation(null);

      if (navigation.kind === "route") {
        setLocation(navigation.url);
      } else {
        window.location.reload();
      }

      window.setTimeout(() => {
        allowNavigationRef.current = false;
      }, 0);
    },
    [setLocation],
  );

  const requestNavigation = useCallback(
    (navigation: PendingNavigation) => {
      if (allowNavigationRef.current) {
        proceedWithNavigation(navigation);
        return;
      }

      if (isSubmittingRef.current) {
        return;
      }

      if (!hasUnsavedChangesRef.current) {
        proceedWithNavigation(navigation);
        return;
      }

      setPendingNavigation(navigation);
      setLeavePromptOpen(true);
    },
    [proceedWithNavigation],
  );

  const updateSavingProgress = useCallback(
    (step: SaveStepKey, description: string) => {
      setActiveSaveStep(step);
      setSaveFeedback({
        tone: "info",
        title: "Salvando documento",
        description,
      });

      if (saveToastIdRef.current) {
        toast.loading(description, { id: saveToastIdRef.current });
        return;
      }

      saveToastIdRef.current = toast.loading(description);
    },
    [],
  );

  const reportSaveError = useCallback((message: string) => {
    setSaveError(message);
    setSaveFeedback({
      tone: "error",
      title: "Não foi possível salvar",
      description: message,
    });

    if (saveToastIdRef.current) {
      toast.error(message, { id: saveToastIdRef.current });
      return;
    }

    toast.error(message);
  }, []);

  const clearSaveFeedback = useCallback(() => {
    setSaveError(null);
    setSaveFeedback(null);
    setActiveSaveStep(null);
    saveToastIdRef.current = null;
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChangesRef.current || allowNavigationRef.current) {
        return undefined;
      }

      event.preventDefault();
      event.returnValue = "Há alterações não salvas.";
      return event.returnValue;
    };

    const handleReloadShortcut = (event: KeyboardEvent) => {
      const isReloadShortcut =
        event.key === "F5" ||
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r");

      if (
        !isReloadShortcut ||
        !hasUnsavedChangesRef.current ||
        allowNavigationRef.current ||
        isSubmittingRef.current
      ) {
        return;
      }

      event.preventDefault();
      setPendingNavigation({ kind: "reload" });
      setLeavePromptOpen(true);
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !hasUnsavedChangesRef.current ||
        allowNavigationRef.current ||
        isSubmittingRef.current
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (!anchor.href || anchor.href.startsWith("javascript:")) return;

      const nextUrl = new URL(anchor.href, window.location.origin);

      if (nextUrl.origin !== window.location.origin) {
        return;
      }

      const normalizedTarget = normalizeRelativeUrl(nextUrl.toString());
      if (normalizedTarget === getCurrentRelativeUrl()) {
        return;
      }

      event.preventDefault();
      setPendingNavigation({ kind: "route", url: normalizedTarget });
      setLeavePromptOpen(true);
    };

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(
      window.history,
    );

    const interceptHistoryNavigation = (
      method: typeof originalPushState,
      state: unknown,
      unused: string,
      url?: string | URL | null,
    ) => {
      if (
        allowNavigationRef.current ||
        !hasUnsavedChangesRef.current ||
        isSubmittingRef.current ||
        !url
      ) {
        method(state, unused, url);
        return;
      }

      const normalizedTarget = normalizeRelativeUrl(url);
      if (normalizedTarget === getCurrentRelativeUrl()) {
        method(state, unused, url);
        return;
      }

      setPendingNavigation({ kind: "route", url: normalizedTarget });
      setLeavePromptOpen(true);
    };

    window.history.pushState = function (state, unused, url) {
      interceptHistoryNavigation(originalPushState, state, unused, url);
    } as History["pushState"];

    window.history.replaceState = function (state, unused, url) {
      interceptHistoryNavigation(originalReplaceState, state, unused, url);
    } as History["replaceState"];

    const handlePopState = () => {
      if (
        allowNavigationRef.current ||
        !hasUnsavedChangesRef.current ||
        isSubmittingRef.current
      ) {
        currentUrlRef.current = getCurrentRelativeUrl();
        return;
      }

      const attemptedUrl = getCurrentRelativeUrl();
      if (attemptedUrl === currentUrlRef.current) {
        return;
      }

      originalPushState(window.history.state, "", currentUrlRef.current);
      setPendingNavigation({ kind: "route", url: attemptedUrl });
      setLeavePromptOpen(true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", handleReloadShortcut, true);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleReloadShortcut, true);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleDocumentClick, true);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  useEffect(
    () => () => {
      if (backupCopiedTimeoutRef.current !== null) {
        window.clearTimeout(backupCopiedTimeoutRef.current);
      }
    },
    [],
  );

  /* Surface backups from a previous session so the user knows a copy survived. */
  useEffect(() => {
    const currentPageId = initialData?.id ?? null;
    const backups = readPageBackups();
    const latestForThisPage = backups.find(
      (entry) => entry.pageId === currentPageId,
    );

    if (latestForThisPage) {
      setLocalBackupState({
        savedAt: latestForThisPage.savedAt,
        storedCount: backups.length,
      });
    }
  }, [initialData?.id]);

  /**
   * Snapshot of everything the form would send to the API, plus the raw editor
   * state. Serves as a manual safety net whenever a save cannot be persisted.
   */
  const buildBackupPayload = useCallback(() => {
    const trimmedTitle = title.trim();
    const { name: _legacyName, ...normativePayload } = normativeData;
    const serializedContent = content ? JSON.stringify(content) : null;

    const entityData =
      type === "original_normativo"
        ? {
            ...normativePayload,
            ementa: normativePayload.ementa?.trim() || trimmedTitle,
            editorContent: serializedContent,
            elements: structuredElements,
          }
        : {
            ...coletaneaData,
            title: trimmedTitle,
            links: extractLinks(content),
          };

    return {
      backupVersion: 1,
      generatedAt: new Date().toISOString(),
      origin: "legis:page-form",
      pageId: initialData?.id ?? null,
      document: {
        title: trimmedTitle,
        type,
        author: author.trim(),
        tags: normalizeTags(tagsInput),
        categoryId: categoryId || null,
        isPublic,
        source: sourceUrl.trim()
          ? { url: sourceUrl.trim(), type: sourceType }
          : null,
        content: serializedContent,
        entityData,
      },
      editorContent: content ?? null,
      structuredElements,
      validationIssues,
      lastSaveError: saveError,
    };
  }, [
    author,
    categoryId,
    coletaneaData,
    content,
    initialData?.id,
    isPublic,
    normativeData,
    saveError,
    sourceType,
    sourceUrl,
    structuredElements,
    tagsInput,
    title,
    type,
    validationIssues,
  ]);

  const handleCopyBackup = useCallback(async () => {
    const payload = buildBackupPayload();
    const serializedBackup = JSON.stringify(payload, null, 2);

    const localBackup = storePageBackup(payload, {
      label: payload.document.title || "Documento sem título",
    });

    if (localBackup.status === "stored") {
      setLocalBackupState({
        savedAt: localBackup.entry.savedAt,
        storedCount: localBackup.storedCount,
      });
    } else {
      setLocalBackupState(null);
    }

    const localBackupMessage =
      localBackup.status === "stored"
        ? `Também guardamos uma cópia neste navegador (${localBackup.storedCount} de ${MAX_STORED_PAGE_BACKUPS}) para recuperação técnica.`
        : `Não foi possível guardar a cópia local: ${localBackup.reason}`;

    const downloadBackup = () => {
      const blob = new Blob([serializedBackup], { type: "application/json" });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

      link.href = objectUrl;
      link.download = `legis-backup-${initialData?.id ?? "novo-documento"}-${timestamp}.json`;
      link.click();
      URL.revokeObjectURL(objectUrl);
    };

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Área de transferência indisponível neste navegador.");
      }

      await navigator.clipboard.writeText(serializedBackup);
      setBackupCopied(true);

      if (localBackup.status === "stored") {
        toast.success("Backup copiado para a área de transferência.", {
          description: localBackupMessage,
        });
      } else {
        toast.warning("Backup copiado, mas sem cópia local.", {
          description: localBackupMessage,
        });
      }

      if (backupCopiedTimeoutRef.current !== null) {
        window.clearTimeout(backupCopiedTimeoutRef.current);
      }
      backupCopiedTimeoutRef.current = window.setTimeout(
        () => setBackupCopied(false),
        2500,
      );
    } catch {
      downloadBackup();
      toast.message(
        "Não foi possível copiar. Baixamos o backup como arquivo JSON.",
        {
          description: localBackupMessage,
        },
      );
    }
  }, [buildBackupPayload, initialData?.id]);

  const executeSave = useCallback(
    async (options?: { navigateAfterSave?: boolean }) => {
      const navigateAfterSave = options?.navigateAfterSave ?? true;
      const trimmedTitle = title.trim();

      if (!trimmedTitle) {
        const message = "Informe um título antes de salvar.";
        reportSaveError(message);
        return null;
      }

      if (type === "coletanea_tematica") {
        const hasDescription = Boolean(
          coletaneaData.shortDescription &&
            htmlToPlainText(coletaneaData.shortDescription).trim(),
        );
        const hasContent = Boolean(
          content &&
            content.content &&
            hasMeaningfulTextContent(content.content),
        );

        if (!hasDescription && !hasContent) {
          const message =
            "Preencha a Descrição resumida ou adicione algum conteúdo antes de salvar a coletânea.";
          reportSaveError(message);
          return null;
        }
      } else if (!content && type !== "original_normativo") {
        const message = "Adicione algum conteúdo antes de salvar.";
        reportSaveError(message);
        return null;
      }

      if (isNormative && !hasNormativeType) {
        const message =
          "O campo Tipo normativo é obrigatório. Selecione um tipo normativo antes de salvar o original normativo.";
        reportSaveError(message);
        return null;
      }

      if (isNormative && !hasMinimumNormativeMetadata) {
        const message =
          "Preencha pelo menos um dos campos Número, Data do ato ou Data de publicação antes de salvar o original normativo.";
        reportSaveError(message);
        return null;
      }

      if (isNormative && !hasNormativeAuthority) {
        const message =
          "Selecione uma autoridade antes de salvar o original normativo.";
        reportSaveError(message);
        return null;
      }

      if (blockingValidationIssues.length > 0) {
        const message = `Existem ${blockingValidationIssues.length} inconsistência(s) bloqueante(s) na estrutura normativa. Corrija antes de salvar.`;
        reportSaveError(message);
        return null;
      }

      clearSaveFeedback();
      setIsSaving(true);

      try {
        updateSavingProgress(
          "validating",
          "Validando informações obrigatórias do documento...",
        );

        const { syncedElements, syncedContent } =
          syncNormativeContentBeforeSave();
        const contentToSave = syncedContent ?? content;

        if (type === "original_normativo") {
          updateSavingProgress(
            "syncing",
            "Sincronizando estrutura e conteúdo original do normativo...",
          );

          const nextValidationIssues = validateNormativeStructure(
            syncedElements as any,
          );
          setValidationIssues(nextValidationIssues);

          const nextBlockingIssues = nextValidationIssues.filter(
            (issue) => issue.severity === "error",
          );

          if (nextBlockingIssues.length > 0) {
            throw new Error(
              `Existem ${nextBlockingIssues.length} inconsistência(s) bloqueante(s) na estrutura normativa. Corrija antes de salvar.`,
            );
          }
        }

        const finalContentToSave =
          contentToSave ??
          (type === "coletanea_tematica"
            ? { type: "doc", content: [] }
            : null);

        if (!finalContentToSave) {
          throw new Error("Adicione algum conteúdo antes de salvar.");
        }

        updateSavingProgress(
          "persisting",
          "Persistindo documento e metadados no servidor...",
        );

        const serializedContent = JSON.stringify(finalContentToSave);
        const resolvedNormativeName = normativeData.name?.trim() || trimmedTitle;
        const entityData =
          type === "original_normativo"
            ? {
                ...normativeData,
                title: trimmedTitle,
                name: resolvedNormativeName,
                editorContent: serializedContent,
                elements: syncedElements,
              }
            : {
                ...coletaneaData,
                title: trimmedTitle,
                links: extractLinks(finalContentToSave),
              };

        const savedPage = await onSubmit({
          title: trimmedTitle,
          type,
          author,
          authorId,
          tags: normalizeTags(tagsInput),
          categoryId,
          isPublic,
          source: sourceUrl.trim()
            ? {
                url: sourceUrl.trim(),
                type: sourceType,
              }
            : undefined,
          content: serializedContent,
          entityData: entityData as any,
        });

        setLastCommittedSnapshot(
          buildFormSnapshot({
            title: trimmedTitle,
            type,
            author,
            tagsInput,
            categoryId,
            isPublic,
            sourceUrl,
            sourceType,
            content: contentToSave,
            normativeData:
              type === "original_normativo"
                ? (entityData as Partial<OriginalNormativo>)
                : normativeData,
            coletaneaData:
              type === "coletanea_tematica"
                ? (entityData as Partial<ColetaneaTematica>)
                : coletaneaData,
            structuredElements: syncedElements,
          }),
        );

        setSaveFeedback({
          tone: "success",
          title: "Documento salvo com sucesso",
          description:
            "O conteúdo original normativo e os metadados foram persistidos.",
        });
        toast.success("Documento salvo com sucesso.", {
          id: saveToastIdRef.current ?? undefined,
        });
        setSaveConfirmationOpen(false);
        if (navigateAfterSave) {
          proceedWithNavigation({
            kind: "route",
            url: `/pages/${savedPage.id}`,
          });
        }
        return savedPage;
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Não foi possível salvar o documento. Revise os dados e tente novamente.",
        );
        reportSaveError(message);
        return null;
      } finally {
        saveToastIdRef.current = null;
        setIsSaving(false);
      }
    },
    [
      author,
      authorId,
      blockingValidationIssues.length,
      categoryId,
      clearSaveFeedback,
      coletaneaData,
      content,
      hasNormativeAuthority,
      hasNormativeType,
      hasMinimumNormativeMetadata,
      isNormative,
      isPublic,
      normativeData,
      onSubmit,
      proceedWithNavigation,
      reportSaveError,
      sourceType,
      sourceUrl,
      syncNormativeContentBeforeSave,
      tagsInput,
      title,
      type,
      updateSavingProgress,
    ],
  );

  const handleSaveBeforeLeaving = useCallback(async () => {
    const nextNavigation = pendingNavigation;
    const savedPage = await executeSave({ navigateAfterSave: false });

    if (savedPage) {
      proceedWithNavigation(nextNavigation);
    }
  }, [executeSave, pendingNavigation, proceedWithNavigation]);

  /* Tone lives in the text and the rule, not in a filled panel. */
  const saveFeedbackStyles =
    saveFeedback?.tone === "error"
      ? "border-destructive text-destructive"
      : saveFeedback?.tone === "success"
        ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
        : "border-border text-foreground";

  const localBackupNotice = localBackupState && (
    <div className="flex items-start gap-2 border-l-2 border-border pl-3 text-xs text-muted-foreground">
      <HardDrive className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span className="min-w-0 break-words">
        Cópia de segurança gravada neste navegador em{" "}
        <strong className="font-medium text-foreground">
          {formatBackupTimestamp(localBackupState.savedAt)}
        </strong>{" "}
        ({localBackupState.storedCount} de {MAX_STORED_PAGE_BACKUPS} cópias
        mantidas). Nada foi perdido: um técnico pode recuperar o documento em{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono">
          localStorage &rarr; {PAGE_BACKUP_STORAGE_KEY}
        </code>
        . Evite limpar os dados do navegador até a recuperação.
      </span>
    </div>
  );

  const getSaveStepState = (step: SaveStepKey) => {
    if (!activeSaveStep) return "pending" as const;

    const currentStepIndex = SAVE_STEPS.findIndex(
      ({ key }) => key === activeSaveStep,
    );
    const stepIndex = SAVE_STEPS.findIndex(({ key }) => key === step);

    if (currentStepIndex === -1 || stepIndex === -1) return "pending" as const;
    if (saveFeedback?.tone === "success") return "done" as const;
    if (saveFeedback?.tone === "error" && stepIndex === currentStepIndex)
      return "error" as const;
    if (stepIndex < currentStepIndex) return "done" as const;
    if (stepIndex === currentStepIndex && isSaving) return "active" as const;

    return "pending" as const;
  };

  return (
    <InspectorTaskProvider>
      <div className="flex flex-col h-[calc(100svh-var(--header-height))] bg-background">
        {/*
              `shrink-0` keeps the action bar at its intrinsic height: it is a flex item
              of a fixed-height column, so a tall document must never be allowed to
              squeeze it (and the save button) out of view.
            */}
        <div className="sticky top-0 z-40 flex w-full shrink-0 items-center justify-between border-b bg-background/80 px-4 py-2 backdrop-blur-sm">
          <div
            className="flex items-center gap-3 text-muted-foreground cursor-pointer hover:text-foreground"
            onClick={() =>
              requestNavigation({ kind: "route", url: cancelLocation })
            }
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">{formTitle || "Documento"}</span>
          </div>
          <div className="flex items-center gap-1">
            <InfoButton
              onClick={() => setInfoModalOpen(true)}
              title="Guia do Editor do Legis"
            />
            {isNormative && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAutoFormat}
                  className="gap-2 font-normal"
                >
                  <FileText className="h-4 w-4" /> Auto-formatar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAutoStructure}
                  className="gap-2 font-normal"
                >
                  <ListTree className="h-4 w-4" /> Auto-estruturar
                </Button>
                <div className="ml-1 flex items-center gap-2 border-l pl-3">
                  <Checkbox
                    id="overwrite-automation"
                    checked={overwriteAutomation}
                    onCheckedChange={(checked) =>
                      setOverwriteAutomation(checked === true)
                    }
                  />
                  <Label
                    htmlFor="overwrite-automation"
                    className="cursor-pointer text-xs font-normal text-muted-foreground"
                  >
                    Sobrescrever ao aplicar
                  </Label>
                </div>
              </>
            )}
            <Button
              onClick={() => {
                clearSaveFeedback();
                setSaveConfirmationOpen(true);
              }}
              variant="outline"
              size="sm"
              className="ml-2 gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}{" "}
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto min-w-0">
            {/*
                      The inspector changes width per mode. Centring the column would
                      shift the text sideways every time it expands, which is hostile
                      while the reader is aiming at words to mark a passage.

                      The left inset is kept equal to the reader's (`px-4` here plus
                      the editor's own `pl-8`), so a device sits at the same place on
                      both screens.
                    */}
            <div
              className={cn(
                "container max-w-4xl px-4 py-6 space-y-6",
                isNormative ? "mr-auto ml-0" : "mx-auto",
              )}
            >
              {saveFeedback && (
                <div
                  className={`flex items-start gap-3 border-l-2 pl-3 ${saveFeedbackStyles}`}
                  role="status"
                  aria-live="polite"
                >
                  {saveFeedback.tone === "error" ? (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : saveFeedback.tone === "success" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                  )}

                  <div className="space-y-1">
                    <p className="text-sm font-medium">{saveFeedback.title}</p>
                    <p className="text-sm opacity-90">
                      {saveFeedback.description}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Textarea
                  ref={titleTextareaRef}
                  placeholder="Título"
                  aria-label="Título do documento"
                  className={cn(
                    DOCUMENT_TITLE_CLASS,
                    DOCUMENT_TITLE_INPUT_RESET,
                  )}
                  rows={1}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Título exibido no cadastro, pesquisa e visualização do
                  documento.
                </p>

                {/*
                              The type is fixed once the document exists, so on an
                              edit these read as a plain statement instead of a
                              choice that cannot be made.
                            */}
                <div
                  className="flex items-center gap-2 text-xs"
                  role="group"
                  aria-label="Tipo de documento"
                >
                  <button
                    type="button"
                    onClick={() =>
                      !initialData && setType("coletanea_tematica")
                    }
                    disabled={!!initialData}
                    aria-pressed={type === "coletanea_tematica"}
                    className={cn(
                      "border-b pb-0.5 transition-colors",
                      type === "coletanea_tematica"
                        ? "border-foreground text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                      !!initialData &&
                        "cursor-not-allowed hover:text-muted-foreground",
                    )}
                  >
                    Coletânea Temática
                  </button>
                  <span aria-hidden="true" className="text-muted-foreground/40">
                    ·
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      !initialData && setType("original_normativo")
                    }
                    disabled={!!initialData}
                    aria-pressed={type === "original_normativo"}
                    className={cn(
                      "border-b pb-0.5 transition-colors",
                      type === "original_normativo"
                        ? "border-foreground text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                      !!initialData &&
                        "cursor-not-allowed hover:text-muted-foreground",
                    )}
                  >
                    Original Normativo
                  </button>
                </div>

                <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-sm">
                      {isPublic ? (
                        <Globe className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                      <span>
                        {isPublic ? "Página pública" : "Página privada"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isPublic
                        ? "Disponível para visualização pública."
                        : "Visível apenas para usuários com acesso autorizado."}
                    </p>
                  </div>

                  <Switch
                    id="page-visibility"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                    className="self-start sm:self-center"
                    aria-label="Alternar visibilidade da página"
                  />
                </div>

                <div className="space-y-1 border-t pt-4">
                  <div className="text-xs font-medium text-muted-foreground">
                    Autoria
                  </div>
                  <UserChip user={authorUser} fallbackLabel={author} />
                  <p className="text-xs text-muted-foreground">
                    {initialData
                      ? "Autoria preservada do registro original. Sua edição fica registrada no histórico da página."
                      : "A página será creditada à sua conta."}
                  </p>
                </div>

                {type === "original_normativo" ? (
                  <NormativeMetadataForm
                    data={normativeData}
                    onChange={setNormativeData}
                  />
                ) : (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-medium">Ficha da coletânea</h3>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="coletanea-type" className="font-normal">
                          Tipo
                          <span aria-hidden="true" className="text-destructive">
                            {" "}
                            *
                          </span>
                        </Label>
                        <Select
                          value={coletaneaData.collectionType}
                          onValueChange={(v) =>
                            setColetaneaData({
                              ...coletaneaData,
                              collectionType: v as any,
                            })
                          }
                        >
                          <SelectTrigger
                            id="coletanea-type"
                            aria-required="true"
                            className="h-8 text-xs"
                          >
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {COLETANEA_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="coletanea-category"
                          className="font-normal"
                        >
                          Categoria
                          <span aria-hidden="true" className="text-destructive">
                            {" "}
                            *
                          </span>
                        </Label>
                        <Select
                          value={coletaneaData.category}
                          onValueChange={(v) =>
                            setColetaneaData({
                              ...coletaneaData,
                              category: v as any,
                            })
                          }
                        >
                          <SelectTrigger
                            id="coletanea-category"
                            aria-required="true"
                            className="h-8 text-xs"
                          >
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {COLETANEA_CATEGORIES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="coletanea-theme"
                          className="font-normal"
                        >
                          Tema
                          <span aria-hidden="true" className="text-destructive">
                            {" "}
                            *
                          </span>
                        </Label>
                        <Input
                          id="coletanea-theme"
                          aria-required="true"
                          value={coletaneaData.theme || ""}
                          onChange={(e) =>
                            setColetaneaData({
                              ...coletaneaData,
                              theme: e.target.value as any,
                            })
                          }
                          className="h-8 text-xs"
                          placeholder="Ex: Legitimidade"
                        />
                      </div>

                      {/* Derived from the content, so it reports rather than asks. */}
                      <div className="space-y-1.5">
                        <Label className="font-normal">Vínculos</Label>
                        <p className="flex h-8 items-center gap-2 text-xs text-muted-foreground">
                          <LinkIcon className="h-3 w-3" />
                          {extractLinks(content).length} vínculos identificados
                          no conteúdo
                        </p>
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <Label
                          htmlFor="coletanea-short-description"
                          className="font-normal"
                        >
                          Descrição resumida
                        </Label>
                        <SimpleEditor
                          key={
                            initialData?.id
                              ? `coletanea-desc-${initialData.id}`
                              : "coletanea-desc-new"
                          }
                          initialContent={coletaneaData.shortDescription || ""}
                          onChange={(content) =>
                            setColetaneaData((prev) => ({
                              ...prev,
                              shortDescription: content,
                            }))
                          }
                          placeholder="Resumo em linguagem simples..."
                          outputFormat="html"
                        />
                        <p className="text-xs text-muted-foreground">
                          Aparece na busca e na listagem de coletâneas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="min-h-[500px]">
                <LegisEditor
                  initialContent={content}
                  onChange={setContent}
                  onEditorReady={setEditor}
                  isNormative={isNormative}
                  localElements={structuredElements}
                />
              </div>
            </div>
          </div>

          <InspectorHost editor={editor}>
            {isNormative && (
              <PropertiesPanel
                editor={editor}
                selectedElements={selectedElements}
                allElements={structuredElements}
                documentValidityDate={normativeData.actDate || normativeData.publicationDate || normativeData.originalStartValidity?.date}
                onUpdate={(updatedOrList: any) => {
                  const updates = Array.isArray(updatedOrList)
                    ? updatedOrList
                    : [updatedOrList];

                  setStructuredElements((prev) => {
                    const newElements = prev.map((el) => {
                      const update = updates.find((u) => u.id === el.id);
                      if (update) {
                        // Also update the text in data structure if "Nova redação" special situation is present
                        if (
                          update.specialSituations &&
                          update.specialSituations.length > 0
                        ) {
                          const novaRedacao = update.specialSituations.find(
                            (s: any) => s.type === "Nova redação" && s.newText,
                          );
                          if (novaRedacao && novaRedacao.newText) {
                            // Only apply text replacement if we're adding the situation right now
                            // OR if it's the first time it's being applied to avoid overwriting later user edits.
                            // A robust way is just replacing since that's the "Nova redação" semantic meaning.
                            const newHtml = novaRedacao.newText
                              .split("\n")
                              .filter((p: string) => p.trim() !== "")
                              .map((p: string) => `<p>${p}</p>`)
                              .join("");
                            return { ...update, text: newHtml || update.text };
                          }
                        }
                        return update;
                      }
                      return el;
                    });

                    // Update selected elements to reflect current values in side panel
                    setSelectedElements((prevSelected) =>
                      prevSelected.map((sel) => {
                        const update = updates.find((u) => u.id === sel.id);
                        return update ? update : sel;
                      }),
                    );

                    // Also update Editor if available
                    if (editor) {
                      const updateMap = new Map(updates.map((u) => [u.id, u]));
                      let hasChanges = false;
                      const { tr } = editor.state;

                      editor.state.doc.descendants((node, pos) => {
                        const update = node.attrs?.normativeId
                          ? updateMap.get(node.attrs.normativeId)
                          : null;
                        if (update) {
                          tr.setNodeMarkup(pos, undefined, {
                            ...node.attrs,
                            type: update.type,
                            index: update.index,
                            specialSituations: update.specialSituations,
                            originalStartValidity: update.originalStartValidity,
                            originalEndValidity: update.originalEndValidity,
                          });

                          // Check for "Nova redação" special situation and update text if present
                          if (
                            update.specialSituations &&
                            update.specialSituations.length > 0
                          ) {
                            const novaRedacao = update.specialSituations.find(
                              (s: any) =>
                                s.type === "Nova redação" && s.newText,
                            );

                            if (novaRedacao && novaRedacao.newText) {
                              // Parse the new text into paragraph blocks to support line breaks
                              const paragraphs = novaRedacao.newText
                                .split("\n")
                                .filter((p: string) => p.trim() !== "");

                              const contentNodes =
                                paragraphs.length > 0
                                  ? paragraphs.map((text: string) => ({
                                      type: "text",
                                      text: text,
                                    }))
                                  : [
                                      {
                                        type: "text",
                                        text: novaRedacao.newText,
                                      },
                                    ];

                              // Note: this replaces the entire text content of the node.
                              const doc = editor.schema.nodeFromJSON({
                                type: "doc",
                                content: [
                                  {
                                    type: node.type.name,
                                    attrs: {
                                      ...node.attrs,
                                      type: update.type,
                                      index: update.index,
                                      specialSituations:
                                        update.specialSituations,
                                      originalStartValidity:
                                        update.originalStartValidity,
                                      originalEndValidity:
                                        update.originalEndValidity,
                                    },
                                    content: contentNodes,
                                  },
                                ],
                              });

                              if (doc && doc.firstChild) {
                                const newContent = doc.firstChild.content;
                                if (newContent && newContent.size > 0) {
                                  // Extract the original content size (excluding node opening and closing tags)
                                  const innerSize = Math.max(
                                    0,
                                    node.nodeSize - 2,
                                  );
                                  // Replace the inner content with the new text content
                                  tr.replaceWith(
                                    pos + 1,
                                    pos + 1 + innerSize,
                                    newContent,
                                  );
                                }
                              }
                            }
                          }

                          hasChanges = true;
                        }
                        return true;
                      });

                      if (hasChanges) {
                        editor.view.dispatch(tr);
                      }
                    }

                    return newElements;
                  });
                }}
                onSelectElements={setSelectedElements as any}
              />
            )}
          </InspectorHost>
        </div>

        <Dialog
          open={saveConfirmationOpen}
          onOpenChange={(open) =>
            !isSubmitting && setSaveConfirmationOpen(open)
          }
        >
          {/* O acompanhamento do salvamento e os avisos crescem: rolar dentro do diálogo. */}
          <DialogContent className="max-h-[calc(100svh-4rem)] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Confirmar Salvamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-1 py-3 text-sm text-muted-foreground">
              <p className="text-xs font-medium text-foreground">
                Data e hora do salvamento:{" "}
                {new Date().toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "medium",
                })}
              </p>
              <p>
                {isNormative
                  ? `Vigência do original: início ${normativeData.originalStartValidity?.date || normativeData.publicationDate || "não definida"}${normativeData.originalEndValidity?.date ? ` · fim ${normativeData.originalEndValidity.date}` : ""}. Base: ${getLastElementDescription()}`
                  : "Deseja salvar esta coletânea?"}
              </p>
            </div>
            {(isSaving || saveFeedback) && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs text-muted-foreground">
                  Acompanhamento do salvamento
                </p>

                <div className="space-y-2">
                  {SAVE_STEPS.map((step) => {
                    const status = getSaveStepState(step.key);

                    return (
                      <div
                        key={step.key}
                        className="flex items-center gap-2 text-sm"
                      >
                        {status === "done" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : status === "error" ? (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        ) : status === "active" ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                        )}

                        <span
                          className={
                            status === "pending"
                              ? "text-muted-foreground"
                              : "text-foreground"
                          }
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {isNormative && warningValidationIssues.length > 0 && (
              <div className="border-l-2 border-amber-600 pl-3 text-sm text-amber-700 dark:text-amber-400">
                Atenção: {warningValidationIssues.length} aviso(s) de estrutura
                foram identificados. O salvamento continuará, mas vale revisar
                antes de publicar.
              </div>
            )}
            {saveError && (
              <div className="border-l-2 border-destructive pl-3 text-sm text-destructive break-words">
                {saveError}
              </div>
            )}
            {localBackupNotice}
            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:space-x-0">
              <Button
                variant="ghost"
                onClick={() => {
                  void handleCopyBackup();
                }}
                className="gap-2"
                title="Copia o documento completo (metadados, conteúdo do editor e estrutura normativa) e grava uma cópia neste navegador"
              >
                {backupCopied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ClipboardCopy className="h-4 w-4" />
                )}
                {backupCopied ? "Backup copiado" : "Copiar backup"}
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setSaveConfirmationOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    void executeSave();
                  }}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Salvando..." : "Confirmar"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={leavePromptOpen}
          onOpenChange={(open) => !isSubmitting && setLeavePromptOpen(open)}
        >
          {/* Quatro ações não cabem na largura padrão (`max-w-lg`) do diálogo. */}
          <DialogContent className="max-h-[calc(100svh-4rem)] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Há alterações não salvas</DialogTitle>
              <DialogDescription>
                Deseja salvar antes de sair?
              </DialogDescription>
            </DialogHeader>

            <div className="text-sm text-muted-foreground">
              Se você sair agora, as alterações feitas neste documento serão
              perdidas.
            </div>

            {saveError && (
              <div className="border-l-2 border-destructive pl-3 text-sm text-destructive break-words">
                {saveError}
              </div>
            )}

            {localBackupNotice}

            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:space-x-0">
              <Button
                variant="ghost"
                onClick={() => {
                  setLeavePromptOpen(false);
                  setPendingNavigation(null);
                }}
                disabled={isSubmitting}
              >
                Continuar editando
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    void handleCopyBackup();
                  }}
                  className="gap-2 text-muted-foreground"
                  title="Copia o documento completo e grava uma cópia neste navegador antes de sair"
                >
                  {backupCopied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <ClipboardCopy className="h-4 w-4" />
                  )}
                  {backupCopied ? "Backup copiado" : "Copiar backup"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => proceedWithNavigation(pendingNavigation)}
                  disabled={isSubmitting}
                  className="text-foreground/90 hover:text-destructive hover:bg-destructive/10"
                >
                  Descartar alterações
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    void handleSaveBeforeLeaving();
                  }}
                  disabled={isSubmitting}
                  autoFocus
                  className="gap-2"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <InfoModal
          open={infoModalOpen}
          onOpenChange={setInfoModalOpen}
          title="Guia do Editor do Legis"
          category="editor"
        />
      </div>
    </InspectorTaskProvider>
  );
}
