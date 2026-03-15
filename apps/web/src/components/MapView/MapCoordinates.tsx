import { computed } from "@preact/signals";
import proj4 from "proj4";
import { useMapContext } from "../../hooks/useMapContext";

// Define SIRGAS 2000 UTM Zone 23S
proj4.defs(
  "EPSG:31983",
  "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
);

export const MapCoordinates = () => {
  const { zoom, cursorPosition } = useMapContext();

  const coordinates = computed(() => {
    if (!cursorPosition.value) return null;
    const { latitude, longitude } = cursorPosition.value;

    // Convert WGS84 (EPSG:4326) to SIRGAS 2000 UTM 23S (EPSG:31983)
    try {
      const [easting, northing] = proj4("EPSG:4326", "EPSG:31983", [
        longitude,
        latitude,
      ]);
      return { easting, northing };
    } catch (e) {
      console.error("Projection error", e);
      return null;
    }
  });

  const zoomLevel = computed(() => zoom.value.toFixed(2));

  return (
    <div className="absolute bottom-1 left-[100px] z-10 flex gap-4 bg-background/80 px-2 py-1 text-xs text-foreground rounded border shadow-sm backdrop-blur-sm pointer-events-none select-none">
      <span>Zoom: {zoomLevel}</span>
      {coordinates.value && (
        <span>
          E: {coordinates.value.easting.toFixed(2)} N:{" "}
          {coordinates.value.northing.toFixed(2)} (SIRGAS 2000 / UTM 23S)
        </span>
      )}
    </div>
  );
};
