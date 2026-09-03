import { UrbisIcon } from "@open-urbis/map-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MapActionToolbarProps {
  onEdit?: () => void;
  onPrint?: () => void;
  onChangeSelection?: () => void;
  className?: string;
}

export const MapActionToolbar = ({
  onEdit,
  onPrint,
  onChangeSelection,
  className,
}: MapActionToolbarProps) => {
  return (
    <div className={cn("flex items-center gap-2 mb-4", className)}>
      {onChangeSelection && (
        <Button
          variant="outline"
          size="sm"
          onClick={onChangeSelection}
          className="gap-2"
        >
          <UrbisIcon name="edit" className="text-sm" aria-hidden="true" />
          Alterar Seleção
        </Button>
      )}
      {onEdit && (
        <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
          <UrbisIcon
            name="square_foot"
            className="text-sm"
            aria-hidden="true"
          />
          Ajustar Perímetro
        </Button>
      )}
      {onPrint && (
        <Button variant="outline" size="sm" onClick={onPrint} className="gap-2">
          <UrbisIcon name="print" className="text-sm" aria-hidden="true" />
          Imprimir
        </Button>
      )}
    </div>
  );
};
