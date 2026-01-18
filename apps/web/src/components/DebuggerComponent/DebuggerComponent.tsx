import { signal } from "@preact/signals";
import {
  Dialog,
  DialogActions,
  DialogButton,
  DialogContent,
  DialogTitle,
} from "@rmwc/dialog";
import { ReactNode } from "react";
import { Button } from "rmwc";
import { useMapContext } from "../../context/MapContext/mapContext";
import { useNavigationContext } from "../../context/navigationContext";
import { useSearchContext } from "../../context/searchContext";
import "./DebuggerComponent.scss";

const isOpen = signal<boolean>(false);

export const DebuggerComponent = () => {
  const searchContext = useSearchContext();
  const navigationContext = useNavigationContext();
  const mapContext = useMapContext();

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
                      <h2>Search Context</h2>
                      <pre>{JSON.stringify(searchContext, null, 2)}</pre>
                      <h2>Navigation Context</h2>
                      <pre>{JSON.stringify(navigationContext, null, 2)}</pre>
                      <h2>Map Context</h2>
                      <pre>{JSON.stringify(mapContext, null, 2)}</pre>
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
