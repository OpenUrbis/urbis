import { signal } from "@preact/signals";
import {
  Dialog,
  DialogActions,
  DialogButton,
  DialogContent,
  DialogTitle,
} from "@rmwc/dialog";
import { Icon } from "@rmwc/icon"; // Importar o componente Icon
import { createElement, ReactNode } from "react";
import ReactJson from "react-json-view";
import { useMapContext } from "../../hooks/useMapContext";
import { useSearchContext } from "../../hooks/useSearchContext";
import "./style.scss";

const isOpen = signal<boolean>(false);

export const Debugger = () => {
  const searchContext = useSearchContext();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { overlayRef, ...mapContext } = useMapContext();

  return (
    <>
      <Dialog
        open={isOpen.value}
        onClose={() => {
          isOpen.value = false;
        }}
      >
        {
          (
            <>
              <DialogTitle>Debugger</DialogTitle>
              <DialogContent>
                {
                  (
                    <div className="debugger-content">
                      {createElement(ReactJson, {
                        collapsed: true,
                        src: JSON.parse(
                          JSON.stringify({
                            searchContext,
                            mapContext,
                          })
                        ),
                      })}
                    </div>
                  ) as ReactNode
                }
              </DialogContent>
              <DialogActions>
                {
                  (
                    <DialogButton action="close">Fechar</DialogButton>
                  ) as ReactNode
                }
              </DialogActions>
            </>
          ) as ReactNode
        }
      </Dialog>

      <Icon
        icon="bug_report" // Ícone de depuração do Material Icons
        className="debugger-icon"
        onClick={() => (isOpen.value = true)}
        role="button"
        tabIndex={0} // Para acessibilidade
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            isOpen.value = true;
          }
        }}
      />
    </>
  );
};