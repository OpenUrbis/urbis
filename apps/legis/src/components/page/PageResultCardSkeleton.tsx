import { cn } from "@open-urbis/map-ui";

interface PageResultCardSkeletonProps {
  viewMode: "grid" | "list";
  /** Usado apenas para variar levemente as larguras e evitar aparência robótica. */
  index?: number;
}

const TITLE_WIDTHS = ["w-[92%]", "w-[78%]", "w-[85%]"];
const SUMMARY_LAST_WIDTHS = ["w-[62%]", "w-[48%]", "w-[70%]"];

/** Barra neutra: o pulso fica no container, para todas as barras piscarem juntas. */
function Bar({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("bg-muted", className)} />;
}

/**
 * Placeholder com a mesma estrutura do PageResultCard (classificação, referência,
 * título, ementa/resumo e metadados), preservando altura e espaçamentos reais.
 */
export function PageResultCardSkeleton({
  viewMode,
  index = 0,
}: PageResultCardSkeletonProps) {
  const isGrid = viewMode === "grid";
  const titleWidth = TITLE_WIDTHS[index % TITLE_WIDTHS.length];
  const summaryLastWidth =
    SUMMARY_LAST_WIDTHS[index % SUMMARY_LAST_WIDTHS.length];

  return (
    <div
      role="status"
      aria-label="Carregando documento"
      className={cn(
        "animate-pulse",
        isGrid
          ? "flex h-full flex-col border p-4"
          : "flex flex-col gap-2 border-b px-1 py-4",
      )}
    >
      {/* Classificação + ações */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Bar className="h-[22px] w-32 rounded-full" />
          <Bar className="h-[22px] w-24 rounded-full" />
        </div>
        <div className="-mr-1 -mt-1 flex shrink-0 gap-0.5">
          <Bar className="h-7 w-7" />
          <Bar className="h-7 w-7" />
        </div>
      </div>

      {/* Referência normativa */}
      <Bar className="mt-2 h-4 w-[45%]" />

      {/* Título */}
      <div className={cn("space-y-1.5", isGrid ? "mt-2" : "mt-1")}>
        <Bar className={cn(isGrid ? "h-4" : "h-5", titleWidth)} />
        {isGrid && <Bar className="h-4 w-[60%]" />}
      </div>

      {/* Complementos de identificação */}
      <Bar className="mt-2 h-3 w-[38%]" />

      {/* Ementa / Resumo / Prévia */}
      <div className="mt-3 space-y-1.5 border-l pl-3">
        <Bar className="h-2.5 w-16" />
        <Bar className="h-3 w-full" />
        <Bar className="h-3 w-full" />
        {isGrid && <Bar className="h-3 w-full" />}
        <Bar className={cn("h-3", summaryLastWidth)} />
      </div>

      {/* Metadados */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-4 gap-y-1",
          isGrid ? "mt-auto pt-3" : "mt-3",
        )}
      >
        <Bar className="h-2.5 w-24" />
        <Bar className="h-2.5 w-20" />
        <Bar className="h-2.5 w-16" />
      </div>
    </div>
  );
}

export function PageResultListSkeleton({
  viewMode,
  count,
}: {
  viewMode: "grid" | "list";
  count?: number;
}) {
  const total = count ?? (viewMode === "grid" ? 6 : 5);

  return (
    <div
      aria-busy="true"
      className={cn(
        viewMode === "list"
          ? "flex flex-col"
          : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch",
      )}
    >
      {Array.from({ length: total }, (_, index) => (
        <PageResultCardSkeleton key={index} viewMode={viewMode} index={index} />
      ))}
    </div>
  );
}
