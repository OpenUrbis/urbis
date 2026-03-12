import { Button } from "@/components/ui/button";
import { useNavigationContext } from "../../hooks/useNavigationContext";

export const MenuToggleButton = () => {
  const { toggleDrawer } = useNavigationContext();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDrawer}
      className="mr-2"
      aria-label="Alternar menu"
    >
      <span className="material-symbols-outlined text-2xl">menu</span>
    </Button>
  );
};
