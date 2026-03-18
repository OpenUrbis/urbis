import { computed } from "@preact/signals";
import proj4 from "proj4";
import {
  cn,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@open-urbis/map-ui";
import { Copy } from "lucide-react";
import { useMapContext } from "../../hooks/useMapContext";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";

// Define SIRGAS 2000 UTM Zone 23S
proj4.defs(
  "EPSG:31983",
  "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
);

export const MapCoordinates = () => {
  const { zoom, cursorPosition } = useMapContext();
  const { drawerOpen } = useNavigationContext();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const sidebarOpen = isDesktop && drawerOpen.value;

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div
      className={cn(
        "absolute bottom-1 left-[100px] z-30 flex items-center gap-2 bg-background/80 px-2 py-1 text-xs text-foreground rounded border shadow-sm backdrop-blur-sm select-none",
        sidebarOpen && "left-[524px]"
      )}
    >
      <span className="font-mono">Zoom: {zoomLevel.value}</span>
      {cursorPosition.value && (
        <>
          <div className="h-3 w-px bg-border mx-1" />
          <span className="font-mono">
            Lat: {cursorPosition.value.latitude.toFixed(5)} Lon:{" "}
            {cursorPosition.value.longitude.toFixed(5)}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
                <Copy className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() =>
                  copyToClipboard(
                    `${cursorPosition.value!.latitude}, ${
                      cursorPosition.value!.longitude
                    }`
                  )
                }
              >
                Copiar EPSG:4326 (Lat, Lon)
              </DropdownMenuItem>
              {coordinates.value && (
                <DropdownMenuItem
                  onClick={() =>
                    copyToClipboard(
                      `${coordinates.value!.easting.toFixed(2)}, ${coordinates.value!.northing.toFixed(
                        2
                      )}`
                    )
                  }
                >
                  Copiar EPSG:31983 (E, N)
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
};
