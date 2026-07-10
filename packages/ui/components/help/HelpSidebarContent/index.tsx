"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";
import { CollapsibleFeedbackSection } from "./components/CollapsibleFeedbackSection";
import { ErrorFeedbackSection } from "./components/ErrorFeedbackSection";

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
        A plataforma Urbis reúne mapas, dados urbanísticos, ambientais e
        territoriais da Prefeitura de São Paulo, permitindo consultas e análises
        para apoio ao planejamento urbano.
      </p>
    ),
  },
  {
    id: "como-usar-mapa",
    question: "Como usar o Mapa para consultar um endereço ou lote?",
    answer: (
      <p className="text-xs text-muted-foreground">
        Utilize a barra de busca para pesquisar por endereço, número de
        contribuinte ou inscrição cadastral e ative as camadas desejadas.
      </p>
    ),
  },
  {
    id: "camadas-nao-aparecem",
    question: "Ativei uma camada e nada apareceu. O que pode ser?",
    answer: (
      <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
        <li>Algumas camadas exigem mais zoom.</li>
        <li>A camada pode não existir para aquela área.</li>
        <li>Tente atualizar a página.</li>
      </ul>
    ),
  },
  {
    id: "significado-cores",
    question: "O que significam as cores e símbolos do mapa?",
    answer: (
      <p className="text-xs text-muted-foreground">
        As cores variam conforme a camada ativa. A legenda pode ser visualizada
        ao expandir cada camada no painel.
      </p>
    ),
  },
  {
    id: "dados-atualizados",
    question: "Com que frequência os dados são atualizados?",
    answer: (
      <p className="text-xs text-muted-foreground">
        A atualização depende da base de origem. Algumas camadas são atualizadas
        periodicamente, outras conforme publicação oficial.
      </p>
    ),
  },
  {
    id: "problemas-mapa",
    question: "O mapa está lento ou não carrega. O que fazer?",
    answer: (
      <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
        <li>Reduza o número de camadas ativas.</li>
        <li>Verifique sua conexão.</li>
        <li>Tente outro navegador.</li>
      </ul>
    ),
  },
];

export function HelpSidebarContent() {
  const [openQuestionId, setOpenQuestionId] = React.useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);

  const toggleQuestion = (id: string) => {
    setOpenQuestionId((current) => (current === id ? null : id));
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* ===================== */}
      {/* FAQ (topo) - área que pode rolar */}
      {/* ===================== */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        <div className="space-y-3">
          <span className="text-xs font-semibold text-foreground">
            Respostas a perguntas frequentes
          </span>

          {FAQ_ITEMS.map((item) => {
            const isOpen = openQuestionId === item.id;

            return (
              <div
                key={item.id}
                className="border border-border/40 rounded-md bg-card"
              >
                <button
                  type="button"
                  onClick={() => toggleQuestion(item.id)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
                >
                  <span className="text-xs font-medium">{item.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isOpen ? "rotate-180" : ""
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
      </div>

      {/* ===================== */}
      {/* FEEDBACK (sempre colado no fundo) */}
      {/* ===================== */}
      <div className="shrink-0 pt-4 mt-4 border-t border-border/40">
        <div className="border border-border rounded-md bg-card">
          <button
            type="button"
            onClick={() => setFeedbackOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
          >
            <span className="text-xs font-semibold">
              Dúvidas, sugestões e erros
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                feedbackOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {feedbackOpen && (
            <div className="px-3 pb-3 pt-2 space-y-3">
              <CollapsibleFeedbackSection
                id="duvidas"
                title="Dúvidas"
                description="Envie dúvidas específicas sobre o uso da plataforma."
                placeholder="Descreva sua dúvida..."
                type="inquiry"
                endpoint="/support/create-ticket"
                folderPath="protocolos/arquivos"
              />

              <CollapsibleFeedbackSection
                id="sugestoes"
                title="Sugestões"
                description="Compartilhe ideias e melhorias para o sistema."
                placeholder="Descreva sua sugestão..."
                type="suggestion"
                endpoint="/support/create-ticket"
                folderPath="protocolos/arquivos"
              />

              <ErrorFeedbackSection
                endpoint="/support/create-ticket"
                folderPath="protocolos/arquivos"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
