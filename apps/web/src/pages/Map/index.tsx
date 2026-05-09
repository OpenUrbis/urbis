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
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <LeftNav />
        <div className="flex-1 relative h-full w-full">
          <MapLegend />
          <MapView />
        </div>
      </div>
    </div>
  );
};

export default MapPage;
