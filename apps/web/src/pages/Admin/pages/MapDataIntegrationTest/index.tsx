import { useState } from "react";
import { MapDataIntegrationField } from "@open-urbis/map";
import { Button } from "@/components/ui/button";

const EXAMPLE_DATA = {
  fundiário: {
    "imóvel real": {
      area: 116670.0501,
      geometria: {
        type: "Polygon",
        coordinates: [
          [
            [340662.401, 7393623.122],
            [340664.167, 7393625.491],
          ],
        ],
      },
    },
  },
  blocos: [
    {
      identificacao: {
        nome: "identificacao",
        valor: "B1",
      },
      nome_do_bloco: {
        nome: "nome do bloco",
        valor: "Shopping Anália Franco",
      },
    },
  ],
};

const MapDataIntegrationTestPage = () => {
  const [value, setValue] = useState<any>(null);
  const [initialData, setInitialData] = useState<any>();
  const [mode, setMode] = useState<'edit' | 'view'>('edit');
  const [fieldKey, setFieldKey] = useState(0);
  const [customJson, setCustomJson] = useState<string>("");

  const loadExample = async () => {
    try {
      const res = await fetch('/novojson.json');
      const data = await res.json();
      setInitialData(data);
      setMode('view');
      setFieldKey((k) => k + 1);
      setValue(data);
    } catch (e) {
      console.error("Erro ao carregar exemplo", e);
      setInitialData(EXAMPLE_DATA);
      setMode('view');
      setFieldKey((k) => k + 1);
      setValue(EXAMPLE_DATA);
    }
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
    <div className="min-h-screen flex flex-col items-center justify-start bg-muted/20 p-8 gap-8">
      <div className="w-full max-w-[1200px]">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Urbis Verifica</h2>
            <p className="text-sm text-muted-foreground">Arraste um arquivo .dwg padrão prefeitura para testar o fluxo de processamento e validação.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadExample} variant="outline" size="sm">
              Exemplo
            </Button>
            <Button onClick={reset} variant="default" size="sm">
              Limpar
            </Button>
          </div>
        </div>

        <div className="bg-background rounded-xl border p-6 shadow-sm">
          <MapDataIntegrationField
            key={fieldKey}
            mode={mode}
            initialData={initialData}
            onChange={handleDataChange}
          />
        </div>
      </div>

      {/* Debug & Custom Initial Data View */}
      <div className="p-4 border rounded-lg bg-card shadow-sm w-full max-w-[840px] animate-in fade-in">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-base">bug_report</span>
            Debug State & Initial Data
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs font-mono mb-4">
          <div className="p-2 bg-muted/30 rounded border border-border/50">
            <p className="font-semibold text-muted-foreground mb-1">State Flags:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between">
                <span>hasValue:</span>
                <span className={value ? "text-green-600 font-bold" : "text-muted-foreground"}>{String(!!value)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mode:</span>
                <span className="text-blue-600 font-bold">{mode}</span>
              </div>
            </div>
          </div>
          <div className="col-span-2">
            <p className="font-semibold text-muted-foreground mb-1">Value Data Snapshot (from onChange):</p>
            <pre className="bg-muted p-3 rounded-md overflow-auto max-h-60 text-[10px] leading-relaxed border shadow-inner">
              {value ? JSON.stringify(value, null, 2) : "Nenhum dado recebido ainda."}
            </pre>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="font-semibold text-sm mb-2">Set Custom Initial Data (JSON)</p>
          <textarea
            className="w-full h-32 p-2 text-xs font-mono border rounded-md bg-muted/30"
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
