import { Button } from "@open-urbis/map-ui";
import { ArrowLeft } from "lucide-react";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { DynamicSystemSidebar } from '@open-urbis/map';

export const ProspectiveSearchPage = () => {
  const { navigatePop } = useNavigationContext();

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <div className="flex items-center gap-2 mb-2 px-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={navigatePop} className="h-8 w-8 rounded-full">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-base font-semibold text-foreground">Pesquisa Prospectiva</h2>
      </div>

      <div className="flex-1 relative overflow-hidden rounded-xl border border-border shadow-sm bg-card">
        <div className="w-full h-full z-20 overflow-y-auto">
          <DynamicSystemSidebar />
        </div>
      </div>
    </div>
  );
};
