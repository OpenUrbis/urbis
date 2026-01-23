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
        A plataforma Urbis é um conjunto de ferramentas digitais da Prefeitura de São Paulo para
        consulta de mapas, dados urbanísticos, ambientais e serviços relacionados ao planejamento
        urbano da cidade.
      </p>
    ),
  },
  {
    id: "como-usar-mapa",
    question: "Como usar o mapa para consultar um endereço ou lote?",
    answer: (
      <p className="text-xs text-muted-foreground">
        Utilize a barra de busca do Mapa.Urbis para digitar o endereço, número de contribuinte ou
        inscrição cadastral e visualize informações usando as camadas disponíveis.
      </p>
    ),
  },
  {
    id: "onde-encontro-documentos",
    question: "Onde encontro documentos e certidões urbanísticas?",
    answer: (
      <p className="text-xs text-muted-foreground">
        Os links estão nas seções &quot;Doc. técnica&quot; e &quot;+Info&quot;, além dos sistemas
        específicos da Prefeitura.
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
  endpoint?: string;
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

function mergeHeaders(a: Record<string, string>, b: Record<string, string>) {
  var out: Record<string, string> = {};
  for (var k in a) out[k] = a[k];
  for (var k2 in b) out[k2] = b[k2];
  return out;
}

/**
 * API base (DEV)
 */
function getApiBase() {
  return "http://localhost:3000";
}

/**
 * API key (DEV) - usado para criar ticket e pegar download-url
 * (upload público normalmente não precisa)
 */
function getApiKey() {
  return "secret";
}

function buildApiKeyHeaders(): Record<string, string> {
  var key = getApiKey();
  if (!key) return {};
  return { "x-api-key": key };
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeFolderPath(p: string) {
  return (p || "").replace(/^\/+/, "").replace(/\/+$/, "");
}

function normalizeKeyMaybe(k: string) {
  // backend às vezes retorna "uploads/..." e às vezes "protocolos/..."
  // vamos manter como vier
  return (k || "").replace(/^\/+/, "");
}

function normalizePublicUrlMaybe(url: string) {
  // não mexe, só garante string
  return String(url || "");
}

/**
 * ==========================
 * TICKET (SEM async/await)
 * ==========================
 */
function createSupportTicket(params: {
  endpoint?: string;
  payload: {
    name: string;
    email: string;
    message: string;
    files: string[]; // keys do S3/MinIO
    type: FeedbackType;
    includeSectionData?: boolean;
    sectionData?: ReturnType<typeof buildSectionData>;
  };
}) {
  var base = getApiBase().replace(/\/$/, "");
  var raw = params.endpoint || "/support/create-ticket";
  var ep = raw.indexOf("http://") === 0 || raw.indexOf("https://") === 0 ? raw : base + raw;

  return fetch(ep, {
    method: "POST",
    headers: mergeHeaders({ "Content-Type": "application/json" }, buildApiKeyHeaders()),
    body: JSON.stringify(params.payload),
  }).then(function (res) {
    if (res.ok) return;

    return res.text().then(function (text) {
      try {
        var data = text ? JSON.parse(text) : null;
        var msg =
          data && typeof data.message === "string"
            ? data.message
            : data && Array.isArray(data.message)
              ? data.message.join(", ")
              : "Erro ao criar o ticket.";
        throw new Error(msg);
      } catch {
        throw new Error("Erro ao criar o ticket.");
      }
    });
  });
}

/**
 * ==========================
 * UPLOAD PUBLICO (DEV) - sem async/await
 * POST /files/public/upload-url
 * Retorna { uploadURL, key } ou { url, key } e opcional fields
 * ==========================
 */
function requestPublicUploadUrl(params: { contentType: string; folderPath: string }) {
  var base = getApiBase().replace(/\/$/, "");
  var url = base + "/files/public/upload-url";
  

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" }, // público: sem x-api-key
    body: JSON.stringify({
      contentType: params.contentType,
      folderPath: normalizeFolderPath(params.folderPath),
    }),
  }).then(function (res) {
    return res.text().then(function (t) {
      var data = t ? safeJsonParse(t) : null;

      if (!res.ok) {
        var msg =
          (data && typeof data.message === "string" && data.message) ||
          (data && Array.isArray(data.message) ? data.message.join(", ") : "") ||
          ("Erro HTTP " + res.status);
        throw new Error(msg);
      }

      var uploadURL = data && (data.uploadURL || data.uploadUrl || data.url);
      var key = data && data.key;

      var rawFields = data && data.fields;
      var fields =
        rawFields && typeof rawFields === "object" && Object.keys(rawFields).length > 0
          ? rawFields
          : null;

      if (!uploadURL || !key) throw new Error("Resposta inválida da API pública de upload.");

      return {
        uploadURL: normalizePublicUrlMaybe(uploadURL),
        key: normalizeKeyMaybe(key),
        fields: fields,
      };
    });
  });
}

/**
 * Preview: pegue uma URL assinada de download (privado)
 */
function requestDownloadUrl(key: string) {
  var base = getApiBase().replace(/\/$/, "");
  var url = base + "/files/download-url?key=" + encodeURIComponent(key);

  return fetch(url, {
    method: "GET",
    headers: mergeHeaders({ Accept: "application/json" }, buildApiKeyHeaders()),
  }).then(function (res) {
    return res.text().then(function (t) {
      var data = t ? safeJsonParse(t) : null;

      if (!res.ok) {
        var msg =
          (data && typeof data.message === "string" && data.message) || ("Erro HTTP " + res.status);
        throw new Error(msg);
      }

      var downloadURL = data && (data.downloadURL || data.downloadUrl || data.url);
      if (!downloadURL) throw new Error("Resposta inválida da API de download.");
      return downloadURL as string;
    });
  });
}

function getQueryParam(url: string, name: string) {
  try {
    return new URL(url).searchParams.get(name);
  } catch {
    return null;
  }
}

function crc32Table() {
  var c = 0;
  var table = new Array(256);
  for (var n = 0; n < 256; n++) {
    c = n;
    for (var k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
}

var __CRC32_TABLE: number[] | null = null;

function crc32OfUint8(arr: Uint8Array) {
  if (!__CRC32_TABLE) __CRC32_TABLE = crc32Table();
  var crc = 0xffffffff;
  for (var i = 0; i < arr.length; i++) {
    crc = (__CRC32_TABLE![(crc ^ arr[i]) & 0xff] ^ (crc >>> 8)) >>> 0;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function crc32Base64FromFile(file: File) {
  return file.arrayBuffer().then(function (buf) {
    var u8 = new Uint8Array(buf);
    var crc = crc32OfUint8(u8); // uint32
    // 4 bytes big-endian
    var b0 = (crc >>> 24) & 0xff;
    var b1 = (crc >>> 16) & 0xff;
    var b2 = (crc >>> 8) & 0xff;
    var b3 = crc & 0xff;
    return btoa(String.fromCharCode(b0, b1, b2, b3));
  });
}

function uploadToS3(uploadInfo: { uploadURL: string; fields: any; key: string }, file: File) {
  // POST policy (se vier fields de verdade)
  if (uploadInfo.fields && typeof uploadInfo.fields === "object" && Object.keys(uploadInfo.fields).length) {
    var form = new FormData();
    Object.keys(uploadInfo.fields).forEach(function (k) {
      form.append(k, uploadInfo.fields[k]);
    });
    form.append("file", file);

    return fetch(uploadInfo.uploadURL, { method: "POST", body: form }).then(function (res) {
      if (res.ok) return;
      return res.text().then(function (t) {
        throw new Error("Falha ao enviar o arquivo (POST). " + (t || "HTTP " + res.status));
      });
    });
  }

  // PUT presigned (MinIO)
  var url = uploadInfo.uploadURL;
  var algo = getQueryParam(url, "x-amz-sdk-checksum-algorithm"); // ex: CRC32
  var needsCrc32 = algo && algo.toUpperCase() === "CRC32";

  function doPut(headers: Record<string, string>) {
    return fetch(url, {
      method: "PUT",
      mode: "cors",
      headers: headers,
      body: file,
    }).then(function (res) {
      if (res.ok) return;
      return res.text().then(function (t) {
        throw new Error("Falha ao enviar o arquivo (PUT). " + (t || "HTTP " + res.status));
      });
    });
  }

  // ⚠️ Não mande Content-Type aqui no primeiro teste.
  // Em vários presigns, Content-Type não foi assinado e pode dar mismatch/erro.
  if (needsCrc32) {
    return crc32Base64FromFile(file).then(function (crcB64) {
      return doPut({
        "x-amz-checksum-crc32": crcB64,
        "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
      });
    });
  }

  // Se não precisar checksum, manda super limpo
  return doPut({
    "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
  });
}




function uploadFilesSequentially(params: { files: File[]; folderPath: string }) {
  var outKeys: string[] = [];
  var idx = 0;

  function next(): any {
    if (idx >= params.files.length) {
      return fetch("data:application/json,{}").then(function () {
        return outKeys;
      });
    }

    var f = params.files[idx];
    idx++;

    var contentType = (f && f.type) || "application/octet-stream";

    return requestPublicUploadUrl({ contentType: contentType, folderPath: params.folderPath }).then(
      function (info: any) {
        return uploadToS3({ uploadURL: info.uploadURL, fields: info.fields, key: info.key }, f).then(
          function () {
            outKeys.push(info.key);
            return next();
          }
        );
      }
    );
  }

  return next();
}

/**
 * ==========================
 * UI COMPONENTS
 * ==========================
 */

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

  const [files, setFiles] = React.useState<string[]>([]); // keys
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [selectedFileNames, setSelectedFileNames] = React.useState<string[]>([]);

  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const toggle = () =>
    setOpen(function (o) {
      return !o;
    });

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
      .then(function (keys: any) {
        var ks = keys || [];
        setFiles(ks);

        var firstKey = ks && ks.length ? ks[0] : null;
        if (firstKey) {
          return requestDownloadUrl(firstKey)
            .then(function (dl: string) {
              setPreviewUrl(dl);
              setSubmitting(false);
            })
            .catch(function () {
              setPreviewUrl(null);
              setSubmitting(false);
            });
        }

        setPreviewUrl(null);
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

  const firstFileName = selectedFileNames && selectedFileNames.length ? selectedFileNames[0] : "";
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
        <ChevronDown
          className={"w-4 h-4 transition-transform " + (open ? "rotate-180" : "rotate-0")}
        />
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

  const [files, setFiles] = React.useState<string[]>([]); // keys
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [selectedFileNames, setSelectedFileNames] = React.useState<string[]>([]);

  const [includeSectionData, setIncludeSectionData] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const toggle = () =>
    setOpen(function (o) {
      return !o;
    });

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
      .then(function (keys: any) {
        var ks = keys || [];
        setFiles(ks);

        var firstKey = ks && ks.length ? ks[0] : null;
        if (firstKey) {
          return requestDownloadUrl(firstKey)
            .then(function (dl: string) {
              setPreviewUrl(dl);
              setSubmitting(false);
            })
            .catch(function () {
              setPreviewUrl(null);
              setSubmitting(false);
            });
        }

        setPreviewUrl(null);
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

  const firstFileName = selectedFileNames && selectedFileNames.length ? selectedFileNames[0] : "";
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
        <ChevronDown
          className={"w-4 h-4 transition-transform " + (open ? "rotate-180" : "rotate-0")}
        />
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
                      className={"w-4 h-4 transition-transform " + (isOpen ? "rotate-180" : "rotate-0")}
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
