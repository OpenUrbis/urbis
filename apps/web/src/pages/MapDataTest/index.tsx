import { useState } from "react";
import {
  DynamicSystemProvider,
  DynamicSystemSidebar,
  DynamicSystemResults,
} from "@open-urbis/map";
import {
  Minus,
  Maximize2,
  X,
  FileText,
  PanelRightOpen,
  Sparkles,
} from "lucide-react";

export function MapDataTestPage() {
  const [isResultsOpen, setIsResultsOpen] = useState(true);
  const [isResultsMinimized, setIsResultsMinimized] = useState(false);

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_32%)] bg-slate-100 dark:bg-slate-950">
      <DynamicSystemProvider>
        <div className="flex h-full w-full flex-col overflow-hidden md:flex-row">
          {/* Sidebar (Left) */}
          <div className="z-20 md:h-full" style={{ maxWidth: "420px" }}>
            <DynamicSystemSidebar />
          </div>

          {/* Background Placeholder for the Map (takes remaining space) */}
          <div className="relative flex h-1/2 flex-1 items-center justify-center border-t border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-slate-100 md:h-full md:border-t-0 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:36px_36px] dark:bg-[linear-gradient(to_right,rgba(51,65,85,0.24)_1px,transparent_1px),linear-gradient(to_bottom,rgba(51,65,85,0.24)_1px,transparent_1px)]" />

            <div className="relative z-10 flex max-w-md flex-col items-center px-6 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                Visualização MapData
              </div>
              <p className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Área de mapa pronta para integração visual
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                O painel lateral de resultados foi reorganizado para uma leitura
                mais compacta, moderna e com os detalhes técnicos sempre
                expandidos.
              </p>
            </div>

            {/* Floating Results Window */}
            {isResultsOpen && (
              <div
                className={`absolute bottom-0 right-0 z-50 flex flex-col border border-slate-200/80 bg-white/95 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-all duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-950/95 ${
                  isResultsMinimized
                    ? "h-[58px] w-full rounded-t-2xl md:bottom-6 md:right-6 md:w-[360px] md:rounded-2xl"
                    : "h-[78vh] max-h-[860px] w-full rounded-t-3xl md:bottom-5 md:right-5 md:h-[calc(100%-40px)] md:w-[min(640px,calc(100%-32px))] md:rounded-3xl lg:right-8 lg:w-[680px] xl:right-10 xl:w-[720px]"
                }`}
              >
                {/* Window Header */}
                <div
                  className="flex cursor-pointer select-none items-center justify-between rounded-t-3xl border-b border-slate-200/80 px-4 py-3.5 text-foreground md:px-5 dark:border-slate-800"
                  onClick={() => setIsResultsMinimized(!isResultsMinimized)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold tracking-tight">
                        Resultados da Pesquisa
                      </h3>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                        Parâmetros, zonas e notas técnicas em visualização
                        expandida
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsResultsMinimized(!isResultsMinimized);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-900"
                    >
                      {isResultsMinimized ? (
                        <Maximize2 className="h-4 w-4" />
                      ) : (
                        <Minus className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsResultsOpen(false);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Window Content */}
                <div
                  className={`flex-1 overflow-hidden bg-slate-50/80 text-foreground transition-opacity duration-300 dark:bg-slate-950 ${isResultsMinimized ? "pointer-events-none opacity-0" : "opacity-100"}`}
                >
                  <DynamicSystemResults />
                </div>
              </div>
            )}

            {/* Button to reopen results if closed */}
            {!isResultsOpen && (
              <button
                onClick={() => {
                  setIsResultsOpen(true);
                  setIsResultsMinimized(false);
                }}
                className="absolute bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg backdrop-blur transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100 dark:hover:bg-slate-900 md:right-8"
              >
                <PanelRightOpen className="h-4 w-4" />
                Abrir Resultados
              </button>
            )}
          </div>
        </div>
      </DynamicSystemProvider>
    </div>
  );
}

export default MapDataTestPage;
