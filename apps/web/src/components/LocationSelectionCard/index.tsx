import { computed, useSignal } from "@preact/signals";
import { Button, UrbisIcon } from "@open-urbis/map-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@open-urbis/map-ui";
import { Input } from "@open-urbis/map-ui";
import { Label } from "@open-urbis/map-ui";
import { cn } from "@open-urbis/map-ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@open-urbis/map-ui";
import { MapPin, Info, X } from "lucide-react";
import { useMapContext } from "../../hooks/useMapContext";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { transformFileToJson } from "../../utils/transformFileToJson";
import { getGeoJsonBounds } from "../MapView/utils";
import { PolygonDetails } from "../PolygonDetails";
import { DigitalAddressDetails } from "./DigitalAddressDetails";
import {
  DigitalAddressInlineResult,
  DigitalAddressPlateDialog,
  type DigitalAddressInlineResultData,
} from "./DigitalAddressInlineResult";
import { decode, getPolygon, encode } from "@open-urbis/endereco-digital";
// @ts-ignore
import { OpenLocationCode } from "open-location-code";
import proj4 from "proj4";
import { enabledFeatureFlags } from "../../features/feature-flags";

// Define Projections
proj4.defs(
  "EPSG:31983",
  "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
);
proj4.defs(
  "EPSG:4674",
  "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs",
);

const olc = new OpenLocationCode();

const SAO_PAULO_DIGITAL_ADDRESS_PREFIX = "-23-46";
const DIGITAL_ADDRESS_ALLOWED_CHARS = "23456789BCDFGHJKLMNPQTVWXYZ";
const DIGITAL_ADDRESS_PREFIX_ASSUMED_MESSAGE =
  "Prefixo assumido para a cidade de São Paulo.";
const SAO_PAULO_PLUS_CODE_PREFIX = "588M";
const PLUS_CODE_ALLOWED_CHARS = "23456789CFGHJMPQRVWX";
const PLUS_CODE_PREFIX_ERROR =
  "Valor deve conter 4 caracteres e não pode conter o número 1 nem as letras A, B, D, E, I, K, L, N, O, S, T, U, Y e Z.";
const PLUS_CODE_VALUE_ERROR =
  "Valor deve conter 6 a 8 caracteres e não pode conter o número 1 nem as letras A, B, D, E, I, K, L, N, O, S, T, U, Y e Z.";

const normalizeDigitalAddressCode = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, "");

const formatDigitalAddressCode = (value: string) => {
  const cleanCode = normalizeDigitalAddressCode(value);
  if (cleanCode.length <= 3) return cleanCode;
  return `${cleanCode.substring(0, 3)}-${cleanCode.substring(3, 7)}`;
};

const hasOnlyDigitalAddressChars = (value: string) =>
  [...value].every((char) => DIGITAL_ADDRESS_ALLOWED_CHARS.includes(char));

const parseDigitalAddressInput = (prefixValue: string, codeValue: string) => {
  const rawPrefix = prefixValue.trim();
  const rawCode = codeValue.trim();
  const combined = `${rawPrefix} ${rawCode}`.trim();
  const prefixMatch = combined.match(/([+-])\s*(\d{1,2})\D*([+-])\s*(\d{1,3})/);
  const assumedPrefix = !prefixMatch;
  const prefix = prefixMatch
    ? `${prefixMatch[1]}${Number(prefixMatch[2])}${prefixMatch[3]}${Number(prefixMatch[4])}`
    : SAO_PAULO_DIGITAL_ADDRESS_PREFIX;
  const codeSource = prefixMatch
    ? combined.slice((prefixMatch.index ?? 0) + prefixMatch[0].length)
    : rawCode || rawPrefix;
  const cleanCode = normalizeDigitalAddressCode(codeSource);
  const code = formatDigitalAddressCode(cleanCode);

  return {
    prefix,
    code,
    address: `${prefix} ${code}`,
    assumedPrefix,
  };
};

const normalizePlusCodePart = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, "");

const formatPlusCodeValue = (value: string) => {
  const cleanCode = normalizePlusCodePart(value);

  if (cleanCode.length <= 4) return cleanCode;

  return `${cleanCode.substring(0, 4)}+${cleanCode.substring(4, 8)}`;
};

const splitPlusCode = (fullCode: string) => {
  const cleanCode = normalizePlusCodePart(fullCode);

  return {
    prefix: cleanCode.substring(0, 4),
    code: formatPlusCodeValue(cleanCode.substring(4, 12)),
  };
};

const getFullPlusCode = (prefix: string, code: string) => {
  const cleanPrefix = normalizePlusCodePart(prefix);
  const cleanCode = normalizePlusCodePart(code);

  if (cleanCode.length <= 4) return `${cleanPrefix}${cleanCode}`;

  return `${cleanPrefix}${cleanCode.substring(0, 4)}+${cleanCode.substring(4, 8)}`;
};

const hasOnlyPlusCodeChars = (value: string) =>
  [...value].every((char) => PLUS_CODE_ALLOWED_CHARS.includes(char));

interface LocationSelectionCardProps {
  initialOption?: string | null;
  initialInputType?: "latlon" | "digital" | "pluscode";
  initialDigitalAddressResult?: DigitalAddressInlineResultData | null;
  initialDigitalAddressPrefixAssumed?: boolean;
}

export const LocationSelectionCard = ({
  initialOption = null,
  initialInputType = "latlon",
  initialDigitalAddressResult = null,
  initialDigitalAddressPrefixAssumed = false,
}: LocationSelectionCardProps) => {
  const {
    flyTo,
    layerSchemas,
    digitalAddressFeature,
    isPickingLocation,
    onLocationPick,
  } = useMapContext();
  const { editFeature, editFeatureTemplate, layerWithRootEditTemplate } =
    usePolygonEditContext();
  const { navigateTo, navigateReplace, clearCurrentPage } =
    useNavigationContext();
  const defaultOption = initialOption ?? "coordenadas";
  const step = useSignal(2);
  const geoJsonFile = useSignal<File | null>(null);
  const error = useSignal("");
  const selectedOption = useSignal<string | null>(defaultOption);

  const crs = useSignal<"EPSG:4674" | "EPSG:4326" | "EPSG:31983">("EPSG:31983");
  const inputType = useSignal<"latlon" | "digital" | "pluscode">(
    initialInputType,
  );
  const latitude = useSignal("");
  const longitude = useSignal("");
  const [initialDigitalAddressPrefix, initialDigitalAddressCode = ""] =
    initialDigitalAddressResult?.digitalAddress.split(" ") ?? [
      SAO_PAULO_DIGITAL_ADDRESS_PREFIX,
      "",
    ];
  const digitalAddressPrefix = useSignal(initialDigitalAddressPrefix);
  const digitalAddress = useSignal(initialDigitalAddressCode);
  const prefixInfoVisible = useSignal(false);
  const digitalDiscoveryInstruction = useSignal("");
  const digitalAddressPrefixAssumed = useSignal(
    initialDigitalAddressPrefixAssumed,
  );
  const digitalAddressResult = useSignal<DigitalAddressInlineResultData | null>(
    initialDigitalAddressResult,
  );
  const plusCodePrefix = useSignal(SAO_PAULO_PLUS_CODE_PREFIX);
  const plusCodeInput = useSignal("");
  const plusCodePrefixInfoVisible = useSignal(false);
  const plusCodeDiscoveryPoint = useSignal<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const formatDigitalCode = (value: string) => {
    return formatDigitalAddressCode(value);
  };

  const getFullDigitalAddress = () =>
    parseDigitalAddressInput(digitalAddressPrefix.value, digitalAddress.value)
      .address;

  const validateDigitalPrefix = () => {
    const parsedAddress = parseDigitalAddressInput(
      digitalAddressPrefix.value,
      digitalAddress.value,
    );
    const prefix = parsedAddress.prefix;
    const match = prefix.match(/^([+-])(\d{1,2})([+-])(\d{1,3})$/);

    if (!match) {
      error.value =
        "Valor deve ser + ou -, número entre 0 e 89, + ou -, número entre 0 e 179.";
      return false;
    }

    const latitudeDegrees = Number(match[2]);
    const longitudeDegrees = Number(match[4]);

    if (
      latitudeDegrees < 0 ||
      latitudeDegrees > 89 ||
      longitudeDegrees < 0 ||
      longitudeDegrees > 179
    ) {
      error.value =
        "Valor deve ser + ou -, número entre 0 e 89, + ou -, número entre 0 e 179.";
      return false;
    }

    digitalAddressPrefix.value = prefix;
    digitalAddressPrefixAssumed.value = parsedAddress.assumedPrefix;
    return true;
  };

  const validateDigitalCode = () => {
    const parsedAddress = parseDigitalAddressInput(
      digitalAddressPrefix.value,
      digitalAddress.value,
    );
    const formattedCode = parsedAddress.code;
    const cleanCode = normalizeDigitalAddressCode(formattedCode);
    const digitalCodeRegex =
      /^[23456789BCDFGHJKLMNPQTVWXYZ]{3}-[23456789BCDFGHJKLMNPQTVWXYZ]{4}$/;

    if (
      cleanCode.length !== 7 ||
      !hasOnlyDigitalAddressChars(cleanCode) ||
      !digitalCodeRegex.test(formattedCode)
    ) {
      error.value =
        "Valor deve conter 7 caracteres e não pode conter os números 0 e 1 nem as letras A, E, I, O, R, S e U.";
      return false;
    }

    digitalAddressPrefix.value = parsedAddress.prefix;
    digitalAddress.value = formattedCode;
    digitalAddressPrefixAssumed.value = parsedAddress.assumedPrefix;
    return true;
  };

  const validatePlusCodePrefix = () => {
    const prefix = normalizePlusCodePart(plusCodePrefix.value);

    if (prefix.length !== 4 || !hasOnlyPlusCodeChars(prefix)) {
      error.value = PLUS_CODE_PREFIX_ERROR;
      return false;
    }

    plusCodePrefix.value = prefix;

    if (prefix !== SAO_PAULO_PLUS_CODE_PREFIX) {
      error.value =
        "ATENÇÃO: os Plus Codes no Município de São Paulo possuem prefixo 588M.";
      return false;
    }

    return true;
  };

  const validatePlusCodeValue = () => {
    const cleanCode = normalizePlusCodePart(plusCodeInput.value);

    if (
      cleanCode.length < 6 ||
      cleanCode.length > 8 ||
      !hasOnlyPlusCodeChars(cleanCode)
    ) {
      error.value = PLUS_CODE_VALUE_ERROR;
      return false;
    }

    const formattedCode = formatPlusCodeValue(cleanCode);
    const fullCode = getFullPlusCode(plusCodePrefix.value, formattedCode);

    if (!olc.isValid(fullCode) || !olc.isFull(fullCode)) {
      error.value = PLUS_CODE_VALUE_ERROR;
      return false;
    }

    plusCodeInput.value = formattedCode;
    return true;
  };

  const getDigitalAddressPolygonCoords = (address: string) => {
    const p = getPolygon(address);
    const lats = p.map((pt) => pt.lat);
    const lons = p.map((pt) => pt.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    return {
      centerLat: (minLat + maxLat) / 2,
      centerLon: (minLon + maxLon) / 2,
      polygonCoords: [
        [
          [minLon, minLat],
          [maxLon, minLat],
          [maxLon, maxLat],
          [minLon, maxLat],
          [minLon, minLat],
        ],
      ],
    };
  };

  const buildDigitalAddressResult = (
    address: string,
    discoveryPoint?: { latitude: number; longitude: number },
  ): DigitalAddressInlineResultData => {
    const { centerLat, centerLon } = getDigitalAddressPolygonCoords(address);
    const plusCodeLatitude = discoveryPoint?.latitude ?? centerLat;
    const plusCodeLongitude = discoveryPoint?.longitude ?? centerLon;

    return {
      latitude: centerLat,
      longitude: centerLon,
      plusCode: olc.encode(plusCodeLatitude, plusCodeLongitude, 12),
      digitalAddress: address,
      discoveryPoint,
    };
  };

  const getDigitalAddressInputResult = () => {
    try {
      const parsedAddress = parseDigitalAddressInput(
        digitalAddressPrefix.value,
        digitalAddress.value,
      );
      const prefixMatch = parsedAddress.prefix.match(
        /^([+-])(\d{1,2})([+-])(\d{1,3})$/,
      );
      const cleanCode = normalizeDigitalAddressCode(parsedAddress.code);

      if (
        !prefixMatch ||
        cleanCode.length !== 7 ||
        !hasOnlyDigitalAddressChars(cleanCode)
      ) {
        return null;
      }

      const latitudeDegrees = Number(prefixMatch[2]);
      const longitudeDegrees = Number(prefixMatch[4]);

      if (
        latitudeDegrees < 0 ||
        latitudeDegrees > 89 ||
        longitudeDegrees < 0 ||
        longitudeDegrees > 179
      ) {
        return null;
      }

      decode(parsedAddress.address);

      return buildDigitalAddressResult(parsedAddress.address);
    } catch {
      return null;
    }
  };

  const showDigitalAddressResult = ({
    address,
    sourceLat,
    sourceLon,
    includeMarker,
  }: {
    address: string;
    sourceLat?: number;
    sourceLon?: number;
    includeMarker: boolean;
  }) => {
    const { centerLat, centerLon, polygonCoords } =
      getDigitalAddressPolygonCoords(address);

    const markerLat = sourceLat ?? centerLat;
    const markerLon = sourceLon ?? centerLon;
    const features: any[] = [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: polygonCoords,
        },
        properties: { type: "polygon", sourceType: "digital" },
      },
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [markerLon, markerLat],
        },
        properties: { type: "marker" },
      },
    ];

    layerSchemas.value = layerSchemas.value.map((l) => ({
      ...l,
      isVisible: false,
    }));
    digitalAddressFeature.value = {
      type: "FeatureCollection",
      features,
    };

    flyTo({
      center: [markerLon, markerLat],
      zoom: 20,
      bounds: getGeoJsonBounds({ type: "Polygon", coordinates: polygonCoords }),
      pitch: 0,
      bearing: 0,
      maxZoom: 22,
      duration: 1000,
    });

    digitalAddressResult.value = buildDigitalAddressResult(
      address,
      includeMarker && sourceLat !== undefined && sourceLon !== undefined
        ? { latitude: sourceLat, longitude: sourceLon }
        : undefined,
    );
  };

  const showPlusCodeResult = ({
    plusCode,
    discoveryPoint,
  }: {
    plusCode: string;
    discoveryPoint?: { latitude: number; longitude: number };
  }) => {
    const codeArea = olc.decode(plusCode);
    const { longitudeLo, latitudeLo, longitudeHi, latitudeHi } = codeArea;
    const polygonCoords = [
      [
        [longitudeLo, latitudeLo],
        [longitudeHi, latitudeLo],
        [longitudeHi, latitudeHi],
        [longitudeLo, latitudeHi],
        [longitudeLo, latitudeLo],
      ],
    ];

    const markerLat = discoveryPoint?.latitude ?? codeArea.latitudeCenter;
    const markerLon = discoveryPoint?.longitude ?? codeArea.longitudeCenter;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const features: any[] = [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: polygonCoords,
        },
        properties: { type: "polygon", sourceType: "pluscode" },
      },
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [markerLon, markerLat],
        },
        properties: { type: "marker" },
      },
    ];

    layerSchemas.value = layerSchemas.value.map((l) => ({
      ...l,
      isVisible: false,
    }));
    digitalAddressFeature.value = {
      type: "FeatureCollection",
      features,
    };

    flyTo({
      center: [markerLon, markerLat],
      zoom: 20,
      bounds: getGeoJsonBounds({ type: "Polygon", coordinates: polygonCoords }),
      pitch: 0,
      bearing: 0,
      maxZoom: 22,
      duration: 1000,
    });

    navigateReplace(
      <DigitalAddressDetails
        latitude={codeArea.latitudeCenter}
        longitude={codeArea.longitudeCenter}
        plusCode={plusCode}
        sourceType="pluscode"
        discoveryPoint={discoveryPoint}
      />,
    );
  };

  const rootTemplate = computed(() => {
    const layer = layerSchemas.value?.find(
      (schema) => schema.id === layerWithRootEditTemplate.value,
    );
    if (!layer) return [];

    return layer.viewTemplate || [];
  });

  const validateInputs = () => {
    if (selectedOption.value === "coordenadas") {
      if (inputType.value === "latlon") {
        const lat = parseFloat(latitude.value);
        const lon = parseFloat(longitude.value);

        // For UTM, range check is different/harder.
        // For Lat/Lon, check limits.
        const isProjected = crs.value === "EPSG:31983";

        // Helper to count decimal places from string to avoid float issues
        const getDecimalPlaces = (val: string) => {
          if (!val.includes(".")) return 0;
          return val.split(".")[1].length;
        };

        if (!isProjected) {
          if (
            isNaN(lat) ||
            isNaN(lon) ||
            lat < -90 ||
            lat > 90 ||
            lon < -180 ||
            lon > 180
          ) {
            error.value =
              "Por favor, insira valores válidos para latitude e longitude.";
            return false;
          }

          // Check precision for Lat/Lon (approx 1m requires ~5 decimal places)
          if (
            getDecimalPlaces(latitude.value) < 5 ||
            getDecimalPlaces(longitude.value) < 5
          ) {
            error.value =
              "A precisão mínima necessária é de 5 casas decimais para representar um metro.";
            return false;
          }
        }

        if (isProjected) {
          if (isNaN(lat) || isNaN(lon)) {
            error.value = "Por favor, insira valores válidos para coordenadas.";
            return false;
          }
          // UTM is in meters, so any valid number (integer or float) has at least 1m precision.
          // No additional precision check needed unless enforcing sub-meter.
        }
      } else if (inputType.value === "digital") {
        if (!validateDigitalPrefix() || !validateDigitalCode()) return false;

        try {
          decode(getFullDigitalAddress());
        } catch (e) {
          error.value =
            "Valor deve conter 7 caracteres e não pode conter os números 0 e 1 nem as letras A, E, I, O, R, S e U.";
          return false;
        }
      } else if (inputType.value === "pluscode") {
        if (!plusCodeInput.value.trim()) {
          error.value = "Por favor, insira um Plus Code.";
          return false;
        }

        if (!validatePlusCodePrefix() || !validatePlusCodeValue()) return false;
      }
    } else if (selectedOption.value === "geoJson" && !geoJsonFile.value) {
      error.value = "Por favor, envie um arquivo GeoJSON válido.";
      return false;
    }

    error.value = "";
    return true;
  };

  const handleCaptureToggle = (type: "latlon" | "digital" | "pluscode") => {
    if (isPickingLocation.value) {
      isPickingLocation.value = false;
      onLocationPick.value = null;
      return;
    }

    isPickingLocation.value = true;
    onLocationPick.value = (lat, lon) => {
      if (type === "latlon") {
        let [x, y] = [lon, lat];
        if (crs.value === "EPSG:31983") {
          [x, y] = proj4("EPSG:4326", "EPSG:31983", [lon, lat]);
        }
        latitude.value = y.toFixed(6);
        longitude.value = x.toFixed(6);
      } else if (type === "digital") {
        digitalAddress.value = encode(lat, lon);
      } else if (type === "pluscode") {
        const clickedPlusCode = olc.encode(lat, lon, 12);
        const { prefix, code } = splitPlusCode(clickedPlusCode);
        plusCodePrefix.value = prefix;
        plusCodeInput.value = code;
        plusCodeDiscoveryPoint.value = { latitude: lat, longitude: lon };
        showPlusCodeResult({
          plusCode: clickedPlusCode,
          discoveryPoint: plusCodeDiscoveryPoint.value,
        });
      }

      isPickingLocation.value = false;
      onLocationPick.value = null;
    };
  };

  const handleDigitalDiscovery = () => {
    if (isPickingLocation.value) {
      isPickingLocation.value = false;
      onLocationPick.value = null;
      digitalDiscoveryInstruction.value = "";
      return;
    }

    error.value = "";
    digitalDiscoveryInstruction.value =
      "Clique no local do mapa onde quer descobrir o Endereço Digital Urbis.";
    isPickingLocation.value = true;
    onLocationPick.value = (lat, lon) => {
      const address = encode(lat, lon);
      const [prefix, code] = address.split(" ");
      digitalAddressPrefix.value = prefix;
      digitalAddress.value = code;
      digitalAddressPrefixAssumed.value = false;
      digitalDiscoveryInstruction.value = "";
      showDigitalAddressResult({
        address,
        sourceLat: lat,
        sourceLon: lon,
        includeMarker: true,
      });
      isPickingLocation.value = false;
      onLocationPick.value = null;
    };
  };

  const handleSubmit = () => {
    if (validateInputs()) {
      if (selectedOption.value === "coordenadas") {
        let lat: number, lon: number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let polygonCoords: any[] = [];
        let typeLabel = "digital";

        if (inputType.value === "latlon") {
          lat = parseFloat(latitude.value);
          lon = parseFloat(longitude.value);

          // Convert if needed
          if (crs.value === "EPSG:31983") {
            // UTM [Easting, Northing] -> [Lon, Lat]
            // Input: lon field is X (Easting), lat field is Y (Northing)
            const converted = proj4("EPSG:31983", "EPSG:4326", [lon, lat]);
            lon = converted[0];
            lat = converted[1];
          } else if (crs.value === "EPSG:4674") {
            // SIRGAS 2000 Lat/Lon -> WGS84 Lat/Lon (practically same, but explicit)
            const converted = proj4("EPSG:4674", "EPSG:4326", [lon, lat]);
            lon = converted[0];
            lat = converted[1];
          }

          // Default to Digital Address Polygon for lat/lon input
          const address = encode(lat, lon);
          const p = getPolygon(address);
          // Ensure rectangle by using bbox
          const lats = p.map((pt) => pt.lat);
          const lons = p.map((pt) => pt.lon);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLon = Math.min(...lons);
          const maxLon = Math.max(...lons);

          polygonCoords = [
            [
              [minLon, minLat],
              [maxLon, minLat],
              [maxLon, maxLat],
              [minLon, maxLat],
              [minLon, minLat],
            ],
          ];
        } else if (inputType.value === "digital") {
          showDigitalAddressResult({
            address: getFullDigitalAddress(),
            includeMarker: false,
          });
          return;
        } else {
          // pluscode
          typeLabel = "pluscode";
          const submittedPlusCode = getFullPlusCode(
            plusCodePrefix.value,
            plusCodeInput.value,
          );
          const codeArea = olc.decode(submittedPlusCode);
          lat = codeArea.latitudeCenter;
          lon = codeArea.longitudeCenter;

          // Plus Code Polygon
          const { longitudeLo, latitudeLo, longitudeHi, latitudeHi } = codeArea;
          polygonCoords = [
            [
              [longitudeLo, latitudeLo],
              [longitudeHi, latitudeLo],
              [longitudeHi, latitudeHi],
              [longitudeLo, latitudeHi],
              [longitudeLo, latitudeLo],
            ],
          ];
        }

        // Calculate both codes for display
        const calcPlusCode =
          inputType.value === "pluscode"
            ? getFullPlusCode(plusCodePrefix.value, plusCodeInput.value)
            : olc.encode(lat, lon, 12); // High precision

        // Construct FeatureCollection
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const features: any[] = [];

        const shouldIncludeMarker =
          inputType.value !== "pluscode" ||
          plusCodeDiscoveryPoint.value !== null;

        if (shouldIncludeMarker) {
          const markerLat =
            inputType.value === "pluscode"
              ? (plusCodeDiscoveryPoint.value?.latitude ?? lat)
              : lat;
          const markerLon =
            inputType.value === "pluscode"
              ? (plusCodeDiscoveryPoint.value?.longitude ?? lon)
              : lon;

          features.push({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [markerLon, markerLat],
            },
            properties: { type: "marker" },
          });
        }

        if (inputType.value !== "latlon") {
          features.push({
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: polygonCoords,
            },
            properties: { type: "polygon", sourceType: typeLabel },
          });
        }

        const featureCollection = {
          type: "FeatureCollection",
          features,
        };

        // Hide all layers
        layerSchemas.value = layerSchemas.value.map((l) => ({
          ...l,
          isVisible: false,
        }));

        // Set the feature in MapContext (for DeckGL)
        digitalAddressFeature.value = featureCollection;

        const destination =
          inputType.value !== "latlon"
            ? {
                bounds: getGeoJsonBounds({
                  type: "Polygon",
                  coordinates: polygonCoords,
                }),
                pitch: 0,
                bearing: 0,
              }
            : {
                center: [lon, lat],
                zoom: 18,
                pitch: 0,
                bearing: 0,
              };

        flyTo(destination);

        navigateReplace(
          <DigitalAddressDetails
            latitude={lat}
            longitude={lon}
            plusCode={calcPlusCode}
            sourceType={inputType.value}
            discoveryPoint={
              inputType.value === "pluscode" && plusCodeDiscoveryPoint.value
                ? plusCodeDiscoveryPoint.value
                : undefined
            }
          />,
        );
      } else if (selectedOption.value === "geoJson") {
        openObj({ file: geoJsonFile.value!, crs: crs.value });
      }
      step.value = 2;
      selectedOption.value = defaultOption;
    }
  };

  const openObj = async ({ file, crs }: { file: File; crs: string }) => {
    if (!file) return;
    let object = await transformFileToJson(file);

    // Convert GeoJSON coordinates if needed
    if (crs !== "EPSG:4326") {
      const transform = (coords: any): any => {
        if (typeof coords[0] === "number") {
          return proj4(crs, "EPSG:4326", coords);
        }
        return coords.map(transform);
      };

      const transformFeature = (feature: any) => {
        if (feature.geometry && feature.geometry.coordinates) {
          feature.geometry.coordinates = transform(
            feature.geometry.coordinates,
          );
        }
        return feature;
      };

      if (object.type === "FeatureCollection") {
        object.features = object.features.map(transformFeature);
      } else if (object.type === "Feature") {
        object = transformFeature(object);
      }
    }

    let featureToEdit = object;
    if (object.type === "FeatureCollection") {
      featureToEdit = object.features?.[0];
    }

    if (featureToEdit) {
      // Remove CRS if present (we converted to WGS84)
      delete featureToEdit.crs;

      editFeature(featureToEdit);

      const geometry = featureToEdit.geometry;
      if (geometry?.coordinates) {
        navigateTo(
          <PolygonDetails
            template={editFeatureTemplate.value!}
            rootTemplate={rootTemplate.value!}
          />,
        );
        flyTo({
          bounds: getGeoJsonBounds(geometry),
          bearing: 0,
        });
      }
    }
  };

  const handleOptionSelect = (option: string) => {
    selectedOption.value = option;
    step.value = 2;
    error.value = "";
    // Clear previous digital features
    digitalAddressFeature.value = null;
  };

  const isDigitalAddressMode =
    selectedOption.value === "coordenadas" && inputType.value === "digital";
  const showFooterSubmit = !isDigitalAddressMode;
  const showFooter = !isDigitalAddressMode;

  const handleClose = () => {
    if (isPickingLocation.value) {
      isPickingLocation.value = false;
      onLocationPick.value = null;
      digitalDiscoveryInstruction.value = "";
    }
    clearCurrentPage();
  };

  const digitalAddressInputResult =
    inputType.value === "digital" ? getDigitalAddressInputResult() : null;
  const digitalAddressPlateResult =
    digitalAddressInputResult ?? digitalAddressResult.value;
  const isSaoPauloDigitalPrefix =
    digitalAddressPrefix.value.trim() === SAO_PAULO_DIGITAL_ADDRESS_PREFIX;

  return (
    <div className="grid gap-2">
      <Card
        className={cn(
          "rounded-xl border shadow-sm",
          isDigitalAddressMode && "border-0 bg-transparent shadow-none",
        )}
      >
        {selectedOption.value !== "coordenadas" && (
          <CardHeader className="p-2 pb-0">
            <CardTitle className="text-base font-medium">
              Buscar com perímetro
            </CardTitle>
          </CardHeader>
        )}
        <CardContent
          className={cn("space-y-2 p-2", isDigitalAddressMode && "p-0")}
        >
          {selectedOption.value === "coordenadas" && (
            <div className="space-y-2">
              {inputType.value !== "digital" && (
                <div className="grid w-full max-w-sm items-center gap-1">
                  <Label className="text-[10px] text-muted-foreground uppercase font-bold">
                    Método de busca
                  </Label>
                  <Select
                    value={inputType.value}
                    onValueChange={(v: "latlon" | "digital" | "pluscode") => {
                      inputType.value = v;
                      error.value = "";
                      if (v === "digital")
                        digitalAddressPrefix.value =
                          SAO_PAULO_DIGITAL_ADDRESS_PREFIX;
                      if (v === "pluscode")
                        plusCodePrefix.value = SAO_PAULO_PLUS_CODE_PREFIX;
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latlon">
                        Coordenadas (Lat/Lon)
                      </SelectItem>
                      <SelectItem value="digital">Endereço Digital</SelectItem>
                      <SelectItem value="pluscode">
                        Plus Code (Google)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {inputType.value === "latlon" && (
                <div className="space-y-2">
                  <div className="grid w-full max-w-sm items-center gap-1">
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">
                      Projeção
                    </Label>
                    <Select
                      value={crs.value}
                      onValueChange={(v: any) => (crs.value = v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a projeção" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EPSG:4674">
                          SIRGAS 2000 / WGS 84 (Geográfico)
                        </SelectItem>
                        <SelectItem value="EPSG:31983">
                          SIRGAS 2000 (UTM 23S)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid w-full items-center gap-1">
                      <Label htmlFor="latitude" className="text-xs">
                        {crs.value === "EPSG:31983"
                          ? "Northing (Y)"
                          : "Latitude"}
                      </Label>
                      <Input
                        className="h-8 text-xs"
                        type="number"
                        id="latitude"
                        value={latitude.value}
                        placeholder={
                          crs.value === "EPSG:31983" ? "7394382" : "-23.5505"
                        }
                        onChange={(e) =>
                          (latitude.value = (
                            e.currentTarget as HTMLInputElement
                          ).value)
                        }
                      />
                      <p className="text-[9px] text-muted-foreground">
                        Ex:{" "}
                        {crs.value === "EPSG:31983" ? "7394382" : "-23.55052"}
                      </p>
                    </div>
                    <div className="grid w-full items-center gap-1">
                      <Label htmlFor="longitude" className="text-xs">
                        {crs.value === "EPSG:31983"
                          ? "Easting (X)"
                          : "Longitude"}
                      </Label>
                      <Input
                        className="h-8 text-xs"
                        type="number"
                        id="longitude"
                        value={longitude.value}
                        placeholder={
                          crs.value === "EPSG:31983" ? "333199" : "-46.6333"
                        }
                        onChange={(e) =>
                          (longitude.value = (
                            e.currentTarget as HTMLInputElement
                          ).value)
                        }
                      />
                      <p className="text-[9px] text-muted-foreground">
                        Ex:{" "}
                        {crs.value === "EPSG:31983" ? "333199" : "-46.63330"}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className={cn(
                      "w-full h-8 text-xs gap-2 mt-2",
                      isPickingLocation.value &&
                        "bg-primary/20 border-primary/50",
                    )}
                    onClick={() => handleCaptureToggle("latlon")}
                  >
                    <MapPin className="h-4 w-4" />
                    {isPickingLocation.value
                      ? "Clique no mapa para capturar"
                      : "Capturar com um clique no mouse"}
                  </Button>

                  <div className="bg-muted/50 p-2 rounded-lg border text-[10px] text-muted-foreground leading-relaxed mt-2">
                    Busque utilizando Latitude e Longitude (ex: -23.5505,
                    -46.6333) ou coordenadas UTM. Certifique-se de selecionar a
                    projeção correta.
                  </div>
                </div>
              )}

              {inputType.value === "digital" && (
                <div className="grid w-full max-w-none items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
                  <div className="space-y-2 px-1 pt-1">
                    <div className="flex items-start justify-between gap-2">
                      <img
                        src="/endereco_digital_logo.png"
                        className="h-9 max-w-[210px] object-contain object-left invert dark:invert-0"
                        alt="Endereço Digital do Urbis"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="-mr-1 -mt-1 h-7 w-7 rounded-full"
                        aria-label="Fechar"
                        onClick={handleClose}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {!digitalAddressResult.value && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        O Endereço Digital é uma ferramenta do Urbis que
                        permite, com um código local de 7 caracteres (ex.:
                        J7K-H87F), ou global acrescentando um prefixo variável
                        (ex.: -23-46 J7K-H87F), localizar facilmente uma área de
                        aproximadamente 1 metro quadrado. Sua maior utilidade é
                        servir de endereço em ruas sem nome oficial ou CEP.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 rounded-lg border bg-card p-3 shadow-sm">
                    <h3 className="text-sm font-semibold leading-none text-foreground">
                      Já sei o Endereço Digital
                    </h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-[88px_minmax(92px,1fr)_auto] items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Label
                            htmlFor="digitalAddressPrefix"
                            className="text-xs font-semibold"
                          >
                            Prefixo
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 rounded-full text-muted-foreground"
                            aria-label="Informação sobre o prefixo"
                            onClick={() =>
                              (prefixInfoVisible.value =
                                !prefixInfoVisible.value)
                            }
                          >
                            <Info className="h-3 w-3" />
                          </Button>
                        </div>
                        <Input
                          className="h-9 text-center text-sm font-semibold"
                          type="text"
                          id="digitalAddressPrefix"
                          value={digitalAddressPrefix.value}
                          placeholder={SAO_PAULO_DIGITAL_ADDRESS_PREFIX}
                          onChange={(e) => {
                            digitalAddressPrefix.value = (
                              e.currentTarget as HTMLInputElement
                            ).value;
                            digitalAddressPrefixAssumed.value = false;
                            error.value = "";
                          }}
                        />
                        <span className="text-[10px] italic leading-tight text-muted-foreground">
                          {isSaoPauloDigitalPrefix
                            ? "assumindo Município de São Paulo"
                            : ""}
                        </span>
                      </div>

                      <div className="grid grid-cols-[88px_minmax(92px,1fr)_auto] items-center gap-2">
                        <Label
                          htmlFor="digitalAddress"
                          className="text-xs font-semibold"
                        >
                          Endereço Digital
                        </Label>
                        <Input
                          className="h-9 text-sm font-semibold"
                          type="text"
                          id="digitalAddress"
                          value={digitalAddress.value}
                          placeholder="ex.: J7K-H87F"
                          onChange={(e) => {
                            digitalAddress.value = formatDigitalCode(
                              (e.currentTarget as HTMLInputElement).value,
                            );
                            digitalAddressPrefixAssumed.value = false;
                            error.value = "";
                          }}
                        />
                        <Button
                          onClick={handleSubmit}
                          size="sm"
                          className="h-9 rounded-full px-4 text-xs font-semibold shadow-sm"
                          disabled={!digitalAddressInputResult}
                        >
                          Ir
                        </Button>
                      </div>
                    </div>

                    {prefixInfoVisible.value && (
                      <div className="rounded-lg border bg-muted/50 p-2 text-xs leading-relaxed text-muted-foreground">
                        O prefixo é formado pelos graus de latitude e longitude
                        com indicação do sinal. Se ele não for informado, o
                        sistema assume {SAO_PAULO_DIGITAL_ADDRESS_PREFIX} para a
                        cidade de São Paulo.
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 rounded-lg border bg-card p-3 shadow-sm">
                    <h3 className="text-sm font-semibold leading-none text-foreground">
                      Descobrir Endereço Digital
                    </h3>
                    {isPickingLocation.value && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Clique abaixo para uma descoberta guiada.
                      </p>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      className={cn(
                        "mx-auto flex h-8 rounded-full px-5 text-xs font-semibold",
                        isPickingLocation.value && "ring-2 ring-primary/40",
                      )}
                      onClick={handleDigitalDiscovery}
                    >
                      {isPickingLocation.value
                        ? "Cancelar descoberta"
                        : "Descobrir"}
                    </Button>

                    {digitalDiscoveryInstruction.value && (
                      <div className="rounded-lg border bg-primary/10 p-2 text-xs leading-relaxed text-primary">
                        {digitalDiscoveryInstruction.value}
                      </div>
                    )}

                    {!digitalDiscoveryInstruction.value &&
                      !digitalAddressResult.value && (
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          Clique com o botão esquerdo do mouse no local do mapa
                          onde quer descobrir o Endereço Digital Urbis.
                        </p>
                      )}

                    {digitalAddressResult.value && (
                      <DigitalAddressInlineResult
                        result={digitalAddressResult.value}
                        showPlateButton={false}
                      />
                    )}

                    <p className="text-xs italic leading-relaxed text-muted-foreground">
                      Também é possível descobrir rapidamente o Endereço Digital
                      clicando com o botão direito em qualquer parte do mapa.
                    </p>
                  </div>

                  {digitalAddressPrefixAssumed.value && (
                    <div className="rounded-lg border bg-muted/50 p-2 text-xs leading-relaxed text-muted-foreground">
                      {DIGITAL_ADDRESS_PREFIX_ASSUMED_MESSAGE}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {digitalAddressPlateResult ? (
                      <DigitalAddressPlateDialog
                        result={digitalAddressPlateResult}
                      />
                    ) : (
                      <Button
                        className="h-8 rounded-full px-4 text-xs font-semibold shadow-sm"
                        size="sm"
                        disabled
                      >
                        Gerar placa
                      </Button>
                    )}
                    {!digitalAddressPlateResult && (
                      <p className="text-xs italic leading-tight text-muted-foreground">
                        Para gerar uma placa, preencha ou descubra um Endereço
                        Digital.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {inputType.value === "pluscode" && (
                <div className="grid w-full max-w-sm items-center gap-2">
                  <div className="grid w-full max-w-sm items-center gap-1">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="plusCodePrefix" className="text-xs">
                        Prefixo
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full"
                        aria-label="Informação sobre o prefixo do Plus Code"
                        onClick={() =>
                          (plusCodePrefixInfoVisible.value =
                            !plusCodePrefixInfoVisible.value)
                        }
                      >
                        <Info className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      className="h-8 text-xs font-mono"
                      type="text"
                      id="plusCodePrefix"
                      value={plusCodePrefix.value}
                      placeholder={SAO_PAULO_PLUS_CODE_PREFIX}
                      maxLength={4}
                      onChange={(e) => {
                        plusCodePrefix.value = normalizePlusCodePart(
                          (e.currentTarget as HTMLInputElement).value,
                        ).substring(0, 4);
                        plusCodeDiscoveryPoint.value = null;
                        if (
                          plusCodePrefix.value !== SAO_PAULO_PLUS_CODE_PREFIX
                        ) {
                          error.value =
                            "ATENÇÃO: os Plus Codes no Município de São Paulo possuem prefixo 588M.";
                        } else {
                          error.value = "";
                        }
                      }}
                    />
                    {plusCodePrefixInfoVisible.value && (
                      <div className="bg-muted/50 p-2 rounded-lg border text-[10px] text-muted-foreground leading-relaxed">
                        Plus Codes são os endereços digitais do padrão Open
                        Location Code, do Google, de uso permitido pela licença
                        Apache 2.0. No Município de São Paulo, o prefixo
                        esperado é 588M.
                      </div>
                    )}
                  </div>

                  <div className="grid w-full max-w-sm items-center gap-1">
                    <Label htmlFor="plusCode" className="text-xs">
                      Plus Code
                    </Label>
                    <Input
                      className="h-8 text-xs font-mono"
                      type="text"
                      id="plusCode"
                      value={plusCodeInput.value}
                      placeholder="C9X8+RCVG"
                      onChange={(e) => {
                        plusCodeInput.value = formatPlusCodeValue(
                          (e.currentTarget as HTMLInputElement).value,
                        );
                        plusCodeDiscoveryPoint.value = null;
                        error.value = "";
                      }}
                    />
                    <p className="text-[9px] text-muted-foreground">
                      Ex.: C9X8+RCVG
                    </p>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className={cn(
                      "w-full h-8 text-xs gap-2",
                      isPickingLocation.value &&
                        "bg-primary/20 border-primary/50",
                    )}
                    onClick={() => handleCaptureToggle("pluscode")}
                  >
                    <MapPin className="h-4 w-4" />
                    {isPickingLocation.value
                      ? "Clique no mapa para capturar"
                      : "Capturar com um clique no mouse"}
                  </Button>

                  <div className="bg-muted/50 p-2 rounded-lg border text-[10px] text-muted-foreground leading-relaxed">
                    O Plus Code é um sistema de endereçamento aberto do Google.
                    Para São Paulo, informe o prefixo 588M e um código local com
                    6 a 8 caracteres no formato xxxx+xxx ou xxxx+xxxx.
                  </div>
                </div>
              )}
            </div>
          )}
          {selectedOption.value === "geoJson" && (
            <div className="space-y-2">
              <div className="grid w-full max-w-sm items-center gap-1">
                <Label className="text-[10px] text-muted-foreground uppercase font-bold">
                  Projeção do Arquivo
                </Label>
                <Select
                  value={crs.value}
                  onValueChange={(v: any) => (crs.value = v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a projeção" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EPSG:4674">
                      SIRGAS 2000 / WGS 84 (Geográfico)
                    </SelectItem>
                    <SelectItem value="EPSG:31983">
                      SIRGAS 2000 (UTM 23S)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid w-full max-w-sm items-center gap-1">
                <Label htmlFor="geojson" className="text-xs">
                  Selecione o arquivo
                </Label>
                <Input
                  className="h-8 text-xs"
                  type="file"
                  id="geojson"
                  accept=".geojson"
                  onChange={(e) =>
                    (geoJsonFile.value = e.currentTarget.files
                      ? e.currentTarget.files[0]
                      : null)
                  }
                />
                <div className="flex gap-4 text-[10px] text-muted-foreground pt-1">
                  <a
                    href="/exemplo_wgs84.geojson"
                    download
                    className="hover:underline flex items-center gap-1"
                  >
                    <UrbisIcon
                      name="download"
                      className="text-[10px]"
                      aria-hidden="true"
                    />
                    Exemplo WGS 84
                  </a>
                  <a
                    href="/exemplo_sirgas_utm.geojson"
                    download
                    className="hover:underline flex items-center gap-1"
                  >
                    <UrbisIcon
                      name="download"
                      className="text-[10px]"
                      aria-hidden="true"
                    />
                    Exemplo SIRGAS UTM
                  </a>
                </div>
              </div>
            </div>
          )}

          {error.value && (
            <div className="rounded border border-destructive/20 bg-destructive/10 p-1.5 text-[10px] text-destructive">
              {error.value}
            </div>
          )}

          {showFooter && (
            <div className="flex gap-2 pt-1 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="rounded-full h-7 text-xs"
              >
                Fechar
              </Button>
              {showFooterSubmit && (
                <Button
                  onClick={handleSubmit}
                  size="sm"
                  className="rounded-full shadow-sm h-7 text-xs"
                >
                  Localizar
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
