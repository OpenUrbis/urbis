/* eslint-disable react-hooks/rules-of-hooks */
import axios, { AxiosRequestConfig } from "axios";
import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { Loader2 } from "lucide-react";
import { createFn } from "../../../../utils/createFn";
import { IRequestProperties } from "../../types/request-type";
import { ITemplatesDeclaration } from "../../types/templates-type";
import { ViewTemplateEngine } from "../../ViewTemplateEngine";

const requestResponseCache = new Map<string, unknown>();
const requestInFlightCache = new Map<string, Promise<unknown>>();

const buildRequestCacheKey = (
  templateProperties: IRequestProperties | undefined,
  rawData: unknown,
) => {
  return JSON.stringify({
    rawData,
    request: templateProperties,
  });
};

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
    const loading = useSignal(false);
    const responseData = useSignal<unknown | undefined>(undefined);

    const fetch = async () => {
      loading.value = true;

      try {
        const { transformRequest, transformResponse, data, ...properties } =
          template.properties as IRequestProperties;

        const cacheKey = buildRequestCacheKey(
          template.properties as IRequestProperties,
          rawData,
        );

        if (requestResponseCache.has(cacheKey)) {
          responseData.value = requestResponseCache.get(cacheKey);
          loading.value = false;

          return;
        }

        const pendingRequest = requestInFlightCache.get(cacheKey);

        if (pendingRequest) {
          responseData.value = await pendingRequest;
          loading.value = false;

          return;
        }

        const axiosConfig: AxiosRequestConfig = { ...properties };

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
          const baseUrl = (import.meta.env.VITE_API_URL || "/api");
          const url = axiosConfig.url?.startsWith("/")
            ? `${baseUrl}${axiosConfig.url}`
            : axiosConfig.url;
          const requestPromise = axios({ ...axiosConfig, url }).then(
            ({ data: axiosData }) => {
              requestResponseCache.set(cacheKey, axiosData);

              return axiosData;
            },
          );

          requestInFlightCache.set(cacheKey, requestPromise);

          const axiosData = await requestPromise;

          responseData.value = axiosData;
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          requestInFlightCache.delete(cacheKey);
          loading.value = false;
        }
      } catch (error) {
        console.error("Error preparing request:", error);
        loading.value = false;
      }
    };

    useEffect(() => {
      fetch();

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawData, template]);

    return loading.value || !responseData.value ? (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ) : (
      <div className="grid gap-2">
        {templates.map((template, i) => (
          <ViewTemplateEngine
            key={`${key}-engine-${i}`}
            template={template}
            data={{ ...(rawData ?? {}), response: responseData.value }}
            rootTemplate={rootTemplate}
            isPrint={isPrint}
          />
        ))}
      </div>
    );
  },
};
