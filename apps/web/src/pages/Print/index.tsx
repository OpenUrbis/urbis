import axios from "axios";
import { useCallback, useEffect, useState } from "preact/hooks";
import { CircularProgress } from "rmwc";
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
  const fetchData = useCallback(async (parameter: any) => {
    try {
      const { layerSchema, ...rest } = parameter;

      if (!layerSchema) throw { message: "LayerSchema is not found" };

      const { origin, viewTemplate } = await getLayerSchema(layerSchema);

      if (!viewTemplate) throw { message: "ViewTemplate is not found" };

      setTemplate(viewTemplate);

      const { data, status } = await axios(origin, {
        params: {
          ...rest,
        },
      });

      const feature = data?.features?.[0];

      if (!feature || status !== 200)
        throw { message: "LayerSchema data is not found" };

      setData(feature);

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
    <div className="h-100 w-100 d-flex align-items-center justify-content-center">
      <CircularProgress label="progress" size="xlarge" />
    </div>
  ) : error ? (
    <div className="h-100 w-100 d-flex align-items-center justify-content-center">
      {error}
    </div>
  ) : (
    <div className="container">
      <header className="d-flex align-items-center justify-content-between">
        <div className="logo d-flex align-items-center justify-content-center">
          LOGO
        </div>
        <div className="metadata d-flex align-items-center justify-content-center flex-column">
          <span>Prefeitura de São Paulo</span>
          <span>Informações</span>
          <span>Informações</span>
        </div>
        <div className="qrcode d-flex align-items-center justify-content-center">
          QRCODE
        </div>
      </header>
      <FeaturesView
        feature={{ feature: data, template }}
        key="print"
        isPrint={true}
      />
      <footer>Informações</footer>
    </div>
  );
};

export default PrintPage;
