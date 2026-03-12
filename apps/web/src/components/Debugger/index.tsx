import { signal } from "@preact/signals";
import { Bug, Copy } from "lucide-react";
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

  const getDebugData = () => {
    return JSON.parse(
      JSON.stringify({
        searchContext,
        mapContext,
      })
    );
  };

  const copyToClipboard = () => {
    const data = getDebugData();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

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
            src: getDebugData(),
          })}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
           <Button type="button" variant="outline" onClick={copyToClipboard} className="gap-2">
             <Copy className="h-4 w-4" />
             Copiar JSON
           </Button>
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
