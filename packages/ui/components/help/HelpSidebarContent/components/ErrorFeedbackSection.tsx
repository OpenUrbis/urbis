"use client";

import { ChevronDown, Loader2, X } from "lucide-react";
import * as React from "react";
import {
  UploadResult,
  buildSectionData,
  createSupportTicket,
  getRecaptchaToken,
  isValidEmail,
  uploadFilesSequentiallyWithRecaptcha,
} from "../utils";

export function ErrorFeedbackSection(props: {
  endpoint?: string;
  folderPath?: string;
}) {
  const endpoint = props.endpoint ? props.endpoint : "/support/create-ticket";
  const folderPath = props.folderPath
    ? props.folderPath
    : "protocolos/arquivos";

  const [open, setOpen] = React.useState(false);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [uploadedFiles, setUploadedFiles] = React.useState<UploadResult[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadCount, setUploadCount] = React.useState(0);

  const [includeSectionData, setIncludeSectionData] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const toggle = () => setOpen((o) => !o);

  const removeFile = (key: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.key !== key));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;

    if (!fileList || !fileList.length) {
      return;
    }

    setSuccess(null);
    setError(null);

    const currentCount = uploadedFiles.length;
    if (currentCount + fileList.length > 10) {
      setError("Máximo de 10 arquivos permitidos.");
      e.target.value = "";
      return;
    }

    const list: File[] = [];
    const MAX_BYTES = 1024 * 1024;
    const allowed = {
      "image/png": true,
      "image/svg+xml": true,
      "image/jpeg": true,
      "image/webp": true,
    } as any;

    for (let i = 0; i < fileList.length; i++) {
      const f = fileList.item(i);
      if (!f) continue;

      const typeOk = !!(f.type && allowed[f.type]);
      if (!typeOk) {
        setError(
          "Formato inválido. Envie apenas PNG, SVG, JPEG ou WEBP (máx. 1MB).",
        );
        e.target.value = "";
        return;
      }

      if (typeof f.size === "number" && f.size > MAX_BYTES) {
        setError(
          "Arquivo muito grande. Tamanho máximo: 1MB (PNG, SVG, JPEG ou WEBP).",
        );
        e.target.value = "";
        return;
      }

      list.push(f);
    }

    if (!list.length) {
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    setUploadCount(list.length);

    uploadFilesSequentiallyWithRecaptcha(
      { files: list, folderPath: folderPath },
      function (err, results) {
        if (err) {
          setError(err.message || "Falha ao enviar anexos.");
          setIsUploading(false);
          setUploadCount(0);
          e.target.value = "";
          return;
        }

        if (results) {
          setUploadedFiles((prev) => [...prev, ...results]);
        }

        setIsUploading(false);
        setUploadCount(0);
        e.target.value = "";
      },
    );
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

    if (!message.trim() && (!uploadedFiles || uploadedFiles.length === 0)) {
      setError("Preencha a descrição ou anexe um print para enviar.");
      return;
    }

    setSubmitting(true);

    getRecaptchaToken("create_ticket", function (err, token) {
      if (err || !token) {
        setError(err ? err.message : "Falha ao validar reCAPTCHA no envio.");
        setSubmitting(false);
        return;
      }

      createSupportTicket({
        endpoint: endpoint,
        payload: {
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          files: uploadedFiles.map((f) => f.key),
          type: "bug-report",
          recaptcha: token,
          includeSectionData: includeSectionData,
          sectionData: includeSectionData ? buildSectionData() : undefined,
        },
      })
        .then(function () {
          setSuccess(
            "Erro reportado com sucesso. Uma cópia foi enviada para o seu e-mail cadastrado.",
          );

          setName("");
          setEmail("");
          setMessage("");
          setUploadedFiles([]);

          setSubmitting(false);
        })
        .catch(function (err2: any) {
          setError(
            err2 && err2.message
              ? String(err2.message)
              : "Falha ao enviar. Tente novamente.",
          );
          setSubmitting(false);
        });
    });
  };

  return (
    <div className="border border-border rounded-md bg-card text-card-foreground">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="text-xs font-semibold">Relatar erro</span>
        <ChevronDown
          className={
            "w-4 h-4 transition-transform " + (open ? "rotate-180" : "rotate-0")
          }
        />
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3">
          <p className="text-xs text-muted-foreground">
            Relate problemas de funcionamento, erros de informação ou
            comportamentos inesperados.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                Nome
              </label>
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

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                E-mail
              </label>
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

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                Descrição do erro
              </label>
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

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                Anexos (opcional)
              </label>
              <input
                type="file"
                accept=".png,.svg,.jpeg,.jpg,.webp,image/png,image/svg+xml,image/jpeg,image/webp"
                multiple
                onChange={handleFileChange}
                disabled={isUploading || submitting}
                className="block w-full text-[11px] text-muted-foreground file:mr-2 file:py-1.5 file:px-3
                           file:rounded-md file:border-0 file:text-[11px] file:font-medium
                           file:bg-primary file:text-primary-foreground hover:file:bg-primary/90
                           disabled:opacity-50 disabled:cursor-not-allowed"
              />

              {(uploadedFiles.length > 0 || isUploading) && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.key}
                      className="relative aspect-square overflow-hidden rounded-md border border-border group"
                    >
                      <img
                        src={file.url}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(file.key)}
                        disabled={isUploading || submitting}
                        className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                        title="Remover"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {isUploading &&
                    [...Array(uploadCount)].map((_: any, i: number) => (
                      <div
                        key={`loading-${i}`}
                        className="relative aspect-square overflow-hidden rounded-md border border-border flex items-center justify-center bg-muted"
                      >
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ))}
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
              <label
                htmlFor="include-section-data"
                className="text-[11px] text-muted-foreground"
              >
                Incluir dados da seção (URL, contexto e informações técnicas) no
                relatório.
              </label>
            </div>

            {error && <p className="text-[11px] text-destructive">{error}</p>}
            {success && (
              <p className="text-[11px] text-emerald-600">{success}</p>
            )}

            <button
              type="submit"
              disabled={submitting || isUploading}
              className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs
                         bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70
                         disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Enviando...
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Carregando imagens...
                </>
              ) : (
                "Enviar"
              )}
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
