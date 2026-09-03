import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  UrbisIcon,
} from "@open-urbis/map-ui";
import { FIU_DISCLAIMER_MESSAGE, FIU_TEST_VALIDITY_TAG } from "../../utils/fiu";

interface FiuDisclaimerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const FiuDisclaimerModal = ({
  isOpen,
  onOpenChange,
  onConfirm,
}: FiuDisclaimerModalProps) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <UrbisIcon
              name="warning"
              className="text-amber-500 text-lg"
              aria-hidden="true"
            />
            <span>Aviso de Validade Demonstrativa</span>
          </DialogTitle>
          <div className="pt-2 space-y-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              {FIU_TEST_VALIDITY_TAG}
            </span>
            <DialogDescription className="text-xs leading-relaxed text-foreground/85">
              {FIU_DISCLAIMER_MESSAGE}
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button size="sm" onClick={handleConfirm}>
            Continuar e Gerar FIU
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
