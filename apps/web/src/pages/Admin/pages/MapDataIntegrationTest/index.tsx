import { useState } from "react";
import { MapDataIntegrationField } from "@open-urbis/map";
import { Button } from "@/components/ui/button";
import { EXAMPLE_DATA } from "./MapDataIntegrationExample";

const MapDataIntegrationTestPage = () => {
  const [value, setValue] = useState<any>(null);
  const [initialData, setInitialData] = useState<any>();
  const [mode, setMode] = useState<'edit' | 'view'>('edit');
  const [fieldKey, setFieldKey] = useState(0);
  const [customJson, setCustomJson] = useState<string>("");

  const loadExample = async () => {
    setInitialData(EXAMPLE_DATA);
    setMode('view');
    setFieldKey((k) => k + 1);
    setValue(EXAMPLE_DATA);
  };

  const loadCustom = () => {
    try {
      const data = JSON.parse(customJson);
      setInitialData(data);
      setMode('view');
      setFieldKey((k) => k + 1);
      setValue(data);
    } catch (e) {
      alert("JSON inválido");
    }
  };

  const reset = () => {
    setInitialData(null);
    setMode('edit');
    setFieldKey((k) => k + 1);
    setValue(null);
  };

  const handleDataChange = (data: any) => {
    setValue(data);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50 dark:bg-zinc-950 p-8 gap-8 transition-colors">
      <div className="w-full max-w-[1200px]">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">Leitura inteligente de dados projetuais</h2>
            <p className="text-sm text-gray-600 dark:text-zinc-400">Envie ou arraste um arquivo .dwg padrão prefeitura para analisar as validações e extrações do projeto.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 max-w-[600px]">
            <Button onClick={loadExample} variant="outline" size="sm">
              Exemplo Completo (DWG)
            </Button>

            <Button onClick={reset} variant="default" size="sm">
              Limpar
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm dark:shadow-zinc-950/40 transition-colors">
          <MapDataIntegrationField
            key={fieldKey}
            mode={mode}
            initialData={initialData}
            onChange={handleDataChange}
          />
        </div>
      </div>

      {/* Debug & Custom Initial Data View */}
      <div className="p-4 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-sm dark:shadow-zinc-950/40 w-full max-w-[840px] animate-in fade-in transition-colors">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold flex items-center gap-2 text-gray-900 dark:text-zinc-100">
            <span className="material-symbols-outlined text-base">bug_report</span>
            Debug State & Initial Data
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs font-mono mb-4">
          <div className="p-2 bg-gray-50 dark:bg-zinc-900 rounded-md border border-gray-200 dark:border-zinc-800 transition-colors">
            <p className="font-semibold text-gray-600 dark:text-zinc-400 mb-1">State Flags:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between">
                <span className="text-gray-900 dark:text-zinc-100">hasValue:</span>
                <span className={value ? "text-green-600 dark:text-green-500 font-bold" : "text-gray-500 dark:text-zinc-500"}>{String(!!value)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900 dark:text-zinc-100">Mode:</span>
                <span className="text-blue-600 dark:text-blue-500 font-bold">{mode}</span>
              </div>
            </div>
          </div>
          <div className="col-span-2">
            <p className="font-semibold text-gray-600 dark:text-zinc-400 mb-1">Value Data Snapshot (from onChange):</p>
            <pre className="bg-gray-50 dark:bg-zinc-900 p-3 rounded-md overflow-auto max-h-60 text-xs min-h-[100px] leading-relaxed border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-zinc-950/40 text-gray-900 dark:text-zinc-100 transition-colors">
              {value ? JSON.stringify(value, null, 2) : "Nenhum dado recebido ainda."}
            </pre>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-zinc-800 pt-4">
          <p className="font-semibold text-sm mb-2 text-gray-900 dark:text-zinc-100">Set Custom Initial Data (JSON)</p>
          <textarea
            className="w-full h-32 p-2 text-xs font-mono border border-gray-200 dark:border-zinc-800 rounded-md bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 transition-colors"
            placeholder={'{\n  "algumaChave": "valor"\n}'}
            value={customJson}
            onChange={(e) => setCustomJson(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <Button onClick={loadCustom} size="sm">
              Carregar Custom JSON (View Mode)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapDataIntegrationTestPage;