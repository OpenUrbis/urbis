# Search Configuration Documentation

## Table of Contents
- [Overview](#overview)
- [Search Object Properties](#search-object-properties)
- [Example Search Configurations](#example-search-configurations)

## Overview

This document describes the structure and functionality of the search configuration system in the layout construction engine. The search configuration defines how search queries are processed, including the data source, request parameters, response transformation, and user interactions. Each search configuration is represented by a record in a single row of a database, specifying the behavior of a search feature and enabling dynamic retrieval and display of geospatial data.

**Note**: All configured searches are executed in parallel in the frontend when a user performs a query, allowing multiple results to be returned simultaneously from different search configurations.

## Search Object Properties

The database record that defines a search configuration contains several properties that control its functionality, data processing, and rendering behavior. The table below lists all properties, their descriptions, default values, and examples.

| Property                | Description                                                                 | Default Value | Example                                                                 |
|-------------------------|-----------------------------------------------------------------------------|---------------|-------------------------------------------------------------------------|
| `id`                    | Unique identifier for the search configuration. Must be unique across all configurations. | None (required) | `"lots"`                                                                |
| `name`                  | Descriptive name of the search, used for rendering in the user interface.   | None (required) | `"Tax Addresses"`                                                       |
| `layerSchemaId`         | Optional. Identifier of a layer schema (defined in `layer-schema.md`) used to apply a click action when a search result is selected. If not provided, the `clickAction` property is used. | `null`        | `"lotes"`                                                               |
| `index`                 | Integer specifying the rendering order of search results on the screen. Higher values are rendered last (on top). | None (required) | `10`                                                                    |
| `origin`                | URL or endpoint for the data source (e.g., a WFS GeoServer). May include environment variables, such as `{environment}`. | None (required) | `"https://geoserver.slui.dev/geoserver/slui/ows"`                       |
| `transformParams`       | Optional. JavaScript function called before the request to process URL query parameters. Receives an object with a `term` property containing the search input. Returns an object with query parameters (e.g., `CQL_FILTER`). The `utils` object is available, providing functions like `calculateCenterId`. | `null`        | `({term}) => { ... }` (see example below)                               |
| `transformRequest`      | Optional. JavaScript function called before the request to process the request body (if applicable). Receives the request data and can modify it. The `utils` object is available. | `null`        | `null`                                                                  |
| `transformResponse`     | Optional. JavaScript function called after the API response to transform the data. Receives the `data` parameter (API response) and must return an array of objects in the frontend-expected format: `{ id, latitude, longitude, name, rawData }`. The `utils` object is available, including `calculateCenterId` for calculating the center of coordinates. | `null`        | `(data) => { ... }` (see example below)                                 |
| `clickAction`           | Optional. Defines the action executed when a search result is clicked. Follows the same structure as layer click actions (see [Actions on Polygon Click](#actions-on-polygon-click) in [Layer Schema Documentation](./layer-schema.md)). Used if `layerSchemaId` is not defined. | `null`        | `{ "action": "setZoom", "params": { "zoom": 17.1 } }`                    |
| `method`                | Optional. HTTP request method (e.g., GET, POST, PUT).                      | `"GET"`       | `"POST"`                                                                |
| `isActive`              | Optional. Boolean indicating whether the search configuration is active (i.e., whether requests are executed). | `true`        | `true`                                                                  |

**Note on Expected Response**: When defined, the `transformResponse` function must return an array of objects in the format `{ id, latitude, longitude, name, rawData }`, which is the standard expected by the frontend for rendering search results.

### Notes on `utils` Functions
The `transformParams`, `transformRequest`, and `transformResponse` functions have access to a `utils` object that provides helper functions. Currently, the following function is available:
- **`calculateCenterId(coordinates)`**: Takes an array of coordinates and returns the center point as `[longitude, latitude]`.

### Notes on `clickAction`
The `clickAction` property follows the same schema as the `clickAction` in the layer configuration (see [Actions on Polygon Click](#actions-on-polygon-click) in [Layer Schema Documentation](./layer-schema.md)). It supports actions such as `SelectFeature`, `setZoom`, and `openFeature`. If `layerSchemaId` is provided, the click action is derived from the referenced layer schema, and `clickAction` is ignored.

## Example Search Configurations

### Complex Configuration (Tax Addresses)
This example demonstrates a search configuration for tax addresses, with custom parameter and response transformations to handle specific query formats and standardize the output.

```javascript
{
  "id": "lots",
  "name": "Tax Addresses",
  "layerSchemaId": "lotes",
  "index": 10,
  "origin": "https://geoserver.slui.dev/geoserver/slui/ows",
  "transformParams": `({term}) => {
    const parseCode = (term) => {
      term = term.replaceAll(" ", "");
      if (!/^\\d{10}(\\d{2})?$/.test(term)) return null;
      const setor = term.substring(0, 3); // first 3 digits
      const quadra = term.substring(3, 6); // next 3 digits
      const lote = term.substring(6, 10); // next 4 digits
      const condominio = term.length === 12 ? term.substring(10, 12) : null; // last 2 digits, if present

      return { quadra, setor, lote, condominio };
    };

    let CQL_FILTER = '';

    const code = parseCode(term);
    if (code) {
      const { condominio, lote, quadra, setor } = code;
      CQL_FILTER = \`cd_setor_fiscal = '\${setor}' AND cd_quadra_fiscal = '\${quadra}' AND cd_lote = '\${lote}'\`;
      if (condominio) CQL_FILTER += \` AND cd_condominio = '\${condominio}'\`;
    } else {
      term = \`%\${term.split(" ").join("%").split(",").join("")}%\`;
      CQL_FILTER = \`nm_logradouro_completo ILIKE '\${term}'\`;
    }

    return {
      service: "WFS",
      version: "1.0.0",
      request: "GetFeature",
      typeName: "slui:view_lote_cidadao",
      maxFeatures: "5",
      outputFormat: "json",
      srsName: "EPSG:4326",
      CQL_FILTER
    };
  }`,
  "transformResponse": `(data) => {
    return JSON.parse(data)?.features?.map((feature) => {
      const { properties, id } = feature;
      const { nm_logradouro_completo: name, cd_numero_porta: number } = properties;
      const [longitude, latitude] = utils.calculateCenterId(feature?.geometry.coordinates[0]);

      return {
        id,
        latitude,
        longitude,
        name: \`\${name}, \${number}\`,
        rawData: feature
      };
    }) ?? [];
  }`,
  "transformRequest": null,
  "clickAction": null,
  "method": "GET",
  "isActive": true
}
```

### Simple Configuration (Monuments)
This example shows a minimal search configuration for monuments, using default values where possible and a simple response transformation.

```javascript
{
  "id": "monuments",
  "name": "Monuments",
  "layerSchemaId": "monumentos",
  "index": 5,
  "origin": "https://geoserver.slui.dev/geoserver/slui/ows",
  "transformParams": `({term}) => {
    const CQL_FILTER = \`nm_monumento ILIKE '%\${term}%'\`;
    return {
      service: "WFS",
      version: "1.0.0",
      request: "GetFeature",
      typeName: "slui:monumentos",
      maxFeatures: "10",
      outputFormat: "json",
      srsName: "EPSG:4326",
      CQL_FILTER
    };
  }`,
  "transformResponse": `(data) => {
    return JSON.parse(data)?.features?.map((feature) => {
      const { properties, id } = feature;
      const { nm_monumento: name } = properties;
      const [longitude, latitude] = utils.calculateCenterId(feature?.geometry.coordinates[0]);

      return {
        id,
        latitude,
        longitude,
        name,
        rawData: feature
      };
    }) ?? [];
  }`,
  "transformRequest": null,
  "clickAction": null,
  "method": "GET",
  "isActive": true
}
```

### Configuration for Districts
This example illustrates a search configuration for municipal districts, with parameter and response transformations to search and display district names.

```javascript
{
  "id": "districts",
  "name": "Districts",
  "layerSchemaId": "distrito_municipal",
  "index": 20,
  "origin": "https://geoserver.slui.dev/geoserver/slui/ows",
  "transformParams": `({term}) => ({
    service: "WFS",
    version: "1.0.0",
    request: "GetFeature",
    typeName: "slui:distrito_municipal",
    maxFeatures: "5",
    outputFormat: "json",
    srsName: "EPSG:4326",
    CQL_FILTER: \`nm_distrito_municipal ILIKE '%\${term}%'\`
  })`,
  "transformResponse": `(data) => {
    return JSON.parse(data)?.features?.map((feature) => {
      const { properties, id } = feature;
      const { nm_distrito_municipal: name } = properties;
      const [longitude, latitude] = utils.calculateCenterId(feature?.geometry.coordinates[0]);

      return {
        id,
        latitude,
        longitude,
        name,
        rawData: feature
      };
    }) ?? [];
  }`,
  "transformRequest": null,
  "clickAction": null,
  "method": "GET",
  "isActive": true
}
```

### Configuration for Address Geocoding
This example demonstrates a search configuration for address geocoding, using an external API and a custom click action to apply zoom.

```javascript
{
  "id": "geocoding",
  "name": "Addresses",
  "layerSchemaId": null,
  "index": 30,
  "origin": "{environment}/geocoding/places",
  "transformParams": `({term}) => ({search: term, service: "nominatim"})`,
  "transformResponse": null,
  "transformRequest": null,
  "clickAction": {
    "action": "setZoom",
    "params": {
      "zoom": 17.1
    }
  },
  "method": "GET",
  "isActive": true
}
```