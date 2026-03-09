import { DynamicSystemResults } from "@open-urbis/map";
import { Button } from "@open-urbis/map-ui";
import { FileText, Maximize2, Minus, X } from "lucide-react";
import { useState, useEffect } from "react";

export const ProspectiveSearchResults = () => {
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isResultsMinimized, setIsResultsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      {/* Floating Results Window */}
      {isResultsOpen && (
        <div
          className={`absolute bottom-0 right-0 md:right-6 lg:right-16 bg-background rounded-t-xl md:rounded-t-2xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] border border-border z-30 flex flex-col transition-all duration-300 ease-in-out ${
            isResultsMinimized
              ? "w-full md:w-[320px] h-[48px]"
              : "w-full md:w-[90vw] lg:w-[920px] h-[85vh] md:h-[700px] max-h-[85vh]"
          }`}
          style={!isResultsMinimized && !isMobile ? { maxWidth: 'calc(100% - 506px)' } : {}}
        >
          {/* Window Header */}
          <div
            className="bg-card text-foreground px-4 py-3 flex justify-between items-center rounded-t-xl md:rounded-t-2xl cursor-pointer select-none border-b border-border"
            onClick={() => setIsResultsMinimized(!isResultsMinimized)}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <h3 className="text-sm font-semibold tracking-tight">
                Legendas, diretrizes e notas.
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsResultsMinimized(!isResultsMinimized);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {isResultsMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsResultsOpen(false);
                }}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Window Content */}
          <div
            className={`flex-1 overflow-hidden transition-opacity duration-300 bg-background text-foreground ${
              isResultsMinimized ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <DynamicSystemResults />
          </div>
        </div>
      )}

      {/* Button to reopen results if closed */}
      {!isResultsOpen && (
        <div className="absolute bottom-6 right-16 z-30">
          <Button
            onClick={() => {
              setIsResultsOpen(true);
              setIsResultsMinimized(false);
            }}
            className="rounded-full shadow-lg gap-2"
          >
            <FileText className="w-4 h-4" />
            Abrir Resultados
          </Button>
        </div>
      )}
    </>
  );
};
