import { useEffect } from "react";
import Header from "../../components/Header";
import { LeftNav } from "../../components/LeftNav";
import { MapLegend } from "../../components/MapLegend";
import { MapView } from "../../components/MapView";
import { MapLicense } from "../../components/MapLicense";
import { MapTutorial } from "../../components/MapTutorial";

import { useLayerPersistence } from "../../hooks/useLayerPersistence";
import { AppLoading } from "../../components/AppLoading";
import { ProspectiveView } from "./ProspectiveView";
import { FeatureDetailsWindow } from "../../components/FeaturesView/FeatureDetailsWindow";
import { LayerWarningAlert } from "../../components/MapView/LayerWarningAlert";
import { useAppLoading } from "../../hooks/useAppLoading";
import { useDigitalAddressSearch } from "../../hooks/useDigitalAddressSearch";

const DigitalAddressUrlInitializer = () => {
  const { isAppReady } = useAppLoading();
  const searchDigitalAddress = useDigitalAddressSearch();

  useEffect(() => {
    if (!isAppReady.value) return;

    const query = new URLSearchParams(location.search);
    const digitalAddress = query.get("p");

    if (!digitalAddress) return;

    void searchDigitalAddress(digitalAddress, {
      showAssumedPrefixToast: false,
    });
  }, [isAppReady.value, searchDigitalAddress]);

  return null;
};

const MapPage = () => {
  // Enable state restoration and persistence logic
  useLayerPersistence();

  return (
    <div className="h-screen w-full overflow-hidden bg-background relative">
      <AppLoading />
      <DigitalAddressUrlInitializer />
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header />
      </div>

      <div className="absolute inset-0 z-0">
        <div className="relative h-full w-full">
          <MapLegend />
          <MapView />

          <MapLicense />
          <MapTutorial />
        </div>
      </div>

      <div className="absolute inset-y-0 left-0 z-40 pointer-events-none">
        <LeftNav />
      </div>

      {/* Prospective Search View */}
      <ProspectiveView />

      {/* Feature Details Window - Direct Top-Level Render */}
      <FeatureDetailsWindow />

      {/* Layer Warning Alert - Centered Top Notification with 6s Timer */}
      <LayerWarningAlert />
    </div>
  );
};

export default MapPage;
