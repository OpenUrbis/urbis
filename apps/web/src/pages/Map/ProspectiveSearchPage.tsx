import { useNavigationContext } from "../../hooks/useNavigationContext";
import { DynamicSystemSidebar } from "@open-urbis/map";

export const ProspectiveSearchPage = () => {
  const { navigatePop } = useNavigationContext();

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <div className="flex-1 relative overflow-hidden rounded-xl border border-border shadow-sm bg-card flex flex-col">
        <DynamicSystemSidebar onBack={navigatePop} />
      </div>
    </div>
  );
};
