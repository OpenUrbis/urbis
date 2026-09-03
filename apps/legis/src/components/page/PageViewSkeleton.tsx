import { cn } from "@open-urbis/map-ui";
import { ChevronRight } from "lucide-react";

/** Barra neutra: o pulso fica nos containers, para tudo piscar em sincronia. */
function Bar({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("bg-muted", className)} />;
}

function ElementBlock({
  keyWidth,
  lastWidth,
}: {
  keyWidth: string;
  lastWidth: string;
}) {
  return (
    <>
      <div className="col-start-1 min-w-0 my-4 space-y-2 pl-2 pr-4 xl:pr-8">
        <Bar className={cn("h-4", keyWidth)} />
        <Bar className="h-3.5 w-full" />
        <Bar className="h-3.5 w-full" />
        <Bar className={cn("h-3.5", lastWidth)} />
      </div>
      <div className="hidden xl:block col-start-2" />
    </>
  );
}

/**
 * Placeholder da tela de visualização de documento. Reproduz a barra superior e a
 * mesma malha do NormativeDocumentRenderer (epígrafe centralizada, ementa à direita,
 * preâmbulo e elementos), evitando salto de layout quando o conteúdo carrega.
 */
export function PageViewSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando documento"
      className="flex flex-col min-h-screen bg-background"
    >
      {/* Barra superior */}
      <div className="sticky top-[--header-height] z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="w-full px-6 py-3 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex min-w-0 items-center gap-2">
            <Bar className="h-4 w-12" />
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30" />
            <Bar className="h-4 w-48" />
            <Bar className="h-5 w-36 rounded-full" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Bar className="h-8 w-20" />
            <Bar className="h-8 w-20" />
          </div>
        </div>
      </div>

      {/* Documento */}
      <div className="flex w-full justify-center">
        <div className="w-full max-w-[1400px] px-4 py-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-x-6 items-start py-6 pl-8 animate-pulse">
            <header className="col-start-1 min-w-0 mb-2 pr-4 xl:pr-8">
              {/* Epígrafe (centralizada) */}
              <div className="mb-4 flex justify-center">
                <Bar className="h-6 w-[420px] max-w-full" />
              </div>

              {/* Ementa (metade direita) */}
              <div className="mb-4 flex">
                <div className="ml-auto w-1/2 space-y-2">
                  <Bar className="h-4 w-full" />
                  <Bar className="h-4 w-full" />
                  <Bar className="h-4 w-[72%]" />
                </div>
              </div>

              {/* Preâmbulo */}
              <div className="mb-4 space-y-2">
                <Bar className="h-3.5 w-full" />
                <Bar className="h-3.5 w-[88%]" />
              </div>
            </header>
            <div className="hidden xl:block col-start-2" />

            <ElementBlock keyWidth="w-40" lastWidth="w-[68%]" />
            <ElementBlock keyWidth="w-28" lastWidth="w-[52%]" />
            <ElementBlock keyWidth="w-48" lastWidth="w-[76%]" />
            <ElementBlock keyWidth="w-32" lastWidth="w-[44%]" />
          </div>
        </div>
      </div>
    </div>
  );
}
