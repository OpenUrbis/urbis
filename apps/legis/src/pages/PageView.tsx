import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useAuth } from "@open-urbis/map-auth";
import { usePage } from "../hooks/use-page";
import { Page } from "../types/page";
import {
  Button,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  cn,
} from "@open-urbis/map-ui";
import {
  Edit,
  Calendar,
  Book,
  FileText,
  ChevronRight,
  Lock,
  Link as LinkIcon,
  Info,
  RotateCcw,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { LegisEditor } from "../components/Editor/LegisEditor";
import { usePermission } from "../hooks/use-permission";
import { JSONContent, type Editor as TiptapEditor } from "@tiptap/core";
import { safeJSONParse } from "@/lib/content";
import { OriginalNormativo, ColetaneaTematica } from "../domain/entities";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NormativeDocumentRenderer } from "../components/page/NormativeDocumentRenderer";
import { PageViewSkeleton } from "../components/page/PageViewSkeleton";
import { DOCUMENT_TITLE_CLASS } from "../components/page/document-title";
import { ColetaneaRenderer } from "../components/page/ColetaneaRenderer";
import { pageService } from "../services/page-service";
import { UserChip } from "../components/common/UserChip";
import { formatValidityDisplay } from "../domain/validity";
import { useAuthorities } from "../contexts/authorities-context";
import {
  useElementAnchorFocus,
  useElementAnchorOffset,
} from "../hooks/use-element-anchor";
import { elementAnchorHref, withElementAnchor } from "../lib/element-anchor";

export default function PageView() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/pages/:id");
  const auth = useAuth();
  const { getPage } = usePage();
  const { canEdit, canDelete } = usePermission();
  const { getAuthorityById } = useAuthorities();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<JSONContent | undefined>(undefined);
  const [fichaOpen, setFichaOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"full" | "consolidated">("full");

  // Coletanea State
  const [linkedPages, setLinkedPages] = useState<Page[]>([]);
  const [resumoModalOpen, setResumoModalOpen] = useState(false);
  const [selectedLinkedPage, setSelectedLinkedPage] = useState<Page | null>(
    null,
  );

  // Parsing State
  const [, setEditor] = useState<TiptapEditor | null>(null);

  // Âncoras de dispositivo: a barra da página é medida para que `#el-<id>` pare
  // abaixo dela, e o foco reage a cada documento/hash novo.
  const { stickyRef, anchorOffsetStyle } = useElementAnchorOffset();
  useElementAnchorFocus(!loading && !!page, page?.id);

  const loadPage = useCallback(
    async (id: string) => {
      try {
        const data = await getPage(id);
        if (data) {
          setPage(data);
          if (data.content) {
            const parsed = safeJSONParse(data.content);
            if (parsed) setContent(parsed);
            else if (data.content.trim()) {
              setContent({
                type: "doc",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: data.content }],
                  },
                ],
              });
            }
          }

          // Load Linked Pages for Coletanea
          if (data.type === "coletanea_tematica" && data.entity) {
            const col = data.entity as ColetaneaTematica;
            if (col.links && col.links.length > 0) {
              const ids = col.links.map((l) => l.resourceId);
              pageService.getPagesByIds(ids).then(setLinkedPages);
            }
          }
        } else {
          setLocation("/pages");
        }
      } catch (error) {
        console.error("Failed to load page", error);
      } finally {
        setLoading(false);
      }
    },
    [getPage, setLocation],
  );

  useEffect(() => {
    if (params?.id) {
      loadPage(params.id);
    }
  }, [params?.id, loadPage]);

  if (loading) {
    return <PageViewSkeleton />;
  }

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
        <Lock className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Página indisponível</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Esta página pode ser privada, restrita a administradores ou não existir.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <Button variant="outline" onClick={() => setLocation("/pages")}>
            Voltar para a lista
          </Button>
          {!auth.isAuthenticated && (
            <Button onClick={() => auth.signinRedirect()}>
              Fazer login
            </Button>
          )}
        </div>
      </div>
    );
  }

  const isNormative = page.type === "original_normativo";
  const isColetanea = page.type === "coletanea_tematica";
  const normativeData = isNormative ? (page.entity as OriginalNormativo) : null;
  const coletaneaData = isColetanea ? (page.entity as ColetaneaTematica) : null;

  // Helper to format date
  const formatDate = (dateStr?: string, full: boolean = false) => {
    if (!dateStr) return "sem data";
    try {
      // Try to parse DD.MM.YYYY
      const parsed = parse(dateStr, "dd.MM.yyyy", new Date());
      if (!isValid(parsed)) return dateStr;

      if (full) {
        return format(parsed, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
      }
      return format(parsed, "dd.MM.yyyy");
    } catch {
      return dateStr;
    }
  };

  /** Timestamps de auditoria vêm em ISO, diferente das datas normativas. */
  const formatTimestamp = (isoDate?: string) => {
    if (!isoDate) return "sem data";
    const parsed = new Date(isoDate);
    if (!isValid(parsed)) return isoDate;
    return format(parsed, "dd.MM.yyyy 'às' HH:mm", { locale: ptBR });
  };

  const authority = normativeData
    ? getAuthorityById(normativeData.authorityId)
    : undefined;

  // Abrir o vínculo já no dispositivo vinculado, não no topo do ato inteiro.
  const linkedPageHref = (linkedPage: Page) => {
    const elementId = coletaneaData?.links.find(
      (link) => link.resourceId === linkedPage.id,
    )?.linkedElements?.[0]?.elementId;

    return `/pages/${linkedPage.id}${elementId ? elementAnchorHref(elementId) : ""}`;
  };

  return (
    <div
      className="flex flex-col min-h-screen bg-background"
      style={anchorOffsetStyle}
    >
      {/* Top Bar */}
      {/*
              The app header is sticky at the top of the document scroll, so this bar
              has to stick *below* it. With `top-0` it slid under the header and
              disappeared as soon as the document was tall enough to scroll.
            */}
      <div
        ref={stickyRef}
        className="sticky top-[--header-height] z-40 bg-background/80 backdrop-blur-sm border-b"
      >
        <div className="w-full px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/pages"
              className="hover:text-foreground transition-colors"
            >
              Legis
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <span className="truncate max-w-[200px] text-foreground font-medium">
              {page.title}
            </span>
            {page.isPublic ? (
              <></>
            ) : (
              <Badge
                variant="outline"
                className="ml-2 gap-1 text-[10px] h-5 font-normal text-muted-foreground"
              >
                <Lock className="h-3 w-3" /> Privada
              </Badge>
            )}
            {page.deletedAt && (
              <Badge
                variant="destructive"
                className="ml-2 gap-1 text-[10px] h-5 font-normal bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400"
              >
                Excluído (Lixeira)
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isColetanea && (
              <div className="flex items-center rounded-md border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("full")}
                  className={cn(
                    "h-7 text-xs px-2 font-normal",
                    viewMode === "full"
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  Completo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("consolidated")}
                  className={cn(
                    "h-7 text-xs px-2 font-normal border-l",
                    viewMode === "consolidated"
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  Consolidado
                </Button>
              </div>
            )}
            {isNormative && (
              <Badge
                variant="outline"
                className="ml-2 gap-1 font-normal text-muted-foreground"
              >
                <Book className="h-3 w-3" />
                Original Normativo
              </Badge>
            )}
            {isNormative && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFichaOpen(true)}
                className="gap-2 font-normal"
              >
                <Info className="h-4 w-4" />
                Ficha
              </Button>
            )}
            {page.deletedAt && canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await pageService.restorePage(page.id);
                    window.location.reload();
                  } catch (_err) {
                    alert("Erro ao restaurar a página");
                  }
                }}
                className="gap-2 font-normal text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                title="Restaurar página"
              >
                <RotateCcw className="h-4 w-4" />
                Restaurar
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (page.deletedAt) {
                    if (
                      confirm(
                        "ATENÇÃO: Deseja EXCLUIR DEFINITIVAMENTE esta página do banco de dados? Esta ação não pode ser desfeita.",
                      )
                    ) {
                      try {
                        await pageService.permanentDeletePage(page.id);
                        setLocation("/");
                      } catch (_err) {
                        alert("Erro ao excluir permanentemente a página");
                      }
                    }
                  } else {
                    if (
                      confirm(
                        "Tem certeza que deseja mover esta página para a lixeira?",
                      )
                    ) {
                      try {
                        await pageService.delete(page.id);
                        setLocation("/");
                      } catch (_err) {
                        alert("Erro ao mover a página para a lixeira");
                      }
                    }
                  }
                }}
                className="gap-2 font-normal text-destructive hover:bg-destructive/10"
                title={
                  page.deletedAt ? "Deletar em definitivo" : "Mover para lixeira"
                }
              >
                <Trash2 className="h-4 w-4" />
                {page.deletedAt ? "Excluir Definitivamente" : "Excluir"}
              </Button>
            )}
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                /* Editar sem perder o dispositivo em que o leitor estava. */
                onClick={() =>
                  setLocation(
                    withElementAnchor(
                      `/pages/${page.id}/edit`,
                      window.location.hash,
                    ),
                  )
                }
                className="gap-2 font-normal"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {isNormative && normativeData ? (
          /* Original Normativo Custom View */
          <div className="flex w-full justify-center bg-background">
            <div className="w-full max-w-[1400px] px-4 py-6">
              <NormativeDocumentRenderer
                data={normativeData}
                title={page.title}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 relative">
            {isColetanea && coletaneaData ? (
              /* Coletanea Tematica View */
              <div className="container max-w-[1400px] mx-auto px-0 py-6 min-h-full relative">
                <div className="relative">
                  <div className="py-4 px-4 xl:px-6">
                    <div className="flex flex-col gap-6 items-start">
                      {/* Main Column */}
                      <div className="w-full">
                        {/* Ficha */}
                        <header className="mb-6 border-b pb-4 space-y-3">
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className="mb-1 font-normal text-muted-foreground"
                            >
                              {coletaneaData.category}
                            </Badge>
                            <h1 className={DOCUMENT_TITLE_CLASS}>
                              {coletaneaData.title}
                            </h1>
                            <div className="flex gap-2 text-sm text-muted-foreground">
                              <span>Temas: {coletaneaData.theme}</span>
                            </div>
                          </div>
                        </header>

                        {/* Vínculos (Moved from Sidebar) */}
                        {linkedPages.length > 0 && (
                          <section className="mb-6 hidden">
                            <h2 className="text-sm font-medium text-muted-foreground mb-3">
                              Vínculos
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {linkedPages.map((lp) => (
                                <div
                                  key={lp.id}
                                  className="group p-3 border hover:border-foreground/30 cursor-pointer transition-colors"
                                  onClick={() => {
                                    setSelectedLinkedPage(lp);
                                    setResumoModalOpen(true);
                                  }}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[11px] text-muted-foreground">
                                      {lp.type === "original_normativo"
                                        ? "Original Normativo"
                                        : "Coletânea"}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                      {new Date(
                                        lp.updatedAt,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="font-medium text-sm leading-snug group-hover:text-primary">
                                    {lp.title}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}

                        {/* Resumo */}
                        {coletaneaData.shortDescription && (
                          <section className="mb-6">
                            <h2 className="text-sm font-medium text-muted-foreground mb-3">
                              Resumo
                            </h2>
                            <div
                              className="prose dark:prose-invert max-w-none text-justify leading-relaxed border-l pl-4"
                              dangerouslySetInnerHTML={{
                                __html: coletaneaData.shortDescription,
                              }}
                            />
                          </section>
                        )}

                        {/* Conteúdo */}
                        <section>
                          <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-medium text-muted-foreground">
                              Conteúdo
                            </h2>
                          </div>
                          <ColetaneaRenderer
                            content={content}
                            viewMode={viewMode}
                          />
                        </section>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resumo Modal */}
                <Dialog
                  open={resumoModalOpen}
                  onOpenChange={setResumoModalOpen}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{selectedLinkedPage?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">
                        Resumo
                      </h4>
                      <div
                        className="prose dark:prose-invert text-sm leading-relaxed text-justify max-w-none"
                        dangerouslySetInnerHTML={{
                          __html:
                            selectedLinkedPage?.type === "coletanea_tematica" &&
                            (selectedLinkedPage.entity as ColetaneaTematica)
                              ?.shortDescription
                              ? (selectedLinkedPage.entity as ColetaneaTematica)
                                  .shortDescription!
                              : selectedLinkedPage?.type === "original_normativo" &&
                                  (selectedLinkedPage?.entity as OriginalNormativo)
                                    ?.ementa
                                ? (selectedLinkedPage?.entity as OriginalNormativo)
                                    .ementa!
                                : "Sem resumo disponível.",
                        }}
                      />
                    </div>
                    <div className="pt-4 border-t flex justify-end">
                      {selectedLinkedPage && (
                        <a
                          href={linkedPageHref(selectedLinkedPage)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button
                            variant="outline"
                            className="gap-2 font-normal"
                          >
                            Abrir Página Completa
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              /* Standard View */
              <div className="container max-w-4xl mx-auto px-4 py-6 space-y-5">
                <header className="space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Badge
                      variant="outline"
                      className="gap-1 font-normal text-muted-foreground"
                    >
                      <FileText className="h-3 w-3" />
                      Página
                    </Badge>
                    {page.tags?.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-muted-foreground font-normal"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  <h1 className={cn(DOCUMENT_TITLE_CLASS, "text-foreground")}>
                    {page.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b pb-4">
                    <UserChip
                      user={page.authorUser}
                      fallbackLabel={page.author}
                    />
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(page.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </header>

                <article className="min-h-[200px]">
                  <LegisEditor
                    key={page.id}
                    initialContent={content}
                    readOnly={true}
                    onEditorReady={setEditor}
                    isNormative={false}
                  />
                </article>
              </div>
            )}
          </div>
        )}

        {/* Properties Panel (Legacy) */}
        {!isNormative && !isColetanea && (
          <div className="hidden md:block w-80 border-l relative">
            <div className="sticky top-[--header-height] h-[calc(100svh-var(--header-height))] overflow-y-auto">
              {/* <PropertiesPanel ... /> */}
            </div>
          </div>
        )}
      </div>

      {/* Ficha Sheet */}
      <Sheet open={fichaOpen} onOpenChange={setFichaOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Ficha</SheetTitle>
          </SheetHeader>
          {isNormative && normativeData ? (
            <div className="py-4 space-y-4 text-sm">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  ID
                </div>
                <div className="font-mono inline-block text-xs">{page.id}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Nome
                </div>
                <div className="font-medium text-foreground">
                  {page.title || normativeData.name || "Sem nome"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Data do Ato
                  </div>
                  <div>{formatDate(normativeData.actDate)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Data de Publicação
                  </div>
                  <div>{formatDate(normativeData.publicationDate)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Vigência Inicial
                  </div>
                  <div>
                    {formatValidityDisplay(normativeData.originalStartValidity)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Vigência Final
                  </div>
                  <div>
                    {formatValidityDisplay(normativeData.originalEndValidity)}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Autoridade
                </div>
                {authority ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-medium underline decoration-dotted underline-offset-4 cursor-help">
                          {authority.commonRefAbbr}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px] p-3 space-y-2">
                        <div>
                          <span className="font-medium text-xs text-muted-foreground block">
                            Nome por extenso
                          </span>
                          <span>
                            {authority.complementFull
                              ? `${authority.complementFull} - `
                              : ""}
                            {authority.commonRefFull}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-xs text-muted-foreground block">
                            Abreviação
                          </span>
                          <span>
                            {authority.complementAbbr
                              ? `${authority.complementAbbr} - `
                              : ""}
                            {authority.commonRefAbbr}
                          </span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <span className="text-muted-foreground italic">
                    Autoridade não identificada ({normativeData.authorityId})
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Ementa
                </div>
                <div className="text-justify text-xs text-muted-foreground leading-relaxed">
                  {normativeData.ementa || "sem ementa"}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Fontes
                </div>
                <div className="space-y-1">
                  {normativeData.sources && normativeData.sources.length > 0 ? (
                    normativeData.sources.map((source, idx) => (
                      <div key={idx}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <LinkIcon className="h-3 w-3" />
                          {source.name ||
                            (page.title ? page.title : `Link ${idx + 1}`)}
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground italic">
                      sem fontes
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-muted-foreground">
              Informações não disponíveis para este tipo de documento.
            </div>
          )}

          {/* Autoria e auditoria: valem para qualquer tipo de página. */}
          <div className="space-y-3 border-t py-4 text-sm">
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">
                Autor
              </div>
              <UserChip
                user={page.authorUser}
                fallbackLabel={page.author}
                showProfileLink={canEdit}
              />
            </div>

            {/* Dados de gestão e auditoria interna restritos a usuários com permissão de edição */}
            {canEdit && (
              <div className="space-y-3 border-t pt-3">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Criado por
                  </div>
                  <UserChip
                    user={page.createdByUser}
                    emptyLabel="Não registrado"
                    showProfileLink={canEdit}
                  />
                  <div className="text-xs text-muted-foreground">
                    {formatTimestamp(page.createdAt)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Última edição
                  </div>
                  <UserChip
                    user={page.updatedByUser}
                    emptyLabel="Não registrado"
                    showProfileLink={canEdit}
                  />
                  <div className="text-xs text-muted-foreground">
                    {formatTimestamp(page.updatedAt)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
