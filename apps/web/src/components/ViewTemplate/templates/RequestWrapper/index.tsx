/* eslint-disable react-hooks/rules-of-hooks */
import axios, { AxiosRequestConfig } from "axios";
import { useEffect, useState } from "preact/hooks";
import { CircularProgress } from "rmwc";
import { createFn } from "../../../../utils/createFn";
import { IRequestProperties } from "../../types/request-type";
import { ITemplatesDeclaration } from "../../types/templates-type";
import { ViewTemplateEngine } from "../../ViewTemplateEngine";
import "./style.scss";

export const RequestWrapper: ITemplatesDeclaration = {
  name: "wrapper-request",
  render: (componentProperties) => {
    const {
      data: rawData,
      template,
      key,
      rootTemplate,
      isPrint,
    } = componentProperties;
    const { templates = [] } = template;
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(undefined);

    const fetch = async () => {
      setLoading(true);
      let axiosConfig: AxiosRequestConfig;

      try {
        const { transformRequest, transformResponse, data, ...properties } =
          template.properties as IRequestProperties;

        axiosConfig = properties;

        if (data) {
          const dataFn = createFn(data, false);

          if (dataFn) axiosConfig.data = dataFn(componentProperties);
        }

        if (transformRequest) {
          const transformRequestFn = createFn(transformRequest);

          if (transformRequestFn)
            axiosConfig.transformRequest = [transformRequestFn];
        }

        if (transformResponse) {
          const transformResponseFn = createFn(transformResponse);

          if (transformResponseFn)
            axiosConfig.transformResponse = [transformResponseFn];
        }

        try {
          const { data } = await axios(axiosConfig);

          setData(data);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error preparing request:", error);
        setLoading(false);
      }
    };

    useEffect(() => {
      fetch();

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawData, template]);

    return loading || !data ? (
      <div className="d-flex justify-content-center align-items-center">
        <CircularProgress size="large" />
      </div>
    ) : (
      templates.map((template, i) => (
        <ViewTemplateEngine
          key={`${key}-engine-${i}`}
          template={template}
          data={{ ...(rawData ?? {}), response: data }}
          rootTemplate={rootTemplate}
          isPrint={isPrint}
        />
      ))
    );
  },
};
