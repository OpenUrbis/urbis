import { Button } from "@open-urbis/map-ui";
import { useNavigationContext } from "../../hooks/useNavigationContext";

interface MenuToggleButtonProps {
  onClick?: () => void;
}

export const MenuToggleButton = ({ onClick }: MenuToggleButtonProps) => {
  const { toggleDrawer } = useNavigationContext();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      toggleDrawer();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="mr-2"
      aria-label="Alternar menu"
    >
      <span className="material-symbols-outlined text-2xl">menu</span>
    </Button>
  );
};
