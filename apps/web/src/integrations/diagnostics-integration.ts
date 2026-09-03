import { getAuthHeaders } from "../utils/auth-headers";

const environment = (import.meta.env.VITE_API_URL || "/api") + "/maps";

export interface DiagnosticLinkResult {
  url: string;
  originalUrl: string;
  sourceType: "legis" | "layer_schema" | "search_config" | "mosaico";
  sourceId: string;
  sourceName: string;
  status: "ok" | "broken";
  statusCode: number | null;
  errorMessage: string | null;
}

export interface DiagnosticsResponse {
  summary: {
    total: number;
    ok: number;
    broken: number;
    mosaicoCount: number;
    legisCount: number;
    layerSchemaCount: number;
    searchConfigCount: number;
  };
  results: DiagnosticLinkResult[];
}

export const getLinkDiagnostics = async (): Promise<DiagnosticsResponse> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${environment}/diagnostics/links`, {
    headers,
  });
  if (!response.ok) {
    throw new Error("Failed to run link diagnostics");
  }
  return await response.json();
};
