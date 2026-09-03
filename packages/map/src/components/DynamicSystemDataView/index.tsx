import React, { useEffect, useState } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { ProspectiveSearchProvider } from "../ProspectiveSearch/ProspectiveSearchContext";

interface DynamicDataResponse {
  version: string;
  modules: string[];
}

const REQUIRED_MODULE_NAMES = new Set([
  "Usos",
  "CNAE",
  "CNAEs por Atividade",
  "Usos permitidos por Zona",
  "Parâmetros urbanísticos por Uso",
]);

const REQUIRED_MODULE_PREFIXES = [
  "Parâmetros urbanísticos por Zon",
  "Parâmetros urbanísticos por Per",
];

function isRequiredModule(moduleName: string) {
  return (
    REQUIRED_MODULE_NAMES.has(moduleName) ||
    REQUIRED_MODULE_PREFIXES.some((prefix) => moduleName.startsWith(prefix))
  );
}

interface DynamicSystemProviderProps {
  children: React.ReactNode;
}

export function DynamicSystemProvider({
  children,
}: DynamicSystemProviderProps) {
  const [moduleData, setModuleData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        // Use Vite environment variable for API URL or default to localhost:3000
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

        // Fetch list of available modules
        const response = await axios.get<DynamicDataResponse>(
          `${apiUrl}/dynamic-system-data`,
        );

        if (response.data && Array.isArray(response.data.modules)) {
          const relevantModules =
            response.data.modules.filter(isRequiredModule);

          // Pre-fetch all modules data
          const fetchedData: Record<string, any> = {};

          // Process all modules
          await Promise.all(
            relevantModules.map(async (moduleName) => {
              try {
                const moduleResponse = await axios.get(
                  `${apiUrl}/dynamic-system-data/${encodeURIComponent(moduleName)}`,
                );
                fetchedData[moduleName] = moduleResponse.data.data;
              } catch (err) {
                console.error(`Error fetching module ${moduleName}:`, err);
                fetchedData[moduleName] = { error: "Failed to load data" };
              }
            }),
          );

          setModuleData(fetchedData);
        } else {
          setModuleData({});
        }
      } catch (err) {
        console.error("Error fetching dynamic system data modules:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[100vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden relative">
      <ProspectiveSearchProvider moduleData={moduleData}>
        {children}
      </ProspectiveSearchProvider>
    </div>
  );
}
