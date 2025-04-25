import { signal } from "@preact/signals";
import {
  Dialog,
  DialogActions,
  DialogButton,
  DialogContent,
  DialogTitle,
} from "@rmwc/dialog";
import { createElement, ReactNode } from "react";
import ReactJson from "react-json-view";
import { Button } from "rmwc";
import { useMapContext } from "../../hooks/useMapContext";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { useSearchContext } from "../../hooks/useSearchContext";
import "./style.scss";

const isOpen = signal<boolean>(false);

export const Debugger = () => {
  const searchContext = useSearchContext();
  const navigationContext = useNavigationContext();
  const mapContext = useMapContext();
  delete mapContext.overlayRef;

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
                    <div>
                      {createElement(ReactJson, {
                        collapsed: true,
                        src: JSON.parse(
                          JSON.stringify({
                            searchContext,
                            navigationContext,
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

      <Button
        className="debugger-button"
        raised
        onClick={() => (isOpen.value = true)}
      >
        Open Debugger
      </Button>
    </>
  );
};
