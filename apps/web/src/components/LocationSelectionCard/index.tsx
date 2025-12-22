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
import { useMapContext } from "../../hooks/useMapContext";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { transformFileToJson } from "../../utils/transformFileToJson";
import { calculateCentroid } from "../MapView/utils";
import { PolygonDetails } from "../PolygonDetails";
import { BaseMapSelector } from "../BaseMapSelector";

export const LocationSelectionCard = () => {
  const { flyTo, layerSchemas } = useMapContext();
  const { editFeature, editFeatureTemplate, layerWithRootEditTemplate } =
    usePolygonEditContext();
  const { navigateTo } = useNavigationContext();

  const [step, setStep] = useState(1);
  const [geoJsonFile, setGeoJsonFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

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
        const destination = {
          center: [parseFloat(longitude), parseFloat(latitude)],
          zoom: 18,
          pitch: 45,
          bearing: 0,
        };

        flyTo(destination);
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
              <ItemTitle>Navegar por Coordenadas</ItemTitle>
              <ItemDescription>
                Inserir latitude e longitude manualmente.
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
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-lg font-medium">
              {selectedOption === "coordenadas"
                ? "Navegar por Coordenadas"
                : "Buscar com perímetro"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-4">
            {selectedOption === "coordenadas" && (
              <div className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    type="number"
                    id="latitude"
                    value={latitude}
                    placeholder="-23.5505"
                    onChange={(e) => setLatitude(e.currentTarget.value)}
                  />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    type="number"
                    id="longitude"
                    value={longitude}
                    placeholder="-46.6333"
                    onChange={(e) => setLongitude(e.currentTarget.value)}
                  />
                </div>
              </div>
            )}
            {selectedOption === "geoJson" && (
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="geojson">Selecione o arquivo</Label>
                <Input
                  type="file"
                  id="geojson"
                  className="max-w-[260px]"
                  accept=".geojson"
                  onChange={(e) =>
                    setGeoJsonFile(
                      e.currentTarget.files ? e.currentTarget.files[0] : null
                    )
                  }
                />
              </div>
            )}

            {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}

            <div className="flex gap-2 pt-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="rounded-full"
              >
                Voltar
              </Button>
              <Button onClick={handleSubmit} className="rounded-full">
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && <BaseMapSelector />}
    </div>
  );
};
