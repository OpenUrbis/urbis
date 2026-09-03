import ImageControl from "@mapbox-controls/image";
import "@mapbox-controls/image/src/index.css";
import RulerControl from "@mapbox-controls/ruler";
import "@mapbox-controls/ruler/src/index.css";
import TooltipControl from "@mapbox-controls/tooltip";
import "@mapbox-controls/tooltip/src/index.css";

import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import maplibregl from "maplibre-gl";
import "mapbox-gl-style-switcher/styles.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { encode } from "@open-urbis/endereco-digital";
import { IPolygonEditContextActions } from "../../types/polygon-edit-context-type";

type MapboxDrawConfig = ConstructorParameters<typeof MapboxDraw>[0];
type ImageControlInstance = InstanceType<typeof ImageControl>;
type AnglePoint = [number, number];

const createSvgElement = <K extends keyof SVGElementTagNameMap>(tagName: K) =>
  document.createElementNS("http://www.w3.org/2000/svg", tagName);

const COMPASS_ICON_NORTH_OFFSET_DEGREES = -45;

const CONTROL_ICON_PATHS = {
  ruler:
    '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',
  draftingCompass:
    '<path d="m12 19 7-14 2 2-14 7"/><path d="m18 13 3 3"/><path d="m2 22 7-7"/><path d="m7 17 3 3"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  compass:
    '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.8 5.4a2 2 0 0 1-1.27 1.28l-5.41 1.8 1.8-5.41a2 2 0 0 1 1.28-1.27z"/>',
  locate:
    '<line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><circle cx="12" cy="12" r="7"/>',
} as const;

type ControlIconName = keyof typeof CONTROL_ICON_PATHS;

const createLucideSvg = (icon: ControlIconName) => {
  const container = document.createElement("span");
  container.className = "map-general-control-icon";
  container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CONTROL_ICON_PATHS[icon]}</svg>`;
  return container;
};

export const mapImageControl = {
  current: null as ImageControlInstance | null,
};

type TooltipFeature = {
  id?: string | number;
};

type TooltipMouseEvent = {
  features?: TooltipFeature[];
  point?: unknown;
  target?: {
    queryRenderedFeatures?: (
      point: unknown,
      options: { layers: string[] },
    ) => TooltipFeature[];
  };
};

const getTooltipContent = (event: unknown) => {
  const tooltipEvent = event as TooltipMouseEvent;
  const [feature] =
    tooltipEvent.target?.queryRenderedFeatures?.(tooltipEvent.point, {
      layers: ["polygon-fill"],
    }) ??
    tooltipEvent.features ??
    [];

  return `Tooltip for feature: ${feature?.id || "unknown"}`;
};

const calculateAngle = ([a, b, c]: [AnglePoint, AnglePoint, AnglePoint]) => {
  const vectorA = [a[0] - b[0], a[1] - b[1]];
  const vectorC = [c[0] - b[0], c[1] - b[1]];
  const dot = vectorA[0] * vectorC[0] + vectorA[1] * vectorC[1];
  const lengthA = Math.hypot(vectorA[0], vectorA[1]);
  const lengthC = Math.hypot(vectorC[0], vectorC[1]);

  if (!lengthA || !lengthC) return null;

  const cosine = Math.max(-1, Math.min(1, dot / (lengthA * lengthC)));
  return (Math.acos(cosine) * 180) / Math.PI;
};

const createControlButton = (
  icon: ControlIconName,
  label: string,
  onClick: () => void,
) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "map-general-control-button";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.dataset.tooltip = label;
  button.appendChild(createLucideSvg(icon));

  const tooltip = document.createElement("span");
  tooltip.className = "map-control-tooltip";
  tooltip.textContent = label;
  button.appendChild(tooltip);

  button.addEventListener("click", onClick);
  return button;
};

class GeneralMapControls implements maplibregl.IControl {
  private map?: maplibregl.Map;
  private container?: HTMLDivElement;
  private zoomLabel?: HTMLSpanElement;
  private compassIcon?: HTMLSpanElement;
  private scaleDisplay?: HTMLDivElement;
  private geolocateButton?: HTMLButtonElement;
  private userMarker?: maplibregl.Marker;
  private watchPositionId?: number;
  private isTrackingLocation = false;
  private ruler?: InstanceType<typeof RulerControl>;
  private angleButton?: HTMLButtonElement;
  private anglePopup?: maplibregl.Popup;
  private anglePoints: AnglePoint[] = [];
  private angleDisplayPoints: AnglePoint[] = [];
  private angleOverlay?: HTMLDivElement;
  private angleSvg?: SVGSVGElement;
  private isMeasuringAngle = false;

  private updateZoom = () => {
    if (!this.map || !this.zoomLabel) return;
    this.zoomLabel.textContent = this.map.getZoom().toFixed(2);
    this.updateScale();
  };

  private updateScale = () => {
    if (!this.map || !this.scaleDisplay) return;

    const container = this.map.getContainer();
    const y = container.clientHeight / 2;
    const referencePixels = 100;
    const left = this.map.unproject([0, y]);
    const right = this.map.unproject([referencePixels, y]);
    const metersForReference = left.distanceTo(right);

    if (!Number.isFinite(metersForReference) || metersForReference <= 0) {
      this.scaleDisplay.textContent = "Escala";
      this.scaleDisplay.style.width = "";
      this.scaleDisplay.style.minWidth = "";
      return;
    }

    const metersPerPixel = metersForReference / referencePixels;
    const maxScalePixels = Math.min(
      112,
      Math.max(64, container.clientWidth * 0.18),
    );
    const maxMeters = metersPerPixel * maxScalePixels;
    const displayInKm = maxMeters >= 1000;
    const target = displayInKm ? maxMeters / 1000 : maxMeters;
    const unit = displayInKm ? "km" : "m";
    const magnitude = Math.pow(10, Math.floor(Math.log10(target)));
    const normalized = target / magnitude;
    const nice =
      normalized >= 5 ? 5 : normalized >= 2 ? 2 : normalized >= 1 ? 1 : 0.5;
    const value = nice * magnitude;
    const representedMeters = displayInKm ? value * 1000 : value;
    const width = representedMeters / metersPerPixel;
    const visualWidth = Math.max(1, width);
    const label = `${
      value >= 10 ? Math.round(value) : Number(value.toFixed(1))
    } ${unit}`;

    this.scaleDisplay.style.width = `${visualWidth}px`;
    this.scaleDisplay.style.minWidth = `${visualWidth}px`;
    this.scaleDisplay.style.setProperty(
      "--map-scale-label-size",
      visualWidth < 28
        ? "0px"
        : visualWidth < 44
          ? "9px"
          : visualWidth < 58
            ? "10px"
            : "11px",
    );
    this.scaleDisplay.textContent = label;
    this.scaleDisplay.title = `Escala: ${label}`;
    this.scaleDisplay.dataset.tooltip = `Escala: ${label}`;
  };

  private updateCompass = () => {
    if (!this.map || !this.compassIcon) return;
    this.compassIcon.style.rotate = `${this.map.getBearing() * -1 + COMPASS_ICON_NORTH_OFFSET_DEGREES}deg`;
  };

  private toggleGeolocate = () => {
    if (!this.map) return;

    if (!("geolocation" in navigator)) {
      alert("A geolocalização não é suportada por este navegador.");
      return;
    }

    if (this.isTrackingLocation) {
      this.stopGeolocate();
      return;
    }

    this.startGeolocate();
  };

  private startGeolocate = () => {
    if (!this.map || !this.geolocateButton) return;

    this.geolocateButton.classList.add("is-loading");
    this.geolocateButton.title = "Obtendo localização...";

    const onSuccess = (position: GeolocationPosition) => {
      if (!this.map || !this.geolocateButton) return;

      const { latitude, longitude, accuracy } = position.coords;
      const lngLat: [number, number] = [longitude, latitude];

      this.geolocateButton.classList.remove("is-loading");
      this.geolocateButton.classList.add("is-active");
      this.isTrackingLocation = true;
      this.geolocateButton.title =
        "Minha localização (Ativa - clique para desativar)";

      this.map.flyTo({
        center: lngLat,
        zoom: Math.max(this.map.getZoom(), 16),
        essential: true,
      });

      this.updateUserMarker(lngLat, accuracy);
    };

    const onError = (error: GeolocationPositionError) => {
      if (!this.geolocateButton) return;

      this.geolocateButton.classList.remove("is-loading");
      this.stopGeolocate();

      let message = "Não foi possível obter sua localização.";
      if (error.code === error.PERMISSION_DENIED) {
        message =
          "Permissão de localização negada pelo navegador. Habilite a localização nas configurações do navegador.";
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        message = "Sinal de localização (GPS/Rede) indisponível.";
      } else if (error.code === error.TIMEOUT) {
        message = "Tempo limite excedido ao obter sua localização.";
      }

      alert(message);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });

    this.watchPositionId = navigator.geolocation.watchPosition(
      (pos) => {
        if (this.isTrackingLocation) {
          const { latitude, longitude, accuracy } = pos.coords;
          this.updateUserMarker([longitude, latitude], accuracy);
        }
      },
      (err) => console.warn("Erro ao atualizar geolocalização:", err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    );
  };

  private updateUserMarker = (lngLat: [number, number], accuracy?: number) => {
    if (!this.map) return;

    let digitalAddress = "";
    try {
      digitalAddress = encode(lngLat[1], lngLat[0]);
    } catch (e) {
      console.warn("Não foi possível gerar Endereço Digital:", e);
    }

    const popupHTML = `
      <div class="map-user-location-popup p-2 text-xs max-w-xs space-y-1.5 select-none">
        <div class="flex items-center justify-between gap-2 border-b border-border/40 pb-1">
          <strong class="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-primary inline-block"></span>
            Sua Localização
          </strong>
        </div>

        ${
          digitalAddress
            ? `
          <div class="rounded-md bg-muted/60 p-1.5 border border-border/50">
            <div class="flex items-center justify-between gap-1 mb-0.5">
              <span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Endereço Digital</span>
              <button
                type="button"
                class="copy-digital-addr-btn p-0.5 hover:bg-background rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Copiar Endereço Digital"
                data-address="${digitalAddress}"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
            </div>
            <div class="font-mono text-xs font-semibold text-primary select-all leading-tight">${digitalAddress}</div>
            <button
              type="button"
              class="open-digital-addr-btn mt-1.5 w-full flex items-center justify-center gap-1.5 py-1 px-2 text-[11px] font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors cursor-pointer"
              data-lat="${lngLat[1]}"
              data-lng="${lngLat[0]}"
            >
              <span>Ver detalhes do Endereço</span>
            </button>
          </div>
        `
            : ""
        }

        <div class="text-[10px] text-muted-foreground space-y-0.5 pt-0.5 border-t border-border/30">
          <div class="flex justify-between gap-3">
            <span>Coordenadas:</span>
            <code class="font-mono text-foreground">${lngLat[1].toFixed(5)}, ${lngLat[0].toFixed(5)}</code>
          </div>
          ${
            accuracy
              ? `
            <div class="flex justify-between gap-3">
              <span>Precisão:</span>
              <span class="text-foreground">~${Math.round(accuracy)}m</span>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;

    const attachPopupEvents = (popup: maplibregl.Popup) => {
      const el = popup.getElement();
      if (!el) return;

      const copyBtn = el.querySelector(".copy-digital-addr-btn");
      if (copyBtn) {
        copyBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const addr = (copyBtn as HTMLElement).dataset.address;
          if (addr) {
            void navigator.clipboard.writeText(addr);
            copyBtn.setAttribute("title", "Copiado!");
            setTimeout(() => {
              copyBtn.setAttribute("title", "Copiar Endereço Digital");
            }, 1500);
          }
        });
      }

      const openBtn = el.querySelector(".open-digital-addr-btn");
      if (openBtn) {
        openBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const latStr = (openBtn as HTMLElement).dataset.lat;
          const lngStr = (openBtn as HTMLElement).dataset.lng;
          if (latStr && lngStr) {
            window.dispatchEvent(
              new CustomEvent("open-digital-address", {
                detail: {
                  latitude: parseFloat(latStr),
                  longitude: parseFloat(lngStr),
                },
              }),
            );
          }
        });
      }
    };

    if (!this.userMarker) {
      const el = document.createElement("div");
      el.className = "map-user-location-marker";
      el.innerHTML = `
        <div class="map-user-location-pulse"></div>
        <div class="map-user-location-dot"></div>
      `;

      const popup = new maplibregl.Popup({
        offset: 12,
        closeButton: false,
      }).setHTML(popupHTML);

      popup.on("open", () => attachPopupEvents(popup));

      this.userMarker = new maplibregl.Marker({ element: el })
        .setLngLat(lngLat)
        .setPopup(popup)
        .addTo(this.map);

      this.userMarker.togglePopup();
    } else {
      this.userMarker.setLngLat(lngLat);
      const popup = this.userMarker.getPopup();
      if (popup) {
        popup.setHTML(popupHTML);
        if (popup.isOpen()) {
          attachPopupEvents(popup);
        }
      }
    }
  };

  private stopGeolocate = () => {
    this.isTrackingLocation = false;

    if (this.watchPositionId !== undefined) {
      navigator.geolocation.clearWatch(this.watchPositionId);
      this.watchPositionId = undefined;
    }

    if (this.geolocateButton) {
      this.geolocateButton.classList.remove("is-active", "is-loading");
      this.geolocateButton.title = "Minha localização";
    }

    if (this.userMarker) {
      this.userMarker.remove();
      this.userMarker = undefined;
    }
  };

  private ensureAngleOverlay = () => {
    if (!this.map || this.angleOverlay) return;

    this.angleOverlay = document.createElement("div");
    this.angleOverlay.className = "map-angle-overlay";
    this.angleSvg = createSvgElement("svg");
    this.angleSvg.setAttribute("aria-hidden", "true");
    this.angleOverlay.appendChild(this.angleSvg);
    document.body.appendChild(this.angleOverlay);
  };

  private updateAngleLine = () => {
    if (!this.map || !this.angleSvg || !this.angleOverlay) return;

    const container = this.map.getContainer();
    const rect = container.getBoundingClientRect();
    this.angleOverlay.style.left = `${rect.left}px`;
    this.angleOverlay.style.top = `${rect.top}px`;
    this.angleOverlay.style.width = `${rect.width}px`;
    this.angleOverlay.style.height = `${rect.height}px`;
    this.angleSvg.setAttribute("width", `${rect.width}`);
    this.angleSvg.setAttribute("height", `${rect.height}`);
    this.angleSvg.replaceChildren();

    const projectedPoints = this.angleDisplayPoints
      .map((point) => this.map?.project(point))
      .filter((point): point is maplibregl.Point => Boolean(point));

    if (projectedPoints.length >= 2) {
      const points = projectedPoints
        .map((projectedPoint) => `${projectedPoint.x},${projectedPoint.y}`)
        .join(" ");

      const polyline = createSvgElement("polyline");
      polyline.setAttribute("points", points);
      polyline.setAttribute("class", "map-angle-line");
      this.angleSvg.appendChild(polyline);
    }

    projectedPoints.forEach((projectedPoint, index) => {
      const group = createSvgElement("g");
      group.setAttribute("class", "map-angle-point-group");
      group.setAttribute(
        "transform",
        `translate(${projectedPoint.x} ${projectedPoint.y})`,
      );

      const outerCircle = createSvgElement("circle");
      outerCircle.setAttribute("class", "map-angle-point-outer");
      outerCircle.setAttribute("r", "13");

      const innerCircle = createSvgElement("circle");
      innerCircle.setAttribute("class", "map-angle-point-inner");
      innerCircle.setAttribute("r", "10");

      const label = createSvgElement("text");
      label.setAttribute("class", "map-angle-point-label");
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dominant-baseline", "central");
      label.textContent = String(index + 1);

      group.append(outerCircle, innerCircle, label);
      this.angleSvg?.appendChild(group);
    });
  };

  private renderAngleGraphics = () => {
    if (!this.map) return;

    this.ensureAngleOverlay();
    this.updateAngleLine();
  };

  private clearAngleGraphics = () => {
    this.angleDisplayPoints = [];
    this.angleSvg?.replaceChildren();
    this.angleOverlay?.remove();
    this.angleOverlay = undefined;
    this.angleSvg = undefined;
  };

  private clearAngleMeasure = () => {
    this.anglePoints = [];
    this.clearAngleGraphics();
    this.anglePopup?.remove();
    this.anglePopup = undefined;
    if (this.map) this.map.getCanvas().style.cursor = "";
  };

  private setAngleMeasureActive = (active: boolean) => {
    if (!this.map || !this.angleButton) return;

    this.isMeasuringAngle = active;
    this.angleButton.classList.toggle("is-active", active);
    this.angleButton.title = active
      ? "Clique em três pontos para medir o ângulo"
      : "Medir ângulos";

    if (active) {
      this.clearAngleMeasure();
      this.map.getCanvas().style.cursor = "crosshair";
      this.ensureAngleOverlay();
      this.anglePopup = new maplibregl.Popup({
        closeButton: false,
        className: "map-angle-popup-shell",
      })
        .setLngLat(this.map.getCenter())
        .setHTML('<div class="map-angle-popup">Clique em 3 pontos</div>')
        .addTo(this.map);
      return;
    }

    this.clearAngleMeasure();
  };

  private registerAnglePoint = (lngLat: maplibregl.LngLatLike) => {
    if (!this.map || !this.isMeasuringAngle) return false;

    const point = maplibregl.LngLat.convert(lngLat);

    if (this.anglePoints.length === 0 && this.angleDisplayPoints.length >= 3) {
      this.clearAngleGraphics();
    }

    this.anglePoints.push([point.lng, point.lat]);
    this.angleDisplayPoints = [...this.anglePoints];
    this.renderAngleGraphics();

    if (this.anglePoints.length < 3) {
      this.anglePopup
        ?.setLngLat(point)
        .setHTML(
          `<div class="map-angle-popup">Ponto ${this.anglePoints.length}/3 selecionado</div>`,
        );
      return true;
    }

    const angle = calculateAngle(
      this.anglePoints as [AnglePoint, AnglePoint, AnglePoint],
    );
    const vertex = this.anglePoints[1];
    this.angleDisplayPoints = [...this.anglePoints];
    this.renderAngleGraphics();
    this.anglePopup
      ?.setLngLat(vertex)
      .setHTML(
        `<div class="map-angle-popup"><strong>${angle?.toFixed(1) ?? "-"}°</strong><span>Ângulo medido</span></div>`,
      );
    this.anglePoints = [];
    return true;
  };

  private handleAngleContainerClick = (event: MouseEvent) => {
    if (!this.map || !this.isMeasuringAngle) return;

    const target = event.target as HTMLElement | null;
    if (
      target?.closest(
        ".map-general-controls,.mapboxgl-ctrl,.maplibregl-ctrl,.mapboxgl-ctrl-group,.maplibregl-ctrl-group",
      )
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const rect = this.map.getContainer().getBoundingClientRect();
    const lngLat = this.map.unproject([
      event.clientX - rect.left,
      event.clientY - rect.top,
    ]);
    this.registerAnglePoint(lngLat);
  };

  onAdd(map: maplibregl.Map) {
    this.map = map;
    this.ruler = new RulerControl({
      units: "kilometers",
      labelFormat: (n: number) => `${n.toFixed(2)} km`,
      invisible: true,
    });
    this.ruler.onAdd(map as unknown as Parameters<typeof this.ruler.onAdd>[0]);

    this.container = document.createElement("div");
    this.container.className =
      "map-general-controls mapboxgl-ctrl maplibregl-ctrl";

    const rulerButton = createControlButton("ruler", "Medir distâncias", () => {
      const ruler = this.ruler as InstanceType<typeof RulerControl> & {
        isActive?: boolean;
        activate?: () => void;
        deactivate?: () => void;
      };
      if (ruler.isActive) {
        ruler.deactivate?.();
        rulerButton.classList.remove("is-active");
      } else {
        ruler.activate?.();
        rulerButton.classList.add("is-active");
      }
    });

    const angleButton = createControlButton(
      "draftingCompass",
      "Medir ângulos",
      () => this.setAngleMeasureActive(!this.isMeasuringAngle),
    );
    this.angleButton = angleButton;

    const geolocateButton = createControlButton(
      "locate",
      "Minha localização",
      () => this.toggleGeolocate(),
    );
    this.geolocateButton = geolocateButton;

    const zoomOutButton = createControlButton("minus", "Afastar", () =>
      this.map?.zoomOut(),
    );
    const zoomInButton = createControlButton("plus", "Aproximar", () =>
      this.map?.zoomIn(),
    );
    const compassButton = createControlButton(
      "compass",
      "Orientar ao norte",
      () => this.map?.easeTo({ bearing: 0, pitch: 0 }),
    );
    this.compassIcon =
      compassButton.querySelector(".map-general-control-icon") ?? undefined;

    const zoomDisplay = document.createElement("div");
    zoomDisplay.className = "map-general-zoom-display";
    zoomDisplay.title = "Nível de zoom atual";
    zoomDisplay.dataset.tooltip = "Nível de zoom atual";
    zoomDisplay.setAttribute("aria-label", "Nível de zoom atual");
    zoomDisplay.textContent = "Zoom ";
    this.zoomLabel = document.createElement("span");
    zoomDisplay.appendChild(this.zoomLabel);

    this.scaleDisplay = document.createElement("div");
    this.scaleDisplay.className = "map-general-scale-display";
    this.scaleDisplay.title = "Escala aproximada";
    this.scaleDisplay.dataset.tooltip = "Escala aproximada";
    this.scaleDisplay.setAttribute("aria-label", "Escala aproximada");

    this.container.append(
      zoomInButton,
      zoomOutButton,
      geolocateButton,
      rulerButton,
      angleButton,
      compassButton,
      zoomDisplay,
      this.scaleDisplay,
    );

    this.updateZoom();
    this.updateCompass();
    this.updateScale();
    map.on("zoom", this.updateZoom);
    map.on("move", this.updateScale);
    map.on("resize", this.updateScale);
    map.on("resize", this.updateAngleLine);
    map.on("move", this.updateAngleLine);
    map.on("moveend", this.updateAngleLine);
    map.on("rotate", this.updateCompass);
    map
      .getContainer()
      .addEventListener("click", this.handleAngleContainerClick, true);
    return this.container;
  }

  onRemove() {
    this.map?.off("zoom", this.updateZoom);
    this.map?.off("move", this.updateScale);
    this.map?.off("resize", this.updateScale);
    this.map?.off("resize", this.updateAngleLine);
    this.map?.off("move", this.updateAngleLine);
    this.map?.off("moveend", this.updateAngleLine);
    this.map?.off("rotate", this.updateCompass);
    this.map
      ?.getContainer()
      .removeEventListener("click", this.handleAngleContainerClick, true);
    this.clearAngleMeasure();
    this.stopGeolocate();
    this.ruler?.onRemove?.();
    this.container?.remove();
    this.map = undefined;
    this.container = undefined;
    this.zoomLabel = undefined;
    this.compassIcon = undefined;
    this.scaleDisplay = undefined;
    this.ruler = undefined;
    this.angleButton = undefined;
    this.isMeasuringAngle = false;
  }
}

const MAPLIBRE_DRAW_STYLES = [
  {
    id: "gl-draw-polygon-fill",
    type: "fill",
    filter: ["all", ["==", "$type", "Polygon"]],
    paint: {
      "fill-color": [
        "case",
        ["==", ["get", "active"], "true"],
        "#fbb03b",
        "#3bb2d0",
      ],
      "fill-opacity": 0.1,
    },
  },
  {
    id: "gl-draw-lines",
    type: "line",
    filter: ["any", ["==", "$type", "LineString"], ["==", "$type", "Polygon"]],
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": [
        "case",
        ["==", ["get", "active"], "true"],
        "#fbb03b",
        "#3bb2d0",
      ],
      "line-dasharray": [
        "case",
        ["==", ["get", "active"], "true"],
        ["literal", [0.2, 2]],
        ["literal", [2, 0]],
      ],
      "line-width": 2,
    },
  },
  {
    id: "gl-draw-point-outer",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "feature"]],
    paint: {
      "circle-radius": ["case", ["==", ["get", "active"], "true"], 7, 5],
      "circle-color": "#fff",
    },
  },
  {
    id: "gl-draw-point-inner",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "feature"]],
    paint: {
      "circle-radius": ["case", ["==", ["get", "active"], "true"], 5, 3],
      "circle-color": [
        "case",
        ["==", ["get", "active"], "true"],
        "#fbb03b",
        "#3bb2d0",
      ],
    },
  },
  {
    id: "gl-draw-vertex-outer",
    type: "circle",
    filter: [
      "all",
      ["==", "$type", "Point"],
      ["==", "meta", "vertex"],
      ["!=", "mode", "simple_select"],
    ],
    paint: {
      "circle-radius": ["case", ["==", ["get", "active"], "true"], 7, 5],
      "circle-color": "#fff",
    },
  },
  {
    id: "gl-draw-vertex-inner",
    type: "circle",
    filter: [
      "all",
      ["==", "$type", "Point"],
      ["==", "meta", "vertex"],
      ["!=", "mode", "simple_select"],
    ],
    paint: {
      "circle-radius": ["case", ["==", ["get", "active"], "true"], 5, 3],
      "circle-color": "#fbb03b",
    },
  },
  {
    id: "gl-draw-midpoint",
    type: "circle",
    filter: ["all", ["==", "meta", "midpoint"]],
    paint: {
      "circle-radius": 3,
      "circle-color": "#fbb03b",
    },
  },
] as const;

const EnhancedSimpleSelect = {
  ...MapboxDraw.modes.simple_select,
  onTrash: function (_state: any) {
    const ctx = this as any;
    const selectedIds = ctx.getSelectedIds?.() ?? [];
    if (selectedIds.length > 0) {
      ctx.deleteFeature?.(selectedIds);
      ctx.fireActionable?.();
      ctx.changeMode?.((MapboxDraw as any).constants?.modes?.DRAW_POLYGON ?? "draw_polygon");
    }
  },
  onKeyDown: function (state: any, e: any) {
    const selectors = (MapboxDraw as any).lib?.CommonSelectors;
    const isBackspace = selectors?.isBackspaceKey?.(e) ?? (e?.key === "Backspace" || e?.keyCode === 8);
    const isDelete = selectors?.isDeleteKey?.(e) ?? (e?.key === "Delete" || e?.keyCode === 46);
    if (isBackspace || isDelete) {
      e?.preventDefault?.();
      (this as any).onTrash?.(state);
    }
  },
};

const EnhancedDrawPolygon = {
  ...MapboxDraw.modes.draw_polygon,
  onTrash: function (state: any) {
    if (!state?.polygon) return;
    const ctx = this as any;
    if (state.currentVertexPosition > 1) {
      state.polygon.removeCoordinate(`0.${state.currentVertexPosition - 1}`);
      state.currentVertexPosition--;
      ctx.updateUIClasses?.({ mouse: (MapboxDraw as any).constants?.cursors?.ADD ?? "add" });
      ctx.doRender?.(state.polygon.id);
    } else if (state.currentVertexPosition === 1) {
      state.polygon.removeCoordinate("0.0");
      state.currentVertexPosition = 0;
      ctx.updateUIClasses?.({ mouse: (MapboxDraw as any).constants?.cursors?.ADD ?? "add" });
      ctx.doRender?.(state.polygon.id);
    } else {
      ctx.deleteFeature?.([state.polygon.id], { silent: true });
      ctx.changeMode?.((MapboxDraw as any).constants?.modes?.DRAW_POLYGON ?? "draw_polygon");
    }
  },
  onKeyDown: function (state: any, e: any) {
    const selectors = (MapboxDraw as any).lib?.CommonSelectors;
    const isBackspace = selectors?.isBackspaceKey?.(e) ?? (e?.key === "Backspace" || e?.keyCode === 8);
    const isDelete = selectors?.isDeleteKey?.(e) ?? (e?.key === "Delete" || e?.keyCode === 46);
    if (isBackspace || isDelete) {
      e?.preventDefault?.();
      (this as any).onTrash?.(state);
    }
  },
};

const EnhancedDirectSelect = {
  ...MapboxDraw.modes.direct_select,
  onTrash: function (state: any) {
    if (!state?.feature) return;
    const ctx = this as any;
    if (state.selectedCoordPaths && state.selectedCoordPaths.length > 0) {
      state.selectedCoordPaths
        .sort((a: string, b: string) => b.localeCompare(a, "en", { numeric: true }))
        .forEach((id: string) => state.feature.removeCoordinate(id));
      ctx.fireUpdate?.();
      state.selectedCoordPaths = [];
      ctx.clearSelectedCoordinates?.();
      ctx.fireActionable?.(state);
      if (!state.feature.isValid()) {
        ctx.deleteFeature?.([state.featureId]);
        ctx.changeMode?.((MapboxDraw as any).constants?.modes?.DRAW_POLYGON ?? "draw_polygon");
      }
    } else {
      const coords = state.feature.coordinates?.[0];
      if (coords && coords.length > 3) {
        state.feature.removeCoordinate(`0.${coords.length - 1}`);
        ctx.fireUpdate?.();
        ctx.doRender?.(state.featureId);
      } else {
        ctx.deleteFeature?.([state.featureId]);
        ctx.changeMode?.((MapboxDraw as any).constants?.modes?.DRAW_POLYGON ?? "draw_polygon");
      }
    }
  },
  onKeyDown: function (state: any, e: any) {
    const selectors = (MapboxDraw as any).lib?.CommonSelectors;
    const isBackspace = selectors?.isBackspaceKey?.(e) ?? (e?.key === "Backspace" || e?.keyCode === 8);
    const isDelete = selectors?.isDeleteKey?.(e) ?? (e?.key === "Delete" || e?.keyCode === 46);
    if (isBackspace || isDelete) {
      e?.preventDefault?.();
      (this as any).onTrash?.(state);
    }
  },
};

const EnhancedDrawLineString = {
  ...MapboxDraw.modes.draw_line_string,
  onTrash: function (state: any) {
    if (!state?.line) return;
    const ctx = this as any;
    if (state.currentVertexPosition > 1) {
      state.line.removeCoordinate(`${state.currentVertexPosition - 1}`);
      state.currentVertexPosition--;
      ctx.updateUIClasses?.({ mouse: (MapboxDraw as any).constants?.cursors?.ADD ?? "add" });
      ctx.doRender?.(state.line.id);
    } else if (state.currentVertexPosition === 1) {
      state.line.removeCoordinate("0");
      state.currentVertexPosition = 0;
      ctx.updateUIClasses?.({ mouse: (MapboxDraw as any).constants?.cursors?.ADD ?? "add" });
      ctx.doRender?.(state.line.id);
    } else {
      ctx.deleteFeature?.([state.line.id], { silent: true });
      ctx.changeMode?.((MapboxDraw as any).constants?.modes?.DRAW_LINE_STRING ?? "draw_line_string");
    }
  },
  onKeyDown: function (state: any, e: any) {
    const selectors = (MapboxDraw as any).lib?.CommonSelectors;
    const isBackspace = selectors?.isBackspaceKey?.(e) ?? (e?.key === "Backspace" || e?.keyCode === 8);
    const isDelete = selectors?.isDeleteKey?.(e) ?? (e?.key === "Delete" || e?.keyCode === 46);
    if (isBackspace || isDelete) {
      e?.preventDefault?.();
      (this as any).onTrash?.(state);
    }
  },
};

const addDrawControls = (
  map: maplibregl.Map,
  polygonEdit: IPolygonEditContextActions,
) => {
  const { setDrawRef, setFeature } = polygonEdit;

  // Garante que o canvas do MapLibre tenha as classes esperadas pelo MapboxDraw
  const canvas = map.getCanvas();
  if (canvas && !canvas.classList.contains("mapboxgl-canvas")) {
    canvas.classList.add("mapboxgl-canvas");
  }
  const canvasContainer = map.getCanvasContainer();
  if (
    canvasContainer &&
    !canvasContainer.classList.contains("mapboxgl-canvas-container")
  ) {
    canvasContainer.classList.add("mapboxgl-canvas-container");
  }

  const draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
      trash: true,
    },
    defaultMode: "simple_select",
    modes: {
      ...MapboxDraw.modes,
      simple_select: EnhancedSimpleSelect,
      draw_polygon: EnhancedDrawPolygon,
      direct_select: EnhancedDirectSelect,
      draw_line_string: EnhancedDrawLineString,
    },
    styles:
      MAPLIBRE_DRAW_STYLES as unknown as NonNullable<MapboxDrawConfig>["styles"],
  });

  const updateDrawnFeatures = () => {
    const all = draw.getAll().features;
    if (all.length > 0) {
      setFeature(all[0]);
    } else {
      setFeature(null);
    }
  };

  map.on("draw.create", updateDrawnFeatures);
  map.on("draw.update", updateDrawnFeatures);
  map.on("draw.delete", updateDrawnFeatures);
  map.on("draw.selectionchange", updateDrawnFeatures);
  map.on("draw.modechange", updateDrawnFeatures);
  map.addControl(draw as unknown as maplibregl.IControl);

  setDrawRef(draw);
  return draw;
};

export const addMapControls = (
  map: maplibregl.Map,
  polygonEdit: IPolygonEditContextActions,
  _?: () => void,
  hideControls?: boolean,
  _isDrawerOpen?: boolean,
) => {
  const draw = addDrawControls(map, polygonEdit);

  if (hideControls) {
    return { draw };
  }

  map.addControl(new GeneralMapControls(), "bottom-left");

  const imageControl = new ImageControl({ removeButton: true });
  const imageContainer = imageControl.onAdd(
    map as unknown as Parameters<typeof imageControl.onAdd>[0],
  );
  imageContainer.style.display = "none";
  map.getContainer().appendChild(imageContainer);
  mapImageControl.current = imageControl;

  // Tooltip Control
  map.addControl(
    new TooltipControl({
      layer: "polygon-fill",
      getContent: getTooltipContent,
    }) as unknown as maplibregl.IControl,
  );

  return { draw };
};
