import { useNavigationContext } from "../../hooks/useNavigationContext";
import { Search } from "../Search";
import "./style.scss";

export const LeftNav = () => {
  const { drawerOpen, currentPage } = useNavigationContext();

  return (
    <div className={`left-nav ${drawerOpen.value ? "active" : ""}`}>
      <div className="page-stack">
        <Search />
        {currentPage.value}
      </div>
    </div>
  );
};