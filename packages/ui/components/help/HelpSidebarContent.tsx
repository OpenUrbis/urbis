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

type CollapsibleFeedbackSectionProps = {
  id: string;
  title: string;
  description: string;
  placeholder: string;
};

function CollapsibleFeedbackSection({
  id,
  title,
  description,
  placeholder,
}: CollapsibleFeedbackSectionProps) {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const toggle = () => setOpen((o) => !o);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setSuccess(null);
    setError(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!message.trim() && !file) {
      setError("Preencha a descrição ou anexe um print para enviar.");
      return;
    }

    setSubmitting(true);

    // Aqui você integraria com sua API de envio de e-mail.
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(
        "Mensagem enviada com sucesso. Uma cópia foi enviada para o seu e-mail cadastrado."
      );
      setMessage("");
      setFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }, 400);
  };

  React.useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  return (
    <div
      key={id}
      className="border border-border rounded-md bg-card text-card-foreground"
    >
      {/* Cabeçalho da seção (colapsável) */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="text-xs font-semibold">{title}</span>

        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {/* Conteúdo interno da seção */}
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3">
          <p className="text-xs text-muted-foreground">{description}</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                Descrição
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
                placeholder={placeholder}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                Anexar print da tela (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
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
                      alt="Pré-visualização do print"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                    {file?.name}
                  </span>
                </div>
              )}
            </div>

            {error && (
              <p className="text-[11px] text-destructive">
                {error}
              </p>
            )}

            {success && (
              <p className="text-[11px] text-emerald-600">
                {success}
              </p>
            )}

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

/**
 * Seção específica para "Relatar erro" com um boolean extra:
 * "Incluir dados da seção (URL, contexto, dados técnicos)".
 */
function ErrorFeedbackSection() {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [includeSectionData, setIncludeSectionData] = React.useState<boolean>(true); // 👈 BOOLEAN
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const toggle = () => setOpen((o) => !o);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setSuccess(null);
    setError(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!message.trim() && !file) {
      setError("Preencha a descrição ou anexe um print para enviar.");
      return;
    }

    setSubmitting(true);

    // Aqui você pode montar o "payload" incluindo o boolean:
    // const payload = {
    //   message,
    //   includeSectionData,
    //   file,
    //   // dados técnicos da seção (URL atual, rota, etc) podem ser incluídos aqui
    // };

    setTimeout(() => {
      setSubmitting(false);
      setSuccess(
        "Erro reportado com sucesso. Uma cópia foi enviada para o seu e-mail cadastrado."
      );
      setMessage("");
      setFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      // includeSectionData continua com o último valor selecionado
    }, 400);
  };

  React.useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  return (
    <div className="border border-border rounded-md bg-card text-card-foreground">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="text-xs font-semibold">Relatar erro</span>

        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3">
          <p className="text-xs text-muted-foreground">
            Relate problemas de funcionamento, erros de informação ou comportamentos inesperados.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
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
                Anexar print da tela (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
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
                      alt="Pré-visualização do print"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                    {file?.name}
                  </span>
                </div>
              )}
            </div>

            {/* 👇 BOOLEAN extra */}
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
                Incluir dados da seção (URL, contexto e informações técnicas) no relatório.
              </label>
            </div>

            {error && (
              <p className="text-[11px] text-destructive">
                {error}
              </p>
            )}

            {success && (
              <p className="text-[11px] text-emerald-600">
                {success}
              </p>
            )}

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
  // FAQ: abre/fecha seção e perguntas
  const [faqOpen, setFaqOpen] = React.useState(true);
  const [openQuestionId, setOpenQuestionId] = React.useState<string | null>(
    null
  );

  const toggleQuestion = (id: string) => {
    setOpenQuestionId((current) => (current === id ? null : id));
  };

  return (
    <div className="space-y-3">
      {/* FAQ (seção + perguntas colapsáveis) */}
      <div className="border border-border rounded-md bg-card text-card-foreground">
        <button
          type="button"
          onClick={() => setFaqOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
        >
          <span className="text-xs font-semibold">FAQ</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              faqOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>

        {faqOpen && (
          <div className="px-3 pb-3 pt-1 space-y-2">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openQuestionId === item.id;

              return (
                <div
                  key={item.id}
                  className="border border-border/40 rounded-md bg-background/40"
                >
                  <button
                    type="button"
                    onClick={() => toggleQuestion(item.id)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
                  >
                    <span className="text-xs font-medium">
                      {item.question}
                    </span>

                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        isOpen ? "rotate-180" : "rotate-0"
                      }`}
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

      {/* Dúvidas */}
      <CollapsibleFeedbackSection
        id="duvidas"
        title="Dúvidas"
        description="Use este espaço para enviar dúvidas específicas sobre o uso da plataforma."
        placeholder="Descreva sua dúvida com o máximo de detalhes possível..."
      />

      {/* Sugestões */}
      <CollapsibleFeedbackSection
        id="sugestoes"
        title="Sugestões"
        description="Compartilhe ideias e melhorias que você gostaria de ver na plataforma."
        placeholder="Descreva sua sugestão de melhoria..."
      />

      {/* Relatar erro com BOOLEAN extra */}
      <ErrorFeedbackSection />
    </div>
  );
}
