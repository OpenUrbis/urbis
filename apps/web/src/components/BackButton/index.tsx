import { Button, UrbisIcon } from "@open-urbis/map-ui";
import { useNavigationContext } from "../../hooks/useNavigationContext";

export const BackButton = () => {
  const { navigatePop } = useNavigationContext();

  return (
    <Button
      variant="outline"
      onClick={() => navigatePop()}
      className="font-medium rounded"
    >
      <UrbisIcon
        name="arrow_back"
        className="mr-2 text-base"
        aria-hidden="true"
      />
      Voltar
    </Button>
  );
};
