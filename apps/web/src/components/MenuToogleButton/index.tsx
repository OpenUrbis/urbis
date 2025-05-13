import { Button } from "@rmwc/button";
import "@rmwc/button/styles";
import "@rmwc/icon/styles";
import { useNavigationContext } from "../../hooks/useNavigationContext";

export const MenuToggleButton = () => {
  const { drawerOpen, toggleDrawer } = useNavigationContext();

  return (
    <Button
      unelevated
      className="d-block d-md-none"
      onClick={toggleDrawer}
      icon={drawerOpen.value ? "close" : "search"}
    >
      {drawerOpen.value ? "Fechar" : "Buscar"}
    </Button>
  );
};