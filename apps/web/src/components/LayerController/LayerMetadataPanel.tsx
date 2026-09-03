import {
  Button,
  cn,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@open-urbis/map-ui";
import {
  AlertTriangle,
  Download,
  ExternalLink,
  FileText,
  Scale,
  X,
  BookA,
  Info,
} from "lucide-react";
import { useEffect, useState } from "react";
import { IGetConfigLayerSchema } from "../../types/fetch-map-config-type";

interface LayerMetadataPanelProps {
  layer: IGetConfigLayerSchema;
  open: boolean;
  className?: string;
  onClose: () => void;
}

const getTextContent = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toLocaleUpperCase("pt-BR"));

const getDisplayValue = (value?: unknown) => {
  if (typeof value !== "string") return "";

  const displayValue = value.trim();

  return displayValue.length > 0 ? displayValue : "";
};

const formatFallbackLabel = (value?: string | null) => {
  const displayValue = getDisplayValue(value);

  if (!displayValue) return "";

  return getTextContent(displayValue.replace(/[-_]/g, " "));
};

const normalizeMetadataUrl = (url?: string | null): string => {
  const displayValue = getDisplayValue(url);
  if (!displayValue) return "";

  return displayValue
    .replace(/https?:\/\/(?:[a-zA-Z0-9_-]+\.)?urbis\.sampa\.br/gi, "https://dadosabertos.urbis.prefeitura.sp.gov.br")
    .replace(/https?:\/\/datalake\.urbis\.(?:sampa\.br|prefeitura\.sp\.gov\.br)/gi, "https://dadosabertos.urbis.prefeitura.sp.gov.br")
    .replace(/\burbis\.sampa\.br\b/gi, "dadosabertos.urbis.prefeitura.sp.gov.br")
    .replace(/\bdatalake\.urbis\.(?:sampa\.br|prefeitura\.sp\.gov\.br)\b/gi, "dadosabertos.urbis.prefeitura.sp.gov.br")
    .replace(/\b([a-z0-9-]+)\.sampa\.br\b/gi, "$1.prefeitura.sp.gov.br");
};

const getMetadataLinks = (metadata: Record<string, unknown>) => {
  const links = metadata.links;

  if (!Array.isArray(links)) return [];

  return links
    .map((link) => {
      if (!link || typeof link !== "object") return null;

      const metadataLink = link as { label?: unknown; url?: unknown };
      const url = getDisplayValue(metadataLink.url);
      if (!url) return null;

      return {
        label: getDisplayValue(metadataLink.label) || "Abrir link",
        url: normalizeMetadataUrl(url),
      };
    })
    .filter((link): link is { label: string; url: string } => Boolean(link));
};

const getWmsUrl = (
  layer: IGetConfigLayerSchema,
  metadataLinks: Array<{ label: string; url: string }> = [],
) => {
  const properties = layer.properties ?? {};
  const serviceLink = metadataLinks.find((link) =>
    /servi[cç]o|wms|wfs|url/i.test(link.label),
  );

  return getDisplayValue(
    properties.wms?.url ??
      properties.url ??
      properties.wmsUrl ??
      properties.serviceUrl ??
      serviceLink?.url ??
      layer.origin,
  );
};

const buildDownloadAllUrl = (url?: string | null) => {
  const displayValue = getDisplayValue(url);

  if (!displayValue) return null;

  return `${displayValue.split("#")[0]}#baixar-tudo`;
};

const InformationBlock = ({
  title,
  value,
  icon: Icon,
  valueClassName,
}: {
  title: string;
  value?: string | null;
  icon: typeof FileText;
  valueClassName?: string;
}) => {
  const displayValue = getDisplayValue(value);

  if (!displayValue) return null;

  return (
    <section className="rounded-xl border bg-background/90 p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <h3>{title}</h3>
      </div>
      <div
        className={cn(
          "prose prose-sm max-w-none text-sm leading-relaxed text-foreground dark:prose-invert [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:my-2",
          valueClassName,
        )}
        dangerouslySetInnerHTML={{ __html: displayValue }}
      />
    </section>
  );
};

interface ExtractedLegisInfo {
  pageIdOrSlug: string;
  fullUrl: string;
}

export const extractLegisInfo = (
  legisLinks: string,
): ExtractedLegisInfo | null => {
  if (!legisLinks) return null;

  const hrefMatch = legisLinks.match(/href=["']([^"']+)["']/i);
  let targetUrl = hrefMatch ? hrefMatch[1].trim() : null;

  if (!targetUrl) {
    const urlMatch = legisLinks.match(
      /(https?:\/\/[^\s<"']+|\/(?:pages|p)\/[^\s<"']+)/i,
    );
    if (urlMatch) {
      targetUrl = urlMatch[1].trim();
    }
  }

  let pageIdOrSlug: string | null = null;

  if (targetUrl) {
    const idMatch = targetUrl.match(/(?:pages|p)\/([a-zA-Z0-9_-]+)/i);
    if (idMatch) {
      pageIdOrSlug = idMatch[1];
    }
  } else if (/^[a-zA-Z0-9_-]+$/.test(legisLinks.trim())) {
    pageIdOrSlug = legisLinks.trim();
    targetUrl = `https://legis.urbis.prefeitura.sp.gov.br/pages/${pageIdOrSlug}`;
  }

  if (!pageIdOrSlug) return null;

  const validTargetUrl =
    targetUrl ?? `https://legis.urbis.prefeitura.sp.gov.br/pages/${pageIdOrSlug}`;
  let fullUrl = validTargetUrl;
  if (fullUrl.startsWith("/")) {
    fullUrl = `https://legis.urbis.prefeitura.sp.gov.br${fullUrl}`;
  }

  return { pageIdOrSlug, fullUrl };
};

const convertTiptapNodeToHtml = (node: any): string => {
  if (!node) return "";
  if (typeof node === "string") return node;

  if (node.type === "text") {
    let text = node.text || "";
    if (Array.isArray(node.marks)) {
      node.marks.forEach((mark: any) => {
        if (!mark || !mark.type) return;
        switch (mark.type) {
          case "bold":
            text = `<strong>${text}</strong>`;
            break;
          case "italic":
          case "em":
            text = `<em>${text}</em>`;
            break;
          case "underline":
            text = `<u>${text}</u>`;
            break;
          case "code":
            text = `<code>${text}</code>`;
            break;
          case "link": {
            const href = mark.attrs?.href || "#";
            text = `<a href="${href}" target="_blank" rel="noreferrer" class="underline text-primary">${text}</a>`;
            break;
          }
          case "strike":
            text = `<s>${text}</s>`;
            break;
        }
      });
    }
    return text;
  }

  const innerHtml = Array.isArray(node.content)
    ? node.content.map(convertTiptapNodeToHtml).join("")
    : "";

  switch (node.type) {
    case "doc":
      return innerHtml;
    case "paragraph":
      return innerHtml ? `<p>${innerHtml}</p>` : "";
    case "heading": {
      const level = node.attrs?.level || 3;
      return `<h${level}>${innerHtml}</h${level}>`;
    }
    case "bulletList":
      return `<ul class="list-disc pl-4 my-1">${innerHtml}</ul>`;
    case "orderedList":
      return `<ol class="list-decimal pl-4 my-1">${innerHtml}</ol>`;
    case "listItem":
      return `<li>${innerHtml}</li>`;
    case "blockquote":
      return `<blockquote>${innerHtml}</blockquote>`;
    case "image": {
      const src = node.attrs?.src || "";
      const alt = node.attrs?.alt || "";
      return src ? `<img src="${src}" alt="${alt}" class="my-2 max-w-full h-auto rounded-md shadow-sm" />` : "";
    }
    case "hardBreak":
      return "<br />";
    default:
      return innerHtml;
  }
};

export const parseLegisSummary = (pageData: any): string => {
  if (!pageData) return "";
  const entityData = pageData.entityData || {};

  const summary =
    entityData.shortDescription ||
    entityData.summaryDescription ||
    entityData.ementa ||
    entityData.description ||
    pageData.summaryDescription ||
    pageData.description;

  if (typeof summary === "string" && summary.trim()) {
    return summary.trim();
  }

  if (typeof pageData.content === "string" && pageData.content.trim()) {
    try {
      const json = JSON.parse(pageData.content);
      const html = convertTiptapNodeToHtml(json);
      if (html) {
        return html;
      }
    } catch {
      if (pageData.content.trim()) {
        return pageData.content.trim();
      }
    }
  }

  return pageData.title || "";
};

export const parseLegisNotes = (pageData: any): string[] => {
  if (!pageData) return [];
  const notesSet = new Set<string>();
  const entityData = pageData.entityData || {};

  const elements = Array.isArray(entityData.elements)
    ? entityData.elements
    : Array.isArray(pageData.elements)
      ? pageData.elements
      : [];

  elements.forEach((el: any) => {
    if (!el) return;
    const type = String(el.type || "").toLowerCase();
    if (type === "nota") {
      const text = typeof el.text === "string" ? el.text.trim() : "";
      if (text) {
        let noteStr = text;
        if (
          el.index &&
          !text.toLowerCase().startsWith("nota") &&
          !text.startsWith(`(${el.index})`) &&
          !text.startsWith(`${el.index}`)
        ) {
          noteStr = `(${el.index}) ${text}`;
        }
        notesSet.add(noteStr);
      }
    }
  });

  const directFields = [
    entityData.notes,
    entityData.notas,
    entityData.observacoes,
    entityData.observations,
    entityData.avisos,
    pageData.notes,
    pageData.notas,
    pageData.observacoes,
    pageData.observations,
    pageData.avisos,
  ];

  directFields.forEach((field) => {
    if (Array.isArray(field)) {
      field.forEach((item: any) => {
        if (typeof item === "string" && item.trim()) {
          notesSet.add(item.trim());
        } else if (item && typeof item.text === "string" && item.text.trim()) {
          notesSet.add(item.text.trim());
        }
      });
    } else if (typeof field === "string" && field.trim()) {
      notesSet.add(field.trim());
    }
  });

  return Array.from(notesSet);
};

const legisCache = new Map<
  string,
  { summary: string; notes: string[]; fullUrl: string } | null
>();

export const LegisInformationBlock = ({
  rawLegisLinks,
  apiBaseUrl,
  title = "Legis",
}: {
  rawLegisLinks?: string | null;
  apiBaseUrl: string;
  title?: string;
}) => {
  const displayValue = getDisplayValue(rawLegisLinks);
  const extracted = extractLegisInfo(displayValue);

  const pageIdOrSlug = extracted?.pageIdOrSlug ?? "";
  const fullUrl = extracted?.fullUrl ?? "";

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!pageIdOrSlug) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    if (legisCache.has(pageIdOrSlug)) {
      const cached = legisCache.get(pageIdOrSlug);
      setSummary(cached?.summary ?? null);
      setNotes(cached?.notes ?? []);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    fetch(`${apiBaseUrl}/legis/pages/${pageIdOrSlug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar página no Legis");
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const text = parseLegisSummary(data);
        const parsedNotes = parseLegisNotes(data);
        legisCache.set(pageIdOrSlug, { summary: text, notes: parsedNotes, fullUrl });
        setSummary(text);
        setNotes(parsedNotes);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pageIdOrSlug, apiBaseUrl, fullUrl]);

  if (!displayValue) return null;

  if (!extracted) {
    return (
      <InformationBlock
        title={title}
        value={displayValue}
        icon={Scale}
      />
    );
  }

  if (loading) {
    return (
      <section className="rounded-xl border bg-background/90 p-3 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Scale className="h-3.5 w-3.5" aria-hidden="true" />
          <h3>{title}</h3>
        </div>
        <div className="animate-pulse space-y-2 text-sm text-muted-foreground">
          <div className="h-4 w-32 rounded bg-muted"></div>
          <div className="h-3 w-full rounded bg-muted"></div>
          <div className="h-3 w-3/4 rounded bg-muted"></div>
        </div>
      </section>
    );
  }

  if (error || !summary) {
    return (
      <InformationBlock
        title={title}
        value={displayValue}
        icon={Scale}
      />
    );
  }

  return (
    <section className="rounded-xl border bg-background/90 p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Scale className="h-3.5 w-3.5" aria-hidden="true" />
        <h3>{title}</h3>
      </div>
      <div className="space-y-2.5 text-sm text-foreground">
        <div>
          <p className="font-bold">Descrição resumida</p>
          <div
            className="prose prose-sm max-w-none leading-relaxed text-muted-foreground dark:prose-invert [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:my-2"
            dangerouslySetInnerHTML={{ __html: summary }}
          />
        </div>

        {notes.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-border/50">
            <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              {notes.length === 1 ? "Nota" : "Notas"}
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground list-disc pl-4">
              {notes.map((note, idx) => (
                <li key={idx} className="leading-relaxed">
                  <span dangerouslySetInnerHTML={{ __html: note }} />
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <a
            href={fullUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs italic text-primary hover:underline"
          >
            descrição completa
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </section>
  );
};

const LinksBlock = ({
  links,
}: {
  links: Array<{ label: string; url: string }>;
}) => {
  if (links.length === 0) return null;

  return (
    <section className="rounded-xl border bg-background/90 p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        <h3>Links úteis</h3>
      </div>
      <div className="space-y-2">
        {links.map((link) => (
          <a
            key={`${link.label}-${link.url}`}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm text-primary transition-colors hover:bg-muted/40"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            <span className="truncate">{link.label}</span>
          </a>
        ))}
      </div>
    </section>
  );
};

export const LayerMetadataPanel = ({
  layer,
  open,
  className,
  onClose,
}: LayerMetadataPanelProps) => {
  const [copiedWms, setCopiedWms] = useState(false);
  const [showWmsInstructions, setShowWmsInstructions] = useState(false);
  const metadata = layer.properties?.metadata ?? {};
  const metadataLinks = getMetadataLinks(metadata);
  const summaryDescription = getDisplayValue(
    metadata.summaryDescription ??
      metadata.description ??
      layer.properties?.description,
  );
  const catalogSourceDescription =
    layer.properties?.source === "geoserver-catalog"
      ? `Camada adicionada pelo Catálogo de GeoServer${
          getDisplayValue(layer.properties?.catalogEntryId)
            ? ` (${getDisplayValue(layer.properties?.catalogEntryId)})`
            : ""
        }.`
      : "";
  const technicalMetadata = [
    catalogSourceDescription,
    getDisplayValue(metadata.geometry)
      ? `Tipo de geometria: ${getDisplayValue(metadata.geometry)}.`
      : "",
    getDisplayValue(metadata.version)
      ? `Versão do serviço: ${getDisplayValue(metadata.version)}.`
      : "",
    getDisplayValue(metadata.outputFormat)
      ? `Formato de saída: ${getDisplayValue(metadata.outputFormat)}.`
      : "",
  ]
    .filter(Boolean)
    .join("<br />");
  const sourceParameters = getDisplayValue(
    metadata.sourceParameters ?? technicalMetadata,
  );
  const legisLinks = getDisplayValue(metadata.legisLinks);
  const ckanMetadataUrl = normalizeMetadataUrl(metadata.ckanMetadataUrl);
  const downloadAllUrl = buildDownloadAllUrl(ckanMetadataUrl);
  const hasAdditionalInformation = Boolean(
    summaryDescription ||
    sourceParameters ||
    legisLinks ||
    metadataLinks.length,
  );
  const groupName =
    getDisplayValue(layer.layerGroup?.name) ||
    formatFallbackLabel(layer.groupId) ||
    "Sem categoria";
  const wmsUrl = getWmsUrl(layer, metadataLinks);
  const apiBaseUrl = import.meta.env.VITE_API_URL || "/api";
  const proxyWmsUrl = layer.id
    ? `${apiBaseUrl}/maps/proxy/layers/${layer.id}/wms`
    : "";

  const handleCopyWms = async () => {
    if (!proxyWmsUrl) return;

    await navigator.clipboard.writeText(proxyWmsUrl);
    setCopiedWms(true);
    setShowWmsInstructions(true);
    window.setTimeout(() => setCopiedWms(false), 2000);
  };

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden bg-background/95 transition-all duration-300 ease-in-out",
        open
          ? "translate-x-0 opacity-100 visible"
          : "translate-x-[24px] opacity-0 invisible pointer-events-none",
        className,
      )}
      aria-label={`Informações da camada ${layer.name}`}
    >
      <div className="border-b bg-background/95 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Camada do mapa
            </p>
            <h2 className="text-xl font-semibold leading-tight text-foreground">
              {layer.name}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full"
            onClick={onClose}
            aria-label="Fechar informações da camada"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
          <span
            className="h-2 w-2 rounded-full bg-primary"
            aria-hidden="true"
          />
          <span className="truncate">Grupo: {groupName}</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-3 p-4">
          {downloadAllUrl && (
            <Button
              id="baixar-tudo"
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-center h-10 px-4 rounded-xl"
              asChild
            >
              <a href={downloadAllUrl} target="_blank" rel="noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Baixar tudo
              </a>
            </Button>
          )}

          <InformationBlock
            title="Sobre esta camada"
            value={summaryDescription}
            icon={FileText}
          />

          <LegisInformationBlock
            rawLegisLinks={legisLinks}
            apiBaseUrl={apiBaseUrl}
          />

          {Array.isArray(layer.colors) &&
            layer.colors
              .filter((c) => c.legisUrl && c.legisUrl.trim())
              .map((c, idx) => (
                <LegisInformationBlock
                  key={`color-legis-${c.id || c.value || idx}`}
                  rawLegisLinks={c.legisUrl}
                  title={`Legis: ${c.label || c.value || "Definição Normativa"}`}
                  apiBaseUrl={apiBaseUrl}
                />
              ))}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 justify-start h-10 px-4 rounded-xl gap-2"
              disabled={!ckanMetadataUrl}
              asChild={!!ckanMetadataUrl}
            >
              {ckanMetadataUrl ? (
                <a href={ckanMetadataUrl} target="_blank" rel="noreferrer">
                  <BookA className="h-4 w-4 text-primary" />
                  Metadados
                </a>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <BookA className="h-4 w-4 text-muted-foreground" />
                  Metadados
                </span>
              )}
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted shrink-0">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs" side="top" align="end">
                  <div className="text-xs leading-relaxed space-y-1.5 p-1">
                    <p>Metadados são dados que descrevem outros dados.</p>
                    <div className="border-t pt-1.5 mt-1.5 text-[11px] text-muted-foreground space-y-1">
                      <p className="font-semibold text-foreground">Nos metadados desta camada, se encontram:</p>
                      <p>(1) os estudos sobre o dado;</p>
                      <p>(2) descrição semântica do dado;</p>
                      <p>(3) descrição técnica do dado (fonte, transformações e formato);</p>
                      <p>(4) opções de consumo (geoserver e download);</p>
                      <p>(5) classificação do dado na organização do Urbis (permitindo ver outros dados semelhantes).</p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <InformationBlock
            title="Avisos"
            value={sourceParameters}
            icon={AlertTriangle}
            valueClassName="text-red-600 dark:text-red-400 font-medium"
          />

          <LinksBlock links={metadataLinks} />
        </div>
      </div>
    </aside>
  );
};
