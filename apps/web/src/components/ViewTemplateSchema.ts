export const viewTemplateSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "array",
  items: {
    $ref: "#/definitions/component",
  },
  definitions: {
    component: {
      oneOf: [
        { $ref: "#/definitions/wrapperRow" },
        { $ref: "#/definitions/wrapperCard" },
        { $ref: "#/definitions/wrapperRequest" },
        { $ref: "#/definitions/wrapperListItems" },
        { $ref: "#/definitions/labelValue" },
        { $ref: "#/definitions/editPolygon" },
        { $ref: "#/definitions/button" },
        { $ref: "#/definitions/polygonMap" },
        { $ref: "#/definitions/primaryItem" },
        { $ref: "#/definitions/secondaryItem" },
      ],
    },
    wrapperCard: {
      type: "object",
      properties: {
        type: { const: "wrapper-card" },
        label: { type: "string" },
        templates: {
          type: "array",
          items: { $ref: "#/definitions/component" },
        },
        properties: {
          type: "object",
          properties: {
            helper: { type: "string" },
          },
        },
      },
      required: ["type", "templates"],
    },
    wrapperRequest: {
      type: "object",
      properties: {
        type: { const: "wrapper-request" },
        templates: {
          type: "array",
          items: { $ref: "#/definitions/component" },
        },
        properties: {
          type: "object",
          properties: {
            url: { type: "string" },
            method: { type: "string", enum: ["get", "post", "put", "delete"] },
            data: { type: "string" },
            transformResponse: { type: "string" },
          },
          required: ["url"],
        },
      },
      required: ["type", "templates", "properties"],
    },
    wrapperListItems: {
      type: "object",
      properties: {
        type: { const: "wrapper-list-items" },
        templates: {
          type: "array",
          items: { $ref: "#/definitions/component" },
        },
        properties: {
          type: "object",
          properties: {
            data: { type: "string" },
            twoLine: { type: "boolean" },
            onItemClick: {
              type: "object",
              properties: {
                action: {
                  type: "string",
                  enum: ["openFeature", "setZoom", "SelectFeature"],
                },
                params: { type: "object" },
              },
              required: ["action"],
            },
          },
        },
      },
      required: ["type", "templates"],
    },
    labelValue: {
      type: "object",
      properties: {
        type: { const: "label-value" },
        label: { type: "string" },
        value: { type: "string" },
        properties: {
          type: "object",
          properties: {
            columnClass: { type: "string" },
            helper: { type: "string" },
          },
        },
      },
      required: ["type", "label", "value"],
    },
    editPolygon: {
      type: "object",
      properties: {
        type: { const: "edit-polygon" },
        label: { type: "string" },
        polygonTemplate: {
          type: "array",
          items: { $ref: "#/definitions/component" },
        },
      },
      required: ["type"],
    },
    /*     button: {
      type: "object",
      properties: {
        type: { const: "button" },
        label: { type: "string" },
        properties: {
          type: "object",
          properties: {
            action: { type: "string" },
          },
          required: ["action"],
        },
      },
      required: ["type", "label", "properties"],
    }, */
    polygonMap: {
      type: "object",
      properties: {
        type: { const: "polygon-map" },
        properties: {
          type: "object",
          properties: {
            initialViewState: { type: "string" },
            polygonProps: { type: "string" },
          },
        },
      },
      required: ["type"],
    },
    primaryItem: {
      type: "object",
      properties: {
        type: { const: "primary-item" },
        value: { type: "string" },
      },
      required: ["type", "value"],
    },
    secondaryItem: {
      type: "object",
      properties: {
        type: { const: "secondary-item" },
        value: { type: "string" },
      },
      required: ["type", "value"],
    },
  },
};
