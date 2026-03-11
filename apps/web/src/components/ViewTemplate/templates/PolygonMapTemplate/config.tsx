import { Label, Input } from "@open-urbis/map-ui";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { CodeEditor } from "../../builder/components/CodeEditor";
import { IBuilderTemplateConfig } from "../../builder/types";
import { ITemplate } from "../../types/templates-type";
import LayerColorManager, { ILayerColor } from "@/components/LayerColorManager";

// Helper to convert color array to rgb string "[r, g, b, a]"
const arrayToRgbStr = (colorArr: number[]) => {
  if (!colorArr || colorArr.length < 3) return `[30, 111, 249, 100]`;
  const r = colorArr[0];
  const g = colorArr[1];
  const b = colorArr[2];
  const a = colorArr[3] !== undefined ? colorArr[3] * 255 : 255;
  return `[${r}, ${g}, ${b}, ${a}]`;
};

// Simple naive parse to extract default colors from legacy string
const extractColorArray = (fnString: string, key: string, defaultColor: number[]) => {
  try {
    const match = fnString.match(new RegExp(`${key}:\\s*\\[([0-9]+),\\s*([0-9]+),\\s*([0-9]+)(?:,\\s*([0-9]+))?\\]`));
    if (match) {
       const r = parseInt(match[1]);
       const g = parseInt(match[2]);
       const b = parseInt(match[3]);
       const a = match[4] ? parseFloat(match[4]) / 255 : 1; // deck.gl alpha is 0-255 in string, but LayerColorManager uses 0-1
       return [r, g, b, a];
    }
  } catch (e) {}
  return defaultColor;
};

const ConfigForm = ({
  template,
  onChange,
}: {
  template: ITemplate;
  onChange: (newTemplate: ITemplate) => void;
}) => {
  const properties = (template.properties || {}) as any;
  const [showAdvanced, setShowAdvanced] = useState(false);

  const defaultFillColor = extractColorArray(properties.polygonProps || "", "getFillColor", [30, 111, 249, 0.4]);
  const defaultLineColor = extractColorArray(properties.polygonProps || "", "getLineColor", [30, 111, 249, 1]);

  const [layerColor, setLayerColor] = useState<ILayerColor>({
    fillColor: defaultFillColor,
    borderColor: defaultLineColor,
    textColor: [255, 255, 255, 1],
  });

  const { register, watch, setValue } = useForm({
    defaultValues: {
      initialViewState: properties.initialViewState || "",
      polygonProps: properties.polygonProps || "",
      // Simple Mode state
      autoCenter: properties.initialViewState?.includes("calculateCenterId") ?? true,
    },
  });

  const values = watch();

  // Function to compile simple settings into the advanced strings
  const applySimpleSettings = (currentColor: ILayerColor, isAutoCenter: boolean) => {
     const fillRgb = arrayToRgbStr(currentColor.fillColor);
     const lineRgb = arrayToRgbStr(currentColor.borderColor);
     
     const viewStateScript = isAutoCenter 
      ? `(data) => {
  const centroid = utils.calculateCenterId(data.geometry.coordinates[0]);
  return {
    longitude: centroid[0],
    latitude: centroid[1],
    zoom: 16.5,
    pitch: 0,
    bearing: 0,
  };
}` 
      : `(data) => ({ zoom: 16 })`;

     const polygonScript = `(data) => ({
  id: "polygon-layer-" + Date.now(),
  data: [{ coordinates: data.geometry.coordinates }],
  pickable: false,
  stroked: true,
  filled: true,
  lineWidthMinPixels: 2,
  getPolygon: (d) => d.coordinates,
  getFillColor: ${fillRgb},
  getLineColor: ${lineRgb},
})`;

     setValue("initialViewState", viewStateScript);
     setValue("polygonProps", polygonScript);
  };

  useEffect(() => {
    if (!showAdvanced) {
      applySimpleSettings(layerColor, values.autoCenter);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerColor, values.autoCenter, showAdvanced]);

  useEffect(() => {
    onChange({
      ...template,
      properties: {
        ...properties,
        initialViewState: values.initialViewState,
        polygonProps: values.polygonProps,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.initialViewState, values.polygonProps]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-4">
        <Label className="cursor-pointer font-medium" onClick={() => setShowAdvanced(!showAdvanced)}>Configuração Avançada (Funções JS)</Label>
        <input 
          type="checkbox" 
          checked={showAdvanced} 
          onChange={(e) => setShowAdvanced(e.target.checked)} 
          className="cursor-pointer"
        />
      </div>

      {!showAdvanced ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
           <div className="border rounded-md p-1 bg-muted/20">
             <LayerColorManager 
                colors={[layerColor]} 
                onChange={(newColors: ILayerColor[]) => {
                  if (newColors && newColors.length > 0) {
                     setLayerColor(newColors[0]);
                  }
                }} 
                dynamic={false} 
             />
           </div>

           <div className="flex items-center justify-between pt-2 border-t">
              <Label className="cursor-pointer">Auto-centralizar no polígono</Label>
              <input type="checkbox" {...register("autoCenter")} className="cursor-pointer" />
           </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <Label>Initial View State (Função string)</Label>
            <CodeEditor
              value={values.initialViewState}
              onChange={(v) => setValue("initialViewState", v)}
              placeholder="(data) => ({ longitude: ... })"
              className="h-32"
            />
          </div>
          <div className="space-y-2">
            <Label>Polygon Props (Função string)</Label>
            <CodeEditor
              value={values.polygonProps}
              onChange={(v) => setValue("polygonProps", v)}
              placeholder="(data) => ({ id: 'layer', ... })"
              className="h-48"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const PolygonMapTemplateConfig: Partial<IBuilderTemplateConfig> = {
  friendlyName: "Mapa do Polígono",
  description: "Exibe polígono no mapa.",
  configComponent: ConfigForm,
  defaultProps: {
    properties: {
      initialViewState: "(data) => ({ zoom: 16 })",
    },
  },
};
