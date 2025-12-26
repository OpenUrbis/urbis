import { signal } from "@preact/signals";
import { Bug } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createElement } from "react";
import ReactJson from "react-json-view";
import { useMapContext } from "../../hooks/useMapContext";
import { useSearchContext } from "../../hooks/useSearchContext";

const isOpen = signal<boolean>(false);

export const Debugger = () => {
  const searchContext = useSearchContext();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { overlayRef, ...mapContext } = useMapContext();

  return (
    <Dialog open={isOpen.value} onOpenChange={(open) => (isOpen.value = open)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Bug className="h-5 w-5" />
          <span className="sr-only">Open Debugger</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Debugger</DialogTitle>
        </DialogHeader>
        <div className="w-full min-w-[424px]">
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
        <DialogFooter>
           <DialogClose asChild>
             <Button type="button" variant="secondary">
               Fechar
             </Button>
           </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
