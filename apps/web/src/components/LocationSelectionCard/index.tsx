import { computed, useSignal } from "@preact/signals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMapContext } from "../../hooks/useMapContext";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { transformFileToJson } from "../../utils/transformFileToJson";
import { calculateCentroid } from "../MapView/utils";
import { PolygonDetails } from "../PolygonDetails";
import { BaseMapSelector } from "../BaseMapSelector";
import { DigitalAddressDetails } from "./DigitalAddressDetails";
import { decode, getPolygon, encode } from "@open-urbis/numeracao-digital";
// @ts-ignore
import { OpenLocationCode } from "open-location-code";

const olc = new OpenLocationCode();

export const LocationSelectionCard = () => {
  const { flyTo, layerSchemas, digitalAddressFeature } = useMapContext();
  const { editFeature, editFeatureTemplate, layerWithRootEditTemplate } =
    usePolygonEditContext();
  const { navigateTo } = useNavigationContext();

  const step = useSignal(1);
  const geoJsonFile = useSignal<File | null>(null);
  const error = useSignal("");
  const selectedOption = useSignal<string | null>(null);
  
  const inputType = useSignal<"latlon" | "digital" | "pluscode">("latlon");
  const latitude = useSignal("");
  const longitude = useSignal("");
  const digitalAddress = useSignal("");
  const plusCodeInput = useSignal("");

  if (!editFeatureTemplate.value || !layerWithRootEditTemplate.value)
    return null;

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
      } else if (inputType.value === "digital") {
         if (!digitalAddress.value.trim()) {
             error.value = "Por favor, insira um endereço digital.";
             return false;
         }
         try {
             decode(digitalAddress.value);
         } catch (e) {
             error.value = "Endereço digital inválido. Verifique o formato (Ex: -23-46 J6M-GHNT).";
             return false;
         }
      } else if (inputType.value === "pluscode") {
          if (!plusCodeInput.value.trim()) {
              error.value = "Por favor, insira um Plus Code.";
              return false;
          }
          if (!olc.isValid(plusCodeInput.value)) {
              error.value = "Plus Code inválido. (Ex: 58PH6G7J+R9)";
              return false;
          }
          if (!olc.isFull(plusCodeInput.value)) {
               // Assuming full code required or handle recovery? 
               // For simplicity, require full code or we need a reference location.
               // We will try to decode, if it throws, it throws.
          }
      }
    } else if (selectedOption.value === "geoJson" && !geoJsonFile.value) {
      error.value = "Por favor, envie um arquivo GeoJSON válido.";
      return false;
    }

    error.value = "";
    return true;
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
            const decoded = decode(digitalAddress.value);
            lat = decoded.latitude;
            lon = decoded.longitude;
            
            const p = getPolygon(digitalAddress.value);
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
        const featureCollection = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "Polygon",
                        coordinates: polygonCoords
                    },
                    properties: { type: "polygon", sourceType: typeLabel }
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

        // Set the feature in MapContext (for DeckGL)
        digitalAddressFeature.value = featureCollection;

        const destination = {
          center: [lon, lat],
          zoom: 22,
          pitch: 45,
          bearing: 0,
        };

        flyTo(destination);
        
        navigateTo(
            <DigitalAddressDetails 
                latitude={lat} 
                longitude={lon} 
                plusCode={calcPlusCode} 
            />
        );

      } else if (selectedOption.value === "geoJson") {
        openObj({ file: geoJsonFile.value! });
      }
      step.value = 1;
      selectedOption.value = null;
    }
  };

  const openObj = async ({ file }: { file: File }) => {
    if (!file) return;
    const object = await transformFileToJson(file);
    editFeature(object);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const centroid: any = calculateCentroid(object?.geometry.coordinates);
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
      {step.value === 1 ? (
        <div className="flex flex-col gap-2">
          <Item
            variant="outline"
            className="cursor-pointer bg-card shadow-sm"
            onClick={() => handleOptionSelect("coordenadas")}
          >
            <ItemContent>
              <ItemTitle>Localizar Endereço</ItemTitle>
              <ItemDescription>
                Busque por Coordenadas, Endereço Digital ou Plus Code.
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <span className="material-symbols-outlined text-muted-foreground">
                chevron_right
              </span>
            </ItemActions>
          </Item>

          <Item
            variant="outline"
            className="cursor-pointer bg-card shadow-sm"
            onClick={() => handleOptionSelect("geoJson")}
          >
            <ItemContent>
              <ItemTitle>Buscar com perímetro georeferenciado</ItemTitle>
              <ItemDescription>
                Carregar arquivo GeoJSON para localização.
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <span className="material-symbols-outlined text-muted-foreground">
                chevron_right
              </span>
            </ItemActions>
          </Item>
        </div>
      ) : (
        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="p-2 pb-0">
            <CardTitle className="text-base font-medium">
              {selectedOption.value === "coordenadas"
                ? "Busca Detalhada"
                : "Buscar com perímetro"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-2">
            {selectedOption.value === "coordenadas" && (
              <div className="space-y-2">
                <div className="grid w-full max-w-sm items-center gap-1">
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">Método de Entrada</Label>
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
                    <div className="grid grid-cols-2 gap-2">
                        <div className="grid w-full items-center gap-1">
                            <Label htmlFor="latitude" className="text-xs">Latitude</Label>
                            <Input
                                className="h-8 text-xs"
                                type="number"
                                id="latitude"
                                value={latitude.value}
                                placeholder="-23.5505"
                                onChange={(e) => (latitude.value = (e.currentTarget as HTMLInputElement).value)}
                            />
                            <p className="text-[9px] text-muted-foreground">Ex: -23.55052</p>
                        </div>
                        <div className="grid w-full items-center gap-1">
                            <Label htmlFor="longitude" className="text-xs">Longitude</Label>
                            <Input
                                className="h-8 text-xs"
                                type="number"
                                id="longitude"
                                value={longitude.value}
                                placeholder="-46.6333"
                                onChange={(e) => (longitude.value = (e.currentTarget as HTMLInputElement).value)}
                            />
                            <p className="text-[9px] text-muted-foreground">Ex: -46.63330</p>
                        </div>
                    </div>
                )}
                
                {inputType.value === "digital" && (
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
                )}

                {inputType.value === "pluscode" && (
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
                )}
              </div>
            )}
            {selectedOption.value === "geoJson" && (
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

      {step.value === 1 && <BaseMapSelector />}
    </div>
  );
};
