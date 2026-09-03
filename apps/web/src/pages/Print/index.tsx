import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { useSignal } from "@preact/signals";

import { FeaturesView } from "../../components/FeaturesView";
import { ITemplate } from "../../components/ViewTemplate/types/templates-type";
import { buildSemanticTemplateGridItems } from "../../components/ViewTemplate/semantic-columns";
import { getLayerSchema } from "../../integrations/layer-schema-integration";
import { getMapConfig, getIntersections } from "../../integrations/map-integration";
import { useTheme } from "../../components/ThemeProvider";
import Header from "../../components/Header";
import { Button, Input, UrbisFooter, UrbisIcon } from "@open-urbis/map-ui";
import { Search } from "../../components/Search";
import {
  FIU_STORAGE_PREFIX,
  convertGeoJsonToDxf,
  getFiuPayload,
} from "../../utils/fiu";
import { getOptionalAuthHeaders } from "../../utils/auth-headers";

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
  const [intendedUse, setIntendedUse] = useState("");

  const semanticGridItems = buildSemanticTemplateGridItems(template.value, 4);

  const fiuUrbanContext = useMemo(() => {
    const features = data.value?.response?.features ?? [];

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

    const zones = uniqueNames(
      features.filter((feature: any) => {
        const id = String(feature?.id ?? "").toLowerCase();
        const layer = String(feature?.properties?.layer ?? "").toLowerCase();
        const schemaId = String(
          feature?.properties?.layerSchemaId ?? "",
        ).toLowerCase();
        return (
          id.includes("zoneamento") ||
          layer.includes("zoneamento") ||
          schemaId.includes("zoneamento")
        );
      }),
    );

    const pqa = uniqueNames(
      features.filter((feature: any) => {
        const id = String(feature?.id ?? "").toLowerCase();
        const layer = String(feature?.properties?.layer ?? "").toLowerCase();
        const schemaId = String(
          feature?.properties?.layerSchemaId ?? "",
        ).toLowerCase();
        return (
          id.includes("qualificacao_ambiental") ||
          id.includes("pqa") ||
          layer.includes("qualificacao_ambiental") ||
          layer.includes("pqa") ||
          schemaId.includes("qualificacao_ambiental") ||
          schemaId.includes("pqa")
        );
      }),
    );

    return { zones, pqa };
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
          <section
            className="print:hidden rounded-2xl border bg-white p-4 shadow-sm md:p-5"
            data-fiu-pdf-ignore="true"
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary md:text-xs md:tracking-[0.22em]">
                  Mapa.Urbis
                </p>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950 md:text-2xl">
                    Ficha de Informações Urbanísticas
                  </h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                    Ferramenta em testes · Validade demonstrativa
                  </span>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                  Consulte a ficha do lote fiscal e gere arquivos para
                  análise técnica. Use a busca para trocar o endereço, CIF/IPTU,
                  referência, coordenada ou Endereço Digital Urbis/Plus Code.
                </p>
                <div className="mt-4 grid max-w-3xl gap-1.5 sm:grid-cols-[170px_minmax(0,1fr)] sm:items-center">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Uso pretendido
                  </label>
                  <Input
                    value={intendedUse}
                    onInput={(event: any) =>
                      setIntendedUse(event.currentTarget.value)
                    }
                    placeholder="Opcional: informe o uso para constar na FIU"
                    className="h-9 rounded-xl bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-auto justify-center whitespace-nowrap"
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
                  className="w-full sm:w-auto justify-center whitespace-nowrap"
                  onClick={downloadFiuGeoJson}
                >
                  <UrbisIcon
                    name="download"
                    className="mr-2 text-base"
                    aria-hidden="true"
                  />
                  Baixar GeoJSON
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto justify-center whitespace-nowrap"
                  onClick={downloadFiuDxf}
                >
                  <UrbisIcon
                    name="download"
                    className="mr-2 text-base"
                    aria-hidden="true"
                  />
                  Baixar DXF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto justify-center whitespace-nowrap"
                  onClick={downloadFiuPdf}
                  disabled={isGeneratingPdf}
                >
                  <UrbisIcon
                    name={
                      isGeneratingPdf ? "progress_activity" : "picture_as_pdf"
                    }
                    className="mr-2 text-base"
                    aria-hidden="true"
                  />
                  {isGeneratingPdf ? "Gerando PDF..." : "Baixar PDF"}
                </Button>
                <Button
                  type="button"
                  className="w-full sm:w-auto justify-center whitespace-nowrap"
                  onClick={() => window.print()}
                >
                  <UrbisIcon
                    name="print"
                    className="mr-2 text-base"
                    aria-hidden="true"
                  />
                  Imprimir
                </Button>
              </div>
            </div>
          </section>
          <div
            className="w-full shrink-0 print:hidden"
            data-fiu-pdf-ignore="true"
          >
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

                // Construct CQL_FILTER based on rawData properties for lots
                const props = item.rawData?.properties || {};
                const cqlParts = [];
                if (props.cd_setor_fiscal)
                  cqlParts.push(`cd_setor_fiscal = '${props.cd_setor_fiscal}'`);
                if (props.cd_quadra_fiscal)
                  cqlParts.push(
                    `cd_quadra_fiscal = '${props.cd_quadra_fiscal}'`,
                  );
                if (props.cd_lote)
                  cqlParts.push(`cd_lote = '${props.cd_lote}'`);
                if (props.cd_condominio)
                  cqlParts.push(`cd_condominio = '${props.cd_condominio}'`);

                if (cqlParts.length > 0) {
                  url.searchParams.set("CQL_FILTER", cqlParts.join(" AND "));
                } else {
                  // Fallback to featureId if no properties found (unlikely for lots)
                  url.searchParams.set("featureId", item.id);
                }

                window.location.href = url.toString();
              }}
            />
          </div>

          <section
            id="fiu-document"
            className="flex-1 w-full overflow-visible bg-white p-0 print:p-0"
          >
            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700 print:mb-3 print:break-inside-avoid">
              <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-900">
                Uso e parâmetros urbanísticos
              </h2>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-[180px_minmax(0,1fr)]">
                <span className="font-semibold text-slate-500">
                  Uso informado:
                </span>
                <span className="font-semibold text-slate-900">
                  {intendedUse.trim() || "não informado"}
                </span>
                <span className="font-semibold text-slate-500">
                  Zonas identificadas:
                </span>
                <span className="font-semibold text-slate-900">
                  {fiuUrbanContext.zones.length
                    ? fiuUrbanContext.zones.join(", ")
                    : "nada consta"}
                </span>
                <span className="font-semibold text-slate-500">
                  Per. de Qual. Amb.:
                </span>
                <span className="font-semibold text-slate-900">
                  {fiuUrbanContext.pqa.length
                    ? fiuUrbanContext.pqa.join(", ")
                    : "nada consta"}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Permissividade, condições de instalação e notas dependem do uso
                informado e das regras urbanísticas vigentes. Use a Pesquisa
                Prospectiva para detalhar a análise normativa quando necessário.
              </p>
            </div>

            {intendedUse.trim() && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-700 print:mb-3 print:break-inside-avoid space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 border-b pb-2">
                  Parâmetros urbanísticos por Uso
                </h3>
                <p className="font-medium text-slate-800">
                  Grupo de atividades / Tipologias pretendido:{" "}
                  <span className="font-bold text-primary">{intendedUse.trim()}</span>
                </p>

                <div className="space-y-2 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="font-semibold text-slate-900">
                    Condições de instalação e vagas exigidas (Quadro 4A / LPUOS):
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    <li>
                      Número mínimo de vagas de automóveis por área construída [m²] ou Unidades Habitacionais [UH]:{" "}
                      <span className="italic font-medium text-slate-600">
                        NA (4A - a) (4A - e) (4A - f) (4A - i)
                      </span>
                    </li>
                    <li>
                      Vagas de carga e descarga (caminhão / utilitário):{" "}
                      <span className="italic font-medium text-slate-600">
                        Conforme área computável e localização (4A - c) (4A - d) (4A - g) (4A - h)
                      </span>
                    </li>
                    <li>
                      Condições de acessibilidade e via:{" "}
                      <span className="italic font-medium text-slate-600">
                        Largura mínima da via 12m em ZEU/ZEUP ativada (4A - j)
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                    Notas relativas ao uso (Quadro nº 4A - Lei 16.402/2016)
                  </h4>
                  <div className="grid gap-1.5 text-[10px] leading-snug text-slate-600">
                    {Object.entries(QUADRO_4A_NOTES).map(([key, desc]) => (
                      <p key={key}>
                        <strong className="font-semibold text-slate-800">{key}</strong> {desc}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="hidden md:grid md:grid-cols-12 gap-4 w-full items-start">
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

            <div className="md:hidden">
              <FeaturesView
                feature={{ feature: data.value, template: template.value }}
                key="interactive-view-mobile"
                isPrint={true}
              />
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
        <div className="mb-3 rounded-lg border border-amber-300/80 bg-amber-50/70 p-2.5 text-xs text-amber-950 print:mb-2 print:break-inside-avoid">
          <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-0.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
            <span>Ferramenta em testes com validade demonstrativa</span>
          </div>
          <p className="text-[11px] leading-snug text-amber-900/90">
            Esta Ficha de Informações Urbanísticas (FIU) foi gerada em caráter preliminar e demonstrativo para apoio à análise urbanística e não substitui certidões e atos oficiais emitidos pelos órgãos competentes da Prefeitura de São Paulo.
          </p>
        </div>
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700 print:mb-3 print:break-inside-avoid">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-900">
            Uso e parâmetros urbanísticos
          </h2>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-[180px_minmax(0,1fr)]">
            <span className="font-semibold text-slate-500">Uso informado:</span>
            <span className="font-semibold text-slate-900">
              {intendedUse.trim() || "não informado"}
            </span>
            <span className="font-semibold text-slate-500">
              Zonas identificadas:
            </span>
            <span className="font-semibold text-slate-900">
              {fiuUrbanContext.zones.length
                ? fiuUrbanContext.zones.join(", ")
                : "nada consta"}
            </span>
            <span className="font-semibold text-slate-500">
              Per. de Qual. Amb.:
            </span>
            <span className="font-semibold text-slate-900">
              {fiuUrbanContext.pqa.length
                ? fiuUrbanContext.pqa.join(", ")
                : "nada consta"}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Permissividade, condições de instalação e notas dependem do uso
            informado e das regras urbanísticas vigentes. Use a Pesquisa
            Prospectiva para detalhar a análise normativa quando necessário.
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
