import { useSignal } from "@preact/signals";
import { useToast } from "../../hooks/useToast";
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
import { MapPin, FileJson, ChevronRight } from "lucide-react";
import { useMapContext } from "../../hooks/useMapContext";
import { useNavigationContext } from "../../hooks/useNavigationContext";
// import { ConcatenatedSearchModal } from "../Search/ConcatenatedSearchModal";
// import { MapLibrary } from "../../pages/Map/MapLibrary";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { transformFileToJson } from "../../utils/transformFileToJson";
import { calculateCentroid } from "../MapView/utils";
// import { PolygonDetails } from "../PolygonDetails";
import { DigitalAddressDetails } from "./DigitalAddressDetails";
import { decode, getPolygon, encode } from "@open-urbis/endereco-digital";
// @ts-ignore upstream package does not ship TypeScript declarations
import { OpenLocationCode } from "open-location-code";
import proj4 from "proj4";

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

type LocationInputType = "latlon" | "digital" | "pluscode";
type CoordinateReferenceSystem = "EPSG:4674" | "EPSG:4326" | "EPSG:31983";
type GeoJsonPolygonGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };
type GeoJsonFeature = {
  type: "Feature";
  geometry: GeoJsonPolygonGeometry | null;
  properties?: Record<string, unknown>;
  crs?: unknown;
};
type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
  crs?: unknown;
};

const DEFAULT_DIGITAL_ADDRESS_PREFIX = "-23-46";
const DEFAULT_PLUS_CODE_PREFIX = "5858";
const DECIMAL_INPUT_REGEX = /^-?\d+(?:[.,]\d+)?$/;

const normalizeDecimalInput = (value: string) =>
  value.trim().replace(/\s+/g, "").replace(",", ".");

const getDecimalPlaces = (value: string) => {
  const normalizedValue = normalizeDecimalInput(value);
  if (!normalizedValue.includes(".")) return 0;

  return normalizedValue.split(".")[1]?.length ?? 0;
};

const buildFormatError = ({
  field,
  example,
  extra,
}: {
  field: string;
  example: string;
  extra?: string;
}) =>
  `Há um problema com o formato informado em ${field}. Compare o valor preenchido com o exemplo: ${example}.${
    extra ? ` ${extra}` : ""
  }`;

const buildGeoJsonError = (detail?: string) =>
  `Há um problema com o formato do arquivo GeoJSON.${detail ? ` ${detail}` : ""} Compare a estrutura com um dos arquivos de exemplo disponíveis abaixo.`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isPolygonGeometry = (value: unknown): value is GeoJsonPolygonGeometry =>
  isRecord(value) &&
  (value.type === "Polygon" || value.type === "MultiPolygon") &&
  Array.isArray(value.coordinates);

const isGeoJsonFeature = (value: unknown): value is GeoJsonFeature =>
  isRecord(value) && value.type === "Feature";

const isGeoJsonFeatureCollection = (
  value: unknown,
): value is GeoJsonFeatureCollection =>
  isRecord(value) &&
  value.type === "FeatureCollection" &&
  Array.isArray(value.features);

const transformCoordinatesToWgs84 = (
  coordinates: unknown,
  sourceCrs: CoordinateReferenceSystem,
): unknown => {
  if (
    Array.isArray(coordinates) &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  ) {
    return proj4(sourceCrs, "EPSG:4326", coordinates as [number, number]);
  }

  if (Array.isArray(coordinates)) {
    return coordinates.map((coordinate) =>
      transformCoordinatesToWgs84(coordinate, sourceCrs),
    );
  }

  return coordinates;
};

const getFeatureFromGeoJson = (value: unknown): GeoJsonFeature => {
  if (isGeoJsonFeatureCollection(value)) {
    const firstFeature = value.features[0];
    if (!firstFeature) {
      throw new Error(
        " O arquivo está vazio. Envie um GeoJSON com pelo menos uma feição do tipo Polygon ou MultiPolygon.",
      );
    }

    if (!isPolygonGeometry(firstFeature.geometry)) {
      throw new Error(
        " Este fluxo aceita apenas Polygon ou MultiPolygon. Compare a geometria do arquivo com o exemplo disponibilizado.",
      );
    }

    return firstFeature;
  }

  if (isGeoJsonFeature(value)) {
    if (!isPolygonGeometry(value.geometry)) {
      throw new Error(
        " Este fluxo aceita apenas Polygon ou MultiPolygon. Compare a geometria do arquivo com o exemplo disponibilizado.",
      );
    }

    return value;
  }

  if (isPolygonGeometry(value)) {
    return {
      type: "Feature",
      geometry: value,
      properties: {},
    };
  }

  throw new Error(
    " Formato incompatível. Use FeatureCollection, Feature, Polygon ou MultiPolygon.",
  );
};

const getPolygonCenter = (
  geometry: GeoJsonPolygonGeometry,
): [number, number] => {
  if (geometry.type === "Polygon") {
    const ring = geometry.coordinates[0];
    if (!ring?.length) {
      throw new Error(
        " O GeoJSON não possui coordenadas suficientes para desenhar o perímetro. Compare com o exemplo disponibilizado.",
      );
    }

    return calculateCentroid(ring) as [number, number];
  }

  const ring = geometry.coordinates[0]?.[0];
  if (!ring?.length) {
    throw new Error(
      " O GeoJSON não possui coordenadas suficientes para desenhar o perímetro. Compare com o exemplo disponibilizado.",
    );
  }

  return calculateCentroid(ring) as [number, number];
};

interface LocationSelectionCardProps {
  initialOption?: string | null;
  initialInputType?: LocationInputType;
}

export const LocationSelectionCard = ({
  initialOption = null,
  initialInputType = "latlon",
}: LocationSelectionCardProps) => {
  const { toastInfo } = useToast();
  const {
    flyTo,
    layerSchemas,
    digitalAddressFeature,
    isPickingLocation,
    onLocationPick,
  } = useMapContext();
  const { editFeature } = usePolygonEditContext();
  const { navigateReplace } = useNavigationContext();

  const step = useSignal(initialOption ? 2 : 1);
  const geoJsonFile = useSignal<File | null>(null);
  const error = useSignal("");
  const selectedOption = useSignal<string | null>(initialOption);

  const crs = useSignal<CoordinateReferenceSystem>("EPSG:31983");
  const inputType = useSignal<LocationInputType>(initialInputType);
  const latitude = useSignal("");
  const longitude = useSignal("");
  const digitalAddress = useSignal("");
  const plusCodeInput = useSignal("");

  const resetMapCapture = () => {
    isPickingLocation.value = false;
    onLocationPick.value = null;
  };

  const resetToInitialStep = () => {
    resetMapCapture();
    step.value = 1;
    selectedOption.value = null;
  };

  const validateInputs = () => {
    if (selectedOption.value === "coordenadas") {
      if (inputType.value === "latlon") {
        const normalizedLatitude = normalizeDecimalInput(latitude.value);
        const normalizedLongitude = normalizeDecimalInput(longitude.value);

        if (!normalizedLatitude || !normalizedLongitude) {
          error.value =
            crs.value === "EPSG:31983"
              ? buildFormatError({
                  field: "Northing / Norte (Y) e Easting / Leste (X)",
                  example: "Northing 7394382 e Easting 333199",
                  extra:
                    "Use um valor por campo e informe as medidas em metros.",
                })
              : buildFormatError({
                  field: "latitude e longitude",
                  example: "latitude -23.550520 e longitude -46.633300",
                  extra: "Use um valor por campo, em graus decimais.",
                });
          return false;
        }

        if (
          !DECIMAL_INPUT_REGEX.test(normalizedLatitude) ||
          !DECIMAL_INPUT_REGEX.test(normalizedLongitude)
        ) {
          error.value =
            crs.value === "EPSG:31983"
              ? buildFormatError({
                  field: "coordenadas UTM",
                  example: "Northing 7394382 e Easting 333199",
                  extra:
                    "São aceitos números inteiros ou decimais, com ponto ou vírgula decimal.",
                })
              : buildFormatError({
                  field: "coordenadas geográficas",
                  example: "latitude -23.550520 e longitude -46.633300",
                  extra: "São aceitos números com ponto ou vírgula decimal.",
                });
          return false;
        }

        const lat = Number(normalizedLatitude);
        const lon = Number(normalizedLongitude);
        const isProjected = crs.value === "EPSG:31983";

        latitude.value = normalizedLatitude;
        longitude.value = normalizedLongitude;

        if (!isProjected) {
          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lon) ||
            lat < -90 ||
            lat > 90 ||
            lon < -180 ||
            lon > 180
          ) {
            error.value = buildFormatError({
              field: "coordenadas geográficas",
              example: "latitude -23.550520 e longitude -46.633300",
              extra:
                "Latitude deve estar entre -90 e 90; longitude entre -180 e 180.",
            });
            return false;
          }

          if (
            getDecimalPlaces(latitude.value) < 5 ||
            getDecimalPlaces(longitude.value) < 5
          ) {
            error.value = buildFormatError({
              field: "coordenadas geográficas",
              example: "latitude -23.550520 e longitude -46.633300",
              extra:
                "Use pelo menos 5 casas decimais para representar aproximadamente 1 metro.",
            });
            return false;
          }
        }

        if (isProjected) {
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            error.value = buildFormatError({
              field: "coordenadas UTM",
              example: "Northing 7394382 e Easting 333199",
              extra: "Os valores precisam ser numéricos e estar em metros.",
            });
            return false;
          }

          if (lat < 0 || lat > 10000000 || lon < 100000 || lon > 900000) {
            error.value = buildFormatError({
              field: "coordenadas UTM 23S",
              example: "Northing 7394382 e Easting 333199",
              extra:
                "Northing deve estar em metros no intervalo aproximado de 0 a 10.000.000, e Easting entre 100.000 e 900.000.",
            });
            return false;
          }
        }
      } else if (inputType.value === "digital") {
        if (!digitalAddress.value.trim()) {
          error.value = buildFormatError({
            field: "Endereço Digital",
            example: `${DEFAULT_DIGITAL_ADDRESS_PREFIX} J6M-GHNT`,
            extra:
              "Você também pode informar apenas o sufixo J6M-GHNT para usar o prefixo padrão de São Paulo.",
          });
          return false;
        }

        const cleanAddress = digitalAddress.value
          .trim()
          .toUpperCase()
          .replace(/\s+/g, "");
        const digitalPartialRegex =
          /^[23456789BCDFGHJKLMNPQTVWXYZ]{3}-?[23456789BCDFGHJKLMNPQTVWXYZ]{4}$/i;

        if (digitalPartialRegex.test(cleanAddress)) {
          const cleanSuffix = cleanAddress.replace("-", "");
          const formattedSuffix = `${cleanSuffix.substring(0, 3)}-${cleanSuffix.substring(3)}`;
          digitalAddress.value = `${DEFAULT_DIGITAL_ADDRESS_PREFIX} ${formattedSuffix}`;
          toastInfo(
            `Prefixo ${DEFAULT_DIGITAL_ADDRESS_PREFIX} (São Paulo) aplicado automaticamente.`,
          );
        }

        try {
          decode(digitalAddress.value.replace(/\s/g, ""));
        } catch {
          error.value = buildFormatError({
            field: "Endereço Digital",
            example: `${DEFAULT_DIGITAL_ADDRESS_PREFIX} J6M-GHNT`,
            extra:
              "Compare exatamente o prefixo e o bloco final com o exemplo informado.",
          });
          return false;
        }
      } else if (inputType.value === "pluscode") {
        let code = plusCodeInput.value.trim().toUpperCase().replace(/\s+/g, "");
        if (!code) {
          error.value = buildFormatError({
            field: "Plus Code",
            example: "58PH6G7J+R9",
            extra:
              "Se você tiver um código curto, informe-o no mesmo padrão ou deixe o sistema completar com o prefixo padrão de São Paulo.",
          });
          return false;
        }

        if (!olc.isValid(code)) {
          if (olc.isValid(DEFAULT_PLUS_CODE_PREFIX + code)) {
            code = DEFAULT_PLUS_CODE_PREFIX + code;
            plusCodeInput.value = code;
            toastInfo(
              `Prefixo ${DEFAULT_PLUS_CODE_PREFIX} (São Paulo) aplicado automaticamente ao Plus Code.`,
            );
          } else {
            error.value = buildFormatError({
              field: "Plus Code",
              example: "58PH6G7J+R9",
              extra:
                "O código precisa seguir o mesmo padrão alfanumérico do exemplo.",
            });
            return false;
          }
        }

        if (!olc.isFull(code)) {
          if (
            olc.isValid(DEFAULT_PLUS_CODE_PREFIX + code) &&
            olc.isFull(DEFAULT_PLUS_CODE_PREFIX + code)
          ) {
            code = DEFAULT_PLUS_CODE_PREFIX + code;
            plusCodeInput.value = code;
            toastInfo(
              `Plus Code curto completado com o prefixo ${DEFAULT_PLUS_CODE_PREFIX}.`,
            );
          } else {
            error.value = buildFormatError({
              field: "Plus Code curto",
              example: `${DEFAULT_PLUS_CODE_PREFIX}PH6G7J+R9`,
              extra:
                "Se o código estiver incompleto, compare o prefixo aplicado com o exemplo acima.",
            });
            return false;
          }
        }
      }
    } else if (selectedOption.value === "geoJson" && !geoJsonFile.value) {
      error.value = buildGeoJsonError(
        " Selecione um arquivo .geojson ou .json com Polygon ou MultiPolygon",
      );
      return false;
    }

    error.value = "";
    return true;
  };

  const handleCaptureToggle = (type: LocationInputType) => {
    if (isPickingLocation.value) {
      resetMapCapture();
      return;
    }

    isPickingLocation.value = true;
    onLocationPick.value = (lat, lon) => {
      if (type === "latlon") {
        let [x, y] = [lon, lat];
        if (crs.value === "EPSG:31983") {
          [x, y] = proj4("EPSG:4326", "EPSG:31983", [lon, lat]);
        } else if (crs.value === "EPSG:4674") {
          [x, y] = proj4("EPSG:4326", "EPSG:4674", [lon, lat]);
        }
        latitude.value = y.toFixed(6);
        longitude.value = x.toFixed(6);
      } else if (type === "digital") {
        digitalAddress.value = encode(lat, lon);
      } else if (type === "pluscode") {
        plusCodeInput.value = olc.encode(lat, lon);
      }

      error.value = "";
    };
  };

  const handleSubmit = async () => {
    if (!validateInputs()) {
      return;
    }

    try {
      if (selectedOption.value === "coordenadas") {
        let lat: number, lon: number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let polygonCoords: any[] = [];
        let typeLabel = "digital";

        if (inputType.value === "latlon") {
          lat = Number(normalizeDecimalInput(latitude.value));
          lon = Number(normalizeDecimalInput(longitude.value));

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
          const cleanAddress = digitalAddress.value.replace(/\s/g, "");
          const decoded = decode(cleanAddress);
          lat = decoded.latitude;
          lon = decoded.longitude;

          const p = getPolygon(cleanAddress);
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
        } else {
          // pluscode
          typeLabel = "pluscode";
          const codeArea = olc.decode(plusCodeInput.value);
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
        const calcPlusCode = olc.encode(lat, lon, 12); // High precision

        // Construct FeatureCollection
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const features: any[] = [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [lon, lat],
            },
            properties: { type: "marker" },
          },
        ];

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

        const destination = {
          center: [lon, lat],
          zoom: 22,
          pitch: 45,
          bearing: 0,
        };

        flyTo(destination);

        navigateReplace(
          <DigitalAddressDetails
            latitude={lat}
            longitude={lon}
            plusCode={calcPlusCode}
            sourceType={inputType.value}
          />,
        );
      } else if (selectedOption.value === "geoJson") {
        const success = await openObj({
          file: geoJsonFile.value!,
          crs: crs.value,
        });
        if (!success) {
          return;
        }
      }
      resetToInitialStep();
    } catch (submitError) {
      console.error("Falha ao localizar a referência informada.", submitError);
      error.value =
        selectedOption.value === "geoJson"
          ? buildGeoJsonError(
              " Não foi possível processar o arquivo enviado. Compare a estrutura do arquivo com os exemplos disponíveis",
            )
          : "Não foi possível localizar a referência informada. Verifique o formato, compare o preenchimento com o exemplo exibido e tente novamente.";
    }
  };

  const openObj = async ({
    file,
    crs,
  }: {
    file: File;
    crs: CoordinateReferenceSystem;
  }) => {
    if (!file) return;
    try {
      let object = await transformFileToJson(file);

      if (crs !== "EPSG:4326") {
        if (isGeoJsonFeatureCollection(object)) {
          object = {
            ...object,
            features: object.features.map((feature) => ({
              ...feature,
              geometry: feature.geometry
                ? {
                    ...feature.geometry,
                    coordinates: transformCoordinatesToWgs84(
                      feature.geometry.coordinates,
                      crs,
                    ) as GeoJsonPolygonGeometry["coordinates"],
                  }
                : null,
            })),
          };
        } else if (
          isGeoJsonFeature(object) &&
          isPolygonGeometry(object.geometry)
        ) {
          object = {
            ...object,
            geometry: {
              ...object.geometry,
              coordinates: transformCoordinatesToWgs84(
                object.geometry.coordinates,
                crs,
              ) as GeoJsonPolygonGeometry["coordinates"],
            },
          };
        } else if (isPolygonGeometry(object)) {
          object = {
            ...object,
            coordinates: transformCoordinatesToWgs84(
              object.coordinates,
              crs,
            ) as GeoJsonPolygonGeometry["coordinates"],
          };
        }
      }

      const featureToEdit = getFeatureFromGeoJson(object);
      delete featureToEdit.crs;

      editFeature(featureToEdit);

      if (featureToEdit.geometry) {
        const [centerLongitude, centerLatitude] = getPolygonCenter(
          featureToEdit.geometry,
        );
        flyTo({
          center: [centerLongitude, centerLatitude],
          zoom: 18,
          bearing: 0,
        });
      }

      error.value = "";
      return true;
    } catch (openError) {
      console.error("Falha ao abrir o arquivo GeoJSON informado.", openError);
      error.value =
        openError instanceof Error
          ? buildGeoJsonError(openError.message)
          : buildGeoJsonError(
              " Não foi possível interpretar o conteúdo do arquivo. Compare a estrutura com os exemplos disponíveis",
            );
      return false;
    }
  };

  const handleOptionSelect = (option: string) => {
    resetMapCapture();
    selectedOption.value = option;
    step.value = 2;
    error.value = "";
    // Clear previous digital features
    digitalAddressFeature.value = null;
  };

  return (
    <div className="grid gap-2">
      {step.value === 1 ? (
        <div className="flex flex-col gap-2">
          {/* Concatenated Search Removed */}

          <div
            className="cursor-pointer bg-card shadow-sm hover:bg-accent/50 transition-colors rounded-lg border p-3 flex items-center gap-3"
            onClick={() => handleOptionSelect("coordenadas")}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="flex flex-col flex-1 text-left">
              <span className="text-sm font-semibold">
                Buscar por ponto, código ou coordenadas
              </span>
              <span className="text-xs text-muted-foreground">
                Informe latitude/longitude, UTM em metros, Endereço Digital ou
                Plus Code.
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <div
            className="cursor-pointer bg-card shadow-sm hover:bg-accent/50 transition-colors rounded-lg border p-3 flex items-center gap-3"
            onClick={() => handleOptionSelect("geoJson")}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileJson className="h-5 w-5" />
            </div>
            <div className="flex flex-col flex-1 text-left">
              <span className="text-sm font-semibold">
                Buscar com perímetro georeferenciado
              </span>
              <span className="text-xs text-muted-foreground">
                Envie um GeoJSON (.geojson ou .json) com Polygon ou
                MultiPolygon.
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* <div
            className="cursor-pointer bg-card shadow-sm hover:bg-accent/50 transition-colors rounded-lg border p-3 flex items-center gap-3"
            onClick={() => navigateTo(<MapLibrary />)}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Library className="h-5 w-5" />
            </div>
            <div className="flex flex-col flex-1 text-left">
              <span className="text-sm font-semibold text-foreground">Biblioteca e Histórico</span>
              <span className="text-xs text-muted-foreground">
                Acesse suas visualizações e buscas salvas.
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div> */}
        </div>
      ) : (
        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="p-3 pb-0 space-y-1">
            <CardTitle className="text-base font-medium">
              {selectedOption.value === "coordenadas"
                ? "Informar ponto, código ou coordenadas"
                : "Enviar perímetro georreferenciado"}
            </CardTitle>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {selectedOption.value === "coordenadas"
                ? "Use sempre o mesmo padrão mostrado nos exemplos abaixo. Se houver erro, compare o valor digitado com o exemplo do formato escolhido."
                : "Use um arquivo GeoJSON no mesmo padrão dos exemplos disponíveis. Se houver erro, compare a estrutura do seu arquivo com um dos modelos abaixo."}
            </p>
          </CardHeader>
          <CardContent className="p-2 space-y-2">
            {selectedOption.value === "coordenadas" && (
              <div className="space-y-2">
                <div className="grid w-full max-w-sm items-center gap-1">
                  <Label className="text-[10px] text-muted-foreground uppercase font-bold">
                    Método de busca
                  </Label>
                  <Select
                    value={inputType.value}
                    onValueChange={(value) => {
                      inputType.value = value as LocationInputType;
                      error.value = "";
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latlon">
                        Coordenadas geográficas ou UTM
                      </SelectItem>
                      <SelectItem value="digital">Endereço Digital</SelectItem>
                      <SelectItem value="pluscode">
                        Plus Code / Open Location Code
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {inputType.value === "latlon" && (
                  <div className="space-y-2">
                    <div className="grid w-full max-w-sm items-center gap-1">
                      <Label className="text-[10px] text-muted-foreground uppercase font-bold">
                        Projeção
                      </Label>
                      <Select
                        value={crs.value}
                        onValueChange={(value) => {
                          crs.value = value as CoordinateReferenceSystem;
                          error.value = "";
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a projeção" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EPSG:4326">
                            WGS 84 / EPSG:4326 (graus decimais)
                          </SelectItem>
                          <SelectItem value="EPSG:4674">
                            SIRGAS 2000 / WGS 84 (Geográfico)
                          </SelectItem>
                          <SelectItem value="EPSG:31983">
                            SIRGAS 2000 / UTM 23S / EPSG:31983 (metros)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="grid w-full items-center gap-1">
                        <Label htmlFor="latitude" className="text-xs">
                          {crs.value === "EPSG:31983"
                            ? "Northing / Norte (Y, metros)"
                            : "Latitude (Y, graus)"}
                        </Label>
                        <Input
                          className="h-8 text-xs"
                          type="text"
                          inputMode="decimal"
                          id="latitude"
                          value={latitude.value}
                          placeholder={
                            crs.value === "EPSG:31983"
                              ? "7394382"
                              : "-23.550520"
                          }
                          onChange={(e) => {
                            latitude.value = (
                              e.currentTarget as HTMLInputElement
                            ).value;
                            error.value = "";
                          }}
                        />
                        <p className="text-[9px] text-muted-foreground">
                          Exemplo compatível:{" "}
                          {crs.value === "EPSG:31983"
                            ? "7394382"
                            : "-23.550520"}
                        </p>
                      </div>
                      <div className="grid w-full items-center gap-1">
                        <Label htmlFor="longitude" className="text-xs">
                          {crs.value === "EPSG:31983"
                            ? "Easting / Leste (X, metros)"
                            : "Longitude (X, graus)"}
                        </Label>
                        <Input
                          className="h-8 text-xs"
                          type="text"
                          inputMode="decimal"
                          id="longitude"
                          value={longitude.value}
                          placeholder={
                            crs.value === "EPSG:31983" ? "333199" : "-46.633300"
                          }
                          onChange={(e) => {
                            longitude.value = (
                              e.currentTarget as HTMLInputElement
                            ).value;
                            error.value = "";
                          }}
                        />
                        <p className="text-[9px] text-muted-foreground">
                          Exemplo compatível:{" "}
                          {crs.value === "EPSG:31983" ? "333199" : "-46.633300"}
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
                        ? "Clique no mapa para preencher os campos"
                        : "Capturar no mapa"}
                    </Button>

                    <div className="bg-muted/50 p-2 rounded-lg border text-[10px] text-muted-foreground leading-relaxed mt-2">
                      <p className="font-semibold text-foreground/80">
                        Formato esperado
                      </p>
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        {crs.value === "EPSG:31983" ? (
                          <>
                            <li>
                              <strong>Northing / Norte (Y)</strong> e{" "}
                              <strong>Easting / Leste (X)</strong> em metros.
                            </li>
                            <li>
                              Exemplo compatível: Northing 7394382 e Easting
                              333199.
                            </li>
                            <li>
                              São aceitos números inteiros ou decimais, com
                              ponto ou vírgula decimal.
                            </li>
                          </>
                        ) : (
                          <>
                            <li>
                              <strong>Latitude (Y)</strong> e{" "}
                              <strong>Longitude (X)</strong> em graus decimais.
                            </li>
                            <li>
                              Exemplo compatível: latitude -23.550520 e
                              longitude -46.633300.
                            </li>
                            <li>
                              Compatível também com vírgula decimal: -23,550520
                              e -46,633300.
                            </li>
                            <li>
                              Use pelo menos 5 casas decimais para representar
                              aproximadamente 1 metro.
                            </li>
                          </>
                        )}
                      </ul>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 text-[10px]">
                        <a
                          href="https://epsg.io/4326"
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          Referência EPSG:4326
                        </a>
                        <a
                          href="https://epsg.io/4674"
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          Referência EPSG:4674
                        </a>
                        <a
                          href="https://epsg.io/31983"
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          Referência EPSG:31983
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {inputType.value === "digital" && (
                  <div className="grid w-full max-w-sm items-center gap-2">
                    <div className="grid w-full max-w-sm items-center gap-1">
                      <Label htmlFor="digitalAddress" className="text-xs">
                        Endereço Digital
                      </Label>
                      <Input
                        className="h-8 text-xs"
                        type="text"
                        id="digitalAddress"
                        value={digitalAddress.value}
                        placeholder="-23-46 J6M-GHNT"
                        onChange={(e) => {
                          digitalAddress.value = (
                            e.currentTarget as HTMLInputElement
                          ).value;
                          error.value = "";
                        }}
                      />
                      <p className="text-[9px] text-muted-foreground">
                        Exemplo compatível: -23-46 J6M-GHNT. Também aceitamos
                        apenas o sufixo J6M-GHNT.
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
                      onClick={() => handleCaptureToggle("digital")}
                    >
                      <MapPin className="h-4 w-4" />
                      {isPickingLocation.value
                        ? "Clique no mapa para preencher o Endereço Digital"
                        : "Capturar no mapa"}
                    </Button>

                    <div className="bg-muted/50 p-2 rounded-lg border text-[10px] text-muted-foreground leading-relaxed">
                      <p className="font-semibold text-foreground/80">
                        Formato esperado
                      </p>
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        <li>
                          Prefixo regional + código final, no padrão{" "}
                          <strong>-23-46 J6M-GHNT</strong>.
                        </li>
                        <li>
                          Compatível também com o sufixo isolado{" "}
                          <strong>J6M-GHNT</strong>; nesse caso usamos o prefixo
                          padrão de São Paulo.
                        </li>
                        <li>
                          O resultado representa uma área aproximada de 1 metro
                          quadrado.
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {inputType.value === "pluscode" && (
                  <div className="grid w-full max-w-sm items-center gap-2">
                    <div className="grid w-full max-w-sm items-center gap-1">
                      <Label htmlFor="plusCode" className="text-xs">
                        Plus Code / Open Location Code
                      </Label>
                      <Input
                        className="h-8 text-xs"
                        type="text"
                        id="plusCode"
                        value={plusCodeInput.value}
                        placeholder="58PH6G7J+R9"
                        onChange={(e) => {
                          plusCodeInput.value = (
                            e.currentTarget as HTMLInputElement
                          ).value;
                          error.value = "";
                        }}
                      />
                      <p className="text-[9px] text-muted-foreground">
                        Exemplo compatível: 58PH6G7J+R9. Também aceitamos o
                        código curto e tentamos completar com o prefixo padrão.
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
                        ? "Clique no mapa para preencher o Plus Code"
                        : "Capturar no mapa"}
                    </Button>

                    <div className="bg-muted/50 p-2 rounded-lg border text-[10px] text-muted-foreground leading-relaxed">
                      <p className="font-semibold text-foreground/80">
                        Formato esperado
                      </p>
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        <li>
                          Use o padrão <strong>58PH6G7J+R9</strong>.
                        </li>
                        <li>
                          Compatível também com código curto; tentaremos
                          completar com o prefixo{" "}
                          <strong>{DEFAULT_PLUS_CODE_PREFIX}</strong> (São
                          Paulo).
                        </li>
                        <li>
                          O Plus Code representa uma área, não apenas um ponto
                          central.
                        </li>
                      </ul>
                      <div className="pt-2">
                        <a
                          href="https://maps.google.com/pluscodes/"
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          Referência oficial do Plus Code
                        </a>
                      </div>
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
                    onValueChange={(value) => {
                      crs.value = value as CoordinateReferenceSystem;
                      error.value = "";
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a projeção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EPSG:4326">
                        WGS 84 / EPSG:4326
                      </SelectItem>
                      <SelectItem value="EPSG:4674">
                        SIRGAS 2000 / WGS 84 (Geográfico)
                      </SelectItem>
                      <SelectItem value="EPSG:31983">
                        SIRGAS 2000 / UTM 23S / EPSG:31983
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid w-full max-w-sm items-center gap-1">
                  <Label htmlFor="geojson" className="text-xs">
                    Selecione o arquivo
                  </Label>
                  <Input
                    className="h-12 text-xs"
                    type="file"
                    id="geojson"
                    accept=".geojson,.json,application/geo+json,application/json"
                    onChange={(e) => {
                      geoJsonFile.value = e.currentTarget.files
                        ? e.currentTarget.files[0]
                        : null;
                      error.value = "";
                    }}
                  />
                  <div className="bg-muted/50 p-2 rounded-lg border text-[10px] text-muted-foreground leading-relaxed mt-2">
                    <p className="font-semibold text-foreground/80">
                      Compatibilidade do arquivo
                    </p>
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                      <li>
                        Extensões aceitas: <strong>.geojson</strong> e{" "}
                        <strong>.json</strong>.
                      </li>
                      <li>
                        Estruturas aceitas: <strong>FeatureCollection</strong>,{" "}
                        <strong>Feature</strong>, <strong>Polygon</strong> e{" "}
                        <strong>MultiPolygon</strong>.
                      </li>
                      <li>
                        Use a projeção correta antes de localizar. O sistema
                        converte para WGS 84 internamente.
                      </li>
                    </ul>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2">
                      <a
                        href="https://epsg.io/4326"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        Referência EPSG:4326
                      </a>
                      <a
                        href="https://epsg.io/4674"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        Referência EPSG:4674
                      </a>
                      <a
                        href="https://epsg.io/31983"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        Referência EPSG:31983
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-4 text-[10px] text-muted-foreground pt-5">
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
                      Exemplo WGS 84 / EPSG:4326
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
                      Exemplo SIRGAS 2000 / UTM 23S
                    </a>
                  </div>
                </div>
              </div>
            )}

            {error.value && (
              <div className="bg-red-50 text-red-600 p-1.5 rounded text-[10px] border border-red-200">
                {error.value}
              </div>
            )}

            <div className="flex gap-2 pt-1 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToInitialStep}
                className="rounded-full h-7 text-xs"
              >
                Voltar
              </Button>
              <Button
                onClick={() => void handleSubmit()}
                size="sm"
                className="rounded-full shadow-sm h-7 text-xs"
              >
                Localizar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
