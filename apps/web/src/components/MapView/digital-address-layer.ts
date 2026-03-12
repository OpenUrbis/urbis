import { GeoJsonLayer } from "@deck.gl/layers";

// SVG Pin Icon (Material Design), White Fill, 24x24
// Base64 encoded to avoid URL encoding issues
const PIN_ICON_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+PHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN3ptMCA5LjVjLTEuMzggMC0yLjUtMS4xMi0yLjUtMi41czEuMTItMi41IDIuNS0yLjUgMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIvPjwvc3ZnPg==";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getDigitalAddressLayers = (digitalAddressFeature: any) => {
    if (!digitalAddressFeature) return [];
    
    return [
        new GeoJsonLayer({
            id: 'digital-address-layer',
            data: digitalAddressFeature,
            
            // Polygon styling
            filled: true,
            stroked: true,
            getFillColor: [60, 180, 240, 50],
            getLineColor: [60, 180, 240, 200],
            getLineWidth: 0.1,

            // Point styling (Icon)
            pointType: 'icon',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            getIcon: (_: any) => ({
                url: PIN_ICON_URL,
                width: 24,
                height: 24,
                anchorY: 24,
                mask: true
            }),
            getIconSize: 24,
            getIconColor: [234, 67, 53], // Red
            
            pickable: true,
            
            // Ensure points are rendered
            pointRadiusMinPixels: 2,
        })
    ];
};
