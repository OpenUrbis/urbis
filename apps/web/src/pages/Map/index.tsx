import { useEffect } from "react";
import Header from "../../components/Header";
import { LeftNav } from "../../components/LeftNav";
import { MapLegend } from "../../components/MapLegend";
import { MapView } from "../../components/MapView";
import { LocationSelectionCard } from "../../components/LocationSelectionCard";
import { useNavigationContext } from "../../hooks/useNavigationContext";

const MapPage = () => {
  const { navigateTo } = useNavigationContext();

  useEffect(() => {
    navigateTo(<LocationSelectionCard />);
  });
  return (
    <div className="h-screen w-full overflow-hidden bg-background relative">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header />
      </div>
      <div className="absolute inset-0 z-0">
        <div className="relative h-full w-full">
          <MapLegend />
          <MapView />
        </div>
      </div>
      <div className="absolute inset-y-0 left-0 z-40 pointer-events-none">
        <LeftNav />
      </div>
    </div>
  );
};

export default MapPage;
