import { computed } from "@preact/signals-react";
import { ReactNode, useState } from "react";
import { Button, Card, TextField } from "rmwc";
import { useMapContext } from "../../hooks/useMapContext";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { transformFileToJson } from "../../utils/transformFileToJson";
import { calculateCentroid } from "../MapView/utils";
import { PolygonDetails } from "../PolygonDetails";
import "./styles.scss";

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
    <div className="card-list">
      <Card
        className="card-details lote-information"
        style={{ padding: "16px" }}
      >
        {
          (
            <>
              {step === 1 && (
                <>
                  <h5>Selecione uma Opção:</h5>
                  <div className="d-gap">
                    <Button
                      outlined
                      onClick={() => handleOptionSelect("coordenadas")}
                    >
                      Navegar por Latitude e Longitude
                    </Button>
                    <Button
                      outlined
                      onClick={() => handleOptionSelect("geoJson")}
                    >
                      Enviar arquivo GeoReferenciado
                    </Button>
                  </div>
                </>
              )}

              {step === 2 && selectedOption === "coordenadas" && (
                <>
                  <TextField
                    label="Latitude"
                    type="number"
                    value={latitude}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onChange={(e: any) => setLatitude(e.target.value)}
                    fullwidth
                  />
                  <TextField
                    label="Longitude"
                    type="number"
                    value={longitude}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onChange={(e: any) => setLongitude(e.target.value)}
                    fullwidth
                  />
                </>
              )}
              {step === 2 && selectedOption === "geoJson" && (
                <input
                  type="file"
                  style={{ maxWidth: "260px" }}
                  accept=".geojson"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e: any) =>
                    setGeoJsonFile(
                      e?.target?.files ? e?.target?.files?.[0] : null
                    )
                  }
                />
              )}

              {error && (
                <div style={{ color: "red", marginTop: "8px" }}>{error}</div>
              )}

              {step === 2 && <Button onClick={() => setStep(1)}>Voltar</Button>}
              {step === 2 && (
                <Button onClick={handleSubmit} raised>
                  Enviar
                </Button>
              )}
            </>
          ) as ReactNode
        }
      </Card>
    </div>
  );
};
