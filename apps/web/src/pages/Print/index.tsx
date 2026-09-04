import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { useSignal } from "@preact/signals";
import DeckGL from "deck.gl";
import { GeoJsonLayer } from "@deck.gl/layers";
import { Map } from "react-map-gl/maplibre";

import { FeaturesView } from "../../components/FeaturesView";
import { ITemplate } from "../../components/ViewTemplate/types/templates-type";
import { buildSemanticTemplateGridItems } from "../../components/ViewTemplate/semantic-columns";
import { getLayerSchema } from "../../integrations/layer-schema-integration";
import { getMapConfig, getIntersections } from "../../integrations/map-integration";
import { getMapStyle } from "../../components/MapView/base-map-styles";
import { useTheme } from "../../components/ThemeProvider";
import Header from "../../components/Header";
import { Button, UrbisFooter, UrbisIcon } from "@open-urbis/map-ui";
import { Search } from "../../components/Search";
import proj4 from "proj4";
import {
  FIU_STORAGE_PREFIX,
  convertGeoJsonToDxf,
  getFiuPayload,
  getFeatureAreaSquareMeters,
} from "../../utils/fiu";
import { getOptionalAuthHeaders } from "../../utils/auth-headers";
import { useProspectiveSearchContext } from "../../components/ProspectiveSearch/ProspectiveSearchContext";
import { IntendedUseCard } from "../../components/ProspectiveSearch/ui/IntendedUseCard";
import { UsoSearchResultItem } from "../../components/ProspectiveSearch/utils/types";
import {
  NOTAS_DICTIONARY,
  formatParameter,
} from "../../components/ProspectiveSearch/utils/labels";
import {
  getRegrasZonamento,
  getCondicoesInstalacao,
  pesquisarUsos,
} from "../../components/ProspectiveSearch/utils/use-logic";

const QUADRO_4A_NOTES: Record<string, string> = {
  "(4A - a)":
    "Não se aplica nas zonas de uso ZEU, ZEUa, ZEUP, ZEUPa, ZEM, ZEMP e nos usos não residenciais em lotes com área inferior a 250m² (duzentos e cinquenta metros quadrados) em todas as zonas.",
  "(4A - b)": "De acordo com o Código de Obras e Edificações.",
  "(4A - c)":
    "Não se exige vaga para carga e descarga nos lotes com área até 250m² (duzentos e cinquenta metros quadrados), exceto em lotes localizados na Macroárea de Urbanização Consolidada e nos seguintes setores e subsetores da Macroárea de Estruturação Metropolitana: I. Subsetores Arco Tietê, Arco Pinheiros e Arco Faria Lima - Águas Espraiadas - Chucri Zaidan do Setor Orla Ferroviária e Fluvial. II. Setor Central (Operação Urbana Centro).",
  "(4A - d)":
    "Para empreendimentos não residenciais acima de 10.000m² (dez mil metros quadrados) de área construída computável, as vagas para caminhão podem ser compartilhadas com os veículos fretados.",
  "(4A - e)":
    "Para Serviços de Armazenamento e Guarda de Bens Móveis das subcategorias de uso nR1, nR2 e nR3, o número mínimo de vagas de automóveis exigido será calculado com base na área construída computável destinada à permanência humana.",
  "(4A - f)":
    "Quando exigido o número mínimo de vagas de automóveis, este deverá ser acrescido do número de vagas especiais conforme definido no Código de Obras e Edificações.",
  "(4A - g)":
    "O atendimento da vaga de caminhão poderá ser dispensado caso haja parecer favorável do órgão municipal de trânsito.",
  "(4A - h)":
    "Para o cálculo de vagas de utilitário, deverá ser considerada a área computável.",
  "(4A - i)":
    "Para estabelecimentos de ensino, o número mínimo de vagas por área construída computável (em m²), será calculated com base na área construída computável destinada às atividades administrativas.",
  "(4A - j)":
    "Nas ZEU e ZEUP ativada, a largura mínima da via será de 12m (doze metros) quando o empreendimento tiver a previsão de vagas de estacionamento.",
};

const getObjValue = (obj: any, keys: string[]): string => {
  if (!obj) return "";
  const foundKey = Object.keys(obj).find((k) =>
    keys.some((key) => key.toLowerCase() === k.trim().toLowerCase()),
  );
  return foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null
    ? String(obj[foundKey]).trim()
    : "";
};

const findZoneData = (zoneName: string, parametrosZonasData: any[]) => {
  if (!parametrosZonasData || !Array.isArray(parametrosZonasData) || !zoneName)
    return null;
  const cleanTarget = zoneName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  const exact = parametrosZonasData.find((row) => {
    const rowZone = String(
      row.zona ||
        row.Zona ||
        row.zonaDeUso ||
        row.zonaUso ||
        row.cd_zona ||
        Object.values(row)[0] ||
        "",
    );
    const cleanRow = rowZone.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return cleanRow === cleanTarget;
  });
  if (exact) return exact;

  return (
    parametrosZonasData.find((row) => {
      const rowZone = String(
        row.zona ||
          row.Zona ||
          row.zonaDeUso ||
          row.zonaUso ||
          row.cd_zona ||
          Object.values(row)[0] ||
          "",
      );
      const cleanRow = rowZone.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      return cleanRow.includes(cleanTarget) || cleanTarget.includes(cleanRow);
    }) || null
  );
};

const findPqaData = (pqaName: string, parametrosPqaData: any[]) => {
  if (!parametrosPqaData || !Array.isArray(parametrosPqaData) || !pqaName)
    return null;
  const cleanTarget = pqaName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  const exact = parametrosPqaData.find((row) => {
    const rowPqa = String(
      row.perimetroQualificacaoAmbiental ||
        row.perimetro ||
        row.Perimetro ||
        row.pqa ||
        row.PQA ||
        Object.values(row)[0] ||
        "",
    );
    const cleanRow = rowPqa.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return cleanRow === cleanTarget;
  });
  if (exact) return exact;

  return (
    parametrosPqaData.find((row) => {
      const rowPqa = String(
        row.perimetroQualificacaoAmbiental ||
          row.perimetro ||
          row.Perimetro ||
          row.pqa ||
          row.PQA ||
          Object.values(row)[0] ||
          "",
      );
      const cleanRow = rowPqa.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      return cleanRow.includes(cleanTarget) || cleanTarget.includes(cleanRow);
    }) || null
  );
};

const formatNumberValue = (val: any, decimals = 2): string => {
  if (
    val === undefined ||
    val === null ||
    val === "" ||
    String(val).trim() === "-" ||
    String(val).trim() === "-Infinity"
  )
    return "-";
  const str = String(val).trim();
  if (
    str.toUpperCase().startsWith("NA") ||
    str.toUpperCase().startsWith("ND") ||
    str.toUpperCase().startsWith("N.A.")
  )
    return "Não aplicável";
  const num = typeof val === "number" ? val : parseFloat(str.replace(",", "."));
  if (Number.isFinite(num)) {
    return num.toLocaleString("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return str;
};

const formatPercentValue = (val: any): string => {
  if (
    val === undefined ||
    val === null ||
    val === "" ||
    String(val).trim() === "-"
  )
    return "-";
  const str = String(val).trim();
  if (
    str.toUpperCase().startsWith("NA") ||
    str.toUpperCase().startsWith("ND") ||
    str.toUpperCase().startsWith("N.A.")
  )
    return "Não aplicável";
  const num = typeof val === "number" ? val : parseFloat(str.replace(",", "."));
  if (Number.isFinite(num)) {
    if (num > 0 && num <= 1) {
      return `${(num * 100).toFixed(0)}% (${num.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })})`;
    }
    return `${num.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}%`;
  }
  return str;
};

const formatGabaritoValue = (val: any): string => {
  if (
    val === undefined ||
    val === null ||
    val === "" ||
    String(val).trim() === "-"
  )
    return "Sem limite regulamentar";
  const s = String(val).trim().toUpperCase();
  if (
    s.startsWith("NA") ||
    s.startsWith("ND") ||
    s.startsWith("N.A.") ||
    s === "SEM LIMITE"
  )
    return "Sem limite regulamentar";
  const num =
    typeof val === "number"
      ? val
      : parseFloat(String(val).replace(",", ".").trim());
  if (Number.isFinite(num)) {
    return `${num.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} m`;
  }
  return String(val);
};

const formatSetbackValue = (val: any): string => {
  if (
    val === undefined ||
    val === null ||
    val === "" ||
    String(val).trim() === "-"
  )
    return "Dispensado";
  const s = String(val).trim().toUpperCase();
  if (
    s.startsWith("NA") ||
    s.startsWith("ND") ||
    s === "0" ||
    s === "0.0" ||
    s === "0,0" ||
    s === "DISPENSADO"
  )
    return "Dispensado";
  const num =
    typeof val === "number"
      ? val
      : parseFloat(String(val).replace(",", ".").trim());
  if (Number.isFinite(num)) {
    return num === 0
      ? "Dispensado"
      : `${num.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} m`;
  }
  return String(val);
};

const getNoteFullText = (noteId: string): string => {
  if (!noteId) return "";
  const clean = noteId.replace(/[()]/g, "").trim();
  const normalized = clean.replace(/\s*-\s*/g, " - ");
  return (
    NOTAS_DICTIONARY[clean] ||
    NOTAS_DICTIONARY[normalized] ||
    NOTAS_DICTIONARY[noteId] ||
    QUADRO_4A_NOTES[noteId] ||
    QUADRO_4A_NOTES[`(${clean})`] ||
    "Consulte o texto oficial da nota correspondente na Lei nº 16.402/2016."
  );
};

const getZonePermissibility = (zoneName: string, regrasZonamento: any) => {
  if (!regrasZonamento) return null;
  const cleanZone = zoneName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  const matchInList = (list: string[] = []) =>
    Array.isArray(list) &&
    list.some(
      (z) => z.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() === cleanZone,
    );

  // 1. ZOE / ZEP / AL (Regime Especial)
  if (
    cleanZone === "ZOE" ||
    cleanZone === "ZEP" ||
    cleanZone.startsWith("ZOE") ||
    cleanZone.startsWith("ZEP") ||
    matchInList(regrasZonamento.zoeZep)
  ) {
    return {
      status: "regime_especial",
      label: "Regime Especial",
      badgeColor: "bg-purple-50 text-purple-900 border-purple-200",
      description:
        "Uso regrado por regime urbanístico especial / PIU (ZOE / ZEP / AL).",
      notes: [],
    };
  }

  // 2. Permitido em regra (S)
  if (matchInList(regrasZonamento.simSemNota)) {
    return {
      status: "permitido",
      label: "Permitido (em regra)",
      badgeColor: "bg-emerald-50 text-emerald-900 border-emerald-200",
      description:
        "Uso permitido por regra geral nesta zona de uso conforme o Quadro nº 4 da Lei nº 16.402/2016.",
      notes: [],
    };
  }

  // 3. Permitido com condições (S com notas)
  const simNotas: string[] = [];
  Object.entries(regrasZonamento.simComNota || {}).forEach(
    ([nota, zonas]: [string, any]) => {
      if (Array.isArray(zonas) && matchInList(zonas)) {
        simNotas.push(nota);
      }
    },
  );
  if (simNotas.length > 0) {
    return {
      status: "permitido_condicionado",
      label: "Permitido com condições",
      badgeColor: "bg-amber-50 text-amber-900 border-amber-200",
      description:
        "Uso permitido nesta zona sujeito ao atendimento das condições regulamentares da LPUOS.",
      notes: simNotas,
    };
  }

  // 4. Proibido com ressalvas (N com notas)
  const naoNotas: string[] = [];
  Object.entries(regrasZonamento.naoComNota || {}).forEach(
    ([nota, zonas]: [string, any]) => {
      if (Array.isArray(zonas) && matchInList(zonas)) {
        naoNotas.push(nota);
      }
    },
  );
  if (naoNotas.length > 0) {
    return {
      status: "proibido_ressalvas",
      label: "Proibido, exceto condições",
      badgeColor: "bg-rose-50 text-rose-900 border-rose-200",
      description:
        "Uso proibido em regra nesta zona, admitindo exceção apenas nos casos previstos em nota regulamentar.",
      notes: naoNotas,
    };
  }

  // 5. Proibido (N)
  if (matchInList(regrasZonamento.naoSemNota)) {
    return {
      status: "proibido",
      label: "Proibido",
      badgeColor: "bg-rose-50 text-rose-900 border-rose-200",
      description:
        "Uso vedado / não permitido nesta zona de uso conforme o Quadro nº 4 da Lei nº 16.402/2016.",
      notes: [],
    };
  }

  return {
    status: "sob_consulta",
    label: "Sob consulta técnica",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
    description: "Zona com regras específicas sob análise territorial.",
    notes: [],
  };
};

const waitForImagesToRender = async (element: HTMLElement) => {
  const images = Array.from(element.querySelectorAll("img"));

  await Promise.all(
    images.map(async (image) => {
      if (image.complete && image.naturalWidth > 0) return;

      await new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });

      await image.decode().catch(() => undefined);
    }),
  );
};

const FiuInteractiveMap = ({
  feature,
  responseFeatures = [],
  selectedFeatureId,
  onSelectFeature,
}: {
  feature: any;
  responseFeatures?: any[];
  selectedFeatureId?: string | null;
  onSelectFeature?: (feature: any) => void;
}) => {
  const [baseStyle, setBaseStyle] = useState<"satellite" | "positron">("satellite");
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const mapRef = useRef<any>(null);

  const { center, zoom } = useMemo(() => {
    const geo = feature?.geometry || feature;
    if (!geo?.coordinates) {
      return { center: [-46.6333, -23.5505] as [number, number], zoom: 16 };
    }

    const coords: number[][] = [];
    const extract = (c: any) => {
      if (!Array.isArray(c)) return;
      if (typeof c[0] === "number" && typeof c[1] === "number") {
        coords.push(c as number[]);
      } else {
        c.forEach(extract);
      }
    };
    extract(geo.coordinates);

    if (coords.length === 0) {
      return { center: [-46.6333, -23.5505] as [number, number], zoom: 16 };
    }

    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    for (const [lon, lat] of coords) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    const delta = Math.max(maxLon - minLon, (maxLat - minLat) * 1.5);
    let z = 16.5;
    if (delta > 0.05) z = 12;
    else if (delta > 0.02) z = 13.5;
    else if (delta > 0.008) z = 15;
    else if (delta > 0.003) z = 16;
    else if (delta > 0.001) z = 17;
    else z = 18;

    return {
      center: [(minLon + maxLon) / 2, (minLat + maxLat) / 2] as [number, number],
      zoom: z,
    };
  }, [feature]);

  const [viewState, setViewState] = useState({
    longitude: center[0],
    latitude: center[1],
    zoom: zoom,
    pitch: 0,
    bearing: 0,
  });

  useEffect(() => {
    setViewState((prev) => ({
      ...prev,
      longitude: center[0],
      latitude: center[1],
      zoom: zoom,
    }));
  }, [center, zoom]);

  const layers = useMemo(() => {
    const list: any[] = [];

    // Intersecting features (Zoneamento, PQA, restrições)
    if (responseFeatures && responseFeatures.length > 0) {
      list.push(
        new GeoJsonLayer({
          id: "fiu-intersecting-layers",
          data: responseFeatures,
          filled: true,
          stroked: true,
          pickable: true,
          getFillColor: (f: any) => {
            const isSelected =
              selectedFeatureId &&
              (f.id === selectedFeatureId || f?.properties?.id === selectedFeatureId);
            if (isSelected) return [59, 130, 246, 90];
            return [148, 163, 184, 30];
          },
          getLineColor: (f: any) => {
            const isSelected =
              selectedFeatureId &&
              (f.id === selectedFeatureId || f?.properties?.id === selectedFeatureId);
            if (isSelected) return [37, 99, 235, 255];
            return [100, 116, 139, 180];
          },
          getLineWidth: (f: any) => {
            const isSelected =
              selectedFeatureId &&
              (f.id === selectedFeatureId || f?.properties?.id === selectedFeatureId);
            return isSelected ? 2.5 : 1;
          },
          lineWidthUnits: "pixels",
          onHover: (info: any) => setHoverInfo(info),
          onClick: (info: any) => {
            if (info.object && onSelectFeature) {
              onSelectFeature(info.object);
            }
          },
        }),
      );
    }

    // Main queried polygon / lot
    if (feature?.geometry) {
      list.push(
        new GeoJsonLayer({
          id: "fiu-queried-property",
          data: feature,
          filled: true,
          stroked: true,
          pickable: true,
          getFillColor: [6, 182, 212, 60],
          getLineColor: [6, 182, 212, 255],
          getLineWidth: 2.5,
          lineWidthUnits: "pixels",
          onHover: (info: any) => {
            if (info.object) {
              setHoverInfo({
                ...info,
                isMainProperty: true,
              });
            } else {
              setHoverInfo(null);
            }
          },
          onClick: (info: any) => {
            if (info.object && onSelectFeature) {
              onSelectFeature(info.object);
            }
          },
        }),
      );
    }

    return list;
  }, [feature, responseFeatures, selectedFeatureId, onSelectFeature]);

  const mapStyle = useMemo(() => {
    if (baseStyle === "positron") {
      return getMapStyle(
        "openfreemap-positron",
        "light",
        import.meta.env.VITE_API_URL || "/api",
      );
    }
    return getMapStyle(
      "satellite-streets",
      "light",
      import.meta.env.VITE_API_URL || "/api",
    );
  }, [baseStyle]);

  return (
    <div className="relative w-full h-[260px] sm:h-[300px] rounded-xl overflow-hidden border border-slate-200/80 bg-slate-100">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: next }: any) => setViewState(next)}
        controller={true}
        layers={layers}
        getCursor={({ isHovering }) => (isHovering ? "pointer" : "default")}
      >
        <Map
          ref={mapRef}
          attributionControl={false}
          mapStyle={mapStyle as any}
        />
      </DeckGL>

      {/* Map style toggle and reset view buttons (hidden in print) */}
      <div
        className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-2 py-1 rounded-lg border border-slate-200 shadow-xs z-10 print:hidden"
        data-fiu-pdf-ignore="true"
      >
        <button
          type="button"
          onClick={() =>
            setBaseStyle(baseStyle === "satellite" ? "positron" : "satellite")
          }
          className="text-[11px] font-medium text-slate-700 hover:text-slate-950 transition-colors"
        >
          {baseStyle === "satellite" ? "Mapa claro" : "Satélite"}
        </button>
        <span className="text-slate-300">·</span>
        <button
          type="button"
          onClick={() =>
            setViewState({
              longitude: center[0],
              latitude: center[1],
              zoom: zoom,
              pitch: 0,
              bearing: 0,
            })
          }
          className="text-[11px] font-medium text-slate-700 hover:text-slate-950 transition-colors"
        >
          Centralizar
        </button>
      </div>

      {/* Hover tooltip */}
      {hoverInfo?.object && hoverInfo?.coordinate && (
        <div
          className="absolute z-20 pointer-events-none px-2.5 py-1.5 rounded-md bg-slate-900/90 text-white text-[11px] shadow-md border border-slate-700 max-w-xs leading-snug"
          style={{
            left: `${hoverInfo.x + 12}px`,
            top: `${hoverInfo.y + 12}px`,
          }}
        >
          {hoverInfo.isMainProperty ? (
            <div>
              <span className="font-semibold text-cyan-300">Imóvel consultado</span>
              {hoverInfo.object.properties?.sql && (
                <div className="text-[10px] text-slate-300">
                  SQL: {hoverInfo.object.properties.sql}
                </div>
              )}
            </div>
          ) : (
            <div>
              <span className="font-medium text-slate-100">
                {hoverInfo.object.properties?.layerSchemaName ||
                  hoverInfo.object.properties?.tx_zoneamento_perimetro ||
                  hoverInfo.object.properties?.cd_zoneamento_perimetro ||
                  hoverInfo.object.properties?.nm_tema_divisao_pde ||
                  hoverInfo.object.properties?.name ||
                  hoverInfo.object.id ||
                  "Polígono incidente"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PrintPage = () => {
  const { setTheme } = useTheme();
  const loading = useSignal<boolean>(false);
  const error = useSignal<string>("");
  const template = useSignal<ITemplate[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = useSignal<any>(null);

  const isInteractive = useSignal<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Preparando a Ficha de Informações Urbanísticas...",
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const prospectiveContext = useProspectiveSearchContext();

  const {
    usosData = [],
    cnaeData = [],
    cnaeCatalogData: _cnaeCatalogData = [],
    usosPorZonaData = [],
    parametrosUsoData = [],
    parametrosZonasData = [],
    parametrosPqaData = [],
  } = prospectiveContext || {};

  const [selectedUse, setSelectedUse] = useState<UsoSearchResultItem | null>(null);

  const selectedUseCode = useMemo(() => {
    if (!selectedUse) return "";
    const getVal = (obj: any, keys: string[]) => {
      if (!obj) return "";
      const foundKey = Object.keys(obj).find((k) =>
        keys.some((key) => key.toLowerCase() === k.trim().toLowerCase()),
      );
      return foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null
        ? String(obj[foundKey]).trim()
        : "";
    };

    const rawCode =
      getVal(selectedUse?.arvore?.tipologiaOuGrupo, [
        "Código",
        "Codigo",
        "codigo",
      ]) ||
      getVal(selectedUse?.arvore?.subtipologiaOuAtividade, [
        "Código",
        "Codigo",
        "codigo",
      ]) ||
      getVal(selectedUse?.item, ["Código", "Codigo", "codigo"]);

    if (!rawCode) return "";

    if (rawCode.startsWith("HIS1-")) return "HIS1";
    if (rawCode.startsWith("HIS2-")) return "HIS2";
    if (rawCode.startsWith("HMP-")) return "HMP";

    return rawCode;
  }, [selectedUse]);

  const regrasZonamento = useMemo(() => {
    if (!selectedUseCode || !usosPorZonaData?.length) return null;
    return getRegrasZonamento(selectedUseCode, usosPorZonaData);
  }, [selectedUseCode, usosPorZonaData]);

  const condicoesInstalacao = useMemo(() => {
    if (!selectedUseCode || !parametrosUsoData?.length) return [];
    return getCondicoesInstalacao(selectedUseCode, parametrosUsoData);
  }, [selectedUseCode, parametrosUsoData]);

  useEffect(() => {
    if (!selectedUse && usosData?.length > 0 && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const usoQuery = params.get("uso") || params.get("usoId");
      if (usoQuery) {
        const decodedUso = decodeURIComponent(usoQuery);
        const searchRes = pesquisarUsos(
          decodedUso,
          usosData,
          cnaeData,
          "atividade",
        );
        if (searchRes?.resultados?.length > 0) {
          setSelectedUse(searchRes.resultados[0]);
        }
      }
    }
  }, [usosData, cnaeData, selectedUse]);

  const semanticGridItems = buildSemanticTemplateGridItems(template.value, 4);

  const fiuUrbanContext = useMemo(() => {
    const rawProps = data.value?.properties ?? {};
    const features: any[] = data.value?.response?.features ?? [];

    const getFeatureName = (feature: any) => {
      const p = feature?.properties || {};
      return (
        p.tx_zoneamento_perimetro ||
        p.cd_zoneamento_perimetro ||
        p.nm_perimetro_divisao_pde ||
        p.nm_tema_divisao_pde ||
        p.nm_subprefeitura ||
        p.nm_distrito_municipal ||
        p.nm_distrito ||
        p.nm_area_tombada ||
        p.nm_area ||
        p.layerSchemaName ||
        (p.layer ? String(p.layer).replace("slui:", "") : null)
      );
    };

    const uniqueNames = (items: any[]) =>
      Array.from(new Set(items.map(getFeatureName).filter(Boolean)));

    // Extrair SQL
    const rawSql =
      rawProps.cd_sql_formatado ||
      rawProps.sql_formatado ||
      rawProps.nr_sql ||
      rawProps.sql ||
      (rawProps.cd_setor_fiscal
        ? `${rawProps.cd_setor_fiscal}.${rawProps.cd_quadra_fiscal}.${rawProps.cd_lote}-${rawProps.cd_digito_lote ?? rawProps.cd_digito ?? ""}`
        : null);

    // Extrair Endereço
    const logradouro =
      rawProps.nm_logradouro_oficial ||
      rawProps.nm_logradouro ||
      rawProps.tx_nome_logradouro ||
      rawProps.endereco ||
      rawProps.tx_endereco;
    const numero = rawProps.nr_imovel || rawProps.numero;
    const enderecoCompleto = logradouro
      ? `${logradouro}${numero ? `, ${numero}` : ""}`
      : null;

    // Área
    const rawArea =
      rawProps.vl_area_terreno ||
      rawProps.area_terreno ||
      rawProps.vl_area_lote ||
      rawProps.area_lote ||
      rawProps.totalarea;
    const calculatedArea = data.value ? getFeatureAreaSquareMeters(data.value) : 0;
    const areaM2 = rawArea ? Number(rawArea) : calculatedArea;

    // Zoneamento
    const zoneFeatures = features.filter((feature: any) => {
      const id = String(feature?.id ?? "").toLowerCase();
      const layer = String(feature?.properties?.layer ?? "").toLowerCase();
      const schemaId = String(feature?.properties?.layerSchemaId ?? "").toLowerCase();
      return id.includes("zoneamento") || layer.includes("zoneamento") || schemaId.includes("zoneamento");
    });
    const directZone =
      rawProps.tx_zoneamento_perimetro ||
      rawProps.cd_zoneamento_perimetro ||
      rawProps.sigla_zoneamento ||
      rawProps.zona;
    const zones = uniqueNames(zoneFeatures);
    if (directZone && !zones.includes(directZone)) {
      zones.unshift(directZone);
    }

    // PQA
    const pqaFeatures = features.filter((feature: any) => {
      const id = String(feature?.id ?? "").toLowerCase();
      const layer = String(feature?.properties?.layer ?? "").toLowerCase();
      const schemaId = String(feature?.properties?.layerSchemaId ?? "").toLowerCase();
      return (
        id.includes("qualificacao_ambiental") ||
        id.includes("pqa") ||
        layer.includes("qualificacao_ambiental") ||
        layer.includes("pqa") ||
        schemaId.includes("qualificacao_ambiental") ||
        schemaId.includes("pqa")
      );
    });
    const directPqa = rawProps.nm_perimetro_pqa || rawProps.pqa;
    const pqa = uniqueNames(pqaFeatures);
    if (directPqa && !pqa.includes(directPqa)) {
      pqa.unshift(directPqa);
    }

    // Subprefeitura e Distrito
    const subprefeitura =
      rawProps.nm_subprefeitura ||
      rawProps.subprefeitura ||
      uniqueNames(features.filter((f) => String(f?.id || "").includes("subprefeitura")))[0] ||
      "-";

    const distrito =
      rawProps.nm_distrito_municipal ||
      rawProps.nm_distrito ||
      rawProps.distrito ||
      uniqueNames(features.filter((f) => String(f?.id || "").includes("distrito")))[0] ||
      "-";

    const bairro = rawProps.nm_bairro || rawProps.bairro || "-";
    const cep = rawProps.cd_cep || rawProps.cep || "-";

    // Macroárea
    const macroarea =
      rawProps.nm_macroarea ||
      rawProps.macroarea ||
      uniqueNames(features.filter((f) => String(f?.id || "").includes("macro")))[0] ||
      "-";

    // Coordenadas
    let latLonText = "-";
    let utmText = "-";
    const geom = data.value?.geometry || data.value;
    if (geom?.coordinates) {
      try {
        let firstCoord: number[] | null = null;
        if (geom.type === "Point") firstCoord = geom.coordinates;
        else if (geom.type === "Polygon") firstCoord = geom.coordinates[0][0];
        else if (geom.type === "MultiPolygon") firstCoord = geom.coordinates[0][0][0];

        if (firstCoord && firstCoord.length >= 2) {
          const lon = Number(firstCoord[0]);
          const lat = Number(firstCoord[1]);
          if (Number.isFinite(lon) && Number.isFinite(lat)) {
            latLonText = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
            try {
              const [easting, northing] = proj4("EPSG:4326", "EPSG:31983", [lon, lat]);
              utmText = `X: ${easting.toFixed(2)} m, Y: ${northing.toFixed(2)} m (SIRGAS 2000 / UTM 23S)`;
            } catch {
              // fallback
            }
          }
        }
      } catch {
        // fallback
      }
    }

    // Restrições e Camadas Incidentes
    const heritageFeatures = features.filter((f: any) => {
      const id = String(f?.id ?? "").toLowerCase();
      const p = f?.properties ?? {};
      const layer = String(p.layer ?? "").toLowerCase();
      return (
        id.includes("tombamento") ||
        id.includes("zepec") ||
        id.includes("cit_") ||
        id.includes("idesp_") ||
        id.includes("patrimonio") ||
        layer.includes("tombamento") ||
        layer.includes("zepec")
      );
    });

    const envFeatures = features.filter((f: any) => {
      const id = String(f?.id ?? "").toLowerCase();
      const p = f?.properties ?? {};
      const layer = String(p.layer ?? "").toLowerCase();
      return (
        id.includes("mananciais") ||
        id.includes("apm") ||
        id.includes("aprm") ||
        id.includes("vegetacao") ||
        id.includes("drenagem") ||
        id.includes("agua") ||
        layer.includes("mananciais") ||
        layer.includes("vegetacao")
      );
    });

    const riskFeatures = features.filter((f: any) => {
      const id = String(f?.id ?? "").toLowerCase();
      const p = f?.properties ?? {};
      const layer = String(p.layer ?? "").toLowerCase();
      return (
        id.includes("risco") ||
        id.includes("contamina") ||
        layer.includes("risco") ||
        layer.includes("contamina")
      );
    });

    return {
      sql: rawSql || "Identificação Georreferenciada",
      iptu: rawProps.cd_iptu || rawProps.nr_iptu || rawProps.iptu || "-",
      endereco: enderecoCompleto || "Endereço cadastral não especificado",
      subprefeitura,
      distrito,
      bairro,
      cep,
      areaM2: areaM2 > 0 ? areaM2.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-",
      areaNumeric: areaM2,
      testada: rawProps.vl_testada_principal || rawProps.testada ? `${Number(rawProps.vl_testada_principal || rawProps.testada).toFixed(2)} m` : "-",
      latLonText,
      utmText,
      zones: zones.length ? zones : ["Zona não categorizada"],
      primaryZone: zones[0] || "Zona Urbana",
      macroarea,
      pqa: pqa.length ? pqa : ["PA 1 (Padrão)"],
      heritage: uniqueNames(heritageFeatures),
      environmental: uniqueNames(envFeatures),
      risks: uniqueNames(riskFeatures),
      totalIntersecting: features.length,
    };
  }, [data.value]);

  const getGridSpanClass = (span: number) => {
    const map: Record<number, string> = {
      1: "md:col-span-1",
      2: "md:col-span-2",
      3: "md:col-span-3",
      4: "md:col-span-4",
      5: "md:col-span-5",
      6: "md:col-span-6",
      7: "md:col-span-7",
      8: "md:col-span-8",
      9: "md:col-span-9",
      10: "md:col-span-10",
      11: "md:col-span-11",
      12: "md:col-span-12",
    };

    return map[span] ?? "md:col-span-4";
  };

  const downloadFiuGeoJson = () => {
    const feature = data.value as any;
    const responseFeatures = feature?.response?.features ?? [];
    const features = [feature, ...responseFeatures]
      .filter((item) => item?.geometry)
      .map((item) => ({
        type: "Feature",
        id: item.id,
        geometry: item.geometry,
        properties: item.properties ?? {},
      }));

    const geoJson = {
      type: "FeatureCollection",
      properties: {
        source: "Mapa.Urbis - FIU",
        generatedAt: new Date().toISOString(),
      },
      features,
    };

    const blob = new Blob([JSON.stringify(geoJson, null, 2)], {
      type: "application/geo+json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fiu-camadas-${new Date().toISOString().slice(0, 10)}.geojson`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadFiuDxf = () => {
    const feature = data.value as any;
    const responseFeatures = feature?.response?.features ?? [];
    const features = [feature, ...responseFeatures]
      .filter((item) => item?.geometry)
      .map((item) => ({
        type: "Feature",
        id: item.id,
        geometry: item.geometry,
        properties: item.properties ?? {},
      }));

    const dxfContent = convertGeoJsonToDxf({
      type: "FeatureCollection",
      features,
    });

    const blob = new Blob([dxfContent], {
      type: "application/dxf;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fiu-camadas-${new Date().toISOString().slice(0, 10)}.dxf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadFiuPdf = async () => {
    const element = document.getElementById("fiu-document");
    if (!element || isGeneratingPdf) return;

    setIsGeneratingPdf(true);

    try {
      element.classList.add("fiu-pdf-capture");
      await document.fonts.ready;
      await waitForImagesToRender(element);
      await new Promise((resolve) => setTimeout(resolve, 250));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        ignoreElements: (node) =>
          node instanceof HTMLElement && node.dataset.fiuPdfIgnore === "true",
      });

      const pageWidth = 794;
      const pageHeight = 1123;
      const margin = 18;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;
      const renderedHeight = (canvas.height * contentWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [pageWidth, pageHeight],
        hotfixes: ["px_scaling"],
      });

      const imageData = canvas.toDataURL("image/jpeg", 0.9);
      let remainingHeight = renderedHeight;
      let offsetY = margin;

      pdf.addImage(
        imageData,
        "JPEG",
        margin,
        offsetY,
        contentWidth,
        renderedHeight,
        undefined,
        "FAST",
      );
      remainingHeight -= contentHeight;

      while (remainingHeight > 0) {
        pdf.addPage([pageWidth, pageHeight], "portrait");
        offsetY -= contentHeight;
        pdf.addImage(
          imageData,
          "JPEG",
          margin,
          offsetY,
          contentWidth,
          renderedHeight,
          undefined,
          "FAST",
        );
        remainingHeight -= contentHeight;
      }

      pdf.save(`fiu-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("Failed to generate FIU PDF", err);
    } finally {
      element.classList.remove("fiu-pdf-capture");
      setIsGeneratingPdf(false);
    }
  };

  const messages = [
    "Preparando a Ficha de Informações Urbanísticas...",
    "Conferindo a geometria da área consultada...",
    "Calculando interseções urbanísticas...",
    "Organizando lotes fiscais e restrições...",
    "Montando a visualização da ficha...",
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading.value && isInteractive.value) {
      let currentIndex = 0;
      interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % messages.length;
        setLoadingMessage(messages[currentIndex]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading.value, isInteractive.value]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchPolygonData = async (
    layerSchema: string,
    origin: string,
    params: any,
  ) => {
    const environment = (import.meta.env.VITE_API_URL || "/api") + "/maps";
    const headers = await getOptionalAuthHeaders().catch(() => ({}));

    let requestUrl = origin;

    if (layerSchema) {
      requestUrl = `${environment}/proxy/layers/${layerSchema}/wfs`;
    } else if (
      requestUrl &&
      requestUrl.startsWith("http") &&
      !requestUrl.includes(window.location.host) &&
      !requestUrl.includes("/maps/proxy")
    ) {
      let fixedOrigin = requestUrl;
      if (fixedOrigin.includes("/geoserver/slui/wms")) {
        fixedOrigin = fixedOrigin.replace(
          "/geoserver/slui/wms",
          "/geoserver/slui/ows",
        );
      }
      requestUrl = `${environment}/proxy?url=${encodeURIComponent(fixedOrigin)}`;
    }

    const mergedParams = {
      service: "WFS",
      version: "1.1.0",
      request: "GetFeature",
      outputFormat: "json",
      srsName: "EPSG:4326",
      ...params,
    };

    const { data: responseData, status } = await axios.get(requestUrl, {
      params: mergedParams,
      headers,
    });

    const feature = responseData?.features?.[0];

    if (!feature || status !== 200)
      throw { message: "LayerSchema data is not found" };

    data.value = feature;
  };

  const fetchLayerConfig = async (layerSchema: string) => {
    if (!layerSchema) throw { message: "LayerSchema is not found" };

    const { origin, boardTemplate } = await getLayerSchema(layerSchema);

    if (!boardTemplate) throw { message: "BoardTemplate is not found" };

    template.value = boardTemplate;

    return origin;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchData = useCallback(async (parameter: any) => {
    try {
      const { payloadKey, layerSchema, ...rest } = parameter;

      if (payloadKey) {
        if (!payloadKey.startsWith(FIU_STORAGE_PREFIX)) {
          throw { message: "Chave da FIU inválida" };
        }

        const rawPayload = await getFiuPayload(payloadKey);
        if (!rawPayload) {
          throw {
            message:
              "Dados da FIU não encontrados. Gere a FIU novamente a partir do mapa.",
          };
        }

        const parsedPayload =
          typeof rawPayload === "string"
            ? JSON.parse(rawPayload)
            : rawPayload;

        if (!parsedPayload?.feature) {
          throw { message: "Dados da FIU estão incompletos" };
        }

        data.value = parsedPayload.feature;
        if (parsedPayload.selectedUse) {
          setSelectedUse(parsedPayload.selectedUse);
        }

        try {
          const currentMapConfig = await getMapConfig();
          template.value = currentMapConfig.editFeatureTemplate?.length
            ? currentMapConfig.editFeatureTemplate
            : (parsedPayload.template?.length ? parsedPayload.template : []);
        } catch {
          template.value = parsedPayload.template || [];
        }

        if (!template.value?.length) {
          try {
            const { boardTemplate } = await getLayerSchema("lotes_fiscais");
            if (boardTemplate?.length) {
              template.value = boardTemplate;
            }
          } catch {
            try {
              const { boardTemplate } = await getLayerSchema("lotes");
              if (boardTemplate?.length) {
                template.value = boardTemplate;
              }
            } catch {
              // Ignore fallback failure
            }
          }
        }

        // Always calculate intersections specifically for FIU context
        try {
          const geom = data.value?.geometry || data.value;
          if (geom && (geom.type === "Polygon" || geom.type === "MultiPolygon")) {
            const intersections = await getIntersections(data.value, undefined, {
              isFiu: true,
              context: "fiu",
            });
            data.value = {
              ...data.value,
              response: intersections,
            };
          }
        } catch (e) {
          console.warn("Could not calculate intersections on print page:", e);
        }

        if (!data.value.response) {
          data.value.response = { features: [], properties: {} };
        } else if (!Array.isArray(data.value.response.features)) {
          data.value.response.features = [];
        }

        loading.value = false;
        return;
      }

      let origin: string = "";
      try {
        origin = await fetchLayerConfig(layerSchema);
      } catch {
        const fallbackSchema = layerSchema === "lotes_fiscais" ? "lotes" : "lotes_fiscais";
        try {
          origin = await fetchLayerConfig(fallbackSchema);
        } catch {
          const currentMapConfig = await getMapConfig();
          if (currentMapConfig.editFeatureTemplate?.length) {
            template.value = currentMapConfig.editFeatureTemplate;
          }
        }
      }

      await fetchPolygonData(layerSchema, origin, rest);

      if (data.value) {
        try {
          const geom = data.value?.geometry || data.value;
          if (geom && (geom.type === "Polygon" || geom.type === "MultiPolygon")) {
            const intersections = await getIntersections(data.value, undefined, {
              isFiu: true,
              context: "fiu",
            });
            data.value = {
              ...data.value,
              response: intersections,
            };
          }
        } catch (e) {
          console.warn("Could not calculate intersections for tax lot:", e);
        }

        if (!data.value.response) {
          data.value.response = { features: [], properties: {} };
        } else if (!Array.isArray(data.value.response.features)) {
          data.value.response.features = [];
        }
      }

      loading.value = false;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      error.value = err.message ?? "Erro não identificado";
      loading.value = false;
    }
  }, []);

  useEffect(() => {
    setTheme("light");
    loading.value = true;

    const params = new URLSearchParams(location.search);
    const queryObject = Object.fromEntries(params.entries());

    if (queryObject.interactive === "true") {
      isInteractive.value = true;
    }

    const loadData = async () => {
      await fetchData(queryObject);

      loading.value = false;
    };

    loadData();
  }, [fetchData, setTheme]);

  if (isInteractive.value) {
    if (loading.value) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 px-6">
          <div className="w-full max-w-md rounded-3xl border bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UrbisIcon
                name="progress_activity"
                className="animate-spin text-3xl"
                aria-hidden="true"
              />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Mapa.Urbis
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Gerando sua FIU
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {loadingMessage}
            </p>
          </div>
        </div>
      );
    }

    if (error.value) {
      return (
        <div className="h-screen w-screen flex flex-col bg-white">
          <div className="print:hidden">
            <Header />
          </div>
          <div className="flex-1 flex items-center justify-center text-destructive p-8">
            <div className="bg-destructive/10 p-6 rounded-xl border border-destructive/20 max-w-md text-center">
              <UrbisIcon
                name="error"
                className="text-4xl mb-4"
                aria-hidden="true"
              />
              <p className="font-medium">{error.value}</p>
            </div>
          </div>
          <div className="print:hidden">
            <UrbisFooter />
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen flex-col bg-slate-50 print:min-h-0 print:bg-white">
        <div className="print:hidden" data-fiu-pdf-ignore="true">
          <Header />
        </div>
        <main className="flex-1 flex flex-col w-full px-4 md:px-8 max-w-7xl mx-auto gap-4 mt-4 mb-8 print:m-0 print:max-w-none print:p-0">
          {/* Barra de Ações e Busca Integrada */}
          <section
            className="print:hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs flex flex-col gap-3"
            data-fiu-pdf-ignore="true"
          >
            {/* Linha Superior: Voltar ao Mapa e Exportações */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="whitespace-nowrap rounded-lg self-start"
                onClick={() => {
                  if (window.opener) {
                    window.close();
                  } else {
                    window.location.href = "/";
                  }
                }}
              >
                <UrbisIcon
                  name="arrow_back"
                  className="mr-1.5 text-sm"
                  aria-hidden="true"
                />
                Voltar ao mapa
              </Button>

              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs"
                  onClick={downloadFiuGeoJson}
                >
                  <UrbisIcon
                    name="download"
                    className="mr-1.5 text-sm"
                    aria-hidden="true"
                  />
                  GeoJSON
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs"
                  onClick={downloadFiuDxf}
                >
                  <UrbisIcon
                    name="download"
                    className="mr-1.5 text-sm"
                    aria-hidden="true"
                  />
                  DXF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs"
                  onClick={downloadFiuPdf}
                  disabled={isGeneratingPdf}
                >
                  <UrbisIcon
                    name={
                      isGeneratingPdf ? "progress_activity" : "picture_as_pdf"
                    }
                    className="mr-1.5 text-sm"
                    aria-hidden="true"
                  />
                  {isGeneratingPdf ? "Gerando..." : "PDF"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-lg text-xs"
                  onClick={() => window.print()}
                >
                  <UrbisIcon
                    name="print"
                    className="mr-1.5 text-sm"
                    aria-hidden="true"
                  />
                  Imprimir
                </Button>
              </div>
            </div>

            {/* Linha Central: Busca de Imóvel / Endereço */}
            <div className="w-full shrink-0 border-t border-slate-100 pt-2.5">
              <Search
                isInteractiveView={true}
                onItemClick={(config, item) => {
                  const url = new URL(window.location.href);
                  const isInteractive = url.searchParams.get("interactive");
                  url.search = "";

                  if (isInteractive) {
                    url.searchParams.set("interactive", isInteractive);
                  }

                  if (config.layerSchemaId) {
                    url.searchParams.set("layerSchema", config.layerSchemaId);
                  } else if (config.id === "lots") {
                    url.searchParams.set("layerSchema", "lotes_fiscais");
                  }

                  const props = item.rawData?.properties || {};
                  const cqlParts = [];
                  if (props.setor_fiscal) {
                    cqlParts.push(`setor_fiscal = ${props.setor_fiscal}`);
                    cqlParts.push(`quadra_fiscal = ${props.quadra_fiscal}`);
                    cqlParts.push(`lote_fiscal = ${props.lote_fiscal}`);
                    if (props.condominio)
                      cqlParts.push(`condominio = ${props.condominio}`);
                  } else if (props.cd_setor_fiscal) {
                    cqlParts.push(`cd_setor_fiscal = '${props.cd_setor_fiscal}'`);
                    cqlParts.push(
                      `cd_quadra_fiscal = '${props.cd_quadra_fiscal}'`,
                    );
                    cqlParts.push(`cd_lote = '${props.cd_lote}'`);
                    if (props.cd_condominio)
                      cqlParts.push(`cd_condominio = '${props.cd_condominio}'`);
                  }

                  if (cqlParts.length > 0) {
                    url.searchParams.set("CQL_FILTER", cqlParts.join(" AND "));
                  } else {
                    url.searchParams.set("featureId", item.id);
                  }

                  window.location.href = url.toString();
                }}
              />
            </div>

            {/* Linha Inferior: Uso Pretendido abaixo da busca */}
            <div className="w-full shrink-0 border-t border-slate-100 pt-2.5">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-slate-700">
                  Uso pretendido (opcional)
                </span>
                <IntendedUseCard
                  selectedUse={selectedUse}
                  onSelectUse={setSelectedUse}
                />
              </div>
            </div>
          </section>

          <section
            id="fiu-document"
            className="flex-1 w-full overflow-visible bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-xs print:p-0 print:border-none print:shadow-none space-y-5"
          >
            {/* Cabeçalho Oficial */}
            <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span>Prefeitura de São Paulo</span>
                  <span className="text-slate-300">·</span>
                  <span>SMUL</span>
                  <span className="text-slate-300">·</span>
                  <span>Plataforma Urbis</span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 mt-1">
                  Ficha de Informações Urbanísticas (FIU)
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consulta territorial e enquadramento urbanístico preliminar
                </p>
              </div>

              <div className="text-left sm:text-right text-[11px] text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80 shrink-0 space-y-0.5">
                <p>
                  <span className="text-slate-500">Emissão:</span>{" "}
                  <span className="font-medium text-slate-900">
                    {new Date().toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Finalidade:</span>{" "}
                  <span className="font-medium text-slate-900">Consulta prévia</span>
                </p>
                <span className="inline-block text-[10px] text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 mt-1">
                  Validade demonstrativa
                </span>
              </div>
            </div>

            {/* Mapa Interativo do Imóvel e Camadas Incidentes */}
            <div className="rounded-xl overflow-hidden border border-slate-200/80 break-inside-avoid">
              <FiuInteractiveMap
                feature={data.value}
                responseFeatures={data.value?.response?.features || []}
              />
            </div>

            {/* 1. IDENTIFICAÇÃO DO IMÓVEL / DADOS CADASTRAIS */}
            <div className="rounded-xl border border-slate-200/80 overflow-hidden break-inside-avoid">
              <div className="bg-slate-50/70 px-4 py-2.5 border-b border-slate-200/80 flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-800">
                  1. Identificação do imóvel e dados cadastrais
                </h2>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-800 bg-white">
                <div>
                  <span className="block font-medium text-slate-500 text-[11px]">
                    SQL (Setor-Quadra-Lote)
                  </span>
                  <strong className="text-sm font-mono text-slate-900 font-semibold">
                    {fiuUrbanContext.sql}
                  </strong>
                </div>
                <div>
                  <span className="block font-medium text-slate-500 text-[11px]">
                    Inscrição imobiliária (IPTU)
                  </span>
                  <span className="font-mono text-slate-900 text-xs">
                    {fiuUrbanContext.iptu}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="block font-medium text-slate-500 text-[11px]">
                    Logradouro / Endereço
                  </span>
                  <span className="font-medium text-slate-900 text-xs">
                    {fiuUrbanContext.endereco}
                  </span>
                </div>
                <div>
                  <span className="block font-medium text-slate-500 text-[11px]">
                    Subprefeitura
                  </span>
                  <span className="text-slate-900">
                    {fiuUrbanContext.subprefeitura}
                  </span>
                </div>
                <div>
                  <span className="block font-medium text-slate-500 text-[11px]">
                    Distrito municipal
                  </span>
                  <span className="text-slate-900">
                    {fiuUrbanContext.distrito}
                  </span>
                </div>
                <div>
                  <span className="block font-medium text-slate-500 text-[11px]">
                    Bairro / CEP
                  </span>
                  <span className="text-slate-900">
                    {fiuUrbanContext.bairro} · {fiuUrbanContext.cep}
                  </span>
                </div>
                <div>
                  <span className="block font-medium text-slate-500 text-[11px]">
                    Área do terreno
                  </span>
                  <strong className="text-slate-900 font-semibold text-xs">
                    {fiuUrbanContext.areaM2} m²
                  </strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="block font-medium text-slate-500 text-[11px]">
                    Coordenadas geográficas (SIRGAS 2000 / WGS84)
                  </span>
                  <span className="font-mono text-[11px] text-slate-600">
                    {fiuUrbanContext.latLonText}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="block font-medium text-slate-500 text-[11px]">
                    Coordenadas projetadas UTM (Metros)
                  </span>
                  <span className="font-mono text-[11px] text-slate-600">
                    {fiuUrbanContext.utmText}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. ZONEAMENTO E ENQUADRAMENTO TERRITORIAL */}
            <div className="rounded-xl border border-slate-200/80 overflow-hidden break-inside-avoid">
              <div className="bg-slate-50/70 px-4 py-2.5 border-b border-slate-200/80 flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-800">
                  2. Zoneamento e enquadramento territorial
                </h2>
                <span className="text-[11px] text-slate-500">
                  Leis nº 16.402/16 e 16.050/14
                </span>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-white">
                <div className="border border-slate-200/70 rounded-lg p-3 bg-slate-50/40 space-y-1">
                  <span className="font-medium text-[11px] text-slate-500 block">
                    Zona de uso incidente
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {fiuUrbanContext.zones.map((zone) => (
                      <span
                        key={zone}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200/80"
                      >
                        {zone}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 pt-0.5">
                    Lei nº 16.402/2016 e Lei nº 18.177/2024.
                  </p>
                </div>

                <div className="border border-slate-200/70 rounded-lg p-3 bg-slate-50/40 space-y-1">
                  <span className="font-medium text-[11px] text-slate-500 block">
                    Macroárea / Macrozoneamento
                  </span>
                  <p className="font-semibold text-slate-900 text-xs pt-0.5">
                    {fiuUrbanContext.macroarea}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Plano Diretor Estratégico (PDE).
                  </p>
                </div>

                <div className="border border-slate-200/70 rounded-lg p-3 bg-slate-50/40 space-y-1">
                  <span className="font-medium text-[11px] text-slate-500 block">
                    Perímetro de qualificação ambiental (PQA)
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {fiuUrbanContext.pqa.map((pqaName) => (
                      <span
                        key={pqaName}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-900 border border-emerald-200/80"
                      >
                        {pqaName}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 pt-0.5">
                    Exigências de Quociente Ambiental (QA).
                  </p>
                </div>
              </div>
            </div>

            {/* 3. PARÂMETROS URBANÍSTICOS DA ZONA */}
            <div className="rounded-xl border border-slate-200/80 overflow-hidden break-inside-avoid">
              <div className="bg-slate-50/70 px-4 py-2.5 border-b border-slate-200/80 flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-800">
                  3. Parâmetros urbanísticos básicos de ocupação do solo
                </h2>
                <span className="text-[11px] text-slate-500">
                  Quadros nº 2A, 3, 3A, 3C e 4B (Lei nº 16.402/2016)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-600 font-medium border-b border-slate-200/80 text-[11px]">
                      <th className="py-2.5 px-3.5">Parâmetro urbanístico</th>
                      {fiuUrbanContext.zones.map((zone) => (
                        <th key={`th-${zone}`} className="py-2.5 px-3.5 whitespace-nowrap">
                          Zona {zone}
                        </th>
                      ))}
                      <th className="py-2.5 px-3.5">Observação regulamentar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {/* CAB */}
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium">
                        Coeficiente de Aproveitamento Básico (CAB)
                      </td>
                      {fiuUrbanContext.zones.map((zone) => {
                        const zData = findZoneData(zone, parametrosZonasData);
                        return (
                          <td key={`cab-${zone}`} className="py-2.5 px-3.5 font-mono font-semibold text-primary">
                            {formatNumberValue(zData?.coeficienteAproveitamentoBasico) || "1,00"}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3.5 text-[11px] text-slate-500">
                        Direito de construir básico sem necessidade de outorga onerosa.
                      </td>
                    </tr>

                    {/* CAM */}
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium">
                        Coeficiente de Aproveitamento Máximo (CAM)
                      </td>
                      {fiuUrbanContext.zones.map((zone) => {
                        const zData = findZoneData(zone, parametrosZonasData);
                        return (
                          <td key={`cam-${zone}`} className="py-2.5 px-3.5 font-mono font-semibold text-slate-900">
                            {formatNumberValue(zData?.coeficienteAproveitamentoMaximo) || "Não aplicável"}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3.5 text-[11px] text-slate-500">
                        Potencial construtivo máximo mediante Outorga Onerosa (OODC).
                      </td>
                    </tr>

                    {/* CAMin */}
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium">
                        Coeficiente de Aproveitamento Mínimo (CAMin)
                      </td>
                      {fiuUrbanContext.zones.map((zone) => {
                        const zData = findZoneData(zone, parametrosZonasData);
                        return (
                          <td key={`camin-${zone}`} className="py-2.5 px-3.5 font-mono text-slate-700">
                            {formatNumberValue(zData?.coeficienteAproveitamentoMinimo) || "0,10"}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3.5 text-[11px] text-slate-500">
                        Abaixo deste limite o imóvel poderá ser caracterizado como subutilizado.
                      </td>
                    </tr>

                    {/* TO Máxima */}
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium">
                        Taxa de Ocupação Máxima (TO)
                        {fiuUrbanContext.areaNumeric > 0 && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {fiuUrbanContext.areaNumeric <= 500
                              ? "Lote com área ≤ 500 m²"
                              : "Lote com área > 500 m²"}
                          </span>
                        )}
                      </td>
                      {fiuUrbanContext.zones.map((zone) => {
                        const zData = findZoneData(zone, parametrosZonasData);
                        const toVal =
                          fiuUrbanContext.areaNumeric > 500
                            ? zData?.taxaOcupacaoMaximaLotesIgualOuSuperior500 || zData?.taxaOcupacaoMaximaLotesAte500
                            : zData?.taxaOcupacaoMaximaLotesAte500 || zData?.taxaOcupacaoMaximaLotesIgualOuSuperior500;
                        return (
                          <td key={`to-${zone}`} className="py-2.5 px-3.5 font-mono font-semibold text-slate-900">
                            {formatPercentValue(toVal)}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3.5 text-[11px] text-slate-500">
                        Proporção máxima do terreno coberta pela projeção horizontal da edificação.
                      </td>
                    </tr>

                    {/* Gabarito */}
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium">
                        Gabarito de Altura Máxima
                      </td>
                      {fiuUrbanContext.zones.map((zone) => {
                        const zData = findZoneData(zone, parametrosZonasData);
                        return (
                          <td key={`gab-${zone}`} className="py-2.5 px-3.5 font-medium text-slate-900">
                            {formatGabaritoValue(zData?.gabaritoAlturaMaxima)}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3.5 text-[11px] text-slate-500">
                        Altura máxima medida a partir do perfil natural do terreno até o topo da edificação.
                      </td>
                    </tr>

                    {/* Recuo de Frente */}
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium">
                        Recuo Mínimo de Frente
                      </td>
                      {fiuUrbanContext.zones.map((zone) => {
                        const zData = findZoneData(zone, parametrosZonasData);
                        return (
                          <td key={`rec-frente-${zone}`} className="py-2.5 px-3.5 text-slate-900">
                            {formatSetbackValue(zData?.recuoMinimoFrente)}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3.5 text-[11px] text-slate-500">
                        Distância mínima obrigatória entre a edificação e o alinhamento da via pública.
                      </td>
                    </tr>

                    {/* Recuos Laterais e Fundos */}
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium">
                        Recuos Laterais e de Fundos
                      </td>
                      {fiuUrbanContext.zones.map((zone) => {
                        const zData = findZoneData(zone, parametrosZonasData);
                        const r10 = zData?.recuoMinimoFundosLateraisAlturaEdificacaoMenorOuIgual10;
                        const rSup = zData?.recuoMinimoFundosLateraisAlturaEdificacaoSuperior10;
                        return (
                          <td key={`rec-lat-${zone}`} className="py-2.5 px-3.5 text-slate-900 text-[11px]">
                            <div>H ≤ 10m: {formatSetbackValue(r10)}</div>
                            <div className="text-slate-500 mt-0.5">
                              H &gt; 10m: {rSup ? String(rSup) : "3,00 m"}
                            </div>
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3.5 text-[11px] text-slate-500">
                        Distâncias mínimas entre as fachadas da edificação e as divisas laterais/fundos do lote.
                      </td>
                    </tr>

                    {/* Cota Parte */}
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium">
                        Cota Parte Máxima de Terreno por Unidade
                      </td>
                      {fiuUrbanContext.zones.map((zone) => {
                        const zData = findZoneData(zone, parametrosZonasData);
                        const cp = zData?.cotaParteMaximaTerrenoPorUnidade;
                        return (
                          <td key={`cota-${zone}`} className="py-2.5 px-3.5 font-mono text-slate-900">
                            {cp && String(cp).trim() !== "-" && !String(cp).toUpperCase().startsWith("NA")
                              ? `${cp} m²/UH`
                              : "Não aplicável"}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3.5 text-[11px] text-slate-500">
                        Área mínima de terreno atribuída a cada unidade habitacional para adensamento.
                      </td>
                    </tr>

                    {/* Taxa de Permeabilidade Mínima */}
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium">
                        Taxa de Permeabilidade Mínima (TP)
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {fiuUrbanContext.pqa[0] || "PQA incidente"}
                        </span>
                      </td>
                      {fiuUrbanContext.zones.map((zone, idx) => {
                        if (idx > 0) {
                          return <td key={`tp-empty-${zone}`} className="py-2.5 px-3.5 text-slate-400">-</td>;
                        }
                        const pData = findPqaData(fiuUrbanContext.pqa[0], parametrosPqaData);
                        const tpVal =
                          fiuUrbanContext.areaNumeric > 500
                            ? pData?.["taxaPermeabilidadeLote>500"]
                            : pData?.["taxaPermeabilidadeLote≤500"];
                        return (
                          <td
                            key={`tp-${zone}`}
                            colSpan={fiuUrbanContext.zones.length > 1 ? fiuUrbanContext.zones.length : 1}
                            className="py-2.5 px-3.5 font-mono font-semibold text-emerald-800"
                          >
                            {formatPercentValue(tpVal || 0.15)}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3.5 text-[11px] text-slate-500">
                        Percentual do terreno destinado exclusivamente à infiltração natural das águas pluviais.
                      </td>
                    </tr>

                    {/* Quota Ambiental Mínima */}
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium">
                        Quota Ambiental (QA) • Pontuação Mínima
                      </td>
                      {fiuUrbanContext.zones.map((zone, idx) => {
                        if (idx > 0) return null;
                        const pData = findPqaData(fiuUrbanContext.pqa[0], parametrosPqaData);
                        let qaPoints: any = "-";
                        const a = fiuUrbanContext.areaNumeric;
                        if (a <= 500 && a > 0) {
                          qaPoints = "Dispensada para lotes ≤ 500 m²";
                        } else if (a > 500 && a <= 1000) {
                          qaPoints = formatNumberValue(pData?.["pontuacaoQaMinimoLote>500≤1000"]);
                        } else if (a > 1000 && a <= 2500) {
                          qaPoints = formatNumberValue(pData?.["pontuacaoQaMinimoLote>1000≤2500"]);
                        } else if (a > 2500 && a <= 5000) {
                          qaPoints = formatNumberValue(pData?.["pontuacaoQaMinimoLote>2500≤5000"]);
                        } else if (a > 5000 && a <= 10000) {
                          qaPoints = formatNumberValue(pData?.["pontuacaoQaMinimoLote>5000≤10000"]);
                        } else if (a > 10000) {
                          qaPoints = formatNumberValue(pData?.["pontuacaoQaMinimoLote>10000"]);
                        } else {
                          qaPoints = "Conforme área do lote";
                        }

                        return (
                          <td
                            key={`qa-${zone}`}
                            colSpan={fiuUrbanContext.zones.length}
                            className="py-2.5 px-3.5 font-medium text-slate-900"
                          >
                            {typeof qaPoints === "string" && qaPoints.includes("Dispensada")
                              ? qaPoints
                              : `${qaPoints} pontos`}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3.5 text-[11px] text-slate-500">
                        Pontuação mínima exigida para qualificação ambiental, drenagem e cobertura vegetal.
                      </td>
                    </tr>

                    {/* Níveis de Ruído */}
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium">
                        Nível de Ruído Máximo Permitido (NCA)
                      </td>
                      {fiuUrbanContext.zones.map((zone) => {
                        const zData = findZoneData(zone, parametrosZonasData);
                        const rDiurno = zData?.nivelCriterioAvaliacaoNcaAmbienteExternoDbEmissaoRuido7hAs19h;
                        const rVesp = zData?.nivelCriterioAvaliacaoNcaAmbienteExternoDbEmissaoRuido19hAs22h;
                        const rNot = zData?.nivelCriterioAvaliacaoNcaAmbienteExternoDbEmissaoRuido22hAs7h;
                        return (
                          <td key={`ruido-${zone}`} className="py-2.5 px-3.5 text-[11px] text-slate-800">
                            <div>7h-19h: {rDiurno ? `${rDiurno} dB(A)` : "-"}</div>
                            <div>19h-22h: {rVesp ? `${rVesp} dB(A)` : "-"}</div>
                            <div>22h-7h: {rNot ? `${rNot} dB(A)` : "-"}</div>
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3.5 text-[11px] text-slate-500">
                        Limite de emissão de ruído no ambiente externo (Quadro nº 4B da Lei nº 16.402/2016).
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. RESTRIÇÕES TERRITORIAIS, AMBIENTAIS E PATRIMÔNIO HISTÓRICO */}
            <div className="rounded-xl border border-slate-200/80 overflow-hidden break-inside-avoid">
              <div className="bg-slate-50/70 px-4 py-2.5 border-b border-slate-200/80 flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-800">
                  4. Restrições territoriais, patrimônio histórico e ambientais
                </h2>
                <span className="text-[11px] text-slate-500">
                  {fiuUrbanContext.totalIntersecting} camadas consultadas
                </span>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-white">
                <div className="border border-slate-200/70 rounded-lg p-3 bg-slate-50/40">
                  <span className="font-medium text-[11px] text-slate-600 block mb-1">
                    Patrimônio cultural e tombamentos
                  </span>
                  {fiuUrbanContext.heritage.length > 0 ? (
                    <ul className="space-y-1">
                      {fiuUrbanContext.heritage.map((item) => (
                        <li key={item} className="text-amber-900 font-medium text-[11px] flex items-start gap-1">
                          <span className="text-amber-600">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 text-[11px]">
                      Sem incidência direta cadastrada.
                    </p>
                  )}
                </div>

                <div className="border border-slate-200/70 rounded-lg p-3 bg-slate-50/40">
                  <span className="font-medium text-[11px] text-slate-600 block mb-1">
                    Proteção ambiental e mananciais
                  </span>
                  {fiuUrbanContext.environmental.length > 0 ? (
                    <ul className="space-y-1">
                      {fiuUrbanContext.environmental.map((item) => (
                        <li key={item} className="text-emerald-900 font-medium text-[11px] flex items-start gap-1">
                          <span className="text-emerald-600">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 text-[11px]">
                      Sem restrições de mananciais ou vegetação direta.
                    </p>
                  )}
                </div>

                <div className="border border-slate-200/70 rounded-lg p-3 bg-slate-50/40">
                  <span className="font-medium text-[11px] text-slate-600 block mb-1">
                    Riscos geológicos e contaminação
                  </span>
                  {fiuUrbanContext.risks.length > 0 ? (
                    <ul className="space-y-1">
                      {fiuUrbanContext.risks.map((item) => (
                        <li key={item} className="text-rose-900 font-medium text-[11px] flex items-start gap-1">
                          <span className="text-rose-600">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 text-[11px]">
                      Sem registro de risco geológico ou contaminação.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 5. USO PRETENDIDO, PERMISSIBILIDADE E CONDIÇÕES DE INSTALAÇÃO */}
            <div className="rounded-xl border border-slate-200/80 overflow-hidden break-inside-avoid">
              <div className="bg-slate-50/70 px-4 py-2.5 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-semibold text-slate-800">
                    5. Uso pretendido, permissibilidade e condições de instalação
                  </h2>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    Quadros nº 4 e 4A (Lei nº 16.402/2016)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Decreto nº 57.378/2016
                </span>
              </div>

              <div className="p-4 space-y-4 bg-white text-xs">
                {selectedUse ? (
                  <>
                    {/* Card do Uso Selecionado com hierarquia e CNAE */}
                    <IntendedUseCard
                      selectedUse={selectedUse}
                      onSelectUse={setSelectedUse}
                    />

                    {/* Descrição Complementar Municipal do CNAE se houver */}
                    {selectedUse.cnaeOriginario &&
                      Boolean(
                        getObjValue(selectedUse.cnaeOriginario, [
                          "descricaoComplementarMunicipioSaoPauloOndeConstamRestricoesMunicipais",
                          "Descrição Complementar do Município de São Paulo onde constam restrições municipais",
                          "Descrição Complementar (Município de São Paulo, onde constam restrições municipais)",
                        ]),
                      ) && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-950 space-y-1">
                          <span className="font-bold text-amber-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Restrições Municipais Específicas para esta Atividade (Decreto nº 57.378/2016):
                          </span>
                          <p className="leading-relaxed">
                            {getObjValue(selectedUse.cnaeOriginario, [
                              "descricaoComplementarMunicipioSaoPauloOndeConstamRestricoesMunicipais",
                              "Descrição Complementar do Município de São Paulo onde constam restrições municipais",
                              "Descrição Complementar (Município de São Paulo, onde constam restrições municipais)",
                            ])}
                          </p>
                        </div>
                      )}

                    {/* Permissibilidade nas zonas incidentes */}
                    <div className="space-y-2 pt-1">
                      <span className="text-xs font-semibold text-slate-900 block">
                        Permissibilidade no Zoneamento Incidente do Imóvel (Quadro nº 4):
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {fiuUrbanContext.zones.map((zone) => {
                          const perm = getZonePermissibility(zone, regrasZonamento);
                          return (
                            <div
                              key={`perm-${zone}`}
                              className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 space-y-2 flex flex-col justify-between"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-slate-900 text-xs">
                                    Zona {zone}
                                  </span>
                                  {perm && (
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold border ${perm.badgeColor}`}
                                    >
                                      {perm.label}
                                    </span>
                                  )}
                                </div>
                                {perm && (
                                  <p className="text-[11px] text-slate-600 leading-relaxed">
                                    {perm.description}
                                  </p>
                                )}
                              </div>

                              {perm && perm.notes.length > 0 && (
                                <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                                  {perm.notes.map((nota) => (
                                    <div
                                      key={nota}
                                      className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[10.5px] text-amber-950 leading-relaxed"
                                    >
                                      <span className="font-bold block text-amber-900 mb-0.5">
                                        Nota {nota.replace(/[()]/g, "")}:
                                      </span>
                                      {getNoteFullText(nota)}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Condições de Instalação (Quadro 4A) */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 block">
                          Condições de Instalação e Parâmetros Específicos do Uso (Quadro nº 4A):
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {condicoesInstalacao.length} parâmetro(s) regulamentado(s)
                        </span>
                      </div>

                      {condicoesInstalacao.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-[11px]">
                          {condicoesInstalacao.map((cond, idx) => {
                            const notes = Array.from(new Set(cond.notas || []));
                            return (
                              <div
                                key={`cond-${idx}`}
                                className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/40 flex flex-col justify-between gap-2.5"
                              >
                                <div>
                                  <span className="block text-slate-800 font-semibold mb-1 leading-snug">
                                    {formatParameter(cond.parametro)}
                                  </span>
                                  <p className="text-primary font-mono font-bold text-xs pt-0.5">
                                    {cond.valor || "Conforme regulamentação"}
                                  </p>
                                </div>

                                {notes.length > 0 && (
                                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                                    {notes.map((note) => (
                                      <div
                                        key={note}
                                        className="text-[10px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200 leading-relaxed"
                                      >
                                        <span className="font-bold text-amber-800 block mb-0.5">
                                          Nota {note.replace(/[()]/g, "")}:
                                        </span>
                                        {getNoteFullText(note)}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-500 text-[11px] leading-relaxed">
                          Sem exigências específicas adicionais de condições de instalação no Quadro nº 4A para este uso. Aplicam-se os parâmetros gerais do zoneamento e do Código de Obras e Edificações.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1 max-w-xl">
                      <span className="font-semibold text-slate-900 text-xs block">
                        Nenhum uso pretendido selecionado para esta consulta.
                      </span>
                      <p className="text-slate-500 text-[11px] leading-relaxed">
                        Selecione uma atividade municipal da LPUOS, CNAE federal ou CNPJ para verificar a permissão no zoneamento incidente e calcular exigências de vagas de estacionamento, carga e descarga e largura de via.
                      </p>
                    </div>
                    <div className="shrink-0 w-full sm:w-auto">
                      <IntendedUseCard
                        selectedUse={selectedUse}
                        onSelectUse={setSelectedUse}
                        isCompact={true}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Se houver templates específicos configurados pelo Admin */}
            {semanticGridItems.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-200/80 break-inside-avoid">
                <h3 className="text-xs font-semibold text-slate-800">
                  6. Informações adicionais do cadastro
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 w-full items-start">
                  {semanticGridItems.map((item) => (
                    <div
                      className={`${getGridSpanClass(item.span)} min-w-0`}
                      key={`interactive-view-item-${item.sourceIndex}`}
                    >
                      <FeaturesView
                        feature={{
                          feature: data.value,
                          template: [item.template],
                        }}
                        isPrint={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Termo de Responsabilidade e Validade Técnica */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 text-[10px] text-slate-500 leading-relaxed break-inside-avoid">
              <span className="text-slate-700 font-semibold block text-[11px] mb-0.5">
                Validade técnica e base legal:
              </span>
              Esta Ficha de Informações Urbanísticas (FIU) é emitida pela Plataforma Urbis em conformidade com o Plano Diretor Estratégico (Lei nº 16.050/2014) e a Lei de Parcelamento, Uso e Ocupação do Solo (Lei nº 16.402/2016 e Lei nº 18.177/2024). Documento informativo para subsidiar estudos de viabilidade e instrução técnica prévia.
            </div>
          </section>
        </main>
        <div className="print:hidden" data-fiu-pdf-ignore="true">
          <UrbisFooter />
        </div>
      </div>
    );
  }

  return loading.value ? (
    <div className="h-screen w-screen flex items-center justify-center">
      <UrbisIcon
        name="progress_activity"
        className="text-4xl animate-spin"
        aria-hidden="true"
      />
    </div>
  ) : error.value ? (
    <div className="h-screen w-screen flex items-center justify-center text-destructive">
      <span id="ready"></span>
      {error.value}
    </div>
  ) : (
    <div className="w-full bg-white p-0">
      <span id="ready"></span>
      <div className="print:hidden mb-4 flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          className="whitespace-nowrap"
          onClick={() => {
            if (window.opener) {
              window.close();
            } else {
              window.location.href = "/";
            }
          }}
        >
          <UrbisIcon
            name="arrow_back"
            className="mr-2 text-base"
            aria-hidden="true"
          />
          Voltar ao Mapa
        </Button>
        <Button
          type="button"
          variant="outline"
          className="whitespace-nowrap"
          onClick={downloadFiuGeoJson}
        >
          <UrbisIcon
            name="download"
            className="mr-2 text-base"
            aria-hidden="true"
          />
          Baixar GeoJSON da FIU
        </Button>
        <Button
          type="button"
          variant="outline"
          className="whitespace-nowrap"
          onClick={downloadFiuDxf}
        >
          <UrbisIcon
            name="download"
            className="mr-2 text-base"
            aria-hidden="true"
          />
          Baixar DXF da FIU
        </Button>
        <Button
          type="button"
          variant="outline"
          className="whitespace-nowrap"
          onClick={downloadFiuPdf}
          disabled={isGeneratingPdf}
        >
          <UrbisIcon
            name={isGeneratingPdf ? "progress_activity" : "picture_as_pdf"}
            className="mr-2 text-base"
            aria-hidden="true"
          />
          {isGeneratingPdf ? "Gerando PDF..." : "Baixar PDF da FIU"}
        </Button>
        <Button
          type="button"
          className="whitespace-nowrap"
          onClick={() => window.print()}
        >
          <UrbisIcon
            name="print"
            className="mr-2 text-base"
            aria-hidden="true"
          />
          Imprimir FIU
        </Button>
      </div>
      <div id="fiu-document" className="content">
        <div className="mb-3 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs text-amber-950 print:mb-2 print:break-inside-avoid">
          <div className="flex items-center gap-1.5 font-medium text-amber-900 mb-0.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
            <span>Ferramenta em testes com validade demonstrativa</span>
          </div>
          <p className="text-[11px] leading-snug text-amber-900/80">
            Esta Ficha de Informações Urbanísticas (FIU) foi gerada em caráter preliminar para apoio à análise urbanística e não substitui certidões oficiais emitidas pela Prefeitura de São Paulo.
          </p>
        </div>
        <div className="mb-4 rounded-xl border border-slate-200/80 bg-white p-3.5 text-xs leading-relaxed text-slate-700 print:mb-3 print:break-inside-avoid">
          <h2 className="text-xs font-semibold text-slate-900">
            Uso e parâmetros urbanísticos
          </h2>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-[180px_minmax(0,1fr)]">
            <span className="font-medium text-slate-500">Uso informado:</span>
            <span className="font-medium text-slate-900">
              {selectedUse
                ? `${getObjValue(selectedUse.item, ["Código", "Codigo", "codigo"]) || getObjValue(selectedUse, ["codigo", "code"])} - ${getObjValue(selectedUse.item, ["Descrição", "Descricao", "descricao"]) || getObjValue(selectedUse, ["descricao", "description"])}`
                : "Não informado"}
            </span>
            <span className="font-medium text-slate-500">
              Zonas identificadas:
            </span>
            <span className="font-medium text-slate-900">
              {fiuUrbanContext.zones.length
                ? fiuUrbanContext.zones.join(", ")
                : "Nada consta"}
            </span>
            <span className="font-medium text-slate-500">
              Perímetro de qualificação ambiental:
            </span>
            <span className="font-medium text-slate-900">
              {fiuUrbanContext.pqa.length
                ? fiuUrbanContext.pqa.join(", ")
                : "Nada consta"}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Permissividade, condições de instalação e notas dependem do uso informado e das regras urbanísticas vigentes.
          </p>
        </div>
        <div className="hidden gap-4 lg:grid lg:grid-cols-12 lg:items-start">
          {semanticGridItems.map((item) => (
            <div
              className={`${getGridSpanClass(item.span)} min-w-0`}
              key={`print-view-item-${item.sourceIndex}`}
            >
              <FeaturesView
                feature={{
                  feature: data.value,
                  template: [item.template],
                }}
                isPrint={true}
              />
            </div>
          ))}
        </div>
        <div className="lg:hidden">
          <FeaturesView
            feature={{ feature: data.value, template: template.value }}
            key="print"
            isPrint={true}
          />
        </div>
      </div>
    </div>
  );
};

export default PrintPage;
