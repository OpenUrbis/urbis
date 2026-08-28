import axios from "axios";
import { useCallback, useEffect, useState } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { QRCodeSVG } from "qrcode.react";
import { FeaturesView } from "../../components/FeaturesView";
import { ITemplate } from "../../components/ViewTemplate/types/templates-type";
import { buildSemanticTemplateColumns } from "../../components/ViewTemplate";
import { getLayerSchema } from "../../integrations/layer-schema-integration";
import { useTheme } from "../../components/ThemeProvider";
import Header from "../../components/Header";
import { UrbisFooter } from "@open-urbis/map-ui";
import { Search } from "../../components/Search";

const PrintPage = () => {
  const { setTheme } = useTheme();
  const loading = useSignal<boolean>(false);
  const error = useSignal<string>("");
  const template = useSignal<ITemplate[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = useSignal<any[]>([]);

  const isInteractive = useSignal<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Carregando informações da área...",
  );
  const [showOkCapybara, setShowOkCapybara] = useState(false);

  const semanticColumns = buildSemanticTemplateColumns(template.value, 3);

  const messages = [
    "Carregando informações da área...",
    "Servindo um cafézinho...",
    "Aceita um bolo enquanto espera?",
    "Cante comigo para alegrar seu dia!",
    "Buscando as coordenadas certinhas...",
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
  const fetchPolygonData = async (origin: string, params: any) => {
    const { data: responseData, status } = await axios(origin, { params });

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
      const { layerSchema, ...rest } = parameter;

      await fetchPolygonData(await fetchLayerConfig(layerSchema), rest);

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

      if (isInteractive.value) {
        setShowOkCapybara(true);
        setTimeout(() => {
          loading.value = false;
        }, 5000);
      } else {
        loading.value = false;
      }
    };

    loadData();
  }, [fetchData, setTheme]);

  if (isInteractive.value) {
    if (loading.value) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-white relative overflow-hidden">
          <div className="flex flex-col items-center z-10 transition-all duration-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-8 animate-pulse text-center">
              {showOkCapybara ? "Prontinho!" : loadingMessage}
            </h2>
          </div>

          <div className="absolute bottom-4 right-4 z-10 transition-all duration-1000 ease-in-out">
            {!showOkCapybara ? (
              <img
                src="/capybara-sing.png"
                alt="Capivara cantando"
                className="w-48 md:w-64 origin-bottom animate-[wiggle_2s_ease-in-out_infinite]"
                style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}
              />
            ) : (
              <img
                src="/capybara-ok.png"
                alt="Capivara Ok"
                className="w-48 md:w-64 animate-in fade-in duration-500 zoom-in-95"
                style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}
              />
            )}
          </div>
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes wiggle {
              0%, 100% { transform: rotate(-3deg); }
              50% { transform: rotate(3deg); }
            }
          `,
            }}
          />
        </div>
      );
    }

    if (error.value) {
      return (
        <div className="h-screen w-screen flex flex-col bg-white">
          <Header />
          <div className="flex-1 flex items-center justify-center text-destructive p-8">
            <div className="bg-destructive/10 p-6 rounded-xl border border-destructive/20 max-w-md text-center">
              <span className="material-symbols-outlined text-4xl mb-4">
                error
              </span>
              <p className="font-medium">{error.value}</p>
            </div>
          </div>
          <UrbisFooter />
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 flex flex-col w-full px-4 md:px-8 max-w-7xl mx-auto gap-6 mt-6 mb-12">
          <div className="w-full shrink-0">
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
                  url.searchParams.set("layerSchema", "lotes");
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
          <section className="flex-1 bg-white rounded-2xl shadow-sm border p-6 overflow-auto w-full">
            <div className="hidden md:flex gap-6 w-full">
              {semanticColumns.map((columnTemplates, index) => {
                if (!columnTemplates.length) return null;

                return (
                  <div
                    className="flex-1 flex flex-col gap-6"
                    key={`interactive-view-col-${index + 1}`}
                  >
                    <FeaturesView
                      feature={{
                        feature: data.value,
                        template: columnTemplates,
                      }}
                      isPrint={true}
                    />
                  </div>
                );
              })}
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
        <UrbisFooter />
      </div>
    );
  }

  return loading.value ? (
    <div className="h-screen w-screen flex items-center justify-center">
      <span className="material-symbols-outlined text-4xl animate-spin">
        progress_activity
      </span>
    </div>
  ) : error.value ? (
    <div className="h-screen w-screen flex items-center justify-center text-destructive">
      <span id="ready"></span>
      {error.value}
    </div>
  ) : (
    <div className="w-full p-4 print:p-0">
      <span id="ready"></span>
      <header className="flex items-center justify-between pb-5 px-12">
        <div className="flex items-center justify-center">
          <img
            src="logo.svg"
            alt="Logo da cidade de São paulo"
            className="w-[100px]"
          />
        </div>
        <div className="flex flex-col items-center justify-center text-center">
          <span className="font-bold">Prefeitura de São Paulo</span>
          <span>DEMO - ADESAMPA</span>
          <span>Informações</span>
        </div>
        <div className="flex items-center justify-center w-[108px] p-2">
          <QRCodeSVG value={location.href} size={100} />
        </div>
      </header>
      <div className="content">
        <FeaturesView
          feature={{ feature: data.value, template: template.value }}
          key="print"
          isPrint={true}
        />
      </div>
    </div>
  );
};

export default PrintPage;
