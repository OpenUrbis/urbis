import DeckGL, { PolygonLayer } from "deck.gl";
import { memo } from "preact/compat";
import { useMemo, useRef } from "react";
import { useSignal } from "@preact/signals";
import { Map } from "react-map-gl/maplibre";
import { getMapStyle } from "../../../MapView/base-map-styles";
import { createFn } from "../../../../utils/createFn";
import { IPolygonMapProperties } from "../../types/polygon-map-type";
import {
  ITemplateProps,
  ITemplateRender,
  ITemplatesDeclaration,
} from "../../types/templates-type";

const PolygonMapComponent: ITemplateRender = ({
  template,
  data,
}: ITemplateProps) => {
  const loadingMap = useSignal(true);
  const mapRef = useRef(null);
  const properties: IPolygonMapProperties =
    template.properties as IPolygonMapProperties;

  if (!properties?.initialViewState) {
    console.error(
      "initialViewState is not defined is 'polygon-map' properties",
    );
    return null;
  }

  if (!properties?.polygonProps) {
    console.error("polygonProps is not defined is 'polygon-map' properties");
    return null;
  }

  const mapId = useMemo(
    () => `polygon-details-${Math.random().toString(36).slice(2)}`,
    [],
  );

  const initialViewState = useMemo(() => {
    const strFn = createFn(properties!.initialViewState!);

    try {
      return strFn(data);
    } catch (err) {
      console.error('Error on execute "initialViewState": ', err);
      return {};
    }
  }, [data, properties]);

  const layers = useMemo(() => {
    const strFn = createFn(properties!.polygonProps!);

    try {
      return [new PolygonLayer(strFn(data))];
    } catch (err) {
      console.error('Error on execute "polygonProps": ', err);
      return [];
    }
  }, [data, properties]);

  return (
    <div
      style={{
        height: 184,
        marginTop: "12px",
        overflow: "hidden",
        borderRadius: "12px",
        position: "relative",
      }}
    >
      {loadingMap.value ? <span id="mapReady"></span> : null}
      <DeckGL
        ref={mapRef}
        initialViewState={initialViewState}
        controller={false}
        layers={layers}
        onLoad={() => (loadingMap.value = false)}
      >
        {
          (
            <Map
              id={mapId}
              attributionControl={false}
              mapStyle={getMapStyle(
                "satellite-streets",
                "light",
                import.meta.env.VITE_API_URL || "/api",
              )}
            /> // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ) as any
        }
      </DeckGL>
    </div>
  );
};

export const PolygonMapTemplate: ITemplatesDeclaration = {
  name: "polygon-map",
  render: memo(PolygonMapComponent),
};
