import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { IPolygonEditContextActions } from "../../types/polygon-edit-context-type";

const addDrawControls = (
  map: mapboxgl.Map,
  polygonEdit: IPolygonEditContextActions
) => {
  const { setDrawRef, setFeature } = polygonEdit;

  const draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
      polygon: true,
      trash: true,
    },
    defaultMode: "simple_select",
  });
  const updateDrawnFeatures = () => {
    const newDrawnFeatures = draw.getAll().features;
    setFeature(newDrawnFeatures[0]);
  };

  map.on("draw.create", updateDrawnFeatures);
  map.on("draw.update", updateDrawnFeatures);
  map.on("draw.delete", updateDrawnFeatures);
  map.addControl(draw as unknown as mapboxgl.IControl);

  setDrawRef(draw);
};

export const addMapControls = (
  map: mapboxgl.Map,
  polygonEdit: IPolygonEditContextActions
) => {
  addDrawControls(map, polygonEdit);
};
