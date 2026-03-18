import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/useToast";
import { decode, getPolygon } from "@open-urbis/endereco-digital";
import { useMapContext } from "../../hooks/useMapContext";
import { DigitalAddressDetails } from "../LocationSelectionCard/DigitalAddressDetails";
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
  Switch,
  cn,
} from "@open-urbis/map-ui";
import { useEffect, useState } from "preact/compat";
import proj4 from "proj4";
import { CLICK_ACTIONS_CONFIG } from "../../application-configs";
import { useAppLoading } from "../../hooks/useAppLoading";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { useSearchContext } from "../../hooks/useSearchContext";
import {
  IGetSearchConfigResponse,
  IGetSearchItem,
  IGetSearchItemError,
} from "../../types/fetch-search-config-type";
import { useNavigationContext } from "../../hooks/useNavigationContext";

proj4.defs(
  "EPSG:31983",
  "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
);

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

export const Search = ({ isInteractiveView = false }: { isInteractiveView?: boolean }) => {
  const { toastInfo } = useToast();
  const {
    currentTerm,
    searchConfig,
    resetSearch,
    searchQuery,
  } = useSearchContext();
  const { toggleDrawer, drawerOpen, navigateTo } = useNavigationContext();
  const { flyTo, digitalAddressFeature, layerSchemas, selectedBaseMap, overlayRef } = useMapContext();
  const { data, error, fetchData, clearResults, loading } = searchQuery;
  const clickActions = CLICK_ACTIONS_CONFIG();
  const { reset: resetPolygonEdit } = usePolygonEditContext();
  const [jsonFeature, setJsonFeature] = useState<any>(null);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const debouncedTerm = useDebounce(currentTerm.value, 500);
  const { isAppReady } = useAppLoading();

  const handleSearch = async (term: string) => {
    if (!term) {
      clearResults();
      return;
    }

    let isDigital = false;
    const cleanTerm = term.replace(/\s/g, "");

    // Regex matches 7 chars in base27 (3 chars + optional hyphen + 4 chars)
    const digitalPartialRegex =
      /^[23456789BCDFGHJKLMNPQTVWXYZ]{3}-?[23456789BCDFGHJKLMNPQTVWXYZ]{4}$/i;

    // Regex for full address (prefix + suffix)
    const digitalFullRegex = /^[+-]\d{1,2}[+-]\d{1,3}[23456789BCDFGHJKLMNPQTVWXYZ]{3}-?[23456789BCDFGHJKLMNPQTVWXYZ]{4}$/i;

    if (digitalPartialRegex.test(cleanTerm)) {
      const cleanSuffix = cleanTerm.toUpperCase().replace("-", "");
      const formattedSuffix = `${cleanSuffix.substring(0, 3)}-${cleanSuffix.substring(3)}`;
      term = `-23-46 ${formattedSuffix}`;

      // Update input and show feedback
      currentTerm.value = term;
      toastInfo("Assumindo cidade de São Paulo (-23-46)");
      isDigital = true;
    } else if (digitalFullRegex.test(cleanTerm)) {
      isDigital = true;
      term = cleanTerm; // Use cleaned term for decoding
    }

    if (isDigital) {
        setIsLocalLoading(true);
        try {
          const decoded = decode(term);
          const lat = decoded.latitude;
          const lon = decoded.longitude;
          const sourceType = "digital";

          const p = getPolygon(term);
          const lats = p.map(pt => pt.lat);
          const lons = p.map(pt => pt.lon);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLon = Math.min(...lons);
          const maxLon = Math.max(...lons);
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const polygonCoords: any[] = [[
              [minLon, minLat],
              [maxLon, minLat],
              [maxLon, maxLat],
              [minLon, maxLat],
              [minLon, minLat]
          ]];

          // Construct FeatureCollection
          const featureCollection = {
              type: "FeatureCollection",
              features: [
                  {
                      type: "Feature",
                      geometry: {
                          type: "Polygon",
                          coordinates: polygonCoords
                      },
                      properties: { type: "polygon", sourceType }
                  },
                  {
                      type: "Feature",
                      geometry: {
                          type: "Point",
                          coordinates: [lon, lat]
                      },
                      properties: { type: "marker" }
                  }
              ]
          };

          // Hide all layers
          layerSchemas.value = layerSchemas.value.map(l => ({ ...l, isVisible: false }));

          // Set feature and navigate
          digitalAddressFeature.value = featureCollection;

          const destination = {
            center: [lon, lat],
            zoom: 22,
            pitch: 45,
            bearing: 0,
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
                  latitude={lat} 
                  longitude={lon} 
                  sourceType={sourceType}
              />
          );

          if (!drawerOpen.value) {
            toggleDrawer();
          }
          
          setIsLocalLoading(false);
          return; // Skip standard fetch

        } catch (e) {
            console.error("Error decoding digital address", e);
            setIsLocalLoading(false);
            // Fallback to standard search if decoding fails
        }
    }

    fetchData(term);
  };

  useEffect(() => {
    handleSearch(debouncedTerm);
  }, [debouncedTerm]);

  const handleCopyJson = () => {
    if (jsonFeature) {
      navigator.clipboard.writeText(JSON.stringify(jsonFeature, null, 2));
    }
  };


  useEffect(() => {
    if (!isAppReady.value) return;

    const query = new URLSearchParams(location.search);
    const search = query.get("search");
    const p = query.get("p");

    if (p) {
        // Handle Digital Address from URL
        selectedBaseMap.value = "maxar-satellite";
        handleSearch(p);
    } else if (search && currentTerm.value !== search) {
      currentTerm.value = search;
      // O debounce cuidará do fetch
    }
  }, [isAppReady.value]);

  const toggleConfig = (id: string, currentStatus: boolean | undefined) => {
    const newStatus = currentStatus === false ? true : false;
    searchConfig.value = searchConfig.value.map((c) =>
      c.id === id ? { ...c, isActive: newStatus } : c,
    );

    if (currentTerm.value) {
      fetchData(currentTerm.value);
    }
  };

  const handleClickItem = (
    config: IGetSearchConfigResponse,
    item: IGetSearchItem,
  ) => {
    const { clickAction: clickActionsRoot, layerSchema } = config;
    const clickAction = clickActionsRoot?.action
      ? clickActionsRoot
      : layerSchema?.clickAction;
    const template = layerSchema?.viewTemplate ?? [];

    if (!clickAction) return;

    const { action, params } = clickAction;
    const actionFn = clickActions[action as keyof typeof clickActions];
    if (actionFn) {
      const { latitude, longitude, rawData } = item;
      resetPolygonEdit();
      actionFn(params, {
        latitude,
        longitude,
        feature: rawData,
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
          {config.name} (0)
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

    return (
      <div className="mt-4 first:mt-2 px-1">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {config.name} ({totalCount})
        </span>
        <ul className="mt-1.5 space-y-0.5">
          {list.map((result) => {
            const content = result as IGetSearchItem;

            return (
              <li
                key={content.id}
                className="p-1.5 cursor-pointer hover:bg-accent/50 rounded-lg transition-all flex items-center justify-between group border border-transparent hover:border-border/50"
                onClick={() => {
                  handleClickItem(config, content);
                  resetSearch();
                  clearResults();
                }}
              >
                <span className="line-clamp-2 text-xs flex-1 mr-2 text-foreground/90 group-hover:text-foreground">
                  {content.name}
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
                  <span className="material-symbols-outlined text-[14px]">
                    data_object
                  </span>
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
          "rounded-2xl border shadow-sm backdrop-blur-sm overflow-hidden transition-colors duration-300",
          data ? "bg-background/95" : "bg-background/80",
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
            {!isInteractiveView && (
              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="shrink-0 rounded-full h-10 w-10 hover:bg-accent"
                onClick={toggleDrawer}
                title={drawerOpen.value ? "Recolher menu" : "Expandir menu"}
              >
                <span className="material-symbols-outlined text-base">
                  {drawerOpen.value ? "menu_open" : "menu"}
                </span>
              </Button>
            )}

            <div className="relative flex-1">
              <Input
                placeholder="Digite para buscar..."
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
                  <span className="material-symbols-outlined text-base text-muted-foreground">
                    close
                  </span>
                </Button>
              )}
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  className="shrink-0 rounded-full h-10 w-10 border-input"
                  title="Configurações de busca"
                >
                  <span className="material-symbols-outlined text-base">
                    tune
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md p-4">
                <DialogHeader className="mb-2">
                  <DialogTitle className="text-lg font-bold">
                    Configuração de Pesquisa
                  </DialogTitle>
                </DialogHeader>
                <div className="py-1 overflow-hidden border rounded-xl shadow-sm bg-background">
                  <table className="w-full text-[13px]">
                    <thead className="bg-muted/50 backdrop-blur-md text-[10px]">
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-bold text-muted-foreground uppercase tracking-wider">
                          Opção
                        </th>
                        <th className="text-center py-2 px-3 font-bold text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {searchConfig.value.map((config) => (
                        <tr
                          key={config.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-2 px-3 font-medium text-foreground/90">
                            {config.name}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <Switch
                              checked={config.isActive !== false}
                              onCheckedChange={() =>
                                toggleConfig(config.id, config.isActive)
                              }
                              className="scale-75 origin-center"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="icon"
              type="submit"
              className="shrink-0 rounded-full h-10 w-10 shadow-sm border-input"
              disabled={loading || isLocalLoading}
            >
              {loading || isLocalLoading ? (
                <span className="material-symbols-outlined text-base animate-spin">
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined text-base">
                  search
                </span>
              )}
            </Button>
          </form>

          {error && (
            <p className="text-destructive mt-3 px-1 text-xs font-medium">
              {error}
            </p>
          )}

          {!data && !currentTerm.value && (
            <div className="mt-4 px-1">
              <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">
                Busque por IPTU, endereço, coordenadas, bairros ou regiões de
                São Paulo utilizando a barra acima.
              </p>
            </div>
          )}

          {data && (
            <div className="mt-2 max-h-[50vh] overflow-y-auto pr-1">
              {searchConfig.value
                .filter((config) => config.isActive !== false)
                .map((config) => buildList(config, data?.[config.id] ?? []))}
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
              <span className="material-symbols-outlined text-base">
                content_copy
              </span>
              Copiar GeoJSON
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
