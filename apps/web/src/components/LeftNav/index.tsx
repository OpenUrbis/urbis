import { FeaturesView } from "../FeaturesView";
import { Search } from "../Search";
import "./style.scss";

export const LeftNav = () => {
  return (
    <div className="left-nav">
      <Search />
      <FeaturesView />
    </div>
  );
};
