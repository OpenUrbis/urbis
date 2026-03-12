import { Button } from "@/components/ui/button";
import { useNavigationContext } from '../../hooks/useNavigationContext';

export const BackButton = () => {
  const { navigatePop } = useNavigationContext();

  return (
    <Button
      variant="outline"
      onClick={() => navigatePop()}
      className="font-medium rounded"
    >
      <span className="material-symbols-outlined mr-2 text-base">arrow_back</span>
      Voltar
    </Button>
  );
};
