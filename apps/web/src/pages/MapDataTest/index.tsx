import { useState } from 'react';
import { DynamicSystemProvider, DynamicSystemSidebar, DynamicSystemResults } from '@open-urbis/map';
import { Minus, Maximize2, X, FileText } from 'lucide-react';

export function MapDataTestPage() {
  const [isResultsOpen, setIsResultsOpen] = useState(true);
  const [isResultsMinimized, setIsResultsMinimized] = useState(false);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <DynamicSystemProvider>
        <div className="flex flex-col md:flex-row h-full w-full overflow-hidden">
          {/* Sidebar (Left) */}
          <div className="md:h-full z-20" style={{maxWidth: "420px"}}>
            <DynamicSystemSidebar />
          </div>
          
          {/* Background Placeholder for the Map (takes remaining space) */}
          <div className="flex-1 h-1/2 md:h-full relative flex items-center justify-center border-t md:border-t-0 border-slate-200 dark:border-slate-800">
            <p className="font-medium">[ Espaço do Mapa ]</p>
            
            {/* Floating Results Window (Bottom Right - like Gmail Compose) */}
            {isResultsOpen && (
              <div 
                className={`absolute bottom-0 right-0 md:right-6 lg:right-16 bg-white dark:bg-slate-950 rounded-t-xl md:rounded-t-2xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-800 z-50 flex flex-col transition-all duration-300 ease-in-out ${
                  isResultsMinimized 
                    ? 'w-full md:w-[320px] h-[48px]' 
                    : 'w-full md:w-[90vw] lg:w-[800px] h-[85vh] md:h-[600px] max-h-[85vh]'
                }`}
              >
                {/* Window Header */}
                <div 
                  className="bg-white dark:bg-slate-950 text-foreground px-4 py-3 flex justify-between items-center rounded-t-xl md:rounded-t-2xl cursor-pointer select-none border-b border-slate-200 dark:border-slate-800"
                  onClick={() => setIsResultsMinimized(!isResultsMinimized)}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <h3 className="text-sm font-semibold tracking-tight">Resultados da Pesquisa</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsResultsMinimized(!isResultsMinimized); }}
                      className="text-slate-400 hover:text-foreground transition-colors"
                    >
                      {isResultsMinimized ? (
                        <Maximize2 className="w-4 h-4" />
                      ) : (
                        <Minus className="w-4 h-4" />
                      )}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsResultsOpen(false); }}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Window Content */}
                <div className={`flex-1 overflow-hidden transition-opacity duration-300 bg-white dark:bg-slate-950 text-foreground ${isResultsMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                  <DynamicSystemResults />
                </div>
              </div>
            )}

            {/* Button to reopen results if closed */}
            {!isResultsOpen && (
              <button
                onClick={() => { setIsResultsOpen(true); setIsResultsMinimized(false); }}
                className="absolute bottom-6 right-16 px-5 py-3 bg-slate-800 text-white font-semibold rounded-full shadow-lg hover:bg-slate-700 transition-colors z-40 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Abrir Resultados
              </button>
            )}
          </div>
        </div>
      </DynamicSystemProvider>
    </div>
  );
}

export default MapDataTestPage;
