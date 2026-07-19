export const PROSPECTIVE_SEARCH_LAYERS_TEMPLATE = {
  "id": "zoneamento_lei_16402_18177",
  "name": "Zoneamento - Lei nº 16.402/16+18.177/24",
  "origin": "https://geoserver.slui.dev/geoserver/slui/ows",
  "isActive": true,
  "type": "CustomWMSLayer",
  "isVisible": true,
  "index": 260,
  "minZoom": 10,
  "getTextColorPropName": "cd_zoneamento_perimetro",
  "getFillColorPropName": "cd_zoneamento_perimetro",
  "getLineColorPropName": "cd_zoneamento_perimetro",
  "clickAction": {
    "action": "SelectFeature",
    "params": {
      "zoom": 19.5
    }
  },
  "viewTemplate": [
    {
      "type": "LabelValueTemplate",
      "properties": {
        "label": "Zona",
        "value": "{{cd_zoneamento_perimetro}}"
      }
    }
  ],
  "properties": {
    "wms": {
      "layers": "slui:zoneamento"
    }
  },
  "groupId": "urbanistico",
  "createdAt": "2026-02-12T02:52:08.889Z",
  "updatedAt": "2026-02-12T02:52:08.889Z",
  "deletedAt": null,
  "colors": [
    {
      "id": 355,
      "color": [232, 232, 232, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZMISa",
      "value": "ZMISa",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 356,
      "color": [224, 218, 197, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZOE",
      "value": "ZOE",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 357,
      "color": [176, 193, 171, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZPDS",
      "value": "ZPDS",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 359,
      "color": [161, 154, 181, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZPI-1",
      "value": "ZPI-1",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 360,
      "color": [212, 195, 221, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZPI-2",
      "value": "ZPI-2",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 361,
      "color": [255, 255, 153, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZPR",
      "value": "ZPR",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 358,
      "color": [200, 206, 175, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZPDSr",
      "value": "ZPDSr",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 324,
      "color": [223, 253, 178, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "AC-1",
      "value": "AC-1",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 325,
      "color": [223, 253, 178, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "AC-2",
      "value": "AC-2",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 326,
      "color": [208, 234, 197, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "Praça/Canteiro",
      "value": "Praça/Canteiro",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 327,
      "color": [173, 160, 152, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZC",
      "value": "ZC",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 328,
      "color": [173, 160, 152, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZCa",
      "value": "ZCa",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 329,
      "color": [207, 178, 161, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZC-ZEIS",
      "value": "ZC-ZEIS",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 330,
      "color": [137, 142, 189, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZCOR-1",
      "value": "ZCOR-1",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 331,
      "color": [129, 186, 226, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZCOR-2",
      "value": "ZCOR-2",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 332,
      "color": [181, 207, 231, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZCOR-3",
      "value": "ZCOR-3",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 333,
      "color": [154, 190, 193, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZCORa",
      "value": "ZCORa",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 334,
      "color": [181, 146, 177, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZDE-1",
      "value": "ZDE-1",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 335,
      "color": [208, 175, 185, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZDE-2",
      "value": "ZDE-2",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 336,
      "color": [219, 206, 159, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZEIS-1",
      "value": "ZEIS-1",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 337,
      "color": [254, 208, 155, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZEIS-2",
      "value": "ZEIS-2",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 338,
      "color": [255, 230, 170, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZEIS-3",
      "value": "ZEIS-3",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 339,
      "color": [255, 239, 195, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZEIS-4",
      "value": "ZEIS-4",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 340,
      "color": [255, 249, 221, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZEIS-5",
      "value": "ZEIS-5",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 341,
      "color": [212, 159, 148, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZEM",
      "value": "ZEM",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 342,
      "color": [227, 192, 169, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZEMP",
      "value": "ZEMP",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 343,
      "color": [145, 170, 149, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZEP",
      "value": "ZEP",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 344,
      "color": [167, 211, 186, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZEPAM",
      "value": "ZEPAM",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 345,
      "color": [255, 239, 195, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZER-1",
      "value": "ZER-1",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 346,
      "color": [255, 225, 158, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZER-2",
      "value": "ZER-2",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 347,
      "color": [255, 255, 153, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZERa",
      "value": "ZERa",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 348,
      "color": [189, 138, 140, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZEU",
      "value": "ZEU",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 349,
      "color": [189, 138, 140, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZEUa",
      "value": "ZEUa",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 350,
      "color": [196, 158, 157, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZEUP",
      "value": "ZEUP",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 351,
      "color": [197, 184, 184, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZEUPa",
      "value": "ZEUPa",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 352,
      "color": [206, 206, 206, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZM",
      "value": "ZM",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 353,
      "color": [217, 217, 217, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZMa",
      "value": "ZMa",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 354,
      "color": [186, 186, 186, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "ZMIS",
      "value": "ZMIS",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 901,
      "color": [186, 186, 186, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "AI",
      "value": "AI",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 902,
      "color": [186, 186, 186, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "AIa",
      "value": "AIa",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 903,
      "color": [186, 186, 186, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "AVP-1",
      "value": "AVP-1",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    },
    {
      "id": 904,
      "color": [186, 186, 186, 190],
      "type": "fill",
      "pattern": "full",
      "patternConfig": null,
      "label": "AVP-2",
      "value": "AVP-2",
      "layerSchemaId": "zoneamento_lei_16402_18177"
    }
  ]
};

const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateSLD = (layerName: string, colors: any[], elseFilterStyle: any = null, isOutline: boolean = false, outlineColor: string = "#000000") => {
  let rules = "";

  // Group colors
  const colorGroups: Record<string, string[]> = {};

  colors.forEach(item => {
    const color = item.color;
    if (!color) return;

    let key;
    if (color === "OUTLINE") {
      key = "OUTLINE";
    } else {
      // Key by hex + opacity
      const opacity = color[3] !== undefined ? (color[3] / 255).toFixed(2) : "1.0";
      const hex = rgbToHex(color[0], color[1], color[2]);
      // Also group by pattern to handle different patterns
      const pattern = item.pattern || "full";
      key = `${hex}-${opacity}-${pattern}`;
    }

    if (!colorGroups[key]) {
      colorGroups[key] = [];
    }
    colorGroups[key].push(item.value);
  });

  Object.entries(colorGroups).forEach(([key, values]) => {
    let baseSymbolizer = "";
    let detailSymbolizer = "";
    let textSymbolizer = "";

    if (key === "OUTLINE") {
      // Dashed Outline, No Fill
      // For Outline layer, we always show the outline (no fill to separate).
      baseSymbolizer = `<PolygonSymbolizer><Stroke><CssParameter name="stroke">${outlineColor}</CssParameter><CssParameter name="stroke-width">2</CssParameter><CssParameter name="stroke-opacity">1</CssParameter><CssParameter name="stroke-dasharray">5 5</CssParameter></Stroke></PolygonSymbolizer>`;
    } else {
      const parts = key.split('-');
      const hex = parts[0];
      const opacity = parts[1];
      const pattern = parts.length > 2 ? parts.slice(2).join('-') : "full";

      // Generate Fill based on pattern
      let fillContent = `<CssParameter name="fill">${hex}</CssParameter><CssParameter name="fill-opacity">${opacity}</CssParameter>`;

      if (pattern === "dots") {
        fillContent = `<GraphicFill><Graphic><Mark><WellKnownName>circle</WellKnownName><Fill><CssParameter name="fill">${hex}</CssParameter></Fill></Mark><Size>4</Size></Graphic></GraphicFill><CssParameter name="fill-opacity">${opacity}</CssParameter>`;
      } else if (pattern === "hatch-1x" || pattern === "hatch") {
        fillContent = `<GraphicFill><Graphic><Mark><WellKnownName>shape://slash</WellKnownName><Stroke><CssParameter name="stroke">${hex}</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke></Mark><Size>10</Size></Graphic></GraphicFill><CssParameter name="fill-opacity">${opacity}</CssParameter>`;
      } else if (pattern === "hatch-cross") {
        fillContent = `<GraphicFill><Graphic><Mark><WellKnownName>shape://times</WellKnownName><Stroke><CssParameter name="stroke">${hex}</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke></Mark><Size>10</Size></Graphic></GraphicFill><CssParameter name="fill-opacity">${opacity}</CssParameter>`;
      }

      // Base: Fill Only (Always visible)
      baseSymbolizer = `<PolygonSymbolizer><Fill>${fillContent}</Fill></PolygonSymbolizer>`;

      // Detail: Stroke Only (Visible at Zoom 14+)
      detailSymbolizer = `<PolygonSymbolizer><Stroke><CssParameter name="stroke">${hex}</CssParameter><CssParameter name="stroke-width">0.5</CssParameter><CssParameter name="stroke-opacity">1</CssParameter></Stroke></PolygonSymbolizer>`;

      // Text: Label (Visible at Zoom 14+)
      textSymbolizer = `<TextSymbolizer><Label><ogc:PropertyName>cd_zoneamento_perimetro</ogc:PropertyName></Label><Font><CssParameter name="font-family">Arial</CssParameter><CssParameter name="font-size">10</CssParameter><CssParameter name="font-style">normal</CssParameter><CssParameter name="font-weight">bold</CssParameter></Font><LabelPlacement><PointPlacement><AnchorPoint><AnchorPointX>0.5</AnchorPointX><AnchorPointY>0.5</AnchorPointY></AnchorPoint></PointPlacement></LabelPlacement><Halo><Radius>1</Radius><Fill><CssParameter name="fill">#FFFFFF</CssParameter></Fill></Halo><Fill><CssParameter name="fill">#000000</CssParameter></Fill><VendorOption name="auto">true</VendorOption><VendorOption name="goodnessOfFit">0.1</VendorOption><VendorOption name="maxDisplacement">10</VendorOption></TextSymbolizer>`;
    }

    let filter = "";
    if (values.length === 1) {
      filter = `<ogc:PropertyIsEqualTo><ogc:PropertyName>cd_zoneamento_perimetro</ogc:PropertyName><ogc:Literal>${values[0].trim()}</ogc:Literal></ogc:PropertyIsEqualTo>`;
    } else {
      const conditions = values.map(val => `<ogc:PropertyIsEqualTo><ogc:PropertyName>cd_zoneamento_perimetro</ogc:PropertyName><ogc:Literal>${val.trim()}</ogc:Literal></ogc:PropertyIsEqualTo>`).join('');
      filter = `<ogc:Or>${conditions}</ogc:Or>`;
    }

    // Rule 1: Base (Fill for Use Layer, Stroke for Outline Layer) - Always visible
    rules += `<Rule><Name>Group-${key}-Base</Name><ogc:Filter>${filter}</ogc:Filter>${baseSymbolizer}</Rule>`;

    // Rule 2: Details (Stroke + Text for Use Layer) - Visible only at Zoom 14+
    // Using 25000 as threshold (approx Zoom 14.5) to ensuring it hides at Zoom 13/14 transition boundary if scale calc differs.
    if (textSymbolizer || (detailSymbolizer && key !== "OUTLINE")) {
      // Note: If key is OUTLINE, detailSymbolizer is empty string based on logic above (baseSymbolizer took the stroke).
      // For Use Layer, detailSymbolizer has Stroke.
      const combinedDetail = `${detailSymbolizer}${textSymbolizer}`;
      if (combinedDetail) {
        rules += `<Rule><Name>Group-${key}-Detail</Name><ogc:Filter>${filter}</ogc:Filter><MaxScaleDenominator>20000</MaxScaleDenominator>${combinedDetail}</Rule>`;
      }
    }
  });

  // ElseFilter
  let elseSymbolizer = "";
  if (elseFilterStyle) {
    elseSymbolizer = `<PolygonSymbolizer><Fill><CssParameter name="fill">${elseFilterStyle.fill}</CssParameter><CssParameter name="fill-opacity">${elseFilterStyle.opacity}</CssParameter></Fill><Stroke><CssParameter name="stroke">${elseFilterStyle.stroke}</CssParameter><CssParameter name="stroke-width">${elseFilterStyle.strokeWidth}</CssParameter><CssParameter name="stroke-opacity">${elseFilterStyle.strokeOpacity}</CssParameter></Stroke></PolygonSymbolizer>`;
  } else {
    // Default Grey
    elseSymbolizer = `<PolygonSymbolizer><Fill><CssParameter name="fill">#AAAAAA</CssParameter><CssParameter name="fill-opacity">0.5</CssParameter></Fill><Stroke><CssParameter name="stroke">#AAAAAA</CssParameter><CssParameter name="stroke-width">0.5</CssParameter></Stroke></PolygonSymbolizer>`;
  }

  rules += `<Rule><Name>Else</Name><ogc:ElseFilter/>${elseSymbolizer}</Rule>`;

  // Remove workspace prefix for SLD NamedLayer Name as per user feedback
  const safeLayerName = layerName.split(':').pop() || layerName;

  return `<?xml version="1.0" encoding="UTF-8"?><StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd"><NamedLayer><Name>${safeLayerName}</Name><UserStyle><FeatureTypeStyle>${rules}</FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>`;
};

import { LIGHT_COLORS, DARK_COLORS } from '@open-urbis/map';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getProspectiveSearchLayers = (matchingZones: string[] = [], regrasZonamento: any = null, hasUrbanParams: boolean = false, areaImovel: [number, number] | null = null, isDarkMode: boolean = false) => {
  const layers = [];
  const templateColors = PROSPECTIVE_SEARCH_LAYERS_TEMPLATE.colors;

  // Colors based on theme (Light vs Dark)
  const palette = isDarkMode ? DARK_COLORS : LIGHT_COLORS;

  const colors = {
      P: palette.P.fill,
      C: palette.C.fill,
      E: palette.E.fill,
      V: palette.V.fill,
      Z: palette.Z.fill,
      GREY: palette.GREY.fill
  };

  const greyHex = palette.GREY.hex;

  // Layer 3: Lots (Filtered by Area) - Added first to be at bottom? No, on top.
  // User said "vão aparecer ou serem filtrados". Usually lots on top of zones.
  // I will push it last.

  // Layer 1: Use Search (Color Fill)
  // Only if use is selected (regrasZonamento exists)
  if (regrasZonamento) {
    const useLayer = JSON.parse(JSON.stringify(PROSPECTIVE_SEARCH_LAYERS_TEMPLATE));
    useLayer.id = "prospective-use-layer";

    // Map colors based on Use Rules ONLY (ignore urban params)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useLayer.colors = templateColors.map((c: any) => {
      const zoneName = c.value;
      // Reset color
      let color = null;

          if (regrasZonamento.simSemNota && regrasZonamento.simSemNota.includes(zoneName)) {
              color = colors.P; 
          } else if (regrasZonamento.simComNota && Object.values(regrasZonamento.simComNota).flat().includes(zoneName)) {
              color = colors.C;
          } else if (regrasZonamento.naoComNota && Object.values(regrasZonamento.naoComNota).flat().includes(zoneName)) {
              color = colors.E; 
          } else if (regrasZonamento.naoSemNota && regrasZonamento.naoSemNota.includes(zoneName)) {
              color = colors.V; 
          } else if (regrasZonamento.zoeZep && regrasZonamento.zoeZep.includes(zoneName)) {
              color = colors.Z; 
          } else {
              // Not in any rule list (e.g. ZOE) -> Explicit Grey
              color = null; 
          }

      return { ...c, color: color };
    });

    // Filter out null colors for SLD generation to keep it clean, OR handle null in generateSLD?
    // My generateSLD handles `if (!color) return;`.
    // So zones without color are not added to rules.
    // But we need them to be transparent?
    // ElseFilter will handle everything else as Grey.
    // Wait, we want "everything else" to be TRANSPARENT for this layer if we only want to show results.
    // But if we want to show the full map context...
    // User said "apenas os resultados da pesquisa por uso".
    // So everything else should be transparent.
    // I will modify generateSLD to accept an ElseFilter color/opacity.

      // User requested "zonas que n atenderem nenhum critério também deve aparecer ... cor cinza"
      // So Use Layer -> Fallback is Grey
      useLayer.properties.sldBody = generateSLD("slui:zoneamento", useLayer.colors, { fill: greyHex, opacity: "0.65", stroke: greyHex, strokeWidth: "0.5", strokeOpacity: "1.0" });
      // We will push useLayer LATER to ensure it is on top (or below depending on logic).
    // User request: "Zonas identificadas por parâmetros (Outline) ficar embaixo do Diretrizes de zoneamento (Fill)".
    // So Fill layer (useLayer) must be LAST (Top).
    // We store it and push later.
  }

  // Layer 2: Urban Params (Black Outline)
  // Only if urban params are active
  if (hasUrbanParams) {
    const paramsLayer = JSON.parse(JSON.stringify(PROSPECTIVE_SEARCH_LAYERS_TEMPLATE));
    paramsLayer.id = "prospective-params-layer";

    // Map colors: Matching -> Black/White Stroke (Theme dependent), No Fill. Non-matching -> Transparent.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paramsLayer.colors = templateColors.map((c: any) => {
      const zoneName = c.value;
      if (matchingZones.includes(zoneName)) {
        // Special marker for generateSLD to know it's outline
        return { ...c, color: "OUTLINE" };
      }
      return { ...c, color: null };
    });

    // Handle Outline color for generateSLD (it currently uses #000000 hardcoded for OUTLINE)
    // I need to modify generateSLD to accept the outline color or use palette.SELECTED.outline
    paramsLayer.properties.sldBody = generateSLD("slui:zoneamento", paramsLayer.colors, { fill: "#FFFFFF", opacity: "0.0", stroke: "#FFFFFF", strokeWidth: "0", strokeOpacity: "0.0" }, true, palette.SELECTED.outline);
    layers.push(paramsLayer);
  }

  // Layer 1: Use Search (Color Fill) - Pushed LAST to be ON TOP
  if (regrasZonamento) {
    const useLayer = JSON.parse(JSON.stringify(PROSPECTIVE_SEARCH_LAYERS_TEMPLATE));
    useLayer.id = "prospective-use-layer";

    // Map colors based on Use Rules ONLY
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useLayer.colors = templateColors.map((c: any) => {
      const zoneName = c.value;
      let color = null;
      if (regrasZonamento.simSemNota && regrasZonamento.simSemNota.includes(zoneName)) {
        color = colors.P;
      } else if (regrasZonamento.simComNota && Object.values(regrasZonamento.simComNota).flat().includes(zoneName)) {
        color = colors.C;
      } else if (regrasZonamento.naoComNota && Object.values(regrasZonamento.naoComNota).flat().includes(zoneName)) {
        color = colors.E; 
      } else if (regrasZonamento.naoSemNota && regrasZonamento.naoSemNota.includes(zoneName)) {
        color = colors.V;
      } else if (regrasZonamento.zoeZep && regrasZonamento.zoeZep.includes(zoneName)) {
        color = colors.Z;
      }
      return { ...c, color: color };
    });

    useLayer.properties.sldBody = generateSLD("slui:zoneamento", useLayer.colors, { fill: greyHex, opacity: "0.65", stroke: greyHex, strokeWidth: "0.5", strokeOpacity: "1.0" });
    layers.push(useLayer);
  }

  // Layer 3: Lots (Filtered by Area)
  if (areaImovel) {
    const lotsLayer = JSON.parse(JSON.stringify(PROSPECTIVE_SEARCH_LAYERS_TEMPLATE));
    lotsLayer.id = "prospective-lots-layer";
    lotsLayer.name = "Lotes Tributários";
    lotsLayer.minZoom = 14; // Only visible at zoom 14+
    lotsLayer.properties.wms.layers = "slui:lote_cidadao";

    const [minArea, maxArea] = areaImovel;

    // Generate SLD for Lots
    const sld = `<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd"><NamedLayer><Name>lote_cidadao</Name><UserStyle><Title>Lots Filter</Title><FeatureTypeStyle><Rule><Name>FilteredLots</Name><ogc:Filter><ogc:PropertyIsBetween><ogc:PropertyName>qt_area_terreno</ogc:PropertyName><ogc:LowerBoundary><ogc:Literal>${minArea}</ogc:Literal></ogc:LowerBoundary><ogc:UpperBoundary><ogc:Literal>${maxArea}</ogc:Literal></ogc:UpperBoundary></ogc:PropertyIsBetween></ogc:Filter><PolygonSymbolizer><Stroke><CssParameter name="stroke">#00FFFF</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke></PolygonSymbolizer></Rule></FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>`;

    lotsLayer.properties.sldBody = sld;
    layers.push(lotsLayer);
  }

  if (layers.length === 0) {
    // If no search active, return default layer (all zones standard colors)?
    // User: "so deve aparecer se tem uma pesquisa".
    // So return empty array.
    return [];
  }

  return layers;
};
