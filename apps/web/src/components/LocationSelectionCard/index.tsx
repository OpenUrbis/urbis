import { computed } from "@preact/signals-react";
import { useState } from "react";
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

  const [step, setStep] = useState(1);
  const [geoJsonFile, setGeoJsonFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  const [inputType, setInputType] = useState<"latlon" | "digital" | "pluscode">("latlon");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [digitalAddress, setDigitalAddress] = useState("");
  const [plusCodeInput, setPlusCodeInput] = useState("");

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
    if (selectedOption === "coordenadas") {
      if (inputType === "latlon") {
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        if (
          isNaN(lat) ||
          isNaN(lon) ||
          lat < -90 ||
          lat > 90 ||
          lon < -180 ||
          lon > 180
        ) {
          setError(
            "Por favor, insira valores válidos para latitude e longitude."
          );
          return false;
        }
      } else if (inputType === "digital") {
         if (!digitalAddress.trim()) {
             setError("Por favor, insira um endereço digital.");
             return false;
         }
         try {
             decode(digitalAddress);
         } catch (e) {
             setError("Endereço digital inválido. Verifique o formato (Ex: -23-46 J6M-GHNT).");
             return false;
         }
      } else if (inputType === "pluscode") {
          if (!plusCodeInput.trim()) {
              setError("Por favor, insira um Plus Code.");
              return false;
          }
          if (!olc.isValid(plusCodeInput)) {
              setError("Plus Code inválido. (Ex: 58PH6G7J+R9)");
              return false;
          }
          if (!olc.isFull(plusCodeInput)) {
               // Assuming full code required or handle recovery? 
               // For simplicity, require full code or we need a reference location.
               // We will try to decode, if it throws, it throws.
          }
      }
    } else if (selectedOption === "geoJson" && !geoJsonFile) {
      setError("Por favor, envie um arquivo GeoJSON válido.");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = () => {
    if (validateInputs()) {
      if (selectedOption === "coordenadas") {
        let lat: number, lon: number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let polygonCoords: any[] = [];
        let typeLabel = "digital";

        if (inputType === "latlon") {
            lat = parseFloat(latitude);
            lon = parseFloat(longitude);
            
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

        } else if (inputType === "digital") {
            const decoded = decode(digitalAddress);
            lat = decoded.latitude;
            lon = decoded.longitude;
            
            const p = getPolygon(digitalAddress);
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
            const codeArea = olc.decode(plusCodeInput);
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

      } else if (selectedOption === "geoJson") {
        openObj({ file: geoJsonFile! });
      }
      setStep(1);
      setSelectedOption(null);
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
    setSelectedOption(option);
    setStep(2);
    setError("");
    // Clear previous digital features
    digitalAddressFeature.value = null;
  };

  return (
    <div className="grid gap-2">
      {step === 1 ? (
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
              {selectedOption === "coordenadas"
                ? "Busca Detalhada"
                : "Buscar com perímetro"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-2">
            {selectedOption === "coordenadas" && (
              <div className="space-y-2">
                <div className="grid w-full max-w-sm items-center gap-1">
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">Método de Entrada</Label>
                    <Select value={inputType} onValueChange={(v: "latlon" | "digital" | "pluscode") => {
                        setInputType(v);
                        setError("");
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

                {inputType === "latlon" && (
                    <div className="grid grid-cols-2 gap-2">
                        <div className="grid w-full items-center gap-1">
                            <Label htmlFor="latitude" className="text-xs">Latitude</Label>
                            <Input
                                className="h-8 text-xs"
                                type="number"
                                id="latitude"
                                value={latitude}
                                placeholder="-23.5505"
                                onChange={(e) => setLatitude(e.currentTarget.value)}
                            />
                            <p className="text-[9px] text-muted-foreground">Ex: -23.55052</p>
                        </div>
                        <div className="grid w-full items-center gap-1">
                            <Label htmlFor="longitude" className="text-xs">Longitude</Label>
                            <Input
                                className="h-8 text-xs"
                                type="number"
                                id="longitude"
                                value={longitude}
                                placeholder="-46.6333"
                                onChange={(e) => setLongitude(e.currentTarget.value)}
                            />
                            <p className="text-[9px] text-muted-foreground">Ex: -46.63330</p>
                        </div>
                    </div>
                )}
                
                {inputType === "digital" && (
                    <div className="grid w-full max-w-sm items-center gap-1">
                        <Label htmlFor="digitalAddress" className="text-xs">Endereço Digital</Label>
                        <Input
                            className="h-8 text-xs"
                            type="text"
                            id="digitalAddress"
                            value={digitalAddress}
                            placeholder="-23-46 J6M-GHNT"
                            onChange={(e) => setDigitalAddress(e.currentTarget.value)}
                        />
                        <p className="text-[9px] text-muted-foreground">Ex: -23-46 J6M-GHNT</p>
                    </div>
                )}

                {inputType === "pluscode" && (
                    <div className="grid w-full max-w-sm items-center gap-1">
                        <Label htmlFor="plusCode" className="text-xs">Plus Code</Label>
                        <Input
                            className="h-8 text-xs"
                            type="text"
                            id="plusCode"
                            value={plusCodeInput}
                            placeholder="58PH6G7J+R9"
                            onChange={(e) => setPlusCodeInput(e.currentTarget.value)}
                        />
                        <p className="text-[9px] text-muted-foreground">Ex: 58PH6G7J+R9</p>
                    </div>
                )}
              </div>
            )}
            {selectedOption === "geoJson" && (
              <div className="grid w-full max-w-sm items-center gap-1">
                <Label htmlFor="geojson" className="text-xs">Selecione o arquivo</Label>
                <Input
                  className="h-8 text-xs"
                  type="file"
                  id="geojson"
                  accept=".geojson"
                  onChange={(e) =>
                    setGeoJsonFile(
                      e.currentTarget.files ? e.currentTarget.files[0] : null
                    )
                  }
                />
              </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 p-1.5 rounded text-[10px] border border-red-200">
                    {error}
                </div>
            )}

            <div className="flex gap-2 pt-1 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
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

      {step === 1 && <BaseMapSelector />}
    </div>
  );
};
