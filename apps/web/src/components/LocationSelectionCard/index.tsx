import { computed, useSignal } from "@preact/signals";
import { useToast } from "@/hooks/useToast";
import { Button } from "@open-urbis/map-ui";
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
import { MapPin, FileJson, ChevronRight, Library, ArrowRight, Filter, FileSearch } from "lucide-react";
import { useMapContext } from "../../hooks/useMapContext";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { ConcatenatedSearchModal } from "../Search/ConcatenatedSearchModal";
import { MapLibrary } from "../../pages/Map/MapLibrary";
import { ProspectiveSearchPage } from "../../pages/Map/ProspectiveSearchPage";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { transformFileToJson } from "../../utils/transformFileToJson";
import { calculateCentroid } from "../MapView/utils";
import { PolygonDetails } from "../PolygonDetails";
import { DigitalAddressDetails } from "./DigitalAddressDetails";
import { decode, getPolygon, encode } from "@open-urbis/endereco-digital";
// @ts-ignore
import { OpenLocationCode } from "open-location-code";
import proj4 from "proj4";

// Define Projections
proj4.defs("EPSG:31983", "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:4674", "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs");

const olc = new OpenLocationCode();

interface LocationSelectionCardProps {
  initialOption?: string | null;
  initialInputType?: "latlon" | "digital" | "pluscode";
}

export const LocationSelectionCard = ({ initialOption = null, initialInputType = "latlon" }: LocationSelectionCardProps) => {
  const { toastInfo } = useToast();
  const { flyTo, layerSchemas, digitalAddressFeature, isPickingLocation, onLocationPick } = useMapContext();
  const { editFeature, editFeatureTemplate, layerWithRootEditTemplate } =
    usePolygonEditContext();
  const { navigateTo, navigateReplace } = useNavigationContext();

  const step = useSignal(initialOption ? 2 : 1);
  const geoJsonFile = useSignal<File | null>(null);
  const error = useSignal("");
  const selectedOption = useSignal<string | null>(initialOption);
  
  const crs = useSignal<"EPSG:4674" | "EPSG:4326" | "EPSG:31983">("EPSG:31983");
  const inputType = useSignal<"latlon" | "digital" | "pluscode">(initialInputType);
  const latitude = useSignal("");
  const longitude = useSignal("");
  const digitalAddress = useSignal("");
  const plusCodeInput = useSignal("");

  const rootTemplate = computed(() => {
    const layer = layerSchemas.value?.find(
      (schema) => schema.id === layerWithRootEditTemplate.value
    );
    if (!layer) return null;

    return layer.viewTemplate;
  });

  if (!rootTemplate.value) {
    console.error("Root template not found in layer schemas.");
    return null;
  }

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
          if (!val.includes('.')) return 0;
          return val.split('.')[1].length;
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
            error.value = "Por favor, insira valores válidos para latitude e longitude.";
            return false;
          }

          // Check precision for Lat/Lon (approx 1m requires ~5 decimal places)
          if (getDecimalPlaces(latitude.value) < 5 || getDecimalPlaces(longitude.value) < 5) {
            error.value = "A precisão mínima necessária é de 5 casas decimais para representar um metro.";
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
         if (!digitalAddress.value.trim()) {
             error.value = "Por favor, insira um endereço digital.";
             return false;
         }
         
         const cleanAddress = digitalAddress.value.replace(/\s/g, "");
         const digitalPartialRegex = /^[23456789BCDFGHJKLMNPQTVWXYZ]{3}-?[23456789BCDFGHJKLMNPQTVWXYZ]{4}$/i;

         if (digitalPartialRegex.test(cleanAddress)) {
             const cleanSuffix = cleanAddress.toUpperCase().replace("-", "");
             const formattedSuffix = `${cleanSuffix.substring(0, 3)}-${cleanSuffix.substring(3)}`;
             digitalAddress.value = `-23-46 ${formattedSuffix}`;
             toastInfo("Assumindo cidade de São Paulo (-23-46)");
         }

         try {
             decode(digitalAddress.value.replace(/\s/g, ""));
         } catch (e) {
             error.value = "Endereço digital inválido. Verifique o formato (Ex: -23-46 J6M-GHNT).";
             return false;
         }
      } else if (inputType.value === "pluscode") {
          let code = plusCodeInput.value.trim().toUpperCase();
          if (!code) {
              error.value = "Por favor, insira um Plus Code.";
              return false;
          }
          
          // 1. Check validity (structure)
          if (!olc.isValid(code)) {
              // Try prepending 5858
              if (olc.isValid("5858" + code)) {
                  code = "5858" + code;
                  plusCodeInput.value = code;
                  toastInfo("Adicionado prefixo 5858 (São Paulo) ao Plus Code");
              } else {
                  error.value = "Plus Code inválido. (Ex: 58PH6G7J+R9)";
                  return false;
              }
          }

          // 2. Check completeness (must be full code for decoding without reference)
          if (!olc.isFull(code)) {
              // Try prepending 5858 to make it full
              if (olc.isValid("5858" + code) && olc.isFull("5858" + code)) {
                  code = "5858" + code;
                  plusCodeInput.value = code;
                  toastInfo("Adicionado prefixo 5858 para completar o código");
              } else {
                  error.value = "Plus Code incompleto (curto). Adicione o prefixo da cidade (ex: 5858...).";
                  return false;
              }
          }
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
              plusCodeInput.value = olc.encode(lat, lon);
          }
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
            const lats = p.map(pt => pt.lat);
            const lons = p.map(pt => pt.lon);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLon = Math.min(...lons);
            const maxLon = Math.max(...lons);
            
            polygonCoords = [[
                [minLon, minLat],
                [maxLon, minLat],
                [maxLon, maxLat],
                [minLon, maxLat],
                [minLon, minLat]
            ]];

        } else if (inputType.value === "digital") {
            const cleanAddress = digitalAddress.value.replace(/\s/g, "");
            const decoded = decode(cleanAddress);
            lat = decoded.latitude;
            lon = decoded.longitude;
            
            const p = getPolygon(cleanAddress);
            const lats = p.map(pt => pt.lat);
            const lons = p.map(pt => pt.lon);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLon = Math.min(...lons);
            const maxLon = Math.max(...lons);
            
            polygonCoords = [[
                [minLon, minLat],
                [maxLon, minLat],
                [maxLon, maxLat],
                [minLon, maxLat],
                [minLon, minLat]
            ]];

        } else { // pluscode
            typeLabel = "pluscode";
            const codeArea = olc.decode(plusCodeInput.value);
            lat = codeArea.latitudeCenter;
            lon = codeArea.longitudeCenter;
            
            // Plus Code Polygon
            const { longitudeLo, latitudeLo, longitudeHi, latitudeHi } = codeArea;
            polygonCoords = [[
                [longitudeLo, latitudeLo],
                [longitudeHi, latitudeLo],
                [longitudeHi, latitudeHi],
                [longitudeLo, latitudeHi],
                [longitudeLo, latitudeLo]
            ]];
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
                    coordinates: [lon, lat]
                },
                properties: { type: "marker" }
            }
        ];

        if (inputType.value !== 'latlon') {
             features.push({
                    type: "Feature",
                    geometry: {
                        type: "Polygon",
                        coordinates: polygonCoords
                    },
                    properties: { type: "polygon", sourceType: typeLabel }
             });
        }

        const featureCollection = {
            type: "FeatureCollection",
            features
        };

        // Hide all layers
        layerSchemas.value = layerSchemas.value.map(l => ({ ...l, isVisible: false }));

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
            />
        );

      } else if (selectedOption.value === "geoJson") {
        openObj({ file: geoJsonFile.value!, crs: crs.value });
      }
      step.value = 1;
      selectedOption.value = null;
    }
  };

  const openObj = async ({ file, crs }: { file: File, crs: string }) => {
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
                 feature.geometry.coordinates = transform(feature.geometry.coordinates);
             }
             return feature;
        }

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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const centroid: any = calculateCentroid(geometry.coordinates);
      const destination = {
        center: [centroid[0][0], centroid[0][1]],
        zoom: 18,
        bearing: 0,
      };

            navigateTo(
                <PolygonDetails
                template={editFeatureTemplate.value!}
                rootTemplate={rootTemplate.value!}
                />
            );
            flyTo(destination);
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

  return (
    <div className="grid gap-2">
      {step.value  === 1 ? (
        <div className="flex flex-col gap-2">
          <div
            className="cursor-pointer bg-card shadow-sm hover:bg-accent/50 transition-colors rounded-lg border p-3 flex items-center gap-3"
            onClick={() => {
              inputType.value = "latlon";
              handleOptionSelect("coordenadas");
            }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ArrowRight className="h-5 w-5" />
            </div>
            <div className="flex flex-col flex-1 text-left">
              <span className="text-sm font-semibold">Ir para</span>
              <span className="text-xs text-muted-foreground">
                Ir para Coordenadas ou Plus Code.
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <div
            className="cursor-pointer bg-card shadow-sm hover:bg-accent/50 transition-colors rounded-lg border p-3 flex items-center gap-3"
            onClick={() => {
              inputType.value = "digital";
              handleOptionSelect("coordenadas");
            }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <img src="/ed.png" alt="Endereço Digital" className="h-5 w-5" />
            </div>
            <div className="flex flex-col flex-1 text-left">
              <span className="text-sm font-semibold">Endereço Digital</span>
              <span className="text-xs text-muted-foreground">
                O que é o Endereço Digital? Saiba como funciona.
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <ConcatenatedSearchModal
            trigger={
              <div
                className="cursor-pointer bg-card shadow-sm hover:bg-accent/50 transition-colors rounded-lg border p-3 flex items-center gap-3 text-left w-full"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Filter className="h-5 w-5" />
                </div>
                <div className="flex flex-col flex-1 text-left">
                  <span className="text-sm font-semibold">Busca Concatenada</span>
                  <span className="text-xs text-muted-foreground">
                    Filtros Multicamadas: Refine sua pesquisa por camadas de dados.
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            }
          />

          <div
            className="cursor-pointer bg-card shadow-sm hover:bg-accent/50 transition-colors rounded-lg border p-3 flex items-center gap-3"
            onClick={() => navigateTo(<ProspectiveSearchPage key="nav-prospective-search" />)}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileSearch className="h-5 w-5" />
            </div>
            <div className="flex flex-col flex-1 text-left">
              <span className="text-sm font-semibold">
                Pesquisa Prospectiva
              </span>
              <span className="text-xs text-muted-foreground">
                Busca de imóveis e áreas.
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
                Importar Geometria: Localize áreas via arquivo GeoJSON.
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <div
            className="cursor-pointer bg-card shadow-sm hover:bg-accent/50 transition-colors rounded-lg border p-3 flex items-center gap-3"
            onClick={() => navigateTo(<MapLibrary />)}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Library className="h-5 w-5" />
            </div>
            <div className="flex flex-col flex-1 text-left">
              <span className="text-sm font-semibold text-foreground">Biblioteca e Histórico</span>
              <span className="text-xs text-muted-foreground">
                Meu Painel: Histórico de buscas e itens salvos.
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      ) : (
        <Card className="rounded-xl border shadow-sm">
          {selectedOption.value !== "coordenadas" && (
            <CardHeader className="p-2 pb-0">
              <CardTitle className="text-base font-medium">
                Buscar com perímetro
              </CardTitle>
            </CardHeader>
          )}
          <CardContent className="p-2 space-y-2">
            {selectedOption.value === "coordenadas" && (
              <div className="space-y-2">
                <div className="grid w-full max-w-sm items-center gap-1">
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">Método de busca</Label>
                    <Select value={inputType.value} onValueChange={(v: "latlon" | "digital" | "pluscode") => {
                        inputType.value = v;
                        error.value = "";
                    }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="latlon">Coordenadas (Lat/Lon)</SelectItem>
                            <SelectItem value="digital">Endereço Digital</SelectItem>
                            <SelectItem value="pluscode">Plus Code (Google)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {inputType.value === "latlon" && (
                    <div className="space-y-2">
                        <div className="grid w-full max-w-sm items-center gap-1">
                            <Label className="text-[10px] text-muted-foreground uppercase font-bold">Projeção</Label>
                            <Select value={crs.value} onValueChange={(v: any) => crs.value = v}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a projeção" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EPSG:4674">SIRGAS 2000 / WGS 84 (Geográfico)</SelectItem>
                                    <SelectItem value="EPSG:31983">SIRGAS 2000 (UTM 23S)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="grid w-full items-center gap-1">
                                <Label htmlFor="latitude" className="text-xs">
                                    {crs.value === "EPSG:31983" ? "Northing (Y)" : "Latitude"}
                                </Label>
                                <Input
                                    className="h-8 text-xs"
                                    type="number"
                                    id="latitude"
                                    value={latitude.value}
                                    placeholder={crs.value === "EPSG:31983" ? "7394382" : "-23.5505"}
                                    onChange={(e) => (latitude.value = (e.currentTarget as HTMLInputElement).value)}
                                />
                                <p className="text-[9px] text-muted-foreground">Ex: {crs.value === "EPSG:31983" ? "7394382" : "-23.55052"}</p>
                            </div>
                            <div className="grid w-full items-center gap-1">
                                <Label htmlFor="longitude" className="text-xs">
                                    {crs.value === "EPSG:31983" ? "Easting (X)" : "Longitude"}
                                </Label>
                                <Input
                                    className="h-8 text-xs"
                                    type="number"
                                    id="longitude"
                                    value={longitude.value}
                                    placeholder={crs.value === "EPSG:31983" ? "333199" : "-46.6333"}
                                    onChange={(e) => (longitude.value = (e.currentTarget as HTMLInputElement).value)}
                                />
                                <p className="text-[9px] text-muted-foreground">Ex: {crs.value === "EPSG:31983" ? "333199" : "-46.63330"}</p>
                            </div>
                        </div>
                        
                        <Button 
                            variant="secondary"
                            size="sm"
                            className={cn("w-full h-8 text-xs gap-2 mt-2", isPickingLocation.value && "bg-primary/20 border-primary/50")}
                            onClick={() => handleCaptureToggle("latlon")}
                        >
                            <MapPin className="h-4 w-4" />
                            {isPickingLocation.value ? "Clique no mapa para capturar" : "Capturar com um clique no mouse"}
                        </Button>

                        <div className="bg-muted/50 p-2 rounded-lg border text-[10px] text-muted-foreground leading-relaxed mt-2">
                            Busque utilizando Latitude e Longitude (ex: -23.5505, -46.6333) ou coordenadas UTM. Certifique-se de selecionar a projeção correta.
                        </div>
                    </div>
                )}
                
                {inputType.value === "digital" && (
                    <div className="grid w-full max-w-sm items-center gap-2">
                        <div className="grid w-full max-w-sm items-center gap-1">
                          <Label htmlFor="digitalAddress" className="text-xs">Endereço Digital</Label>
                          <Input
                              className="h-8 text-xs"
                              type="text"
                              id="digitalAddress"
                              value={digitalAddress.value}
                              placeholder="-23-46 J6M-GHNT"
                              onChange={(e) => (digitalAddress.value = (e.currentTarget as HTMLInputElement).value)}
                          />
                          <p className="text-[9px] text-muted-foreground">Ex: -23-46 J6M-GHNT</p>
                        </div>
                        
                        <Button 
                            variant="secondary"
                            size="sm"
                            className={cn("w-full h-8 text-xs gap-2", isPickingLocation.value && "bg-primary/20 border-primary/50")}
                            onClick={() => handleCaptureToggle("digital")}
                        >
                            <img src="/ed.png" className="h-4 w-4" alt="Icone ED" />
                            {isPickingLocation.value ? "Clique no mapa para capturar" : "Capturar com um clique no mouse"}
                        </Button>

                        <div className="bg-muted/50 p-2 rounded-lg border text-[10px] text-muted-foreground leading-relaxed">
                            O Endereço Digital é uma ferramenta do Urbis que permite, com um código local de 7 caracteres (ex.: J7K-H87F), ou global acrescentando um prefixo variável (ex.: -23-46 J7K-H87F), localizar facilmente uma área de aproximadamente 1 metro quadrado. Sua maior utilidade é servir de endereço em ruas sem nome oficial ou CEP.
                        </div>
                    </div>
                )}

                {inputType.value === "pluscode" && (
                    <div className="grid w-full max-w-sm items-center gap-2">
                        <div className="grid w-full max-w-sm items-center gap-1">
                            <Label htmlFor="plusCode" className="text-xs">Plus Code</Label>
                            <Input
                                className="h-8 text-xs"
                                type="text"
                                id="plusCode"
                                value={plusCodeInput.value}
                                placeholder="58PH6G7J+R9"
                                onChange={(e) => (plusCodeInput.value = (e.currentTarget as HTMLInputElement).value)}
                            />
                            <p className="text-[9px] text-muted-foreground">Ex: 58PH6G7J+R9</p>
                        </div>

                        <Button 
                            variant="secondary"
                            size="sm"
                            className={cn("w-full h-8 text-xs gap-2", isPickingLocation.value && "bg-primary/20 border-primary/50")}
                            onClick={() => handleCaptureToggle("pluscode")}
                        >
                            <MapPin className="h-4 w-4" />
                            {isPickingLocation.value ? "Clique no mapa para capturar" : "Capturar com um clique no mouse"}
                        </Button>

                        <div className="bg-muted/50 p-2 rounded-lg border text-[10px] text-muted-foreground leading-relaxed">
                            O Plus Code é um sistema de endereçamento aberto do Google. Se o código for curto, o sistema tentará usar o prefixo padrão de São Paulo (5858).
                        </div>
                    </div>
                )}
              </div>
            )}
            {selectedOption.value === "geoJson" && (
              <div className="space-y-2">
                  <div className="grid w-full max-w-sm items-center gap-1">
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">Projeção do Arquivo</Label>
                    <Select value={crs.value} onValueChange={(v: any) => crs.value = v}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione a projeção" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="EPSG:4674">SIRGAS 2000 / WGS 84 (Geográfico)</SelectItem>
                            <SelectItem value="EPSG:31983">SIRGAS 2000 (UTM 23S)</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>

                  <div className="grid w-full max-w-sm items-center gap-1">
                    <Label htmlFor="geojson" className="text-xs">Selecione o arquivo</Label>
                    <Input
                      className="h-8 text-xs"
                      type="file"
                      id="geojson"
                      accept=".geojson"
                      onChange={(e) =>
                        (geoJsonFile.value = e.currentTarget.files ? e.currentTarget.files[0] : null)
                      }
                    />
                    <div className="flex gap-4 text-[10px] text-muted-foreground pt-1">
                        <a href="/exemplo_wgs84.geojson" download className="hover:underline flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">download</span>
                            Exemplo WGS 84
                        </a>
                        <a href="/exemplo_sirgas_utm.geojson" download className="hover:underline flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">download</span>
                            Exemplo SIRGAS UTM
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
                onClick={() => (step.value = 1)}
                className="rounded-full h-7 text-xs"
              >
                Voltar
              </Button>
              <Button onClick={handleSubmit} size="sm" className="rounded-full shadow-sm h-7 text-xs">
                Localizar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};
