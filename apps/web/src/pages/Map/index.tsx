import Header from "../../components/Header";
import { LeftNav } from "../../components/LeftNav";
import { MapLegend } from "../../components/MapLegend";
import { MapView } from "../../components/MapView";

const MapPage = () => {
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
