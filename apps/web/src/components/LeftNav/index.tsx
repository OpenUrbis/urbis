import { useNavigationContext } from "../../hooks/useNavigationContext";
import { Search } from "../Search";
import "./style.scss";

export const LeftNav = () => {
  const navigationContext = useNavigationContext();

  return (
    <div className="left-nav">
      <Search />
      {navigationContext.currentPage.value}
    </div>
  );
};
