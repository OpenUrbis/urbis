import { AxiosRequestConfig } from "axios";

export interface IRequestProperties
  extends Omit<
    AxiosRequestConfig,
    "transformRequest" | "transformResponse" | "data"
  > {
  transformResponse?: string;
  transformRequest?: string;
  data?: string;
}
