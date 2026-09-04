import { LIGHT_COLORS, DARK_COLORS } from "@open-urbis/map";

export const PROSPECTIVE_SEARCH_LAYERS_TEMPLATE = {
  id: "zoneamento_lei_16402_18177",
  proxyLayerId: "zoneamento_lei_16402_18177",
  name: "Zoneamento - Lei nº 16.402/16+18.177/24",
  origin: "https://geoserver.slui.dev/geoserver/slui/ows",
  isActive: true,
  type: "CustomWMSLayer",
  isVisible: true,
  index: 260,
  minZoom: 10,
  getTextColorPropName: "cd_zoneamento_perimetro",
  getFillColorPropName: "cd_zoneamento_perimetro",
  getLineColorPropName: "cd_zoneamento_perimetro",
  clickAction: {
    action: "SelectFeature",
    params: {
      zoom: 19.5,
    },
  },
  viewTemplate: [
    {
      type: "LabelValueTemplate",
      properties: {
        label: "Zona",
        value: "{{cd_zoneamento_perimetro}}",
      },
    },
    {
      type: "LabelValueTemplate",
      properties: {
        label: "PQA",
        value: "{{tx_zoneamento_perimetro}}",
      },
    },
  ],
  properties: {
    wms: {
      layers: "slui:zoneamento",
    },
  },
  groupId: "urbanistico",
  createdAt: "2026-02-12T02:52:08.889Z",
  updatedAt: "2026-02-12T02:52:08.889Z",
  deletedAt: null,
  colors: [
    {
      id: 355,
      color: [232, 232, 232, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZMISa",
      value: "ZMISa",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 356,
      color: [224, 218, 197, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZOE",
      value: "ZOE",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 357,
      color: [176, 193, 171, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZPDS",
      value: "ZPDS",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 359,
      color: [161, 154, 181, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZPI-1",
      value: "ZPI-1",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 360,
      color: [212, 195, 221, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZPI-2",
      value: "ZPI-2",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 361,
      color: [255, 255, 153, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZPR",
      value: "ZPR",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 358,
      color: [200, 206, 175, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZPDSr",
      value: "ZPDSr",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 324,
      color: [223, 253, 178, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "AC-1",
      value: "AC-1",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 325,
      color: [223, 253, 178, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "AC-2",
      value: "AC-2",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 326,
      color: [208, 234, 197, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "Praça/Canteiro",
      value: "Praça/Canteiro",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 327,
      color: [173, 160, 152, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZC",
      value: "ZC",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 328,
      color: [173, 160, 152, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZCa",
      value: "ZCa",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 329,
      color: [207, 178, 161, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZC-ZEIS",
      value: "ZC-ZEIS",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 330,
      color: [137, 142, 189, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZCOR-1",
      value: "ZCOR-1",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 331,
      color: [129, 186, 226, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZCOR-2",
      value: "ZCOR-2",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 332,
      color: [181, 207, 231, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZCOR-3",
      value: "ZCOR-3",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 333,
      color: [154, 190, 193, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZCORa",
      value: "ZCORa",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 334,
      color: [181, 146, 177, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZDE-1",
      value: "ZDE-1",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 335,
      color: [208, 175, 185, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZDE-2",
      value: "ZDE-2",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 336,
      color: [219, 206, 159, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZEIS-1",
      value: "ZEIS-1",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 337,
      color: [254, 208, 155, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZEIS-2",
      value: "ZEIS-2",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 338,
      color: [255, 230, 170, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZEIS-3",
      value: "ZEIS-3",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 339,
      color: [255, 239, 195, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZEIS-4",
      value: "ZEIS-4",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 340,
      color: [255, 249, 221, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZEIS-5",
      value: "ZEIS-5",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 341,
      color: [212, 159, 148, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZEM",
      value: "ZEM",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 342,
      color: [227, 192, 169, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZEMP",
      value: "ZEMP",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 343,
      color: [145, 170, 149, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZEP",
      value: "ZEP",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 344,
      color: [167, 211, 186, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZEPAM",
      value: "ZEPAM",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 345,
      color: [255, 239, 195, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZER-1",
      value: "ZER-1",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 346,
      color: [255, 225, 158, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZER-2",
      value: "ZER-2",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 347,
      color: [255, 255, 153, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZERa",
      value: "ZERa",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 348,
      color: [189, 138, 140, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZEU",
      value: "ZEU",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 349,
      color: [189, 138, 140, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZEUa",
      value: "ZEUa",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 350,
      color: [196, 158, 157, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZEUP",
      value: "ZEUP",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 351,
      color: [197, 184, 184, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZEUPa",
      value: "ZEUPa",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 352,
      color: [206, 206, 206, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZM",
      value: "ZM",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 353,
      color: [217, 217, 217, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZMa",
      value: "ZMa",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 354,
      color: [186, 186, 186, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "ZMIS",
      value: "ZMIS",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 901,
      color: [186, 186, 186, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "AI",
      value: "AI",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 902,
      color: [186, 186, 186, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "AIa",
      value: "AIa",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 903,
      color: [186, 186, 186, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "AVP-1",
      value: "AVP-1",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
    {
      id: 904,
      color: [186, 186, 186, 190],
      type: "fill",
      pattern: "full",
      patternConfig: null,
      label: "AVP-2",
      value: "AVP-2",
      layerSchemaId: "zoneamento_lei_16402_18177",
    },
  ],
};

const rgbToHex = (r: number, g: number, b: number) => {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
      .toUpperCase()
  );
};

/**
 * Equivalente em SLD (GeoServer) de cada hachura do atlas `/pattern.png`.
 * `size` menor => padrão mais denso, acompanhando as variantes "2x".
 */
const SLD_PATTERN_MARKS: Record<
  string,
  { wellKnownName: string; size: number }
> = {
  "hatch-1x": { wellKnownName: "shape://slash", size: 10 },
  // Alias legado usado por configurações antigas.
  hatch: { wellKnownName: "shape://slash", size: 10 },
  "hatch-1x-reverse": { wellKnownName: "shape://backslash", size: 10 },
  "hatch-2x": { wellKnownName: "shape://slash", size: 5 },
  "hatch-2x-reverse": { wellKnownName: "shape://backslash", size: 5 },
  "hatch-cross": { wellKnownName: "shape://times", size: 10 },
  "hatch-horizontal": { wellKnownName: "shape://horline", size: 5 },
  "hatch-vertical": { wellKnownName: "shape://vertline", size: 5 },
  "hatch-grid": { wellKnownName: "shape://plus", size: 5 },
};

/**
 * Função para gerar o corpo do SLD (Styled Layer Descriptor) da camada.
 * Permite renderização flexível: contornos tracejados, preenchimentos de uso ou hachuras (interseção).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateSLD = (
  layerName: string,
  colors: any[],
  elseFilterStyle: any = null,
  _isOutline: boolean = false,
  outlineColor: string = "#000000",
  isIntersectionMaskTarget: boolean = false,
  isHatch: boolean = false,
) => {
  let rules = "";

  // Agrupa cores (baseado no HEX e na opacidade)
  const colorGroups: Record<string, string[]> = {};

  colors.forEach((item) => {
    const color = item.color;
    if (!color) return;

    let key;
    if (color === "OUTLINE") {
      key = "OUTLINE";
    } else {
      const opacity =
        color[3] !== undefined ? (color[3] / 255).toFixed(2) : "1.0";
      const hex = rgbToHex(color[0], color[1], color[2]);
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
      // Regra especial para a pesquisa de parâmetros urbanísticos
      if (isIntersectionMaskTarget) {
        if (isHatch) {
          // Borda preta em vez de hachura para a interseção
          baseSymbolizer = `<PolygonSymbolizer><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">4</CssParameter><CssParameter name="stroke-opacity">0.5</CssParameter></Stroke></PolygonSymbolizer>`;
        } else {
          // Preenchimento sólido para testes/fallback
          baseSymbolizer = `<PolygonSymbolizer><Fill><CssParameter name="fill">${outlineColor}</CssParameter><CssParameter name="fill-opacity">0.3</CssParameter></Fill></PolygonSymbolizer>`;
        }
      } else {
        // Apenas a borda tracejada normal
        baseSymbolizer = `<PolygonSymbolizer><Stroke><CssParameter name="stroke">${outlineColor}</CssParameter><CssParameter name="stroke-width">2</CssParameter><CssParameter name="stroke-opacity">1</CssParameter><CssParameter name="stroke-dasharray">5 5</CssParameter></Stroke></PolygonSymbolizer>`;
      }
    } else {
      const parts = key.split("-");
      const hex = parts[0];
      const opacity = parts[1];
      const pattern = parts.length > 2 ? parts.slice(2).join("-") : "full";

      // Gera o preenchimento de acordo com o padrão configurado
      let fillContent = `<CssParameter name="fill">${hex}</CssParameter><CssParameter name="fill-opacity">${opacity}</CssParameter>`;

      if (pattern === "dots") {
        fillContent = `<GraphicFill><Graphic><Mark><WellKnownName>circle</WellKnownName><Fill><CssParameter name="fill">${hex}</CssParameter></Fill></Mark><Size>4</Size></Graphic></GraphicFill><CssParameter name="fill-opacity">${opacity}</CssParameter>`;
      } else if (SLD_PATTERN_MARKS[pattern]) {
        const { wellKnownName, size } = SLD_PATTERN_MARKS[pattern];
        fillContent = `<GraphicFill><Graphic><Mark><WellKnownName>${wellKnownName}</WellKnownName><Stroke><CssParameter name="stroke">${hex}</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke></Mark><Size>${size}</Size></Graphic></GraphicFill><CssParameter name="fill-opacity">${opacity}</CssParameter>`;
      }

      baseSymbolizer = `<PolygonSymbolizer><Fill>${fillContent}</Fill></PolygonSymbolizer>`;
      detailSymbolizer = `<PolygonSymbolizer><Stroke><CssParameter name="stroke">${hex}</CssParameter><CssParameter name="stroke-width">0.5</CssParameter><CssParameter name="stroke-opacity">1</CssParameter></Stroke></PolygonSymbolizer>`;

      // Texto exibido no zoom (Apenas para cor preenchida, ou outline normal)
      textSymbolizer = `<TextSymbolizer><Label><ogc:PropertyName>cd_zoneamento_perimetro</ogc:PropertyName></Label><Font><CssParameter name="font-family">Arial</CssParameter><CssParameter name="font-size">10</CssParameter><CssParameter name="font-style">normal</CssParameter><CssParameter name="font-weight">bold</CssParameter></Font><LabelPlacement><PointPlacement><AnchorPoint><AnchorPointX>0.5</AnchorPointX><AnchorPointY>0.5</AnchorPointY></AnchorPoint></PointPlacement></LabelPlacement><Halo><Radius>1</Radius><Fill><CssParameter name="fill">#FFFFFF</CssParameter></Fill></Halo><Fill><CssParameter name="fill">#000000</CssParameter></Fill><VendorOption name="auto">true</VendorOption><VendorOption name="goodnessOfFit">0.1</VendorOption><VendorOption name="maxDisplacement">10</VendorOption></TextSymbolizer>`;
    }

    if (key === "OUTLINE" && !isIntersectionMaskTarget) {
      textSymbolizer = `<TextSymbolizer><Label><ogc:PropertyName>cd_zoneamento_perimetro</ogc:PropertyName></Label><Font><CssParameter name="font-family">Arial</CssParameter><CssParameter name="font-size">10</CssParameter><CssParameter name="font-style">normal</CssParameter><CssParameter name="font-weight">bold</CssParameter></Font><LabelPlacement><PointPlacement><AnchorPoint><AnchorPointX>0.5</AnchorPointX><AnchorPointY>0.5</AnchorPointY></AnchorPoint></PointPlacement></LabelPlacement><Halo><Radius>1</Radius><Fill><CssParameter name="fill">#FFFFFF</CssParameter></Fill></Halo><Fill><CssParameter name="fill">${outlineColor}</CssParameter></Fill><VendorOption name="auto">true</VendorOption><VendorOption name="goodnessOfFit">0.1</VendorOption><VendorOption name="maxDisplacement">10</VendorOption></TextSymbolizer>`;
    }

    let filter = "";
    if (values.length === 1) {
      filter = `<ogc:PropertyIsEqualTo><ogc:PropertyName>cd_zoneamento_perimetro</ogc:PropertyName><ogc:Literal>${values[0].trim()}</ogc:Literal></ogc:PropertyIsEqualTo>`;
    } else {
      const conditions = values
        .map(
          (val) =>
            `<ogc:PropertyIsEqualTo><ogc:PropertyName>cd_zoneamento_perimetro</ogc:PropertyName><ogc:Literal>${val.trim()}</ogc:Literal></ogc:PropertyIsEqualTo>`,
        )
        .join("");
      filter = `<ogc:Or>${conditions}</ogc:Or>`;
    }

    // Regra Base (Sempre visível)
    rules += `<Rule><Name>Group-${key}-Base</Name><ogc:Filter>${filter}</ogc:Filter>${baseSymbolizer}</Rule>`;

    // Regra Detalhe (Apenas no Zoom 14+)
    if (textSymbolizer || (detailSymbolizer && key !== "OUTLINE")) {
      const combinedDetail = `${detailSymbolizer}${textSymbolizer}`;
      if (combinedDetail) {
        rules += `<Rule><Name>Group-${key}-Detail</Name><ogc:Filter>${filter}</ogc:Filter><MaxScaleDenominator>20000</MaxScaleDenominator>${combinedDetail}</Rule>`;
      }
    }
  });

  // Filtro Alternativo (Else) - Preenchimento base para zonas não incluídas
  let elseSymbolizer = "";
  if (elseFilterStyle) {
    elseSymbolizer = `<PolygonSymbolizer><Fill><CssParameter name="fill">${elseFilterStyle.fill}</CssParameter><CssParameter name="fill-opacity">${elseFilterStyle.opacity}</CssParameter></Fill><Stroke><CssParameter name="stroke">${elseFilterStyle.stroke}</CssParameter><CssParameter name="stroke-width">${elseFilterStyle.strokeWidth}</CssParameter><CssParameter name="stroke-opacity">${elseFilterStyle.strokeOpacity}</CssParameter></Stroke></PolygonSymbolizer>`;
  } else {
    elseSymbolizer = `<PolygonSymbolizer><Fill><CssParameter name="fill">#AAAAAA</CssParameter><CssParameter name="fill-opacity">0.5</CssParameter></Fill><Stroke><CssParameter name="stroke">#AAAAAA</CssParameter><CssParameter name="stroke-width">0.5</CssParameter></Stroke></PolygonSymbolizer>`;
  }

  rules += `<Rule><Name>Else</Name><ogc:ElseFilter/>${elseSymbolizer}</Rule>`;

  // Evita erros do GeoServer removendo o prefixo do workspace do NamedLayer
  const safeLayerName = layerName.split(":").pop() || layerName;

  return `<?xml version="1.0" encoding="UTF-8"?><StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd"><NamedLayer><Name>${safeLayerName}</Name><UserStyle><FeatureTypeStyle>${rules}</FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>`;
};

// Funções auxiliares para gerar e estruturar o SLD unificado e individual
const buildPqaFilter = (compatiblePqas: string[]) => {
  const pqaConditions = compatiblePqas
    .map((pqa) => {
      const normalizedPqa = pqa.replace(/-/g, " ").trim();
      return `<ogc:PropertyIsEqualTo><ogc:PropertyName>tx_zoneamento_perimetro</ogc:PropertyName><ogc:Literal>${normalizedPqa}</ogc:Literal></ogc:PropertyIsEqualTo>`;
    })
    .join("");
  return compatiblePqas.length === 1
    ? pqaConditions
    : `<ogc:Or>${pqaConditions}</ogc:Or>`;
};

const buildZonaFilter = (matchingZones: string[]) => {
  const zoneConditions = matchingZones
    .map(
      (val) =>
        `<ogc:PropertyIsEqualTo><ogc:PropertyName>cd_zoneamento_perimetro</ogc:PropertyName><ogc:Literal>${val.trim()}</ogc:Literal></ogc:PropertyIsEqualTo>`,
    )
    .join("");
  return matchingZones.length === 1
    ? zoneConditions
    : `<ogc:Or>${zoneConditions}</ogc:Or>`;
};

/**
 * Retorna o array de camadas do WMS configuradas dinamicamente para o GeoServer,
 * aplicando os filtros de usos, parâmetros urbanísticos e parâmetros de PQA.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getProspectiveSearchLayers = (
  matchingZones: string[] = [],
  regrasZonamento: any = null,
  hasUrbanParams: boolean = false,
  areaImovel: [number, number] | null = null,
  isDarkMode: boolean = false,
  compatiblePqas: string[] = [],
  hasPqaParams: boolean = false,
) => {
  const layers = [];
  const templateColors = PROSPECTIVE_SEARCH_LAYERS_TEMPLATE.colors;

  // Ajusta cores de acordo com o tema
  const palette = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  const colors = {
    P: palette.P.fill,
    C: palette.C.fill,
    E: palette.E.fill,
    V: palette.V.fill,
    Z: palette.Z.fill,
    GREY: palette.GREY.fill,
  };
  const greyHex = palette.GREY.hex;

  // Variável para sinalizar o cruzamento das duas camadas de parâmetros
  const hasBoth =
    hasUrbanParams &&
    hasPqaParams &&
    matchingZones.length > 0 &&
    compatiblePqas.length > 0;

  // 1. CAMADA DE USO E ATIVIDADE (Cores de Permissão: Permitido, Com Nota, Restrito)
  if (regrasZonamento) {
    const useLayer = JSON.parse(
      JSON.stringify(PROSPECTIVE_SEARCH_LAYERS_TEMPLATE),
    );
    useLayer.id = "prospective-use-layer";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useLayer.colors = templateColors.map((c: any) => {
      let color = null;
      if (
        regrasZonamento.simSemNota &&
        regrasZonamento.simSemNota.includes(c.value)
      )
        color = colors.P;
      else if (
        regrasZonamento.simComNota &&
        Object.values(regrasZonamento.simComNota).flat().includes(c.value)
      )
        color = colors.C;
      else if (
        regrasZonamento.naoComNota &&
        Object.values(regrasZonamento.naoComNota).flat().includes(c.value)
      )
        color = colors.E;
      else if (
        regrasZonamento.naoSemNota &&
        regrasZonamento.naoSemNota.includes(c.value)
      )
        color = colors.V;
      else if (
        regrasZonamento.zoeZep &&
        regrasZonamento.zoeZep.includes(c.value)
      )
        color = colors.Z;
      return { ...c, color: color };
    });

    // Zonas não listadas nas regras caem para a cor Cinza (greyHex)
    useLayer.properties.sldBody = generateSLD(
      "slui:zoneamento",
      useLayer.colors,
      {
        fill: greyHex,
        opacity: "0.65",
        stroke: greyHex,
        strokeWidth: "0.5",
        strokeOpacity: "0.8",
      },
    );
    layers.push(useLayer);
  }

  // 2. CAMADA PRINCIPAL: Parâmetros Urbanísticos (Zonas) e Qualificação Ambiental (PQA)
  if (hasUrbanParams || hasPqaParams) {
    const paramsLayer = JSON.parse(
      JSON.stringify(PROSPECTIVE_SEARCH_LAYERS_TEMPLATE),
    );
    paramsLayer.id = "prospective-params-layer";
    paramsLayer.name = "Parâmetros Urbanísticos e Ambientais";

    const layerNames = [];
    let sldBody = `<?xml version="1.0" encoding="UTF-8"?><StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd">`;

    // Configuração de estilo unificado: borda preta tracejada
    const outlineColor = "#000000";

    const zoneFilter =
      matchingZones.length > 0 ? buildZonaFilter(matchingZones) : "";
    const pqaFilter =
      compatiblePqas.length > 0 ? buildPqaFilter(compatiblePqas) : "";

    if (hasBoth) {
      paramsLayer.proxyLayerId = "zoneamento_lei_16402_18177";
      layerNames.push("slui:zoneamento", "slui:qualificacao_ambiental");

      sldBody += `
        <NamedLayer>
          <Name>zoneamento</Name>
          <UserStyle>
            <FeatureTypeStyle>
              <VendorOption name="composite-base">true</VendorOption>
              <Rule>
                <Name>ZoneBorderBase</Name>
                <ogc:Filter>${zoneFilter}</ogc:Filter>
                <MaxScaleDenominator>20000</MaxScaleDenominator>
                <PolygonSymbolizer>
                  <Stroke><CssParameter name="stroke">${outlineColor}</CssParameter><CssParameter name="stroke-width">3</CssParameter><CssParameter name="stroke-dasharray">5 5</CssParameter></Stroke>
                </PolygonSymbolizer>
              </Rule>
              <Rule>
                <Name>ZoneBorderBaseZoomOut</Name>
                <ogc:Filter>${zoneFilter}</ogc:Filter>
                <MinScaleDenominator>20000</MinScaleDenominator>
                <PolygonSymbolizer>
                  <Stroke><CssParameter name="stroke">${outlineColor}</CssParameter><CssParameter name="stroke-width">3</CssParameter><CssParameter name="stroke-dasharray">5 5</CssParameter></Stroke>
                </PolygonSymbolizer>
              </Rule>
              <Rule><Name>Else</Name><ogc:ElseFilter/><PolygonSymbolizer><Fill><CssParameter name="fill">#FFFFFF</CssParameter><CssParameter name="fill-opacity">0.0</CssParameter></Fill></PolygonSymbolizer></Rule>
            </FeatureTypeStyle>
          </UserStyle>
        </NamedLayer>
        
        <NamedLayer>
          <Name>qualificacao_ambiental</Name>
          <UserStyle>
            <FeatureTypeStyle>
              <VendorOption name="composite">destination-in</VendorOption>
              <Rule>
                <Name>PQAMask</Name>
                <ogc:Filter>${pqaFilter}</ogc:Filter>
                <PolygonSymbolizer><Fill><CssParameter name="fill">#000000</CssParameter><CssParameter name="fill-opacity">1.0</CssParameter></Fill></PolygonSymbolizer>
              </Rule>
              <Rule><Name>Else</Name><ogc:ElseFilter/><PolygonSymbolizer><Fill><CssParameter name="fill">#FFFFFF</CssParameter><CssParameter name="fill-opacity">0.0</CssParameter></Fill></PolygonSymbolizer></Rule>
            </FeatureTypeStyle>
          </UserStyle>
        </NamedLayer>
      `;
      sldBody += `</StyledLayerDescriptor>`;
    } else if (hasPqaParams && compatiblePqas.length > 0) {
      // Apenas PQA está selecionado
      paramsLayer.proxyLayerId = "qualificacao_ambiental";
      paramsLayer.name = "Perímetros de Qualificação Ambiental";
      layerNames.push("slui:qualificacao_ambiental");

      sldBody += `
        <NamedLayer>
          <Name>qualificacao_ambiental</Name>
          <UserStyle>
            <FeatureTypeStyle>
              <Rule>
                <Name>PQABorder</Name>
                <ogc:Filter>${pqaFilter}</ogc:Filter>
                <PolygonSymbolizer>
                  <Stroke><CssParameter name="stroke">${outlineColor}</CssParameter><CssParameter name="stroke-width">3</CssParameter><CssParameter name="stroke-dasharray">5 5</CssParameter></Stroke>
                </PolygonSymbolizer>
              </Rule>
              <Rule><Name>Else</Name><ogc:ElseFilter/><PolygonSymbolizer><Fill><CssParameter name="fill">#FFFFFF</CssParameter><CssParameter name="fill-opacity">0.0</CssParameter></Fill></PolygonSymbolizer></Rule>
            </FeatureTypeStyle>
          </UserStyle>
        </NamedLayer>
      `;
      sldBody += `</StyledLayerDescriptor>`;
    } else if (hasUrbanParams && matchingZones.length > 0) {
      // Apenas Zonas
      paramsLayer.proxyLayerId = "zoneamento_lei_16402_18177";
      layerNames.push("slui:zoneamento");
      sldBody += `
        <NamedLayer>
          <Name>zoneamento</Name>
          <UserStyle>
            <FeatureTypeStyle>
              <Rule>
                <Name>ZoneBorder</Name>
                <ogc:Filter>${zoneFilter}</ogc:Filter>
                <MaxScaleDenominator>20000</MaxScaleDenominator>
                <PolygonSymbolizer>
                  <Stroke><CssParameter name="stroke">${outlineColor}</CssParameter><CssParameter name="stroke-width">3</CssParameter><CssParameter name="stroke-dasharray">5 5</CssParameter></Stroke>
                </PolygonSymbolizer>
              </Rule>
              <Rule>
                <Name>ZoneBorderZoomOut</Name>
                <ogc:Filter>${zoneFilter}</ogc:Filter>
                <MinScaleDenominator>20000</MinScaleDenominator>
                <PolygonSymbolizer>
                  <Stroke><CssParameter name="stroke">${outlineColor}</CssParameter><CssParameter name="stroke-width">3</CssParameter><CssParameter name="stroke-dasharray">5 5</CssParameter></Stroke>
                </PolygonSymbolizer>
              </Rule>
              <Rule><Name>Else</Name><ogc:ElseFilter/><PolygonSymbolizer><Fill><CssParameter name="fill">#FFFFFF</CssParameter><CssParameter name="fill-opacity">0.0</CssParameter></Fill></PolygonSymbolizer></Rule>
            </FeatureTypeStyle>
          </UserStyle>
        </NamedLayer>
      `;
      sldBody += `</StyledLayerDescriptor>`;
    }

    paramsLayer.properties.wms.layers = layerNames.join(",");
    paramsLayer.properties.sldBody = sldBody;

    // Fallback: garante que os dois properties existam se ambas as camadas forem consultadas
    paramsLayer.viewTemplate = [
      {
        type: "LabelValueTemplate",
        properties: { label: "PQA", value: "{{tx_zoneamento_perimetro}}" },
      },
      {
        type: "LabelValueTemplate",
        properties: { label: "Zona", value: "{{cd_zoneamento_perimetro}}" },
      },
    ];

    if (layerNames.length > 0) {
      layers.push(paramsLayer);
    }
  }

  // 3. CAMADA DE LOTES (Apenas Filtro por Área)
  if (areaImovel) {
    const lotsLayer = JSON.parse(
      JSON.stringify(PROSPECTIVE_SEARCH_LAYERS_TEMPLATE),
    );
    lotsLayer.id = "prospective-lots-layer";
    lotsLayer.proxyLayerId = "lotes_fiscais";
    lotsLayer.name = "Lotes fiscais";
    lotsLayer.minZoom = 13;
    lotsLayer.properties.wms.layers = "slui:lotes_fiscais";

    const [minArea, maxArea] = areaImovel;
    const sld = `<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd"><NamedLayer><Name>lotes_fiscais</Name><UserStyle><Title>Lots Filter</Title><FeatureTypeStyle><Rule><Name>FilteredLots</Name><ogc:Filter><ogc:And><ogc:PropertyIsEqualTo><ogc:PropertyName>tipo_lote_fiscal</ogc:PropertyName><ogc:Literal>Fiscal</ogc:Literal></ogc:PropertyIsEqualTo><ogc:PropertyIsBetween><ogc:PropertyName>area_terreno</ogc:PropertyName><ogc:LowerBoundary><ogc:Literal>${minArea}</ogc:Literal></ogc:LowerBoundary><ogc:UpperBoundary><ogc:Literal>${maxArea}</ogc:Literal></ogc:UpperBoundary></ogc:PropertyIsBetween></ogc:And></ogc:Filter><PolygonSymbolizer><Stroke><CssParameter name="stroke">#00FFFF</CssParameter><CssParameter name="stroke-width">1.5</CssParameter></Stroke></PolygonSymbolizer></Rule></FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>`;

    lotsLayer.properties.sldBody = sld;
    lotsLayer.viewTemplate = [
      {
        type: "LabelValueTemplate",
        properties: {
          label: "SQL",
          value: "{{sql}}",
        },
      },
      {
        type: "LabelValueTemplate",
        properties: {
          label: "Área do Terreno",
          value: "{{area_terreno}} m²",
        },
      },
      {
        type: "LabelValueTemplate",
        properties: {
          label: "Logradouro",
          value: "{{logradouro}}",
        },
      },
      {
        type: "LabelValueTemplate",
        properties: {
          label: "Número",
          value: "{{numero}}",
        },
      },
    ];
    layers.push(lotsLayer);
  }

  // Se nada for selecionado e a tela estiver "vazia" nas barras laterais de filtro
  if (layers.length === 0) return [];

  return layers;
};
