import { computed } from "@preact/signals";
import proj4 from "proj4";
import { useMapContext } from "../../hooks/useMapContext";

// Define SIRGAS 2000 (Geographic)
// EPSG:4674: SIRGAS 2000 - Geodetic coordinate system
proj4.defs("EPSG:4674", "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs");

export const MapCoordinates = () => {
  const { zoom, cursorPosition } = useMapContext();

  const coordinates = computed(() => {
    if (!cursorPosition.value) return null;
    const { latitude, longitude } = cursorPosition.value;
    
    // Convert WGS84 (EPSG:4326) to SIRGAS 2000 (EPSG:4674)
    try {
        const [lon, lat] = proj4("EPSG:4326", "EPSG:4674", [longitude, latitude]);
        return { latitude: lat, longitude: lon };
    } catch (e) {
        console.error("Projection error", e);
        return { latitude, longitude };
    }
  });

  const zoomLevel = computed(() => zoom.value.toFixed(2));

  const toDMS = (value: number, isLat: boolean) => {
    const abs = Math.abs(value);
    const degrees = Math.floor(abs);
    const minutes = Math.floor((abs - degrees) * 60);
    const seconds = ((abs - degrees) * 60 - minutes) * 60;
    
    const direction = isLat 
      ? (value >= 0 ? "N" : "S")
      : (value >= 0 ? "E" : "W");

    // Format seconds with 2 decimal places using comma (pt-BR style)
    const formattedSeconds = seconds.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return `${degrees}° ${minutes}' ${formattedSeconds}" ${direction}`;
  };

  return (
    <div className="absolute bottom-1 left-[100px] z-10 flex gap-4 bg-background/80 px-2 py-1 text-xs text-foreground rounded border shadow-sm backdrop-blur-sm pointer-events-none select-none">
      <span>Zoom: {zoomLevel}</span>
      {coordinates.value && (
        <span>
          {toDMS(coordinates.value.latitude, true)} {toDMS(coordinates.value.longitude, false)} (SIRGAS 2000)
        </span>
      )}
    </div>
  );
};
