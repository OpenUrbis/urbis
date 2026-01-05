# Layer Configuration Documentation

This document describes the structure and possibilities for configuring map layers, search functionality, and map context in the application.

## Root Structure

The configuration is returned as a JSON object with two main keys: `searchContext` and `mapContext`.

### 1. Search Context (`searchContext`)

Configures the search bar functionality, including available search sources and history.

| Property | Type | Description |
| :--- | :--- | :--- |
| `currentTerm` | `string` | The currently typed search term. |
| `history` | `string[]` | Array of previous search terms. |
| `searchQuery` | `Object` | State of the current search query (data, loading, error). |
| `searchConfig` | `SearchConfig[]` | Configuration for available search sources. |

#### Search Configuration (`SearchConfig`)

Defines a searchable data source.

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier for the search config (e.g., `"lots"`). |
| `name` | `string` | Display name in the UI. |
| `origin` | `string` | Base URL for the WFS/WMS service (e.g., GeoServer URL). |
| `method` | `"GET" \| "POST"` | HTTP method to use for the request. |
| `index` | `number` | Order priority for search results. |
| `isActive` | `boolean` | Whether this search source is enabled. |
| `transformParams` | `string (Function)` | JS function string to transform the search term into request parameters (e.g., CQL filters). |
| `transformRequest` | `string (Function) \| null` | Optional function to transform the request before sending. |
| `transformResponse` | `string (Function)` | JS function string to transform the API response into a standardized search result format. |
| `clickAction` | `ClickAction \| null` | Action to perform when a result is clicked. |
| `layerSchemaId` | `string \| null` | ID of the `layerSchema` associated with this search result. |
| `layerSchema` | `LayerSchema \| null` | Embedded layer configuration if the result should add a layer to the map. |

---

### 2. Map Context (`mapContext`)

Configures the map state, layers, groups, and interaction templates.

| Property | Type | Description |
| :--- | :--- | :--- |
| `layerSchemas` | `LayerSchema[]` | List of all available map layers. |
| `layerGroups` | `LayerGroup[]` | Hierarchical grouping structure for layers. |
| `selectedFeatures` | `any[]` | Array of currently selected map features. |
| `boundingBox` | `[number, number, number, number]` | Current map view bounds [minLon, minLat, maxLon, maxLat]. |
| `viewport` | `Viewport` | Current map viewport state (lat, lon, zoom, bearing, pitch). |
| `zoom` | `number` | Current zoom level. |
| `is3DActive` | `boolean` | Whether 3D terrain/building mode is active. |
| `selectedBaseMap` | `string` | ID of the active basemap style (e.g., `"standard"`). |
| `editFeatureTemplate`| `Template[]` | Templates for the editing/selection interface. |
| `layerWithRootEditTemplate` | `string` | ID of the layer that provides the root template for editing. |

#### Layer Schema (`LayerSchema`)

Defines how a layer is fetched, rendered, and interacted with.

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier for the layer. |
| `name` | `string` | Display name in the layer controller. |
| `origin` | `string` | URL source for the layer data (WFS for GeoJSON, WMS for images). |
| `isActive` | `boolean` | Whether the layer is available/active in the system. |
| `type` | `LayerType` | Type of layer: `"GeoJsonLayer"`, `"Stream"` (tiled), or `"CustomWMSLayer"`. |
| `isVisible` | `boolean` | Whether the layer is currently visible on the map. |
| `minZoom` | `number \| null` | Minimum zoom level to render the layer. |
| `getTextColorPropName` | `string \| null` | Property key for text color logic. |
| `getFillColorPropName` | `string \| null` | Property key for fill color logic. |
| `getLineColorPropName` | `string \| null` | Property key for line color logic. |
| `groupId` | `string` | ID of the group this layer belongs to. |
| `colors` | `LayerColor[]` | Array of legend colors/styles associated with the layer. |
| `clickAction` | `ClickAction \| null` | Action to trigger when a feature in this layer is clicked. |
| `viewTemplate` | `Template[] \| null` | Array of templates to render in the sidebar when a feature is selected. |
| `properties` | `Object` | Additional DeckGL properties for rendering (fill, stroke, line width, etc.). |

**Layer Properties (`properties`)**
Configuration passed directly to DeckGL layers or custom logic.
- `filled`: `boolean` - Render fill for polygons.
- `stroked`: `boolean` - Render stroke for polygons.
- `getFillColor`: `Function string` or `Array` - Logic for fill color.
- `getLineColor`: `Function string` or `Array` - Logic for line color.
- `getLineWidth`: `number` or `Function` - Line width.
- `getText`: `Function string` - Logic to extract text labels.
- `autoHighlight`: `boolean` - Highlight on hover.
- `highlightColor`: `Array` - RGBA color for highlight.
- `layerActions`: `Array` - Custom actions (buttons) for the layer item in the list.

#### Layer Group (`LayerGroup`)

Defines the hierarchy in the Layer Controller.

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique group ID. |
| `name` | `string` | Display name. |
| `ownerGroup` | `string \| null` | ID of parent group (null for root groups). |
| `childGroups` | `LayerGroup[]` | Recursive array of subgroups. |

#### View Template (`Template`)

Defines the UI components rendered in the sidebar when a feature is selected.

| Property | Type | Description |
| :--- | :--- | :--- |
| `type` | `string` | Component type: `wrapper-card`, `label-value`, `wrapper-list-items`, `polygon-map`, `wrapper-request`, `button`, `edit-polygon`, etc. |
| `label` | `string` | Label or title for the component. |
| `templates` | `Template[]` | Nested templates (for wrappers). |
| `value` | `string` | Value to display (supports EJS-style `<%- %>` interpolation). |
| `properties` | `Object` | Component-specific properties (e.g., `helper`, `action`, `url`, `transformResponse`, `columnClass`). |

**Special Template Types:**
- `wrapper-request`: Makes an HTTP request to fetch additional data (e.g., intersections) and renders nested templates with the response.
- `polygon-map`: Renders a mini-map focusing on the selected feature.
- `edit-polygon`: Renders the geometry editing tools.
- `wrapper-list-items`: Renders a list of items (primary/secondary text) based on data.

---

### Example: Adding a WMS Layer via Configuration

To add a WMS layer, you would create a `LayerSchema` like this:

```json
{
  "id": "pracas_e_canteiros",
  "name": "Praças e Canteiros",
  "origin": "https://geoserver.slui.dev/geoserver/slui/wms?LAYERS=slui%3Apracas_e_canteiros&FORMAT=image%2Fjpeg&TRANSPARENT=true",
  "isActive": true,
  "type": "CustomWMSLayer",
  "isVisible": true,
  "minZoom": null,
  "getTextColorPropName": null,
  "getFillColorPropName": null,
  "getLineColorPropName": null,
  "clickAction": null,
  "viewTemplate": null,
  "properties": {},
  "groupId": "areas_publicas",
  "colors": [
    {
      "id": 307,
      "color": [147, 196, 125, 240],
      "type": "fill",
      "pattern": "full",
      "label": "default",
      "value": null,
      "layerSchemaId": "pracas_e_canteiros"
    }
  ]
}
```

### Example: Adding a GeoJSON Layer with Click Action

```json
{
  "id": "distrito_municipal",
  "name": "Distritos",
  "origin": "https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:distrito_municipal&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326",
  "isActive": true,
  "type": "GeoJsonLayer",
  "isVisible": true,
  "minZoom": null,
  "getTextColorPropName": null,
  "getFillColorPropName": null,
  "getLineColorPropName": null,
  "clickAction": {
    "action": "setZoom",
    "params": {
      "zoom": 17.1
    }
  },
  "viewTemplate": null,
  "properties": {
    "filled": true,
    "getText": "(d) => d?.properties?.nm_distrito_municipal",
    "maxZoom": 17,
    "stroked": true,
    "pickable": true,
    "pointType": "circle+text",
    "wireframe": true,
    "getTextSize": 12,
    "minZoomText": 10,
    "getElevation": -10,
    "getLineWidth": 12,
    "autoHighlight": true,
    "getTextAnchor": "middle",
    "getPointRadius": 12,
    "highlightColor": [153, 203, 255, 140]
  },
  "groupId": "geral",
  "colors": [
    {
      "id": 305,
      "color": [0, 0, 0, 120],
      "type": "line",
      "pattern": "full",
      "label": "default",
      "value": null,
      "layerSchemaId": "distrito_municipal"
    },
    {
      "id": 303,
      "color": [153, 203, 255, 120],
      "type": "fill",
      "pattern": "full",
      "label": "default",
      "value": null,
      "layerSchemaId": "distrito_municipal"
    },
    {
      "id": 304,
      "color": [65, 92, 119, 255],
      "type": "text",
      "pattern": "full",
      "label": "default",
      "value": null,
      "layerSchemaId": "distrito_municipal"
    }
  ]
}
```
