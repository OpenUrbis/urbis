import { useEffect } from "react";
import { Button } from "@open-urbis/map-ui";
import {
  MAP_TUTORIAL_STORAGE_KEY,
  isMobileScreen,
  mapTutorialEnabled,
  mapTutorialVisible,
} from "./state";

export const MapTutorial = () => {
  useEffect(() => {
    if (isMobileScreen() || !mapTutorialEnabled.value) {
      mapTutorialVisible.value = false;
      return;
    }

    mapTutorialVisible.value = false;
    const timeout = window.setTimeout(() => {
      if (!isMobileScreen() && mapTutorialEnabled.value) {
        mapTutorialVisible.value = true;
      }
    }, 3000);

    return () => {
      window.clearTimeout(timeout);
      mapTutorialVisible.value = false;
    };
  }, [mapTutorialEnabled.value]);

  if (isMobileScreen() || !mapTutorialEnabled.value || !mapTutorialVisible.value) return null;

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 top-16 hidden bg-background/35 backdrop-blur-[1px] backdrop-brightness-75 animate-in fade-in duration-500 md:block"
        style={{ zIndex: 10039 }}
      />

      <div
        className="pointer-events-none fixed left-1/2 top-[76px] hidden w-[min(320px,calc(100vw-2rem))] -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-500 md:block"
        style={{ zIndex: "var(--urbis-z-app-menu)" }}
      >
        <div className="pointer-events-auto rounded-xl border bg-white/95 px-3 py-2.5 text-xs text-muted-foreground shadow-md backdrop-blur-md dark:bg-background/95">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium leading-none text-foreground">
                Modo tutorial
              </p>
              <p className="leading-relaxed">
                Rótulos fixos indicam onde ficam as principais ferramentas do
                mapa.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-mr-1 -mt-1 h-7 shrink-0 rounded-full px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => {
                mapTutorialEnabled.value = false;
                mapTutorialVisible.value = false;
                window.localStorage.setItem(MAP_TUTORIAL_STORAGE_KEY, "false");
              }}
              aria-label="Sair do modo tutorial"
            >
              Sair
            </Button>
          </div>

          <div className="mt-2 grid gap-1 text-[11px] leading-relaxed">
            <p>
              <span className="font-medium text-foreground">Esquerda:</span>{" "}
              localização e busca.
            </p>
            <p>
              <span className="font-medium text-foreground">Direita:</span>{" "}
              conteúdos e camadas.
            </p>
            <p>
              <span className="font-medium text-foreground">Abaixo:</span>{" "}
              ferramentas gerais e licenciamento.
            </p>
            <p className="mt-1 pt-1.5 border-t border-border/50 text-[11px]">
              <span className="font-semibold text-foreground">💡 Dica do mapa:</span>{" "}
              clique com o <strong>botão direito do mouse</strong> em qualquer ponto do mapa para ver coordenadas, consultar a tabela de atributos ou desenhar no local.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
