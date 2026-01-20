"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "o-que-e-urbis",
    question: "O que é a plataforma Urbis?",
    answer: (
      <p className="text-xs text-muted-foreground">
        A plataforma Urbis é um conjunto de ferramentas digitais da Prefeitura de São Paulo
        para consulta de mapas, dados urbanísticos, ambientais e serviços relacionados ao
        planejamento urbano da cidade.
      </p>
    ),
  },
  {
    id: "como-usar-mapa",
    question: "Como usar o mapa para consultar um endereço ou lote?",
    answer: (
      <p className="text-xs text-muted-foreground">
        Utilize a barra de busca do Mapa.Urbis para digitar o endereço, número de contribuinte
        ou inscrição cadastral e visualize informações usando as camadas disponíveis.
      </p>
    ),
  },
  {
    id: "onde-encontro-documentos",
    question: "Onde encontro documentos e certidões urbanísticas?",
    answer: (
      <p className="text-xs text-muted-foreground">
        Os links estão nas seções &quot;Doc. técnica&quot; e &quot;+Info&quot;, além dos
        sistemas específicos da Prefeitura.
      </p>
    ),
  },
  {
    id: "como-enviar-sugestoes",
    question: "Como posso enviar sugestões?",
    answer: (
      <p className="text-xs text-muted-foreground">
        Utilize a seção de Sugestões ou +Info para compartilhar melhorias para a plataforma.
      </p>
    ),
  },
];

type FeedbackType = "inquiry" | "bug-report" | "suggestion";

type CollapsibleFeedbackSectionProps = {
  id: string;
  title: string;
  description: string;
  placeholder: string;
  type: FeedbackType;
  /**
   * Endpoint do ticket
   * default: "/support/create-ticket"
   */
  endpoint?: string;
  /**
   * Pasta do S3 (via API de upload-url)
   * default: "protocolos/arquivos"
   */
  folderPath?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function buildSectionData() {
  return {
    url: window.location.href,
    path: window.location.pathname,
    referrer: document.referrer || null,
    userAgent: navigator.userAgent,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    timestampISO: new Date().toISOString(),
  };
}

/**
 * API de URL assinada (Urbis)
 * POST https://api.urbis.sampa.br/files/public/upload-url
 * body: { contentType, folderPath }
 *
 * IMPORTANT: não tipar retorno como Promise<...> pra evitar erro do seu lib
 */
function requestUploadUrl(params: { contentType: string; folderPath: string }): any {
  return fetch("https://api.urbis.sampa.br/files/public/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contentType: params.contentType,
      folderPath: params.folderPath,
    }),
  }).then(function (res) {
    if (!res.ok) throw new Error("Erro ao obter URL de upload.");
    return res.json();
  });
}

/**
 * PUT direto no S3 com uploadUrl
 */
function uploadToS3(uploadUrl: string, file: File): any {
  return fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  }).then(function (res) {
    if (!res.ok) throw new Error("Falha ao enviar o arquivo.");
  });
}

/**
 * Upload sequencial
 * Retorna lista de URLs finais (fileUrl) para anexar no ticket.
 *
 * Sem Promise.resolve / new Promise
 */
function uploadFilesSequentially(params: { files: File[]; folderPath: string }): any {
  var out: string[] = [];
  var i = 0;

  function next(): any {
    if (i >= params.files.length) {
      // Evita Promise.resolve(out) (que usa Promise como valor)
      return fetch("data:application/json,{}").then(function () {
        return out;
      });
    }

    var f = params.files[i];
    i++;

    var contentType = f && f.type ? f.type : "application/octet-stream";

    return requestUploadUrl({
      contentType: contentType,
      folderPath: params.folderPath,
    }).then(function (data: any) {
      if (!data || !data.uploadUrl || !data.fileUrl) {
        throw new Error("Resposta inválida da API de upload.");
      }

      return uploadToS3(data.uploadUrl, f).then(function () {
        out.push(data.fileUrl);
        return next();
      });
    });
  }

  return next();
}

/**
 * Envia ticket (JSON) conforme sua API:
 * POST /support/create-ticket
 * { name, email, message, files: string[], type, includeSectionData?, sectionData? }
 */
function createSupportTicket(params: {
  endpoint: string;
  payload: {
    name: string;
    email: string;
    message: string;
    files: string[];
    type: FeedbackType;
    includeSectionData?: boolean;
    sectionData?: ReturnType<typeof buildSectionData>;
  };
}): any {
  return fetch(params.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params.payload),
  }).then(function (res) {
    if (res.ok) return;

    return res
      .json()
      .then(function (data: any) {
        var msg =
          data && typeof data.message === "string" ? data.message : "Erro ao criar o ticket.";
        throw new Error(msg);
      })
      .catch(function () {
        throw new Error("Erro ao criar o ticket.");
      });
  });
}

function CollapsibleFeedbackSection(props: CollapsibleFeedbackSectionProps) {
  var id = props.id;
  var title = props.title;
  var description = props.description;
  var placeholder = props.placeholder;
  var type = props.type;
  var endpoint = props.endpoint ? props.endpoint : "/support/create-ticket";
  var folderPath = props.folderPath ? props.folderPath : "protocolos/arquivos";

  const [open, setOpen] = React.useState(false);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");

  // Agora files = string[] (URLs finais)
  const [files, setFiles] = React.useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  // só pra mostrar nome/contagem selecionados (UX)
  const [selectedFileNames, setSelectedFileNames] = React.useState<string[]>([]);

  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const toggle = () => setOpen(function (o) { return !o; });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const fileList = e.target.files;

  const list: File[] = [];
  const names: string[] = [];

  const allowed = {
    "image/png": true,
    "image/svg+xml": true,
    "image/jpeg": true,
    "image/webp": true,
  } as any;

  const MAX_BYTES = 1024 * 1024; // 1MB

  setSuccess(null);
  setError(null);
  setPreviewUrl(null);

  if (!fileList || !fileList.length) {
    setFiles([]);
    setSelectedFileNames([]);
    return;
  }

  for (let i = 0; i < fileList.length; i++) {
    const f = fileList.item(i);
    if (!f) continue;

    const typeOk = !!(f.type && allowed[f.type]);
    if (!typeOk) {
      setError("Formato inválido. Envie apenas PNG, SVG, JPEG ou WEBP (máx. 1MB).");
      setFiles([]);
      setSelectedFileNames([]);
      // limpa input para permitir selecionar o mesmo arquivo novamente
      e.currentTarget.value = "";
      return;
    }

    if (typeof f.size === "number" && f.size > MAX_BYTES) {
      setError("Arquivo muito grande. Tamanho máximo: 1MB (PNG, SVG, JPEG ou WEBP).");
      setFiles([]);
      setSelectedFileNames([]);
      e.currentTarget.value = "";
      return;
    }

    list.push(f);
    names.push(f.name);
  }

  if (!list.length) {
    setFiles([]);
    setSelectedFileNames([]);
    return;
  }

  setSubmitting(true);
  setSelectedFileNames(names);

  uploadFilesSequentially({ files: list, folderPath: folderPath })
    .then(function (urls: any) {
      setFiles(urls || []);
      var firstUrl = urls && urls.length ? urls[0] : null;
      setPreviewUrl(firstUrl ? firstUrl : null);
      setSubmitting(false);
    })
    .catch(function (err: any) {
      setError(err && err.message ? err.message : "Falha ao enviar anexos.");
      setFiles([]);
      setSelectedFileNames([]);
      setPreviewUrl(null);
      setSubmitting(false);
    });
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!name.trim()) {
      setError("Informe seu nome.");
      return;
    }

    if (!email.trim() || !isValidEmail(email)) {
      setError("Informe um e-mail válido.");
      return;
    }

    if (!message.trim() && (!files || files.length === 0)) {
      setError("Preencha a descrição ou anexe um print para enviar.");
      return;
    }

    setSubmitting(true);

    createSupportTicket({
      endpoint: endpoint,
      payload: {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        files: files || [],
        type: type,
      },
    })
      .then(function () {
        setSuccess("Mensagem enviada com sucesso. Uma cópia foi enviada para o seu e-mail cadastrado.");

        setName("");
        setEmail("");
        setMessage("");
        setFiles([]);
        setSelectedFileNames([]);
        setPreviewUrl(null);

        setSubmitting(false);
      })
      .catch(function (err: any) {
        setError(err && err.message ? err.message : "Falha ao enviar. Tente novamente.");
        setSubmitting(false);
      });
  };

  const firstFileName =
    selectedFileNames && selectedFileNames.length ? selectedFileNames[0] : "";
  const extraCount =
    selectedFileNames && selectedFileNames.length > 1 ? selectedFileNames.length - 1 : 0;

  return (
    <div key={id} className="border border-border rounded-md bg-card text-card-foreground">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="text-xs font-semibold">{title}</span>
        <ChevronDown className={"w-4 h-4 transition-transform " + (open ? "rotate-180" : "rotate-0")} />
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3">
          <p className="text-xs text-muted-foreground">{description}</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Nome */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Nome</label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSuccess(null);
                  setError(null);
                }}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                           focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                placeholder="Seu nome"
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">E-mail</label>
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSuccess(null);
                  setError(null);
                }}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                           focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                placeholder="seuemail@exemplo.com"
                autoComplete="email"
                inputMode="email"
              />
              {email.trim() && !isValidEmail(email) && (
                <p className="text-[11px] text-destructive">E-mail inválido.</p>
              )}
            </div>

            {/* Mensagem */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Descrição</label>
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setSuccess(null);
                  setError(null);
                }}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                           focus-visible:ring-offset-2 focus-visible:ring-offset-background resize-y min-h-[80px]"
                placeholder={placeholder}
              />
            </div>

            {/* Arquivos */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Anexos (opcional)</label>
              <input
  type="file"
  accept=".png,.svg,.jpeg,.jpg,.webp,image/png,image/svg+xml,image/jpeg,image/webp"
  multiple
  onChange={handleFileChange}
  className="block w-full text-[11px] text-muted-foreground file:mr-2 file:py-1.5 file:px-3
             file:rounded-md file:border-0 file:text-[11px] file:font-medium
             file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
/>

              {previewUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="relative h-12 w-12 overflow-hidden rounded-md border border-border">
                    <img
                      src={previewUrl}
                      alt="Pré-visualização do primeiro anexo"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                    {firstFileName}
                    {extraCount > 0 ? " (+" + extraCount + ")" : ""}
                  </span>
                </div>
              )}
            </div>

            {error && <p className="text-[11px] text-destructive">{error}</p>}
            {success && <p className="text-[11px] text-emerald-600">{success}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs
                         bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70
                         disabled:cursor-not-allowed"
            >
              {submitting ? "Enviando..." : "Enviar"}
            </button>

            <p className="text-[10px] text-muted-foreground">
              Um e-mail de confirmação será enviado para o endereço cadastrado.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}

function ErrorFeedbackSection(props: { endpoint?: string; folderPath?: string }) {
  var endpoint = props.endpoint ? props.endpoint : "/support/create-ticket";
  var folderPath = props.folderPath ? props.folderPath : "protocolos/arquivos";

  const [open, setOpen] = React.useState(false);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [files, setFiles] = React.useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [selectedFileNames, setSelectedFileNames] = React.useState<string[]>([]);

  const [includeSectionData, setIncludeSectionData] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const toggle = () => setOpen(function (o) { return !o; });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    const list: File[] = [];
    const names: string[] = [];

    if (fileList && fileList.length) {
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList.item(i);
        if (f) {
          list.push(f);
          names.push(f.name);
        }
      }
    }

    setSuccess(null);
    setError(null);
    setPreviewUrl(null);

    if (!list.length) {
      setFiles([]);
      setSelectedFileNames([]);
      return;
    }

    setSubmitting(true);
    setSelectedFileNames(names);

    uploadFilesSequentially({ files: list, folderPath: folderPath })
      .then(function (urls: any) {
        setFiles(urls || []);

        var firstUrl = urls && urls.length ? urls[0] : null;
        setPreviewUrl(firstUrl ? firstUrl : null);

        setSubmitting(false);
      })
      .catch(function (err: any) {
        setError(err && err.message ? err.message : "Falha ao enviar anexos.");
        setFiles([]);
        setSelectedFileNames([]);
        setPreviewUrl(null);
        setSubmitting(false);
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!name.trim()) {
      setError("Informe seu nome.");
      return;
    }

    if (!email.trim() || !isValidEmail(email)) {
      setError("Informe um e-mail válido.");
      return;
    }

    if (!message.trim() && (!files || files.length === 0)) {
      setError("Preencha a descrição ou anexe um print para enviar.");
      return;
    }

    setSubmitting(true);

    createSupportTicket({
      endpoint: endpoint,
      payload: {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        files: files || [],
        type: "bug-report",
        includeSectionData: includeSectionData,
        sectionData: includeSectionData ? buildSectionData() : undefined,
      },
    })
      .then(function () {
        setSuccess("Erro reportado com sucesso. Uma cópia foi enviada para o seu e-mail cadastrado.");

        setName("");
        setEmail("");
        setMessage("");
        setFiles([]);
        setSelectedFileNames([]);
        setPreviewUrl(null);

        setSubmitting(false);
      })
      .catch(function (err: any) {
        setError(err && err.message ? err.message : "Falha ao enviar. Tente novamente.");
        setSubmitting(false);
      });
  };

  const firstFileName =
    selectedFileNames && selectedFileNames.length ? selectedFileNames[0] : "";
  const extraCount =
    selectedFileNames && selectedFileNames.length > 1 ? selectedFileNames.length - 1 : 0;

  return (
    <div className="border border-border rounded-md bg-card text-card-foreground">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="text-xs font-semibold">Relatar erro</span>
        <ChevronDown className={"w-4 h-4 transition-transform " + (open ? "rotate-180" : "rotate-0")} />
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3">
          <p className="text-xs text-muted-foreground">
            Relate problemas de funcionamento, erros de informação ou comportamentos inesperados.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Nome */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Nome</label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSuccess(null);
                  setError(null);
                }}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                           focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                placeholder="Seu nome"
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">E-mail</label>
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSuccess(null);
                  setError(null);
                }}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                           focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                placeholder="seuemail@exemplo.com"
                autoComplete="email"
                inputMode="email"
              />
              {email.trim() && !isValidEmail(email) && (
                <p className="text-[11px] text-destructive">E-mail inválido.</p>
              )}
            </div>

            {/* Mensagem */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Descrição do erro</label>
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setSuccess(null);
                  setError(null);
                }}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                           focus-visible:ring-offset-2 focus-visible:ring-offset-background resize-y min-h-[80px]"
                placeholder="Explique o que aconteceu, quais passos você seguiu e qual era o resultado esperado..."
              />
            </div>

            {/* Arquivos */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Anexos (opcional)</label>
              <input
  type="file"
  accept=".png,.svg,.jpeg,.jpg,.webp,image/png,image/svg+xml,image/jpeg,image/webp"
  multiple
  onChange={handleFileChange}
  className="block w-full text-[11px] text-muted-foreground file:mr-2 file:py-1.5 file:px-3
             file:rounded-md file:border-0 file:text-[11px] file:font-medium
             file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
/>

              {previewUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="relative h-12 w-12 overflow-hidden rounded-md border border-border">
                    <img
                      src={previewUrl}
                      alt="Pré-visualização do primeiro anexo"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                    {firstFileName}
                    {extraCount > 0 ? " (+" + extraCount + ")" : ""}
                  </span>
                </div>
              )}
            </div>

            {/* boolean extra */}
            <div className="flex items-start gap-2">
              <input
                id="include-section-data"
                type="checkbox"
                checked={includeSectionData}
                onChange={(e) => setIncludeSectionData(e.target.checked)}
                className="mt-[2px] h-3 w-3 rounded border border-input"
              />
              <label htmlFor="include-section-data" className="text-[11px] text-muted-foreground">
                Incluir dados da seção (URL, contexto e informações técnicas) no relatório.
              </label>
            </div>

            {error && <p className="text-[11px] text-destructive">{error}</p>}
            {success && <p className="text-[11px] text-emerald-600">{success}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs
                         bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70
                         disabled:cursor-not-allowed"
            >
              {submitting ? "Enviando..." : "Enviar"}
            </button>

            <p className="text-[10px] text-muted-foreground">
              Um e-mail de confirmação será enviado para o endereço cadastrado.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}

export function HelpSidebarContent() {
  const [faqOpen, setFaqOpen] = React.useState(true);
  const [openQuestionId, setOpenQuestionId] = React.useState<string | null>(null);

  const toggleQuestion = (id: string) => {
    setOpenQuestionId((current) => (current === id ? null : id));
  };

  return (
    <div className="space-y-3">
      {/* FAQ */}
      <div className="border border-border rounded-md bg-card text-card-foreground">
        <button
          type="button"
          onClick={() => setFaqOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
        >
          <span className="text-xs font-semibold">FAQ</span>
          <ChevronDown
            className={"w-4 h-4 transition-transform " + (faqOpen ? "rotate-180" : "rotate-0")}
          />
        </button>

        {faqOpen && (
          <div className="px-3 pb-3 pt-1 space-y-2">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openQuestionId === item.id;

              return (
                <div key={item.id} className="border border-border/40 rounded-md bg-background/40">
                  <button
                    type="button"
                    onClick={() => toggleQuestion(item.id)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
                  >
                    <span className="text-xs font-medium">{item.question}</span>
                    <ChevronDown
                      className={
                        "w-4 h-4 transition-transform " + (isOpen ? "rotate-180" : "rotate-0")
                      }
                    />
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 pt-1 text-xs text-muted-foreground">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dúvidas -> inquiry */}
      <CollapsibleFeedbackSection
        id="duvidas"
        title="Dúvidas"
        description="Use este espaço para enviar dúvidas específicas sobre o uso da plataforma."
        placeholder="Descreva sua dúvida com o máximo de detalhes possível..."
        type="inquiry"
        endpoint="/support/create-ticket"
        folderPath="protocolos/arquivos"
      />

      {/* Sugestões -> suggestion */}
      <CollapsibleFeedbackSection
        id="sugestoes"
        title="Sugestões"
        description="Compartilhe ideias e melhorias que você gostaria de ver na plataforma."
        placeholder="Descreva sua sugestão de melhoria..."
        type="suggestion"
        endpoint="/support/create-ticket"
        folderPath="protocolos/arquivos"
      />

      {/* Erro -> bug-report */}
      <ErrorFeedbackSection endpoint="/support/create-ticket" folderPath="protocolos/arquivos" />
    </div>
  );
}
