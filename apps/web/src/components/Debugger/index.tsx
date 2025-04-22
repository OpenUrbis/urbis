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
import { useNavigationContext } from "../../context/NavigationContext";
import { useSearchContext } from "../../context/SearchContext";
import { useMapContext } from "../../hooks/useMapContext";
import "./style.scss";

const isOpen = signal<boolean>(false);

export const Debugger = () => {
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
