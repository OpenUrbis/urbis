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
        A plataforma Urbis é um conjunto de ferramentas digitais da Prefeitura
        de São Paulo para consulta de mapas, dados urbanísticos, ambientais e
        serviços relacionados ao planejamento urbano da cidade.
      </p>
    ),
  },
  {
    id: "como-usar-mapa",
    question: "Como usar o mapa para consultar um endereço ou lote?",
    answer: (
      <p className="text-xs text-muted-foreground">
        Utilize a barra de busca do Mapa.Urbis para digitar o endereço, número
        de contribuinte ou inscrição cadastral e visualize informações usando as
        camadas disponíveis.
      </p>
    ),
  },
  {
    id: "onde-encontro-documentos",
    question: "Onde encontro documentos e certidões urbanísticas?",
    answer: (
      <p className="text-xs text-muted-foreground">
        Os links estão nas seções "Doc. técnica" e "+Info",
        além dos sistemas específicos da Prefeitura.
      </p>
    ),
  },
  {
    id: "como-enviar-sugestoes",
    question: "Como posso enviar sugestões?",
    answer: (
      <p className="text-xs text-muted-foreground">
        Utilize a seção de Sugestões ou +Info para compartilhar melhorias para a
        plataforma.
      </p>
    ),
  },
];

export function HelpSidebarContent() {
  const [faqOpen, setFaqOpen] = React.useState(true);
  const [openQuestionId, setOpenQuestionId] = React.useState<string | null>(
    null,
  );

  const toggleQuestion = (id: string) => {
    setOpenQuestionId((current) => (current === id ? null : id));
  };

  return (
    <div className="space-y-3">
      <div className="border border-border rounded-md bg-card text-card-foreground">
        <button
          type="button"
          onClick={() => setFaqOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
        >
          <span className="text-xs font-semibold">FAQ</span>
          <ChevronDown
            className={
              "w-4 h-4 transition-transform " +
              (faqOpen ? "rotate-180" : "rotate-0")
            }
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
                    <span className="text-xs font-medium">{item.question}</span>
                    <ChevronDown
                      className={
                        "w-4 h-4 transition-transform " +
                        (isOpen ? "rotate-180" : "rotate-0")
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

      <CollapsibleFeedbackSection
        id="duvidas"
        title="Dúvidas"
        description="Use este espaço para enviar dúvidas específicas sobre o uso da plataforma."
        placeholder="Descreva sua dúvida com o máximo de detalhes possível..."
        type="inquiry"
        endpoint="/support/create-ticket"
        folderPath="protocolos/arquivos"
      />

      <CollapsibleFeedbackSection
        id="sugestoes"
        title="Sugestões"
        description="Compartilhe ideias e melhorias que você gostaria de ver na plataforma."
        placeholder="Descreva sua sugestão de melhoria..."
        type="suggestion"
        endpoint="/support/create-ticket"
        folderPath="protocolos/arquivos"
      />

      <ErrorFeedbackSection
        endpoint="/support/create-ticket"
        folderPath="protocolos/arquivos"
      />
    </div>
  );
}
