import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/useToast";
import { useMapContext } from "../../hooks/useMapContext";
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  cn,
  UrbisIcon,
} from "@open-urbis/map-ui";
import { useEffect, useRef, useState } from "preact/compat";
import proj4 from "proj4";
import { ClickActionEnum } from "@open-urbis/map-shared";
import { CLICK_ACTIONS_CONFIG } from "../../application-configs";
import { calculateCenterId } from "../../utils/calculateCenterId";

import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { useSearchContext } from "../../hooks/useSearchContext";
import {
  IGetSearchConfigResponse,
  IGetSearchItem,
  IGetSearchItemError,
} from "../../types/fetch-search-config-type";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { enabledFeatureFlags } from "../../features/feature-flags";
import { DigitalAddressDetails } from "../LocationSelectionCard/DigitalAddressDetails";
import { requestedLayerMetadataId } from "../LayerController/state";
import { getGeoJsonBounds } from "../MapView/utils";
import { decode, getPolygon } from "@open-urbis/endereco-digital";
// @ts-ignore
import { OpenLocationCode } from "open-location-code";

const olc = new OpenLocationCode();
const SAO_PAULO_DIGITAL_ADDRESS_PREFIX = "-23-46";
const SAO_PAULO_PLUS_CODE_PREFIX = "588M";
const DIGITAL_ADDRESS_ALLOWED_CHARS = "23456789BCDFGHJKLMNPQTVWXYZ";
const TAX_PERIMETERS_LAYER_LABEL = "Lotes fiscais";

const normalizeSearchGroupLabel = (value?: string) => {
  if (!value) return "";

  const normalizedValue = value.trim();
  const lowerValue = normalizedValue.toLocaleLowerCase("pt-BR");

  if (lowerValue.includes("logradouro") && lowerValue.includes("tribut")) {
    return TAX_PERIMETERS_LAYER_LABEL;
  }

  if (/^logradouros?$/i.test(normalizedValue)) {
    return TAX_PERIMETERS_LAYER_LABEL;
  }

  return normalizedValue;
};

proj4.defs(
  "EPSG:31983",
  "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
);

const normalizeSearchToken = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9+-.,\s]/g, "")
    .trim();

const normalizeAlphanumeric = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, "");

const formatDigitalAddressSuffix = (value: string) =>
  `${value.substring(0, 3)}-${value.substring(3, 7)}`;

const hasOnlyDigitalAddressChars = (value: string) =>
  [...value].every((char) => DIGITAL_ADDRESS_ALLOWED_CHARS.includes(char));

const normalizeDigitalAddressTerm = (term: string) => {
  const cleanTerm = term.replace(/\s/g, "").toUpperCase();
  const partial = cleanTerm.match(
    /^[23456789BCDFGHJKLMNPQTVWXYZ]{3}-?[23456789BCDFGHJKLMNPQTVWXYZ]{4}$/,
  );

  if (partial) {
    const suffix = normalizeAlphanumeric(cleanTerm);
    return {
      address: `${SAO_PAULO_DIGITAL_ADDRESS_PREFIX} ${formatDigitalAddressSuffix(suffix)}`,
      assumedPrefix: true,
    };
  }

  const full = cleanTerm.match(
    /^([+-]\d{1,2}[+-]\d{1,3})([23456789BCDFGHJKLMNPQTVWXYZ]{3})-?([23456789BCDFGHJKLMNPQTVWXYZ]{4})$/,
  );

  if (!full) return null;

  return {
    address: `${full[1]} ${full[2]}-${full[3]}`,
    assumedPrefix: false,
  };
};

const normalizePlusCodeTerm = (term: string) => {
  const raw = normalizeSearchToken(term).replace(/\s/g, "");
  const code = raw.includes("+")
    ? raw
    : raw.length >= 10
      ? `${raw.substring(0, 8)}+${raw.substring(8)}`
      : raw.length >= 6 && raw.length <= 8
        ? `${SAO_PAULO_PLUS_CODE_PREFIX}${raw.substring(0, 4)}+${raw.substring(4)}`
        : raw;

  try {
    if (!olc.isValid(code)) return null;
    const fullCode = olc.isFull(code)
      ? code
      : olc.recoverNearest(code, -23.55052, -46.633308);
    const decoded = olc.decode(fullCode);

    return {
      code: fullCode,
      latitude: decoded.latitudeCenter,
      longitude: decoded.longitudeCenter,
      bounds: {
        latitudeLo: decoded.latitudeLo,
        latitudeHi: decoded.latitudeHi,
        longitudeLo: decoded.longitudeLo,
        longitudeHi: decoded.longitudeHi,
      },
      assumedPrefix: !raw.startsWith(SAO_PAULO_PLUS_CODE_PREFIX),
    };
  } catch {
    return null;
  }
};

const getCifDisplayValue = (term: string) => {
  const raw = term.trim();
  if (!raw) return null;

  const digits = raw.replace(/\D/g, "");
  const parts = raw.split(/[^0-9]+/).filter(Boolean);

  if (/^\d{10}$/.test(digits)) {
    return `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 10)}`;
  }

  if (/^\d{11}$/.test(digits)) {
    return `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 10)}-${digits.substring(10, 11)}`;
  }

  if (/^\d{12}$/.test(digits)) {
    return `${digits.substring(0, 3)}.${digits.substring(3, 6)}.CD${digits.substring(6, 8)}.${digits.substring(8, 12)}`;
  }

  if (/^\d{13}$/.test(digits)) {
    return `${digits.substring(0, 3)}.${digits.substring(3, 6)}.CD${digits.substring(6, 8)}.${digits.substring(8, 12)}-${digits.substring(12, 13)}`;
  }

  if (
    parts.length >= 3 &&
    parts.length <= 5 &&
    parts[0]?.length === 3 &&
    parts[1]?.length === 3 &&
    parts.every((part) => /^\d+$/.test(part))
  ) {
    const setor = parts[0];
    const quadra = parts[1];
    let lote: string | null = null;
    let condominio: string | null = null;
    let digito: string | null = null;

    if (parts[2]?.length === 4) {
      lote = parts[2];
      if (parts[3]?.length === 2) condominio = parts[3];
      if (parts[3]?.length === 1) digito = parts[3];
      if (parts[4]?.length === 1) digito = parts[4];
    } else if (parts[2]?.length === 2 && parts[3]?.length === 4) {
      condominio = parts[2];
      lote = parts[3];
      if (parts[4]?.length === 1) digito = parts[4];
    }

    if (lote) {
      const base = condominio
        ? [setor, quadra, `CD${condominio}`, lote].join(".")
        : [setor, quadra, lote].join(".");
      return digito ? `${base}-${digito}` : base;
    }
  }

  return null;
};

const isLikelyCifTerm = (term: string) => Boolean(getCifDisplayValue(term));

const parseCoordinateTerm = (term: string) => {
  if (isLikelyCifTerm(term)) return null;

  const normalized = term.trim().replace(/[;|]/g, ",").replace(/\s+/g, " ");

  // Evita interpretar códigos alfanuméricos, como Plus Codes (`3G2C+R6`),
  // como pares numéricos soltos (`3`, `2`).
  const coordinateOnlyPattern =
    /^[\d\s.,;|+\-°º()/:xyXYlatlongLATLONGnsewNSEWutmUTMsirgasSIRGAS]+$/;
  if (!coordinateOnlyPattern.test(term)) return null;

  const numbers = normalized.match(/[+-]?\d+(?:[.,]\d+)?/g);

  if (!numbers || numbers.length !== 2) return null;

  const first = Number(numbers[0].replace(",", "."));
  const second = Number(numbers[1].replace(",", "."));
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;

  const isLatLon = Math.abs(first) <= 90 && Math.abs(second) <= 180;
  if (isLatLon) {
    return {
      latitude: first,
      longitude: second,
      label: `${first.toFixed(6)}, ${second.toFixed(6)}`,
      source: "Coordenadas geográficas informadas pelo usuário",
    };
  }

  const looksLikeSirgasUtm =
    first >= 100000 &&
    first <= 900000 &&
    second >= 7000000 &&
    second <= 8000000;

  if (!looksLikeSirgasUtm) return null;

  const [longitude, latitude] = proj4("EPSG:31983", "EPSG:4326", [
    first,
    second,
  ]);

  return {
    latitude,
    longitude,
    label: `${Math.round(first)}, ${Math.round(second)} — SIRGAS 2000 / UTM 23S`,
    source: "Coordenadas projetadas informadas pelo usuário",
  };
};

const getDigitalAddressPolygonCoords = (address: string) => {
  const polygon = getPolygon(address);
  const lats = polygon.map((point) => point.lat);
  const lons = polygon.map((point) => point.lon);
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

const convertFeatureToSirgas = (feature: any) => {
  if (!feature || !feature.geometry) return feature;
  const cloned = JSON.parse(JSON.stringify(feature));

  const transform = (coords: any): any => {
    if (typeof coords[0] === "number") {
      return proj4("EPSG:4326", "EPSG:31983", coords);
    }
    return coords.map(transform);
  };

  if (cloned.geometry.coordinates) {
    cloned.geometry.coordinates = transform(cloned.geometry.coordinates);
  }

  if (cloned.bbox) {
    const min = proj4("EPSG:4326", "EPSG:31983", [
      cloned.bbox[0],
      cloned.bbox[1],
    ]);
    const max = proj4("EPSG:4326", "EPSG:31983", [
      cloned.bbox[2],
      cloned.bbox[3],
    ]);
    cloned.bbox = [min[0], min[1], max[0], max[1]];
  }

  cloned.crs = {
    type: "name",
    properties: { name: "urn:ogc:def:crs:EPSG::31983" },
  };

  return cloned;
};

export const Search = ({
  isInteractiveView = false,
  onItemClick,
}: {
  isInteractiveView?: boolean;
  onItemClick?: (
    config: IGetSearchConfigResponse,
    item: IGetSearchItem,
  ) => void;
}) => {
  const { toastInfo } = useToast();
  const {
    currentTerm,
    searchConfig,
    resetSearch,
    searchQuery,
    isSearchConfigLoaded,
  } = useSearchContext();
  const { toggleDrawer, drawerOpen, navigateReplace } = useNavigationContext();
  const { selectedBaseMap, flyTo, layerSchemas, digitalAddressFeature } =
    useMapContext();
  const { data, error, fetchData, clearResults, setResults, loading } =
    searchQuery;
  const clickActions = CLICK_ACTIONS_CONFIG();
  const { reset: resetPolygonEdit } = usePolygonEditContext();
  const features = enabledFeatureFlags.value;
  const [jsonFeature, setJsonFeature] = useState<any>(null);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const debouncedTerm = useDebounce(currentTerm.value, 500);

  const [resultsHighlighted, setResultsHighlighted] = useState(false);
  const [activeHelpSection, setActiveHelpSection] = useState<string | null>(
    null,
  );
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedItemId(null);
  }, [currentTerm.value]);
  const wasFetchingRef = useRef(false);

  const trimmedTerm = currentTerm.value.trim();
  const isFetching = loading || isLocalLoading;
  /** Termo já informado (digitado ou vindo da URL) cujo debounce ainda não venceu. */
  const isDebouncePending = trimmedTerm !== debouncedTerm.trim();
  /**
   * A busca não deve aguardar a restauração completa do mapa. Isso bloqueava
   * tanto a busca local quanto a remota quando alguma camada demorava a carregar.
   */
  const isSearching =
    isFetching ||
    (!!trimmedTerm &&
      (isDebouncePending || !isSearchConfigLoaded.value));

  const buildLocalSearchResults = (term: string) => {
    const results: IGetSearchItem[] = [];

    const cifDisplayValue = getCifDisplayValue(term);
    const coordinate = cifDisplayValue ? null : parseCoordinateTerm(term);
    if (coordinate) {
      const plusCode = olc.encode(
        coordinate.latitude,
        coordinate.longitude,
        12,
      );
      results.push({
        id: `coordinate-${coordinate.latitude}-${coordinate.longitude}`,
        name: `Coordenada: ${coordinate.label}`,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        rawData: {
          type: "local-coordinate",
          source: coordinate.source,
          plusCode,
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
        },
      });
    }

    const plusCode = cifDisplayValue ? null : normalizePlusCodeTerm(term);
    if (plusCode) {
      results.push({
        id: `plus-code-${plusCode.code}`,
        name: `Plus Code: ${plusCode.code}${plusCode.assumedPrefix ? " (São Paulo)" : ""}`,
        latitude: plusCode.latitude,
        longitude: plusCode.longitude,
        rawData: {
          type: "local-plus-code",
          source: "Plus Codes / Open Location Code",
          plusCode: plusCode.code,
          bounds: plusCode.bounds,
        },
      });
    }

    if (features.digitalAddress && !cifDisplayValue) {
      const digitalAddress = normalizeDigitalAddressTerm(term);
      if (digitalAddress) {
        try {
          const decoded = decode(digitalAddress.address);
          const { centerLat, centerLon } = getDigitalAddressPolygonCoords(
            digitalAddress.address,
          );

          results.push({
            id: `digital-address-${digitalAddress.address}`,
            name: `Endereço Digital Urbis: ${digitalAddress.address}${digitalAddress.assumedPrefix ? " (São Paulo)" : ""}`,
            latitude: decoded.latitude ?? centerLat,
            longitude: decoded.longitude ?? centerLon,
            rawData: {
              type: "local-digital-address",
              source: "Endereço Digital Urbis",
              digitalAddress: digitalAddress.address,
              assumedPrefix: digitalAddress.assumedPrefix,
            },
          });
        } catch {
          // Ignore invalid local digital address candidates and keep API search.
        }
      }
    }

    return results;
  };

  const handleSearch = async (term: string) => {
    if (!term) {
      clearResults();
      return;
    }

    const localResults = buildLocalSearchResults(term);

    if (localResults.length) {
      setResults({
        ...(data ?? {}),
        local: localResults,
      });
    }

    fetchData(term, localResults.length ? { local: localResults } : undefined);
  };

  useEffect(() => {
    // A busca é independente da restauração das camadas do mapa. Primeiro
    // permite resultados locais; quando a configuração remota terminar de
    // carregar, o efeito roda novamente e dispara as fontes da API.
    if (!isSearchConfigLoaded.value && !buildLocalSearchResults(debouncedTerm).length)
      return;

    handleSearch(debouncedTerm);
  }, [debouncedTerm, isSearchConfigLoaded.value]);

  const handleCopyJson = () => {
    if (jsonFeature) {
      navigator.clipboard.writeText(JSON.stringify(jsonFeature, null, 2));
    }
  };

  useEffect(() => {
    // Lido no primeiro render (e não só quando o app fica pronto) para que o
    // termo e o estado "buscando" apareçam imediatamente ao abrir o mapa.
    const query = new URLSearchParams(location.search);
    const search = query.get("search");
    if (search && currentTerm.value !== search) {
      currentTerm.value = search;
      // O debounce cuidará do fetch
    }
  }, []);

  const cifDisplayValue = getCifDisplayValue(currentTerm.value);

  /** Destaca o card por um instante quando a busca responde. */
  useEffect(() => {
    if (wasFetchingRef.current && !isFetching && data) {
      wasFetchingRef.current = isFetching;
      setResultsHighlighted(true);
      const timeout = setTimeout(() => setResultsHighlighted(false), 900);
      return () => clearTimeout(timeout);
    }

    wasFetchingRef.current = isFetching;
  }, [isFetching, data]);

  const localSearchConfig: IGetSearchConfigResponse = {
    id: "local",
    name: "Localização direta",
    origin: "Urbis / Plus Codes / coordenadas informadas",
    isActive: true,
  };

  const getSearchGroupLabel = (config: IGetSearchConfigResponse, list: IGetSearchItem[] = []) => {
    if (config.id === "lots") {
      const firstItem = list[0] as IGetSearchItem;
      const cd_tipo_lote = firstItem?.rawData?.properties?.cd_tipo_lote;
      if (cd_tipo_lote === "V") return "VIAS (CIF)";
      if (cd_tipo_lote === "M") return "ESPAÇOS LIVRES (CIF)";
      return "LOTES FISCAIS";
    }
    return normalizeSearchGroupLabel(config.name);
  };

  const getSearchSourceLabel = (config: IGetSearchConfigResponse, list: IGetSearchItem[] = []) => {
    if (config.id === "local")
      return "Fonte: Urbis, Plus Codes / Open Location Code e coordenadas informadas pelo usuário.";

    const origin = (config.origin || "").toLowerCase();
    if (origin.includes("nominatim") || origin.includes("openstreetmap")) {
      return "Fonte: Nominatim / OpenStreetMap.";
    }

    if (config.id === "lots") {
      const firstItem = list[0] as IGetSearchItem;
      const cd_tipo_lote = firstItem?.rawData?.properties?.cd_tipo_lote;
      let layerName = "Lotes fiscais";
      if (cd_tipo_lote === "V") layerName = "Vias (CIF)";
      else if (cd_tipo_lote === "M") layerName = "Espaços Livres (CIF)";
      return `Fonte: camada “${layerName}”.`;
    }

    if (config.layerSchema?.name) {
      return `Fonte: camada “${normalizeSearchGroupLabel(config.layerSchema.name)}”.`;
    }

    if (config.origin)
      return `Fonte: ${normalizeSearchGroupLabel(config.origin.replace("{environment}", "API Urbis"))}.`;

    return null;
  };

  const hasErrorResult = (list: (IGetSearchItem | IGetSearchItemError)[]) =>
    list.some((item) => (item as IGetSearchItemError)?.type === "error");

  const getResultCount = (list: (IGetSearchItem | IGetSearchItemError)[]) =>
    (list as any).totalCount ?? list.length;

  /** Grupos sem resultado não são listados; grupos com erro continuam visíveis. */
  const visibleSearchConfigs = data
    ? [localSearchConfig, ...searchConfig.value]
        .filter((config) =>
          isInteractiveView
            ? config.id === "lots"
            : config.id === "local" || config.isActive !== false,
        )
        .filter((config) => {
          const list = (data?.[config.id] ?? []) as (
            | IGetSearchItem
            | IGetSearchItemError
          )[];
          return hasErrorResult(list) || getResultCount(list) > 0;
        })
    : [];

  const openLocationDetails = (page: React.ReactNode) => {
    if (!drawerOpen.value) toggleDrawer();
    navigateReplace(page);
  };

  const openLocalResult = (item: IGetSearchItem) => {
    const rawData = item.rawData ?? {};

    if (rawData.type === "local-plus-code") {
      const bounds = rawData.bounds;
      const polygonCoords = [
        [
          [bounds.longitudeLo, bounds.latitudeLo],
          [bounds.longitudeHi, bounds.latitudeLo],
          [bounds.longitudeHi, bounds.latitudeHi],
          [bounds.longitudeLo, bounds.latitudeHi],
          [bounds.longitudeLo, bounds.latitudeLo],
        ],
      ];

      openLocationDetails(
        <DigitalAddressDetails
          latitude={item.latitude}
          longitude={item.longitude}
          plusCode={rawData.plusCode}
          sourceType="pluscode"
        />,
      );

      try {
        digitalAddressFeature.value = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Polygon", coordinates: polygonCoords },
              properties: { type: "polygon", sourceType: "pluscode" },
            },
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [item.longitude, item.latitude],
              },
              properties: { type: "marker", sourceType: "pluscode" },
            },
          ],
        };
        layerSchemas.value = layerSchemas.value.map((layer) => ({
          ...layer,
          isVisible: false,
        }));
        flyTo({
          center: [item.longitude, item.latitude],
          zoom: 20,
          bounds: getGeoJsonBounds({
            type: "Polygon",
            coordinates: polygonCoords,
          }),
          maxZoom: 21,
          pitch: 0,
          bearing: 0,
        });
      } catch (error) {
        console.warn("Could not highlight the Plus Code on the map", error);
      }
      return;
    }

    if (rawData.type === "local-digital-address") {
      const { centerLat, centerLon, polygonCoords } =
        getDigitalAddressPolygonCoords(rawData.digitalAddress);

      openLocationDetails(
        <DigitalAddressDetails
          latitude={centerLat}
          longitude={centerLon}
          plusCode={olc.encode(centerLat, centerLon, 12)}
          sourceType="digital"
          digitalAddress={rawData.digitalAddress}
        />,
      );

      try {
        digitalAddressFeature.value = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Polygon", coordinates: polygonCoords },
              properties: { type: "polygon", sourceType: "digital" },
            },
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [centerLon, centerLat],
              },
              properties: { type: "marker", sourceType: "digital" },
            },
          ],
        };
        layerSchemas.value = layerSchemas.value.map((layer) => ({
          ...layer,
          isVisible: false,
        }));
        flyTo({
          center: [centerLon, centerLat],
          zoom: 20,
          bounds: getGeoJsonBounds({
            type: "Polygon",
            coordinates: polygonCoords,
          }),
          maxZoom: 21,
          pitch: 0,
          bearing: 0,
        });
      } catch (error) {
        console.warn(
          "Could not highlight the Digital Address on the map",
          error,
        );
      }
      return;
    }

    if (rawData.type === "local-coordinate") {
      const address = olc.encode(item.latitude, item.longitude, 12);
      openLocationDetails(
        <DigitalAddressDetails
          latitude={item.latitude}
          longitude={item.longitude}
          plusCode={address}
          sourceType="latlon"
        />,
      );

      try {
        digitalAddressFeature.value = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [item.longitude, item.latitude],
              },
              properties: { type: "marker", sourceType: "coordinate" },
            },
          ],
        };
        flyTo({
          center: [item.longitude, item.latitude],
          zoom: 18,
          pitch: 0,
          bearing: 0,
        });
      } catch (error) {
        console.warn("Could not highlight the coordinate on the map", error);
      }
    }
  };

  const handleClickItem = (
    config: IGetSearchConfigResponse,
    item: IGetSearchItem,
  ) => {
    setSelectedItemId(item.id);
    if (onItemClick) {
      onItemClick(config, item);
      return;
    }

    const matchedSchema = layerSchemas.value?.find(
      (s) => s.id === config.layerSchemaId || (config.id === "lots" && (s.id === "lotes_fiscais" || s.id === "lotes")),
    );
    const resolvedLayerSchema = config.layerSchema || matchedSchema;

    const clickAction = config.clickAction?.action
      ? config.clickAction
      : resolvedLayerSchema?.clickAction ||
        (config.id === "lots"
          ? { action: ClickActionEnum.SelectFeature, params: { zoom: 19.5 } }
          : undefined);

    const template = resolvedLayerSchema?.viewTemplate ?? [];

    if (config.id === "local") {
      openLocalResult(item);
      return;
    }

    // Ensure lot layer is visible on the map when searching lots
    if (config.id === "lots" || config.layerSchemaId === "lotes_fiscais" || config.layerSchemaId === "lotes") {
      layerSchemas.value = layerSchemas.value.map((layer) => {
        if (layer.id === "lotes_fiscais" || layer.id === "lotes" || layer.id === config.layerSchemaId) {
          return {
            ...layer,
            isVisible: true,
            isSelected: true,
          };
        }
        return layer;
      });
    }

    let lat = item.latitude;
    let lon = item.longitude;
    if ((isNaN(lat) || isNaN(lon) || lat === undefined || lon === undefined) && item.rawData) {
      const [cLon, cLat] = calculateCenterId(item.rawData);
      lon = cLon;
      lat = cLat;
    }

    if (!clickAction) {
      if (typeof lat === "number" && !isNaN(lat) && typeof lon === "number" && !isNaN(lon)) {
        resetPolygonEdit();
        flyTo({
          center: [lon, lat],
          zoom: 15,
        });
      }
      return;
    }

    const { action, params } = clickAction;
    const actionFn = clickActions[action as keyof typeof clickActions];
    if (actionFn) {
      resetPolygonEdit();
      actionFn(params, {
        latitude: lat,
        longitude: lon,
        feature: item.rawData,
        template,
      });
    }
  };

  const renderError = (
    config: IGetSearchConfigResponse,
    list: IGetSearchItemError[] = [],
  ) => {
    return (
      <div className="mt-4 px-1">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {getSearchGroupLabel(config)}
        </span>
        <div className="text-destructive mt-1.5 p-2 bg-destructive/10 rounded-lg text-xs border border-destructive/20 shadow-sm">
          {list?.[0]?.message || "Erro ao buscar os dados."}
        </div>
      </div>
    );
  };

  const buildList = (
    config: IGetSearchConfigResponse,
    list: IGetSearchItem[] | IGetSearchItemError[] = [],
  ) => {
    if (
      list.findIndex(
        (item) => (item as IGetSearchItemError)?.type === "error",
      ) >= 0
    )
      return renderError(config, list as IGetSearchItemError[]);

    const totalCount = (list as any).totalCount ?? list.length;
    const groupLabel = getSearchGroupLabel(config, list as IGetSearchItem[]);
    const sourceLabel = getSearchSourceLabel(config, list as IGetSearchItem[]);
    const layerMetadataId = config.layerSchema?.id ?? config.layerSchemaId;

    return (
      <div className="mt-4 first:mt-2 px-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {groupLabel} ({totalCount})
          </span>
          {layerMetadataId && (
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="-mt-1 h-6 w-6 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
              onClick={(event) => {
                event.stopPropagation();
                requestedLayerMetadataId.value = String(layerMetadataId);
              }}
              aria-label={`Ver informações da camada ${groupLabel}`}
              title="Informações da camada"
            >
              <UrbisIcon
                name="info"
                className="text-[15px]"
                aria-hidden="true"
              />
            </Button>
          )}
        </div>
        {sourceLabel && (
          <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
            {sourceLabel}
          </p>
        )}
        <ul className="mt-1.5 space-y-0.5">
          {list.map((result) => {
            const content = result as IGetSearchItem;
            const isSelected = selectedItemId === content.id;
            const isOutsideSP =
              content.latitude &&
              content.longitude &&
              (content.latitude < -24.01 ||
                content.latitude > -23.35 ||
                content.longitude < -46.83 ||
                content.longitude > -46.36);

            return (
              <li
                key={content.id}
                className={cn(
                  "p-1.5 cursor-pointer rounded-lg transition-all flex items-center justify-between group border",
                  isSelected
                    ? "bg-primary/10 border-primary/30 hover:bg-primary/15"
                    : "hover:bg-accent/50 border-transparent hover:border-border/50",
                )}
                onClick={() => {
                  handleClickItem(config, content);
                }}
              >
                <span
                  className={cn(
                    "line-clamp-2 text-xs flex-1 mr-2 text-foreground/90 group-hover:text-foreground",
                    isSelected && "font-semibold text-foreground",
                  )}
                >
                  {content.name}
                  {isOutsideSP && (
                    <span className="block text-[10px] font-semibold text-destructive mt-0.5 animate-pulse">
                      ATENÇÃO: Resultado fora do Município de São Paulo.
                    </span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setJsonFeature(convertFeatureToSirgas(content.rawData));
                  }}
                  title="Ver JSON"
                >
                  <UrbisIcon
                    name="data_object"
                    className="text-[14px]"
                    aria-hidden="true"
                  />
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          "rounded-2xl border shadow-sm backdrop-blur-sm overflow-hidden transition-all duration-300",
          data ? "bg-background/95" : "bg-background/80",
          resultsHighlighted && "border-primary/40 ring-2 ring-primary/25",
        )}
      >
        <CardContent className="p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(currentTerm.value);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Input
                id="urbis-location-search-input"
                placeholder="Pesquise por endereço, cadastro fiscal (“SQL”, “IPTU”), referências (distritos etc.), coordenadas georref. ou endereço digital (Urbis ou Plus Code)"
                value={currentTerm.value}
                onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                  (currentTerm.value = e.target.value)
                }
                className="pr-8 h-10 rounded-xl"
              />
              {currentTerm.value && (
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="absolute right-0 top-0 h-full w-8 hover:bg-transparent rounded-full"
                  onClick={() => {
                    resetSearch();
                    clearResults();
                  }}
                >
                  <UrbisIcon
                    name="close"
                    className="text-base text-muted-foreground"
                    aria-hidden="true"
                  />
                </Button>
              )}
            </div>

            {!isInteractiveView && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="shrink-0 rounded-full h-10 w-10 text-muted-foreground hover:text-foreground"
                    title="Como pesquisar"
                  >
                    <UrbisIcon
                      name="help"
                      className="text-base"
                      aria-hidden="true"
                    />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                  <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                      <UrbisIcon name="help" className="text-primary text-xl" />
                      Como pesquisar no Mapa.Urbis
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                    <p>
                      A busca aceita diferentes formatos. Você pode digitar
                      termos livres ou colar códigos/coordenadas diretamente no
                      campo. Clique em{" "}
                      <strong className="text-foreground">
                        mais informações
                      </strong>{" "}
                      para ver detalhes de cada formato.
                    </p>

                    <div className="space-y-3">
                      {/* Section 1: Endereço */}
                      <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-xs">
                            <strong className="text-foreground text-sm block mb-1">
                              Endereço
                            </strong>
                            ex.: rua, número, bairro. Inclui dados da{" "}
                            <a
                              href="https://www.openstreetmap.org/"
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-foreground hover:underline"
                            >
                              © OpenStreetMap
                            </a>{" "}
                            (
                            <a
                              href="/license/odbl-v1.0.html"
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline font-medium"
                            >
                              <span className="inline-block -scale-x-100" aria-hidden="true">©</span> ODbL v1.0
                            </a>
                            ).
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            type="button"
                            className="p-0 h-auto shrink-0 text-primary font-semibold"
                            onClick={() =>
                              setActiveHelpSection(
                                activeHelpSection === "endereco"
                                  ? null
                                  : "endereco",
                              )
                            }
                          >
                            {activeHelpSection === "endereco"
                              ? "menos informações"
                              : "mais informações"}
                          </Button>
                        </div>
                        {activeHelpSection === "endereco" && (
                          <div className="pt-2 border-t text-xs text-foreground/80 space-y-2 animate-in fade-in duration-200">
                            <p className="font-medium text-foreground">
                              As bases de endereço do Urbis são:
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>
                                registros de endereço do Cadastro Imobiliário
                                Fiscal - CIF (base para cobrança de tributos
                                como o IPTU);
                              </li>
                              <li>
                                base do OpenStreetMap (
                                <a
                                  href="/license/odbl-v1.0.html"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  <span className="inline-block -scale-x-100" aria-hidden="true">©</span> ODbL v1.0
                                </a>
                                ).
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Section 2: Referência */}
                      <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-xs">
                            <strong className="text-foreground text-sm block mb-1">
                              Referência
                            </strong>
                            ex.: distrito, subprefeitura.
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            type="button"
                            className="p-0 h-auto shrink-0 text-primary font-semibold"
                            onClick={() =>
                              setActiveHelpSection(
                                activeHelpSection === "referencia"
                                  ? null
                                  : "referencia",
                              )
                            }
                          >
                            {activeHelpSection === "referencia"
                              ? "menos informações"
                              : "mais informações"}
                          </Button>
                        </div>
                        {activeHelpSection === "referencia" && (
                          <div className="pt-2 border-t text-xs text-foreground/80 space-y-2 animate-in fade-in duration-200">
                            <p>
                              No Urbis, é possível localizar referências de
                              localização, como uma subprefeitura ou um
                              distrito.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Section 3: CIF/IPTU */}
                      <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-xs">
                            <strong className="text-foreground text-sm block mb-1">
                              Nº do imóvel no CIF (“SQL”, “contribuinte”,
                              “IPTU”)
                            </strong>
                            ex.: 026.035.0101.00, 026035010100 ou formatos com hífen.
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            type="button"
                            className="p-0 h-auto shrink-0 text-primary font-semibold"
                            onClick={() =>
                              setActiveHelpSection(
                                activeHelpSection === "cif" ? null : "cif",
                              )
                            }
                          >
                            {activeHelpSection === "cif"
                              ? "menos informações"
                              : "mais informações"}
                          </Button>
                        </div>
                        {activeHelpSection === "cif" && (
                          <div className="pt-2 border-t text-xs text-foreground/80 space-y-2.5 animate-in fade-in duration-200">
                            <p>
                              O Cadastro Imobiliário Fiscal - CIF é uma base de
                              dados da Secretaria Municipal da Fazenda voltada
                              para a cobrança de tributos, como o IPTU. Os dados
                              para essa finalidade são do tipo Fiscal, mas há
                              outros tipos de dados no CIF.
                            </p>
                            <p>
                              <strong className="text-foreground">
                                O tipo Fiscal
                              </strong>{" "}
                              é o mais comum do Cadastro Imobiliário Fiscal -
                              CIF, e se refere aos imóveis que, segundo a
                              classificação tributária, são urbanos (ver art. 32
                              da Lei federal nº 5.172/1966). Esses dados estão
                              na camada{" "}
                              <span className="font-semibold text-foreground">
                                Lotes fiscais
                              </span>
                              , no grupo{" "}
                              <span className="font-semibold text-foreground">
                                Geral
                              </span>
                              .
                            </p>
                            <p>
                              <strong className="text-foreground">
                                O tipo Via
                              </strong>{" "}
                              se refere a vias de vila, que podem ser públicas
                              ou particulares. Para pesquisar nesse formato,
                              digite V antes do último número (ex.:
                              003.019.V0001). Esses dados estão na camada{" "}
                              <span className="font-semibold text-foreground">
                                Vias (CIF)
                              </span>
                              , no grupo{" "}
                              <span className="font-semibold text-foreground">
                                Infraestrutura urbana &gt;&gt; Áreas públicas -
                                Uso comum
                              </span>
                              .
                            </p>
                            <p>
                              <strong className="text-foreground">
                                O tipo Espaços Livres
                              </strong>{" "}
                              se refere a canteiros viários e áreas verdes
                              tornadas bem de uso comum do povo com os
                              loteamentos. Para pesquisar nesse formato, digite
                              EL antes do último número (ex.: 003.019.EL0001).
                              Esses dados estão na camada{" "}
                              <span className="font-semibold text-foreground">
                                Espaços Livres (CIF)
                              </span>
                              , no grupo{" "}
                              <span className="font-semibold text-foreground">
                                Infraestrutura urbana &gt;&gt; Áreas públicas -
                                Uso comum
                              </span>
                              .
                            </p>
                            <p>
                              <strong className="text-foreground">
                                Frações ideais de condomínio
                              </strong>{" "}
                              (ex.: apartamentos) são registradas como se fossem
                              lotes, e vinculados a um número de condomínio
                              (ex.: CD01). O Urbis não possui o registro das
                              frações ideais, somente do lote do condomínio.
                              Para pesquisar por um condomínio, colocar após o
                              segundo número CD e o número do condomínio,
                              seguido de 0000 (ex.: 003.019.CD06.0000).
                            </p>
                            <p className="italic text-muted-foreground text-[11px]">
                              Devido à sua finalidade tributária, as áreas
                              irregulares, públicas ou rurais podem{" "}
                              <strong className="font-semibold text-foreground">
                                não estar representadas
                              </strong>{" "}
                              ou estarem representadas{" "}
                              <strong className="font-semibold text-foreground">
                                com imprecisões e desatualizações
                              </strong>
                              . A Prefeitura não se responsabiliza por usos não
                              tributários dos dados do CIF.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Section 4: Coordenadas */}
                      <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-xs">
                            <strong className="text-foreground text-sm block mb-1">
                              Coordenadas
                            </strong>
                            ex.: -23.55039, -46.63395 (geográficas SIRGAS 2000 ou WGS
                            84) ou 333221, 7394599 (projetada SIRGAS 2000 / UTM
                            23S).
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            type="button"
                            className="p-0 h-auto shrink-0 text-primary font-semibold"
                            onClick={() =>
                              setActiveHelpSection(
                                activeHelpSection === "coordenadas"
                                  ? null
                                  : "coordenadas",
                              )
                            }
                          >
                            {activeHelpSection === "coordenadas"
                              ? "menos informações"
                              : "mais informações"}
                          </Button>
                        </div>
                        {activeHelpSection === "coordenadas" && (
                          <div className="pt-2 border-t text-xs text-foreground/80 space-y-4 animate-in fade-in duration-200">
                            <p>
                              Coordenadas georreferenciadas servem para
                              localizar qualquer espaço no planeta. Seus valores
                              podem ser ângulos (coordenadas geométricas) ou
                              distâncias em metro (coordenadas projetadas). Ver
                              esquemas abaixo:
                            </p>

                            <div className="space-y-4 pt-2">
                              <div className="space-y-1.5 text-center bg-muted/40 p-2 rounded-lg border">
                                <span className="font-bold text-foreground text-[11px] block">
                                  1. COORDENADAS GEOGRÁFICAS - ESQUEMA
                                </span>
                                <img
                                  src="/coordenadas_geograficas.png"
                                  alt="Coordenadas Geográficas"
                                  className="mx-auto max-h-[220px] object-contain rounded border bg-background"
                                />
                              </div>

                              <div className="space-y-1.5 text-center bg-muted/40 p-2 rounded-lg border">
                                <span className="font-bold text-foreground text-[11px] block">
                                  2. COORDENADAS PROJETADAS - DISTRIBUIÇÃO DA SUPERFÍCIE DE CADA ZONA EM UM PLANO CARTESIANO MÉTRICO
                                </span>
                                <img
                                  src="/zona_23s.png"
                                  alt="Coordenadas Projetadas Zona 23S"
                                  className="mx-auto max-h-[220px] object-contain rounded border bg-background"
                                />
                              </div>

                              <div className="space-y-1.5 text-center bg-muted/40 p-2 rounded-lg border">
                                <span className="font-bold text-foreground text-[11px] block">
                                  3. COORDENADAS PROJETADAS - DIVISÃO UTM GLOBAL
                                </span>
                                <img
                                  src="/zonas_utm.png"
                                  alt="Divisão UTM"
                                  className="mx-auto max-h-[220px] object-contain rounded border bg-background"
                                />
                              </div>

                              <div className="space-y-1.5 text-center bg-muted/40 p-2 rounded-lg border">
                                <span className="font-bold text-foreground text-[11px] block">
                                  4. COORDENADAS PROJETADAS - ZONAS UTM NO BRASIL
                                </span>
                                <img
                                  src="/brasil_utm.png"
                                  alt="UTM no Brasil"
                                  className="mx-auto max-h-[220px] object-contain rounded border bg-background"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Section 5: Endereço Digital Urbis */}
                      <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-xs">
                            <strong className="text-foreground text-sm block mb-1">
                              Endereço Digital Urbis
                            </strong>
                            ex.: código completo global (ex. -23-46 J7K-H87F) ou
                            código local paulistano (ex.: J7K-H87F).
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            type="button"
                            className="p-0 h-auto shrink-0 text-primary font-semibold"
                            onClick={() =>
                              setActiveHelpSection(
                                activeHelpSection === "ed" ? null : "ed",
                              )
                            }
                          >
                            {activeHelpSection === "ed"
                              ? "menos informações"
                              : "mais informações"}
                          </Button>
                        </div>
                        {activeHelpSection === "ed" && (
                          <div className="pt-2 border-t text-xs text-foreground/80 space-y-2 animate-in fade-in duration-200">
                            <p>
                              O Endereço Digital Urbis permite que, com um
                              código local de 7 caracteres (ex.: J7K-H87F), ou
                              global acrescentando um prefixo (ex.: -23-46
                              J7K-H87F), se localize facilmente em qualquer
                              lugar do mundo uma área de aproximadamente 1 metro
                              quadrado. Sua maior utilidade é servir de endereço
                              em ruas sem nome oficial ou CEP.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Section 6: Plus Code */}
                      <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-xs">
                            <strong className="text-foreground text-sm block mb-1">
                              Plus Code
                            </strong>
                            ex.: código completo global (ex.: 588M C9X8+RCVG) ou
                            código curto local paulistano (ex.: C9X8+RCVG).{" "}
                            <a
                              href="https://maps.google.com/pluscodes/"
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-foreground hover:underline"
                            >
                              © Google
                            </a>{" "}
                            (
                            <a
                              href="/license/apache-2.0.html"
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline font-medium"
                            >
                              <span className="inline-block -scale-x-100" aria-hidden="true">©</span> Apache 2.0
                            </a>
                            ).
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            type="button"
                            className="p-0 h-auto shrink-0 text-primary font-semibold"
                            onClick={() =>
                              setActiveHelpSection(
                                activeHelpSection === "pluscode"
                                  ? null
                                  : "pluscode",
                              )
                            }
                          >
                            {activeHelpSection === "pluscode"
                              ? "menos informações"
                              : "mais informações"}
                          </Button>
                        </div>
                        {activeHelpSection === "pluscode" && (
                          <div className="pt-2 border-t text-xs text-foreground/80 space-y-2 animate-in fade-in duration-200">
                            <p>
                              Plus Codes são os endereços digitais do padrão
                              Open Location Code, do Google, de uso permitido
                              pela licença Apache 2.0.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-4 pt-2 border-t">
                      Os resultados indicam a fonte usada.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <Button
              variant="outline"
              size="icon"
              type="submit"
              className="shrink-0 rounded-full h-10 w-10 shadow-sm border-input"
              disabled={loading || isLocalLoading}
            >
              {loading || isLocalLoading ? (
                <UrbisIcon
                  name="progress_activity"
                  className="text-base animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <UrbisIcon
                  name="search"
                  className="text-base"
                  aria-hidden="true"
                />
              )}
            </Button>
          </form>

          {cifDisplayValue && (
            <div className="mt-2 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
              <UrbisIcon
                name="tag"
                className="text-[14px]"
                aria-hidden="true"
              />
              <span>
                nº imóvel CIF (“SQL”, “IPTU”):{" "}
                <strong className="font-semibold text-foreground">
                  {cifDisplayValue}
                </strong>
              </span>
            </div>
          )}

          {error && (
            <p className="text-destructive mt-3 px-1 text-xs font-medium">
              {error}
            </p>
          )}

          {!data && !currentTerm.value && !isSearching && (
            <div className="mt-4 px-1">
              <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">
                Pesquise por endereço, cadastro fiscal (“SQL”, “IPTU”),
                referências (distritos etc.), coordenadas georref. ou endereço
                digital (Urbis ou Plus Code)
              </p>
            </div>
          )}

          {isSearching && (
            <div className="mt-4 px-1" role="status" aria-live="polite">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <UrbisIcon
                  name="progress_activity"
                  className="text-[13px] animate-spin"
                  aria-hidden="true"
                />
                <span>
                  {trimmedTerm ? `Buscando “${trimmedTerm}”…` : "Buscando…"}
                </span>
              </div>
              <div className="mt-2 space-y-1" aria-hidden="true">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="h-6 animate-pulse rounded-lg bg-muted"
                    style={{ animationDelay: `${index * 120}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {visibleSearchConfigs.length > 0 && (
            <div
              className={cn(
                "mt-2 max-h-[50vh] overflow-y-auto pr-1 transition-opacity duration-200",
                isSearching && "opacity-50",
              )}
            >
              {visibleSearchConfigs.map((config) =>
                buildList(config, data?.[config.id] ?? []),
              )}
            </div>
          )}

          {!isSearching &&
            !!data &&
            !!trimmedTerm &&
            visibleSearchConfigs.length === 0 && (
              <div className="mt-4 px-1" role="status">
                <p className="text-[11px] font-medium leading-relaxed text-muted-foreground">
                  Nenhum resultado para “{trimmedTerm}”. Revise a grafia ou
                  tente um endereço, cadastro fiscal (“SQL”, “IPTU”), coordenadas ou endereço digital.
                </p>
              </div>
            )}
        </CardContent>
      </Card>

      <Dialog
        open={!!jsonFeature}
        onOpenChange={(open) => !open && setJsonFeature(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold">
              Detalhes da Feature (SIRGAS 2000)
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted p-4 rounded-xl text-xs font-mono whitespace-pre-wrap border shadow-inner">
            {jsonFeature && JSON.stringify(jsonFeature, null, 2)}
          </div>
          <div className="flex justify-end pt-4 mt-2 border-t gap-2">
            <Button
              variant="outline"
              onClick={() => setJsonFeature(null)}
              className="rounded-full px-6"
            >
              Fechar
            </Button>
            <Button
              onClick={handleCopyJson}
              className="gap-2 rounded-full px-8 shadow-md"
            >
              <UrbisIcon
                name="content_copy"
                className="text-base"
                aria-hidden="true"
              />
              Copiar GeoJSON
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
