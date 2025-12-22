import axios from "axios";
import { useCallback, useEffect, useState } from "preact/hooks";
import { QRCodeSVG } from "qrcode.react";
import { FeaturesView } from "../../components/FeaturesView";
import { ITemplate } from "../../components/ViewTemplate/types/templates-type";
import { getLayerSchema } from "../../integrations/layer-schema-integration";

const PrintPage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [template, setTemplate] = useState<ITemplate[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchPolygonData = async (origin: string, params: any) => {
    const { data, status } = await axios(origin, { params });

    const feature = data?.features?.[0];

    if (!feature || status !== 200)
      throw { message: "LayerSchema data is not found" };

    setData(feature);
  };

  const fetchLayerConfig = async (layerSchema: string) => {
    if (!layerSchema) throw { message: "LayerSchema is not found" };

    const { origin, viewTemplate } = await getLayerSchema(layerSchema);

    if (!viewTemplate) throw { message: "ViewTemplate is not found" };

    setTemplate(viewTemplate);

    return origin;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchData = useCallback(async (parameter: any) => {
    try {
      const { layerSchema, ...rest } = parameter;

      await fetchPolygonData(await fetchLayerConfig(layerSchema), rest);

      setLoading(false);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Erro não identificado");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams(location.search);
    const queryObject = Object.fromEntries(params.entries());

    fetchData(queryObject);
  }, [fetchData]);

  return loading ? (
    <div className="h-screen w-screen flex items-center justify-center">
      <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
    </div>
  ) : error ? (
    <div className="h-screen w-screen flex items-center justify-center text-destructive">
      <span id="ready"></span>
      {error}
    </div>
  ) : (
    <div className="w-full p-4 print:p-0">
      <span id="ready"></span>
      <header className="flex items-center justify-between pb-5 px-12">
        <div className="flex items-center justify-center">
          <img src="logo.svg" alt="Logo da cidade de São paulo" className="w-[100px]" />
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
          feature={{ feature: data, template }}
          key="print"
          isPrint={true}
        />
      </div>
    </div>
  );
};

export default PrintPage;
