"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";
import CollapsibleFeedbackSection from "./components/CollapsibleFeedbackSection";
import { ErrorFeedbackSection } from "./components/ErrorFeedbackSection";

interface HelpTab {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  index?: number | null;
}

interface HelpFaqItem {
  id: string;
  question: string;
  answer: string;
  index?: number | null;
  tabs?: HelpTab[];
}

interface HelpSidebarContentProps {
  currentTabSlug: string;
  faqEndpointBase?: string;
  endpoint?: string;
  folderPath?: string;
}

export function HelpSidebarContent({
  currentTabSlug,
  faqEndpointBase = "http://localhost:3000/support/question-answers",
  endpoint = "/support/create-ticket",
  folderPath = "protocolos/arquivos",
}: HelpSidebarContentProps) {
  const [openQuestionId, setOpenQuestionId] = React.useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);
  const [faqItems, setFaqItems] = React.useState<HelpFaqItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const toggleQuestion = (id: string) => {
    setOpenQuestionId((current) => (current === id ? null : id));
  };

  React.useEffect(() => {
    let active = true;

    function normalizeValue(value: string) {
      return String(value || "").trim().toLowerCase();
    }

    function hasMatchingTab(item: HelpFaqItem) {
      if (!item.tabs || !item.tabs.length) {
        return false;
      }

      const current = normalizeValue(currentTabSlug);

      for (let i = 0; i < item.tabs.length; i++) {
        const tab = item.tabs[i];
        if (normalizeValue(tab.name) === current) {
          return true;
        }
      }

      return false;
    }

    function loadFaq() {
      setLoading(true);
      setError(null);
      setOpenQuestionId(null);

      fetch(faqEndpointBase, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error(
              "Não foi possível carregar as perguntas. Status: " + response.status,
            );
          }

          const contentType = response.headers.get("content-type") || "";

          if (contentType.indexOf("application/json") === -1) {
            throw new Error("A API de FAQ não retornou JSON.");
          }

          return response.json();
        })
        .then(function (data) {
          if (!active) return;

          const items = Array.isArray(data) ? (data as HelpFaqItem[]) : [];
          const filtered: HelpFaqItem[] = [];

          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (hasMatchingTab(item)) {
              filtered.push(item);
            }
          }

          const sorted = filtered.slice().sort(function (a, b) {
            const aIndex = typeof a.index === "number" ? a.index : Infinity;
            const bIndex = typeof b.index === "number" ? b.index : Infinity;
            return aIndex - bIndex;
          });

          setFaqItems(sorted);
        })
        .catch(function (err) {
          if (!active) return;

          setFaqItems([]);
          setError(
            err && err.message
              ? String(err.message)
              : "Erro ao carregar perguntas frequentes.",
          );
        })
        .then(function () {
          if (active) {
            setLoading(false);
          }
        });
    }

    loadFaq();

    return function () {
      active = false;
    };
  }, [currentTabSlug, faqEndpointBase]);

  return (
  <div className="flex h-full min-h-0 flex-col">
    <div className="min-h-0 flex-1 pr-1 overflow-y-auto">
      <div className="space-y-3">
        <span className="text-xs font-semibold text-foreground">
          Respostas a perguntas frequentes
        </span>

        {loading && (
          <div className="text-xs text-muted-foreground">
            Carregando FAQ...
          </div>
        )}

        {!loading && error && (
          <div className="text-xs text-destructive">{error}</div>
        )}

        {!loading && !error && faqItems.length === 0 && (
          <div className="text-xs text-muted-foreground">
            Nenhuma pergunta frequente encontrada para esta seção.
          </div>
        )}

        {!loading &&
          !error &&
          faqItems.map(function (item) {
            const isOpen = openQuestionId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-md border border-border/40 bg-card"
              >
                <button
                  type="button"
                  onClick={() => toggleQuestion(item.id)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
                >
                  <span className="text-xs font-medium">{item.question}</span>

                  <ChevronDown
                    className={
                      "h-4 w-4 transition-transform " +
                      (isOpen ? "rotate-180" : "")
                    }
                  />
                </button>

                {isOpen && (
                  <div className="whitespace-pre-line px-3 pb-3 pt-1 text-xs text-muted-foreground">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>

    <div className="mt-auto shrink-0 border-t border-border/40 pt-4">
      <div className="rounded-md border border-border bg-card">
        <button
          type="button"
          onClick={() =>
            setFeedbackOpen(function (open) {
              return !open;
            })
          }
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
        >
          <span className="text-xs font-semibold">
            Dúvidas, sugestões e erros
          </span>

          <ChevronDown
            className={
              "h-4 w-4 transition-transform " +
              (feedbackOpen ? "rotate-180" : "")
            }
          />
        </button>

        {feedbackOpen && (
          <div className="space-y-3 px-3 pb-3 pt-2">
            <CollapsibleFeedbackSection
              id="duvidas"
              title="Dúvidas"
              description="Envie dúvidas específicas sobre o uso da plataforma."
              placeholder="Descreva sua dúvida..."
              type="inquiry"
              endpoint={endpoint}
              folderPath={folderPath}
            />

            <ErrorFeedbackSection
              endpoint={endpoint}
              folderPath={folderPath}
            />

            <CollapsibleFeedbackSection
              id="sugestoes"
              title="Sugestões"
              description="Compartilhe ideias e melhorias para o sistema."
              placeholder="Descreva sua sugestão..."
              type="suggestion"
              endpoint={endpoint}
              folderPath={folderPath}
            />
          </div>
        )}
      </div>
    </div>
  </div>
);
}