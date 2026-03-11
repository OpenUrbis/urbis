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
  className
}: MapActionToolbarProps) => {
  return (
    <div className={cn("flex items-center gap-2 mb-4", className)}>
      {onChangeSelection && (
        <Button variant="outline" size="sm" onClick={onChangeSelection} className="gap-2">
          <span className="material-symbols-outlined text-sm">edit</span>
          Alterar Seleção
        </Button>
      )}
      {onEdit && (
        <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
          <span className="material-symbols-outlined text-sm">square_foot</span>
          Ajustar Perímetro
        </Button>
      )}
      {onPrint && (
        <Button variant="outline" size="sm" onClick={onPrint} className="gap-2">
          <span className="material-symbols-outlined text-sm">print</span>
          Imprimir
        </Button>
      )}
    </div>
  );
};
