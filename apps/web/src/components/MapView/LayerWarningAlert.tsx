import { useState, useEffect, useRef } from "preact/hooks";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@open-urbis/map-ui";

interface LayerWarningItem {
  id: string;
  layerName: string;
  warning: string;
}

export const LayerWarningAlert = () => {
  const [currentWarning, setCurrentWarning] = useState<LayerWarningItem | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleLayerWarningEvent = (event: Event) => {
      const customEvt = event as CustomEvent<{
        layerName: string;
        warning: string;
      }>;
      if (customEvt.detail?.warning) {
        if (timerRef.current) {
          window.clearTimeout(timerRef.current);
        }

        const newWarning: LayerWarningItem = {
          id: String(Date.now()),
          layerName: customEvt.detail.layerName,
          warning: customEvt.detail.warning,
        };

        setCurrentWarning(newWarning);

        timerRef.current = window.setTimeout(() => {
          setCurrentWarning(null);
          timerRef.current = null;
        }, 6000);
      }
    };

    window.addEventListener(
      "layer-warning-alert",
      handleLayerWarningEvent as EventListener,
    );
    return () => {
      window.removeEventListener(
        "layer-warning-alert",
        handleLayerWarningEvent as EventListener,
      );
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!currentWarning) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10095] max-w-lg w-[calc(100vw-2rem)] pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-white dark:bg-card text-foreground shadow-2xl backdrop-blur-md p-4 pr-10">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-red-500/10 rounded-xl text-red-600 dark:text-red-400 shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <h4 className="text-xs font-bold text-red-600 dark:text-red-400 tracking-wide uppercase">
              Aviso: {currentWarning.layerName}
            </h4>
            <p className="text-xs leading-relaxed text-foreground font-normal">
              {currentWarning.warning}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => {
            if (timerRef.current) {
              window.clearTimeout(timerRef.current);
              timerRef.current = null;
            }
            setCurrentWarning(null);
          }}
          aria-label="Fechar aviso"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* 6 Seconds Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/40 overflow-hidden">
          <div
            key={currentWarning.id}
            className="h-full bg-red-600 dark:bg-red-400 animate-layer-warning-timer origin-left"
            style={{
              animation: "layerWarningShrink 6s linear forwards",
            }}
          />
        </div>
      </div>
    </div>
  );
};
