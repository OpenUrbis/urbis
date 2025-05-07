# Map Layers Documentation

## Table of Contents

- [Structure of Layers on the Screen](#structure-of-layers-on-the-screen)
- [Polygon Details Visualization](#polygon-details-visualization)
- [Actions on Polygon Click](#actions-on-polygon-click)
- [Color Configurations](#color-configurations)
- [Layer Object Parameters](#layer-object-parameters)
- [Example Layer Configurations](#example-layer-configurations)

This document outlines the structure and functionality of the map layers system in the layout construction engine. Map layers are organized to display geospatial data, support user interactions, and provide customizable visualizations.

## Structure of Layers on the Screen

The map interface organizes layers into **groups**, which contain **individual layers** and a **legend** displaying associated colors. Each group serves as a container for related layers, allowing users to toggle visibility or interact with specific datasets. Layers within a group can be independently configured for visibility, zoom levels, and styling.

- **Groups**: Logical collections of layers, e.g., "Public Areas" or "Macrozoning."
- **Layers**: Individual geospatial datasets, such as "Running or Dormant Waters" or "Lots."
- **Legend**: Displays color mappings for layers, reflecting either static or dynamic property-based colors.

## Polygon Details Visualization

The system allows displaying details of one or more selected polygons on the map when needed. To enable this functionality, the layer must be configured with the `SelectFeature` click action, without requiring additional parameters in `clickAction`:

```json
{
  clickAction: {
    action: "SelectFeature"
  }
}
```

This configuration indicates that the layer is selectable, enabling the system to process the selection and display detailed polygon information as defined in the `viewTemplate`. For more details on click actions, see the [Actions on Polygon Click](#actions-on-polygon-click) section. The rendering mechanism for this information is detailed in the [viewTemplate Documentation](./view-template.md).

## Actions on Polygon Click

The click action on a polygon is configurable via the `clickAction` property in the layer's JSON schema. The system supports three main actions, described in the table below, enabling everything from polygon selection to navigation to specific views.

| Action            | Description                                                                                   | Usage Context                                         | Required Parameters                                                                                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SelectFeature** | Selects the polygon on the screen, highlighting it for details display or other interactions. | Used exclusively at the layer root.                   | No additional parameters required. Example: `{ action: "SelectFeature" }`                                                                                                 |
| **setZoom**       | Zooms to the clicked location, typically on a specific polygon.                               | Used exclusively at the layer root, on polygons.      | Requires the `zoom` parameter to set the zoom level. Example: `{ action: "setZoom", zoom: 15 }`                                                                           |
| **openFeature**   | Opens the details of a list item, rendering information based on a template.                  | Used exclusively in the `wrapper-list-items` wrapper. | Requires a `template` parameter with a specific template or the string `"root"` to use the layer's `viewTemplate`. Example: `{ action: "openFeature", template: "root" }` |

For more information on rendering details with `openFeature`, see the [viewTemplate Documentation](./view-template.md).

## Color Configurations

Layers support color customization for polygons based on their properties, allowing colors to be applied to the **fill**, **line**, or **text** of a polygon. Configurations can be static or dynamic, and the fill can include visual patterns to differentiate areas on the map.

### Fill Patterns

Users can define fill patterns for polygons, specified in the `pattern` field of the `colors` array. The available options are:

- **full**: Solid fill, no pattern.
- **dots**: Scattered dots pattern.
- **hatch-1x**: Parallel lines pattern.
- **hatch-cross**: Crossed lines pattern.

### Color Types

Colors can be applied to different polygon elements, specified by the properties `getFillColorPropName`, `getLineColorPropName`, and `getTextColorPropName`. The color type is implicitly defined by these properties, corresponding to:

- **fill**: Polygon fill color.
- **line**: Polygon outline color.
- **text**: Color of text displayed on the polygon.

In the absence of `getLineColorPropName` or `getTextColorPropName`, the system defaults to the color defined by `getFillColorPropName` for both line and text. The default type for any color is always `fill`, ensuring the fill is colored even without specific configurations for line or text.

### Usage of `label` and `value` Properties

The `label` property is primarily used to display descriptions in the legend when a layer has multiple colors. The system uses the `value` field to map a polygon's property to the corresponding color, while `label` defines the text shown in the legend. If the comparison value (used for color mapping) is the same as the legend display value, the user can define only the `label` property, omitting `value`. The `value` property is required only when there is a divergence between the comparison value and the legend text.

For example:

- A polygon property might have values like `AI-16` or `AI`, but the legend can display `Area of Influence` or `Area of Influence (2016)`.
- If the comparison value and legend text are the same (e.g., `AI`), only `label` is needed.
- Example with distinct values:
  ```json
  {
    colors: [
      {
        "color": [136, 144, 173, 240],
        "pattern": "full",
        "label": "Area of Influence",
        "value": "AI"
      },
      {
        "color": [201, 186, 119, 240],
        "pattern": "hatch-1x",
        "label": "Area of Influence (2016)",
        "value": "AI-16"
      }
    ]
  }
  ```
- Example with identical values:

  ```json
  {
    colors: [
      {
        "color": [136, 144, 173, 240],
        "pattern": "full",
        "label": "Area of Influence"
      }
    ]
  }
  ```

- **Static Colors**: A single color applied uniformly, e.g., the "Running or Dormant Waters" layer uses:
  ```json
  {
    colors: [
      {
        "color": [56, 85, 204, 240],
        "label": "default",
        "pattern": "full"
      }
    ]
  }
  ```
- **Dynamic Colors**: Colors assigned based on polygon properties, e.g., the "Axes" layer maps colors to the `nm_perimetro_divisao_pde` property:
  ```json
  {
    getFillColorPropName: "nm_perimetro_divisao_pde",
    getLineColorPropName: "nm_perimetro_divisao_pde",
    colors: [
      {
        "color": [136, 144, 173, 240],
        "pattern": "full",
        "label": "Area of Influence",
        "value": "AI"
      },
      {
        "color": [201, 186, 119, 240],
        "pattern": "hatch-1x",
        "label": "Area of Influence (2016)",
        "value": "AI-16"
      }
    ]
  }
  ```

## Layer Object Parameters

The JSON object that defines a layer contains several parameters that control its functionality, appearance, and behavior. The table below lists all parameters observed in the layer examples, along with their descriptions and examples.

| Parameter              | Description                                                                                                                                                                                                                                                                                                                                                                                  | Example                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `id`                   | Unique identifier for the layer.                                                                                                                                                                                                                                                                                                                                                             | `"lots"`                                                                   |
| `name`                 | Descriptive name of the layer, displayed in the interface.                                                                                                                                                                                                                                                                                                                                   | `"Lots"`                                                                   |
| `origin`               | URL or endpoint of the geospatial data source (e.g., WFS GeoServer).                                                                                                                                                                                                                                                                                                                         | `"https://geoserver.slui.dev/geoserver/slui/ows?...&outputFormat=json"`    |
| `isActive`             | Boolean indicating whether the layer is active (loaded on the map).                                                                                                                                                                                                                                                                                                                          | `true`                                                                     |
| `type`                 | Type of the layer, defining the data format and loading method. Available options: <ul><li>**GeoJsonLayer**: Loads an entire GeoJSON, the most common type.</li><li>**Stream**: Loads the layer in parts using the map's bounding box, with sessions to reuse the same areas from the source.</li><li>**CustomWMSLayer**: Used for layers that do not use GeoJSON, such as images.</li></ul> | `"GeoJsonLayer"`                                                           |
| `isVisible`            | Boolean controlling the initial visibility of the layer on the map.                                                                                                                                                                                                                                                                                                                          | `true`                                                                     |
| `minZoom`              | Minimum zoom level for the layer to be displayed (or `null` for no limit).                                                                                                                                                                                                                                                                                                                   | `17`                                                                       |
| `getTextColorPropName` | Name of the polygon property used to map the text color (or `null`).                                                                                                                                                                                                                                                                                                                         | `"nm_perimetro_divisao_pde"`                                               |
| `getFillColorPropName` | Name of the polygon property used to map the fill color (or `null`).                                                                                                                                                                                                                                                                                                                         | `"nm_perimetro_divisao_pde"`                                               |
| `getLineColorPropName` | Name of the polygon property used to map the outline color (or `null`).                                                                                                                                                                                                                                                                                                                      | `"nm_perimetro_divisao_pde"`                                               |
| `groupId`              | Identifier of the group to which the layer belongs.                                                                                                                                                                                                                                                                                                                                          | `"geral"`                                                                  |
| `clickAction`          | Configuration of the action executed when the layer is clicked (see [Actions on Polygon Click](#actions-on-polygon-click)).                                                                                                                                                                                                                                                                  | `{ "action": "SelectFeature" }`                                            |
| `properties`           | Object with additional properties for styling and behavior.                                                                                                                                                                                                                                                                                                                                  | `{ "stroked": false, "filled": true, "pickable": true, ... }`              |
| `colors`               | Array of color configurations for fill, outline, and text.                                                                                                                                                                                                                                                                                                                                   | `[{ "color": [57, 118, 29, 175], "label": "default", "pattern": "full" }]` |

### Details of Properties in `properties`

The `properties` object can contain various additional configurations, depending on the layer. Common examples include:

| Property         | Description                                                                              | Example                                                                                                                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stroked`        | Boolean indicating whether the polygon has an outline.                                   | `false`                                                                                                                                                                                                                          |
| `filled`         | Boolean indicating whether the polygon has a fill.                                       | `true`                                                                                                                                                                                                                           |
| `pointType`      | Type of representation for points (e.g., "circle", "circle+text").                       | `"circle+text"`                                                                                                                                                                                                                  |
| `pickable`       | Boolean indicating whether the polygon is interactive (selectable).                      | `true`                                                                                                                                                                                                                           |
| `extruded`       | Boolean that enables 3D extrusion of the polygon.                                        | `true`                                                                                                                                                                                                                           |
| `wireframe`      | Boolean that enables wireframe mode for the polygon.                                     | `true`                                                                                                                                                                                                                           |
| `getLineWidth`   | Width of the polygon outline (in pixels).                                                | `20`                                                                                                                                                                                                                             |
| `getPointRadius` | Radius of points (in pixels).                                                            | `5`                                                                                                                                                                                                                              |
| `getTextSize`    | Size of text displayed on the polygon (in pixels).                                       | `12`                                                                                                                                                                                                                             |
| `autoHighlight`  | Boolean that enables automatic highlighting on hover.                                    | `true`                                                                                                                                                                                                                           |
| `highlightColor` | Highlight color when interacting with the polygon (RGBA array).                          | `[252, 252, 255, 150]`                                                                                                                                                                                                           |
| `getElevation`   | JavaScript function that calculates the 3D elevation of the polygon based on properties. | ``` "(allotment) => { const { qt_area_construida, qt_area_terreno } = allotment?.properties \|\| {}; if (!qt_area_construida \|\| !qt_area_terreno) return 0; return (qt_area_construida / qt_area_terreno) _ 2 _ 3; }"``` |

For more information on these properties, [see the Deck.gl documentation](https://deck.gl/docs/api-reference/layers/geojson-layer).

### Details of the `colors` Array

The `colors` array defines the color and pattern configurations, with the following fields:

| Field     | Description                                                             | Example              |
| --------- | ----------------------------------------------------------------------- | -------------------- |
| `color`   | Color in RGBA format (array of 4 values).                               | `[57, 118, 29, 175]` |
| `label`   | Text displayed in the legend.                                           | `"default"`          |
| `pattern` | Fill pattern (full, dots, hatch-1x, hatch-cross). (Default: **"full"**) | `"full"`             |
| `value`   | Value of the polygon property for color mapping (optional).             | `"AI"`               |

## Example Layer Configurations

### Simple Layer (Static Color)

```json
{
  "id": "aguas_correntes_ou_dormentes",
  "name": "Running or Dormant Waters",
  "origin": "https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:aguas_correntes_ou_dormentes&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326",
  "isActive": true,
  "type": "GeoJsonLayer",
  "isVisible": false,
  "minZoom": null,
  "getTextColorPropName": null,
  "getFillColorPropName": null,
  "getLineColorPropName": null,
  "groupId": "areas_publicas",
  "colors": [
    {
      "color": [56, 85, 204, 240],
      "label": "default",
      "pattern": "full"
    }
  ]
}
```

### Layer with Dynamic Colors

```json
{
  "id": "eixos",
  "name": "Axes",
  "origin": "https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:eixos&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326",
  "isActive": true,
  "type": "GeoJsonLayer",
  "isVisible": false,
  "minZoom": null,
  "getTextColorPropName": "nm_perimetro_divisao_pde",
  "getFillColorPropName": "nm_perimetro_divisao_pde",
  "getLineColorPropName": "nm_perimetro_divisao_pde",
  "groupId": "macrozoneamento",
  "clickAction": { "action": "setZoom", "zoom": 15 },
  "colors": [
    {
      "color": [136, 144, 173, 240],
      "pattern": "full",
      "label": "Area of Influence",
      "value": "AI"
    },
    {
      "color": [201, 186, 119, 240],
      "pattern": "hatch-1x",
      "label": "Area of Influence (2016)",
      "value": "AI-16"
    }
  ]
}
```

### Layer with Dynamic Loading and Selection

```json
{
  "id": "lotes",
  "name": "Lots",
  "origin": "https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:view_lote_cidadao&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326",
  "isActive": true,
  "type": "Stream",
  "isVisible": true,
  "minZoom": 17,
  "getTextColorPropName": null,
  "getFillColorPropName": null,
  "getLineColorPropName": null,
  "clickAction": { "action": "SelectFeature" },
  "groupId": "geral",
  "properties": {
    "stroked": false,
    "filled": true,
    "pointType": "circle+text",
    "pickable": true,
    "extruded": true,
    "wireframe": true,
    "getLineWidth": 20,
    "getPointRadius": 0,
    "getTextSize": 12,
    "autoHighlight": true,
    "highlightColor": [252, 252, 255, 150],
    "getElevation": "(allotment) => { const { qt_area_construida, qt_area_terreno } = allotment?.properties || {}; if (!qt_area_construida || !qt_area_terreno) return 0; return (qt_area_construida / qt_area_terreno) * 2 * 3; }"
  },
  "colors": [
    {
      "color": [57, 118, 29, 175],
      "label": "default",
      "pattern": "full"
    }
  ]
}
```

### Layer with openFeature Action

```json
{
  "id": "monumentos",
  "name": "Monuments",
  "origin": "https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui:monumentos&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326",
  "isActive": true,
  "type": "GeoJsonLayer",
  "isVisible": true,
  "minZoom": 14,
  "getTextColorPropName": null,
  "getFillColorPropName": null,
  "getLineColorPropName": null,
  "clickAction": { "action": "openFeature", "template": "root" },
  "groupId": "patrimonio",
  "properties": {
    "stroked": true,
    "filled": true,
    "pointType": "circle",
    "pickable": true,
    "getLineWidth": 10,
    "getPointRadius": 5,
    "getTextSize": 10,
    "autoHighlight": true,
    "highlightColor": [255, 255, 0, 200]
  },
  "colors": [
    {
      "color": [200, 50, 50, 200],
      "label": "default",
      "pattern": "dots"
    }
  ]
}
```

### Layer with type CustomWMSLayer

```json
{
  "id": "aguas_correntes_estimadas",
  "name": "Águas Correntes Estimadas",
  "origin":
    "https://geoserver.slui.dev/geoserver/slui/wms?LAYERS=slui%3Aaguas_correntes_estimadas&FORMAT=image%2Fjpeg&TRANSPARENT=true",
  "isActive": true,
  "type": "CustomWMSLayer",
  "isVisible": false,
  "minZoom": null,
  "getTextColorPropName": null,
  "getFillColorPropName": null,
  "getLineColorPropName": null,
  "groupId": "areas_publicas",
  "colors": [
    {
      "color": [65, 120, 216, 240],
      "label": "default",
    },
  ],
},
```
