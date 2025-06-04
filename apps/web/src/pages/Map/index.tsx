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
    <>
      <Header />
      <div className="map-container">
        <LeftNav />
        <div className="map-view">
          <MapLegend />
          <MapView />
        </div>
      </div>
    </>
  );
};

export default MapPage;
