import { useCallback } from "react";
import { decode, getPolygon } from "@open-urbis/endereco-digital";
import { useMapContext } from "./useMapContext";
import { useNavigationContext } from "./useNavigationContext";
import { useSearchContext } from "./useSearchContext";
import { useToast } from "./useToast";
import { DigitalAddressDetails } from "../components/LocationSelectionCard/DigitalAddressDetails";
import { getGeoJsonBounds } from "../components/MapView/utils";

const DEFAULT_DIGITAL_ADDRESS_PREFIX = "-23-46";

// Regex matches 7 chars in base27 (3 chars + optional hyphen + 4 chars)
const digitalPartialRegex =
  /^[23456789BCDFGHJKLMNPQTVWXYZ]{3}-?[23456789BCDFGHJKLMNPQTVWXYZ]{4}$/i;

// Regex for full address (prefix + suffix)
const digitalFullRegex =
  /^([+-]\d{1,2}[+-]\d{1,3})([23456789BCDFGHJKLMNPQTVWXYZ]{3})-?([23456789BCDFGHJKLMNPQTVWXYZ]{4})$/i;

type DigitalAddressSearchOptions = {
  openDrawer?: boolean;
  showAssumedPrefixToast?: boolean;
};

const normalizeDigitalAddressTerm = (term: string) => {
  const cleanTerm = term.replace(/\s/g, "");

  if (digitalPartialRegex.test(cleanTerm)) {
    const cleanSuffix = cleanTerm.toUpperCase().replace("-", "");
    const formattedSuffix = `${cleanSuffix.substring(0, 3)}-${cleanSuffix.substring(3)}`;

    return {
      term: `${DEFAULT_DIGITAL_ADDRESS_PREFIX} ${formattedSuffix}`,
      assumedDefaultPrefix: true,
    };
  }

  const fullAddressMatch = cleanTerm.match(digitalFullRegex);

  if (!fullAddressMatch) return null;

  const [, prefix, firstPart, secondPart] = fullAddressMatch;

  return {
    term: `${prefix} ${firstPart.toUpperCase()}-${secondPart.toUpperCase()}`,
    assumedDefaultPrefix: false,
  };
};

export const useDigitalAddressSearch = () => {
  const { toastInfo } = useToast();
  const { currentTerm } = useSearchContext();
  const { toggleDrawer, drawerOpen, navigateTo } = useNavigationContext();
  const { flyTo, digitalAddressFeature, layerSchemas, overlayRef } =
    useMapContext();

  return useCallback(
    async (
      term: string,
      {
        openDrawer = true,
        showAssumedPrefixToast = true,
      }: DigitalAddressSearchOptions = {},
    ) => {
      const normalized = normalizeDigitalAddressTerm(term);

      if (!normalized) return false;

      currentTerm.value = normalized.term;

      if (normalized.assumedDefaultPrefix && showAssumedPrefixToast) {
        toastInfo("Assumindo cidade de São Paulo (-23-46)");
      }

      try {
        const decoded = decode(normalized.term);
        const lat = decoded.latitude;
        const lon = decoded.longitude;
        const sourceType = "digital";

        const polygon = getPolygon(normalized.term);
        const lats = polygon.map((pt) => pt.lat);
        const lons = polygon.map((pt) => pt.lon);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);

        const polygonCoords = [
          [
            [minLon, minLat],
            [maxLon, minLat],
            [maxLon, maxLat],
            [minLon, maxLat],
            [minLon, minLat],
          ],
        ];

        const featureCollection = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: polygonCoords,
              },
              properties: { type: "polygon", sourceType },
            },
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [lon, lat],
              },
              properties: { type: "marker", sourceType },
            },
          ],
        };

        // Hide all layers
        layerSchemas.value = layerSchemas.value.map((layer) => ({
          ...layer,
          isVisible: false,
        }));

        digitalAddressFeature.value = featureCollection;

        const destination = {
          center: [lon, lat],
          zoom: 20,
          bounds: getGeoJsonBounds({
            type: "Polygon",
            coordinates: polygonCoords,
          }),
          pitch: 0,
          bearing: 0,
          maxZoom: 22,
          duration: 1000,
        };

        const attemptFly = () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (overlayRef.current && (overlayRef.current as any)._map) {
            flyTo(destination);
          } else {
            setTimeout(attemptFly, 200);
          }
        };
        attemptFly();

        navigateTo(
          <DigitalAddressDetails
            key={`digital-address-search-${normalized.term}`}
            latitude={lat}
            longitude={lon}
            plusCode=""
            sourceType="digital"
            digitalAddress={normalized.term}
          />,
        );

        if (openDrawer && !drawerOpen.value) {
          toggleDrawer();
        }

        return true;
      } catch (error) {
        console.error("Error decoding digital address", error);
        return false;
      }
    },
    [
      currentTerm,
      digitalAddressFeature,
      drawerOpen,
      flyTo,
      layerSchemas,
      navigateTo,
      overlayRef,
      toastInfo,
      toggleDrawer,
    ],
  );
};
