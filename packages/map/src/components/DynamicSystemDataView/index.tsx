import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface DynamicDataResponse {
  version: string;
  modules: string[];
}

import { ProspectiveSearchProvider } from '../ProspectiveSearch/ProspectiveSearchContext';
import { Loader2, DatabaseIcon, X, Maximize2, Minimize2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, ScrollArea } from '@open-urbis/map-ui';

interface DynamicSystemProviderProps {
  children: React.ReactNode;
}

export function DynamicSystemProvider({ children }: DynamicSystemProviderProps) {
  const [modules, setModules] = useState<string[]>([]);
  const [moduleData, setModuleData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        // Use Vite environment variable for API URL or default to localhost:3000
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

        // Fetch list of available modules
        const response = await axios.get<DynamicDataResponse>(`${apiUrl}/dynamic-system-data`);

        if (response.data && Array.isArray(response.data.modules)) {
          setModules(response.data.modules);

          // Pre-fetch all modules data
          const fetchedData: Record<string, any> = {};

          // Process all modules
          await Promise.all(
            response.data.modules.map(async (moduleName) => {
              try {
                const moduleResponse = await axios.get(`${apiUrl}/dynamic-system-data/${encodeURIComponent(moduleName)}`);
                fetchedData[moduleName] = moduleResponse.data.data;
              } catch (err) {
                console.error(`Error fetching module ${moduleName}:`, err);
                fetchedData[moduleName] = { error: 'Failed to load data' };
              }
            })
          );

          setModuleData(fetchedData);
        } else {
          setModules([]);
        }
      } catch (err) {
        console.error('Error fetching dynamic system data modules:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50/50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Carregando dados da legislação urbanística...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-red-50/30">
        <div className="text-center p-8 bg-white border border-red-200 rounded-xl shadow-sm max-w-lg">
          <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Erro de Comunicação</h3>
          <p className="text-sm text-slate-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">Tentar Novamente</button>
        </div>
      </div>
    );
  }

  const isDataEmpty = !moduleData || Object.keys(moduleData).length === 0 || !moduleData['Usos']?.length;

  if (isDataEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50/50">
        <p className="text-slate-400 text-sm font-medium animate-pulse">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="absolute top-5 right-5 z-[100]">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-medium text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200 hover:bg-white/80 hover:backdrop-blur-sm rounded-lg transition-all active:scale-95 group"
        >
          <DatabaseIcon className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
          {showDebug ? 'Fechar' : 'Dados'}
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <ProspectiveSearchProvider moduleData={moduleData}>
          {children}
        </ProspectiveSearchProvider>
      </div>

      {showDebug && (
        <div
          className={`fixed inset-0 z-[1000] bg-white/95 backdrop-blur-md flex flex-col transition-all duration-300 ${isFullscreen ? '' : 'm-6 md:m-12 rounded-[32px] shadow-2xl overflow-hidden border border-slate-100'}`}
        >
          {/* Debug Header */}
          <div className="px-10 py-8 bg-white border-b border-slate-50 text-slate-900 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-5">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                <DatabaseIcon className="w-6 h-6 text-slate-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-800">Inspetor de Dados</h2>
                <p className="text-[9px] text-slate-300 font-bold mt-1 uppercase tracking-[0.2em]">{modules.length} módulos ativos</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-slate-600 transition-colors"
                title={isFullscreen ? "Minimizar" : "Maximizar"}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowDebug(false)}
                className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-rose-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Debug Scroll Area */}
          <div className="flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar">
            <div className="p-8 grid grid-cols-1 xl:grid-cols-2 gap-8">
              {modules.map((moduleName) => {
                const data = moduleData[moduleName];
                const isError = data && data.error;
                const isLoaded = !!data;

                return (
                  <Card key={moduleName} className="border-slate-200 bg-white shadow-sm flex flex-col group hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
                      <div className="flex justify-between items-center w-full">
                        <CardTitle className="text-sm font-bold truncate text-slate-700 pr-2">
                          {moduleName}
                        </CardTitle>
                        <Badge variant="outline" className="bg-white text-slate-400 border-slate-200 text-[9px] uppercase font-bold px-2 py-0.5 rounded-lg">
                          {isLoaded ? (Array.isArray(data) ? `${data.length} registros` : 'objeto') : 'carregando...'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 relative min-h-[350px] max-h-[550px]">
                      <ScrollArea className="absolute inset-0 p-6">
                        {isError ? (
                          <div className="text-rose-500 text-xs font-bold bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-center gap-2">
                            <X className="w-4 h-4" />
                            Erro ao carregar dados do módulo.
                          </div>
                        ) : isLoaded ? (
                          <pre className="text-[11px] text-slate-500 font-mono leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100 overflow-x-auto">
                            {/* Show first 10 records for better sampling */}
                            {JSON.stringify(Array.isArray(data) ? data.slice(0, 10) : data, null, 2)}
                          </pre>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 italic text-xs py-20">
                            <Loader2 className="w-6 h-6 animate-spin text-primary/30" />
                            <span>Aguardando resposta do servidor...</span>
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                );
              })}

              {modules.length === 0 && !loading && (
                <div className="col-span-full border-2 border-dashed border-slate-200 p-24 text-center text-slate-400 rounded-3xl bg-white/50">
                  <DatabaseIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-semibold text-lg">Nenhum módulo encontrado</p>
                  <p className="text-sm">Não há dados disponíveis no servidor no momento.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
