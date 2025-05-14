# viewTemplate Documentation

## Table of Contents

- [Introduction](#introduction)
- [Using EJS for Rendering](#using-ejs-for-rendering)
- [Wrappers](#wrappers)
  - [List of Available Wrappers](#list-of-available-wrappers)
  - [Row](#row)
  - [Card](#card)
  - [List Items](#list-items)
- [Templates](#templates)
  - [List of Available Templates](#list-of-available-templates)
  - [Label and Value](#label-and-value)
  - [Edit Polygon Action](#edit-polygon-action)
  - [Button Action](#button-action)
  - [Polygon Map](#polygon-map)
  - [Primary Item](#primary-item)
  - [Secondary Item](#secondary-item)

## Introduction

The `viewTemplate` is a core component of the map visualization system, used to define how polygon or other element information is rendered in the frontend. It enables the creation of customized layouts to display data in a structured and interactive manner, combining wrappers (container structures) and templates (content components). This documentation details the available wrapper and template types, explaining their functionalities and use cases with practical examples.

## Using EJS for Rendering

The system uses the **[EJS (Embedded JavaScript)](https://ejs.co/)** templating language to dynamically render information in the `viewTemplate`. EJS allows embedding JavaScript logic directly within templates, accessing data properties (such as `properties` or `data`) and generating conditional or formatted content. For example, expressions like `<%- properties?.qt_area_terreno ?? '-' %>` extract property values and provide a default value (`-`) if the data is missing. The use of EJS ensures flexibility to create rich, user-adaptable visualizations.

## Wrappers

Wrappers are containers that organize templates into visual structures, such as rows, cards, or lists. They define the overall layout and can contain other wrappers or templates as children.

### List of Available Wrappers

- [Row](#row)
- [Card](#card)
- [List Items](#list-items)

### Row

The `wrapper-row` organizes templates in a row, leveraging the grid system of **[Bootstrap](https://getbootstrap.com/docs/5.3/layout/grid/)**. Each item in the `templates` array corresponds to a column in the grid, enabling responsive layouts. Users can specify the width of each column using the `columnClass` property, which accepts any Bootstrap column class, such as `col-md-6` for half-width on medium or larger screens.

- **Purpose**: Group templates horizontally, such as label-value pairs in columns.
- **Root Properties**:

| Property    | Description                                                     | Example                            |
| ----------- | --------------------------------------------------------------- | ---------------------------------- |
| `type`      | Wrapper identifier, must be `"wrapper-row"`.                    | `"wrapper-row"`                    |
| `templates` | Array of child templates or wrappers to be rendered in the row. | `[{ "type": "label-value", ... }]` |

- **Properties of the `properties` Object**:

| Property      | Description                                                       | Example      |
| ------------- | ----------------------------------------------------------------- | ------------ |
| `columnClass` | Bootstrap CSS class to define the column width for each template. | `"col-md-6"` |

- **Example**:
  ```json
  {
    "type": "wrapper-row",
    "templates": [
      {
        "type": "label-value",
        "label": "Land Area",
        "value": "<%- properties?.qt_area_terreno ?? '-' %>",
        "properties": {
          "columnClass": "col-md-6"
        }
      },
      {
        "type": "label-value",
        "label": "Built Area",
        "value": "<%- properties?.qt_area_construida ?? '-' %>",
        "properties": {
          "columnClass": "col-md-6"
        }
      }
    ]
  }
  ```
  This example creates a row with two label-value pairs, each occupying half the available width on medium or larger screens, using the Bootstrap grid.

### Card

The `wrapper-card` displays content in a visual card, typically with a title (`label`) and a body containing other templates or wrappers. It is used to group related information in a visually distinct manner.

- **Purpose**: Present grouped information, such as polygon details or a list of intersections.
- **Root Properties**:

| Property    | Description                                                      | Example                            |
| ----------- | ---------------------------------------------------------------- | ---------------------------------- |
| `type`      | Wrapper identifier, must be `"wrapper-card"`.                    | `"wrapper-card"`                   |
| `label`     | Card title displayed at the top.                                 | `"Information"`                    |
| `templates` | Array of child templates or wrappers to be rendered in the body. | `[{ "type": "wrapper-row", ... }]` |

- **Properties of the `properties` Object**:

| Property | Description | Example                                             |
| -------- | ----------- | --------------------------------------------------- |
| `helper` | Help text   | `{ "helper": "Information about content in card" }` |

- **Example**:
  ```json
  {
    "type": "wrapper-card",
    "label": "Information",
    "templates": [
      {
        "type": "wrapper-row",
        "templates": [
          {
            "type": "label-value",
            "label": "Land Area",
            "value": "<%- properties?.qt_area_terreno ?? '-' %>",
            "properties": {
              "columnClass": "col-md-6"
            }
          },
          {
            "type": "label-value",
            "label": "Built Area",
            "value": "<%- properties?.qt_area_construida ?? '-' %>",
            "properties": {
              "columnClass": "col-md-6"
            }
          }
        ]
      }
    ]
  }
  ```
  This card displays a title "Information" and a row with two label-value pairs.

### List Items

The `wrapper-list-items` renders a list of items, often used to display filtered or related data, such as lots or intersections. It supports interactions, such as item clicks, and can display information in a single or two-line format (`twoLine`).

- **Purpose**: Display dynamic lists, such as lots in a perimeter or geographic intersections, with support for click actions.
- **Root Properties**:

| Property    | Description                                                                                        | Example                             |
| ----------- | -------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `type`      | Wrapper identifier, must be `"wrapper-list-items"`.                                                | `"wrapper-list-items"`              |
| `templates` | Array of templates, typically [Primary Item](#primary-item) and [Secondary Item](#secondary-item). | `[{ "type": "primary-item", ... }]` |

- **Properties of the `properties` Object**:

| Property      | Description                                                                                                                                                                                                                                                         | Example                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `data`        | JavaScript function executed when the component initializes, returning list data obtained from the **[geospatial-intersections API](https://api.mapa.urbis.sampa.br/swagger/docs#/Geospatial%20intersections/GeospatialIntersectionController_findIntersections)**. | `"(data) => data.response.features.filter(({ id }) => id.includes('lote_cidadao'))"` |
| `twoLine`     | Boolean that enables two-line mode for primary and secondary items.                                                                                                                                                                                                 | `true`                                                                               |
| `onItemClick` | Configuration for the action triggered when an item is clicked.                                                                                                                                                                                                     | `{ "action": "openFeature", "params": { "template": "root" } }`                      |

- **Example**:
  ```json
  {
    "type": "wrapper-list-items",
    "properties": {
      "twoLine": true,
      "data": "(data) => data.response.features.filter(({ id }) => id.includes('lote_cidadao'))",
      "onItemClick": {
        "action": "openFeature",
        "params": { "template": "root" }
      }
    },
    "templates": [
      {
        "type": "primary-item",
        "value": "Identifier #<%- properties.id.replace('lote_cidadao.', '') %>"
      },
      {
        "type": "secondary-item",
        "value": "SQL: <%- properties.cd_setor_fiscal %>-<%- properties.cd_quadra_fiscal %>-<%- properties.cd_lote %> <%- properties.cd_condominio %> <%- properties.nm_logradouro_completo ?? '-' %>"
      }
    ]
  }
  ```
  This example renders a list of lots with two lines per item, where clicking an item opens details using the layer's `viewTemplate`.

## Templates

Templates are components that define specific content to be rendered, such as text, maps, or actions. They are often used within wrappers to display detailed information.

### List of Available Templates

- [Label and Value](#label-and-value)
- [Edit Polygon Action](#edit-polygon)
- [Button Action](#button-action)
- [Polygon Map](#polygon-map)
- [Primary Item](#primary-item)
- [Secondary Item](#secondary-item)

### Label and Value

The `label-value` template displays a label-value pair, ideal for showing specific polygon properties, such as area or type.

- **Purpose**: Present concise information in a label and dynamic value format.
- **Root Properties**:

| Property | Description                                            | Example                                       |
| -------- | ------------------------------------------------------ | --------------------------------------------- |
| `type`   | Template identifier, must be `"label-value"`.          | `"label-value"`                               |
| `label`  | Text of the label displayed next to the value.         | `"Land Area"`                                 |
| `value`  | EJS expression that defines the value to be displayed. | `"<%- properties?.qt_area_terreno ?? '-' %>"` |

- **Properties of the `properties` Object**:

| Property      | Description                                                     | Example                                       |
| ------------- | --------------------------------------------------------------- | --------------------------------------------- |
| `columnClass` | Bootstrap CSS class for grid layout, used within `wrapper-row`. | `"col-md-6"`                                  |
| `helper`      | Help text                                                       | `{ "helper": "Information about the value" }` |

- **Example**:
  ```json
  {
    "type": "label-value",
    "label": "Land Area",
    "value": "<%- properties?.qt_area_terreno ?? '-' %>",
    "properties": {
      "columnClass": "col-md-6"
    }
  }
  ```
  This template displays the label "Land Area" and the corresponding value of the `qt_area_terreno` property.

### Edit Polygon Action

The `edit-polygon` template is the action for editing and initiating a new protocol based on the polygon.

- **Purpose**: Edit the polygon and create a protocol with its information.
- **Root Properties**:

| Property          | Description                                                  | Default              | Example                             |
| ----------------- | ------------------------------------------------------------ | -------------------- | ----------------------------------- |
| `type`            | Template identifier, must be `"edit-polygon"`.               | -                    | `"edit-polygon"`                    |
| `label`           | The text that will be displayed on the button on the screen. | "Ajustar perimetros" | `"edit-polygon"`                    |
| `polygonTemplate` | Array of wrappers or templates to be rendered.               | -                    | `[{ "type": "wrapper-card", ... }]` |

- **Properties of the `properties` Object**:

| Property | Description                                                             | Example |
| -------- | ----------------------------------------------------------------------- | ------- |
| (None)   | Currently, there are no specific properties in the `properties` object. | -       |

> This template will no be rendered when the view is to printing

- **Example**:
  ```json
  {
    "type": "edit-polygon",
    "polygonTemplate": [
      {
        "type": "wrapper-card",
        "label": "Selected Area",
        "templates": [
          {
            "type": "polygon-map",
            "properties": {
              "initialViewState": "(data) => { const centroid = utils.calculateCenterId(data.geometry.coordinates[0]); return { longitude: centroid[0], latitude: centroid[1], zoom: 16.5, pitch: 0, bearing: 0 }; }",
              "polygonProps": "(data) => ({ id: 'polygon-layer', data: [{ coordinates: data.geometry.coordinates }], pickable: false, stroked: true, filled: true, lineWidthMinPixels: 2, getPolygon: (d) => d.coordinates, getFillColor: [255, 165, 0, 100], getLineColor: [255, 140, 0] })"
            }
          }
        ]
      },
      {
        "type": "wrapper-card",
        "label": "Lots in the Perimeter",
        "templates": [
          {
            "type": "wrapper-list-items",
            "properties": {
              "twoLine": true,
              "data": "(data) => data.response.features.filter(({ id }) => id.includes('lote_cidadao'))",
              "onItemClick": {
                "action": "openFeature",
                "params": { "template": "root" }
              }
            },
            "templates": [
              {
                "type": "primary-item",
                "value": "Identifier #<%- properties.id.replace('lote_cidadao.', '') %>"
              },
              {
                "type": "secondary-item",
                "value": "SQL: <%- properties.cd_setor_fiscal %>-<%- properties.cd_quadra_fiscal %>-<%- properties.cd_lote %> <%- properties.cd_condominio %> <%- properties.nm_logradouro_completo ?? '-' %>"
              }
            ]
          }
        ]
      }
    ]
  }
  ```
  This example combines a map with a list of lots, each with a click action to open details.

### Button Action

The `button` template is a simple button with any action.

- **Purpose**: Render a simple button with label and action.
- **Root Properties**:

| Property | Description                                                  | Default | Example          |
| -------- | ------------------------------------------------------------ | ------- | ---------------- |
| `type`   | Template identifier, must be `"button"`.                     | -       | `"edit-polygon"` |
| `label`  | The text that will be displayed on the button on the screen. | "Ação"  | `"edit-polygon"` |

- **Properties of the `properties` Object**:

| Property | Description                                                          | Example                                |
| -------- | -------------------------------------------------------------------- | -------------------------------------- |
| `action` | A string function that will be triggered when the button is clicked. | `(data) => console.log("Do nothing");` |

> This template will no be rendered when the view is to printing

- **Example**:
  ```json
  {
    "type": "button",
    "label": "Imprimir",
    "properties": { "action": "(data) => console.log('DO NOTHING');" },
  },
  ```
  This example combines a map with a list of lots, each with a click action to open details.

### Polygon Map

The `polygon-map` template renders a non-interactive map with a highlighted polygon, configured with an initial view and visual properties.

- **Purpose**: Display the geometry of a polygon on a map.
- **Root Properties**:

| Property | Description                                   | Example         |
| -------- | --------------------------------------------- | --------------- |
| `type`   | Template identifier, must be `"polygon-map"`. | `"polygon-map"` |

- **Properties of the `properties` Object**:

| Property           | Description                                                                           | Example                                                                                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialViewState` | JavaScript function that defines the initial map view (longitude, latitude, zoom).    | `"(data) => { const centroid = utils.calculateCenterId(data.geometry.coordinates[0]); return { longitude: centroid[0], latitude: centroid[1], zoom: 16.5, pitch: 0, bearing: 0 }; }"`                                                                             |
| `polygonProps`     | JavaScript function that configures the polygon's visual properties (color, outline). | `"(data) => ({ id: 'polygon-layer', data: [{ coordinates: data.geometry.coordinates }], pickable: false, stroked: true, filled: true, lineWidthMinPixels: 2, getPolygon: (d) => d.coordinates, getFillColor: [255, 165, 0, 100], getLineColor: [255, 140, 0] })"` |

- **Example**:
  ```json
  {
    "type": "polygon-map",
    "properties": {
      "initialViewState": "(data) => { const centroid = utils.calculateCenterId(data.geometry.coordinates[0]); return { longitude: centroid[0], latitude: centroid[1], zoom: 16.5, pitch: 0, bearing: 0 }; }",
      "polygonProps": "(data) => ({ id: 'polygon-layer', data: [{ coordinates: data.geometry.coordinates }], pickable: false, stroked: true, filled: true, lineWidthMinPixels: 2, getPolygon: (d) => d.coordinates, getFillColor: [255, 165, 0, 100], getLineColor: [255, 140, 0] })"
    }
  }
  ```
  This template displays a centered polygon with an orange fill and a darker outline.

### Primary Item

The `primary-item` template defines the primary content of an item in a list ([List Items](#list-items)), typically used for the title or main information.

- **Purpose**: Display the main text of a list item, such as an identifier or name.
- **Root Properties**:

| Property | Description                                                  | Example                                                           |
| -------- | ------------------------------------------------------------ | ----------------------------------------------------------------- |
| `type`   | Template identifier, must be `"primary-item"`.               | `"primary-item"`                                                  |
| `value`  | EJS expression that defines the primary content of the item. | `"Identifier #<%- properties.id.replace('lote_cidadao.', '') %>"` |

- **Properties of the `properties` Object**:

| Property | Description                                                             | Example |
| -------- | ----------------------------------------------------------------------- | ------- |
| (None)   | Currently, there are no specific properties in the `properties` object. | -       |

- **Example**:
  ```json
  {
    "type": "primary-item",
    "value": "Identifier #<%- properties.id.replace('lote_cidadao.', '') %>"
  }
  ```
  This template displays the identifier of a lot without the "lote_cidadao." prefix.

### Secondary Item

The `secondary-item` template defines the secondary content of an item in a list ([List Items](#list-items)), typically used for supplementary details.

- **Purpose**: Display additional information, such as codes or descriptions, on a second line.
- **Root Properties**:

| Property | Description                                                    | Example                                                                                                                                                                                 |
| -------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`   | Template identifier, must be `"secondary-item"`.               | `"secondary-item"`                                                                                                                                                                      |
| `value`  | EJS expression that defines the secondary content of the item. | `"SQL: <%- properties.cd_setor_fiscal %>-<%- properties.cd_quadra_fiscal %>-<%- properties.cd_lote %> <%- properties.cd_condominio %> <%- properties.nm_logradouro_completo ?? '-' %>"` |

- **Properties of the `properties` Object**:

| Property | Description                                                             | Example |
| -------- | ----------------------------------------------------------------------- | ------- |
| (None)   | Currently, there are no specific properties in the `properties` object. | -       |

- **Example**:
  ```json
  {
    "type": "secondary-item",
    "value": "SQL: <%- properties.cd_setor_fiscal %>-<%- properties.cd_quadra_fiscal %>-<%- properties.cd_lote %> <%- properties.cd_condominio %> <%- properties.nm_logradouro_completo ?? '-' %>"
  }
  ```
  This template displays fiscal codes and the address of a lot.
