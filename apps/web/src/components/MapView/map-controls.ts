import CompassControl from "@mapbox-controls/compass";
import "@mapbox-controls/compass/src/index.css";
import ImageControl from "@mapbox-controls/image";
import "@mapbox-controls/image/src/index.css";
import RulerControl from "@mapbox-controls/ruler";
import "@mapbox-controls/ruler/src/index.css";
import TooltipControl from "@mapbox-controls/tooltip";
import "@mapbox-controls/tooltip/src/index.css";
import ZoomControl from "@mapbox-controls/zoom";
import "@mapbox-controls/zoom/src/index.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import mapboxgl from "mapbox-gl";
import "mapbox-gl-style-switcher/styles.css";
import "mapbox-gl/dist/mapbox-gl.css";
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
  return draw;
};


class SpacerControl implements mapboxgl.IControl {
  private container!: HTMLElement;
  private map?: mapboxgl.Map;

  onAdd(map: mapboxgl.Map) {
    this.map = map;
    this.container = document.createElement("div");
    this.container.className = "mapboxgl-ctrl";
    this.container.style.height = "132px";
    this.container.style.width = "0px";
    return this.container;
  }

  onRemove() {
    this.container.parentNode?.removeChild(this.container);
    this.map = undefined;
  }
}

class PickLocationControl implements mapboxgl.IControl {
  private container!: HTMLElement;
  private onPick: () => void;
  private button!: HTMLButtonElement;

  constructor(onPick: () => void) {
    this.onPick = onPick;
  }

  onAdd(_map: mapboxgl.Map) {
    this.container = document.createElement("div");
    this.container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
    
    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.title = "Identificar Local";
    this.button.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px; line-height: 29px;">pin_drop</span>';
    this.button.addEventListener("click", () => {
        this.onPick();
    });

    this.container.appendChild(this.button);
    return this.container;
  }

  onRemove() {
    this.container.parentNode?.removeChild(this.container);
  }
}

export const addMapControls = (
  map: mapboxgl.Map,
  polygonEdit: IPolygonEditContextActions,
  onPickLocation?: () => void,
  hideControls?: boolean
) => {
  // Adiciona controles de desenho (sempre necessário para edição?)
  // Se hideControls for true (preview), talvez não precisemos de draw? 
  // Mas o retorno espera { draw }.
  const draw = addDrawControls(map, polygonEdit);

  if (hideControls) {
    return { draw };
  }

  // Adiciona o controle de troca de estilo ao mapa
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map.addControl(new SpacerControl(), "top-right");

  if (onPickLocation) {
      map.addControl(new PickLocationControl(onPickLocation), "top-right");
  }

  // Controle de escala
  const scaleControl = new mapboxgl.ScaleControl();
  map.addControl(scaleControl, "top-left");

  // Zoom Control
  map.addControl(new ZoomControl(), "top-right");

  // Compass Control
  map.addControl(new CompassControl({ instant: true }), "top-right");

  // Tooltip Control
  map.addControl(
    new TooltipControl({
      layer: "polygon-fill",
      getContent: (event) =>
        `Tooltip for feature: ${event.features?.[0]?.id || "unknown"}`,
    })
  );

  // Ruler Control
  map.addControl(new RulerControl(), "top-left");
  map.on("ruler.on", () => console.info("Ruler activated"));
  map.on("ruler.off", () => console.info("Ruler deactivated"));

  // Image Control
  const imageControl = new ImageControl({ removeButton: true });
  map.addControl(imageControl, "top-left");

  console.info("Todos os controles foram adicionados ao mapa com sucesso!");
  return { draw };
};
