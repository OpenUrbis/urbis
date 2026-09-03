# @open-urbis/map

Pacote de componentes de mapa React focados em sistemas urbanos e interações espaciais (GIS) para o ecossistema Urbis.

## Instalação

Você pode instalar o pacote diretamente através do registro público do NPM.

```bash
# via pnpm
pnpm add @open-urbis/map

# via npm
npm install @open-urbis/map

# via yarn
yarn add @open-urbis/map
```

> **Nota:** Certifique-se de configurar e carregar adequadamente suas variáveis de ambiente, como por exemplo os tokens do Mapbox e a base URL da API, em sua aplicação host (por exemplo via `.env`), caso utilize as funcionalidades que batem em mapas base ou APIs.

### Assets de hachura (`pattern.png` / `pattern.json`)

As hachuras de preenchimento das camadas (`pattern` / `patternConfig`) usam um atlas de
imagem que precisa ser servido na **raiz pública** da aplicação host, em `/pattern.png` e
`/pattern.json`. Os arquivos prontos acompanham o pacote:

```bash
cp node_modules/@open-urbis/map/public/pattern.png public/
cp node_modules/@open-urbis/map/public/pattern.json public/
```

O atlas atual tem 512x512 (grade 4x4 de tiles de 120x120) e traz os padrões `full`,
`dots`, `hatch-1x`, `hatch-1x-reverse`, `hatch-2x`, `hatch-2x-reverse`, `hatch-cross`,
`hatch-horizontal`, `hatch-vertical` e `hatch-grid`. Os quatro primeiros padrões históricos
(`full`, `dots`, `hatch-1x`, `hatch-cross`) mantêm as mesmas coordenadas do atlas antigo
(256x256), portanto camadas já publicadas continuam idênticas mesmo antes da atualização
dos arquivos — apenas os padrões novos exigem o atlas atualizado.

Se a aplicação exibir a legenda (`MapLegend`), inclua também as classes CSS que recortam
cada tile do atlas (`.pattern`, `.hatch-1x`, `.hatch-horizontal`, ...). A referência está
em `apps/web/src/globals.css` do monorepo, e as coordenadas em
`src/lib/layer-patterns.ts`.

---

## Componentes e Padrões Principais

O pacote disponibiliza duas abordagens primárias de UI voltadas para casos de uso diferentes dentro da Prefeitura/Urbis:

1. **MapPicker**: Focado na seleção de áreas no mapa e visualização/edição de perímetros (usado fortemente em processos de licenciamento, "Ficha do Imóvel").
2. **DynamicSystem**: Um ecossistema de componentes para visualização mais robusta de buscas dinâmicas e exploração de dados no mapa.

Abaixo, detalhamos como implementá-los seguindo as melhores práticas adotadas na plataforma.

---

### 1. MapPicker e Edição de Perímetros

O `MapPicker` é projetado para atuar como um campo de formulário super avançado, onde o usuário pode interagir, visualizar lotes ou editar áreas para processos.

A sua implementação em um sistema completo exige a associação a um componente de Overlay (para visualização de resultados em tela cheia) utilizando os hooks de contexto providos pelo próprio `@open-urbis/map` (`usePolygonEditContext`, `useMapContext`).

#### Exemplo prático de um "MapTest" integrado

```tsx
import {
  MapPicker,
  FeaturesView,
  PolygonDetails,
  usePolygonEditContext,
  useMapContext,
} from "@open-urbis/map";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useMemo } from "react";
import { MapActionToolbar } from "./MapActionToolbar";

const EXAMPLE_DATA = {
  editFeature: {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-46.656551, -23.561573],
          [-46.656551, -23.562573],
          [-46.655551, -23.562573],
          [-46.655551, -23.561573],
          [-46.656551, -23.561573],
        ],
      ],
    },
  },
};

const MapResultContent = ({
  value,
  onClose,
  hideActions = false,
}: {
  value: any;
  onClose: () => void;
  hideActions?: boolean;
}) => {
  const {
    editFeatureTemplate,
    layerWithRootEditTemplate,
    editFeature: startEditing,
  } = usePolygonEditContext();
  const { layerSchemas } = useMapContext();

  const rootTemplate = useMemo(() => {
    if (!layerWithRootEditTemplate.value) return [];
    const layer = layerSchemas.value.find(
      (l) => l.id === layerWithRootEditTemplate.value,
    );
    return layer?.viewTemplate || [];
  }, [layerSchemas.value, layerWithRootEditTemplate.value]);

  const handleEdit = () => {
    if (!value) return;
    const featureToEdit =
      value.type === "selection"
        ? value.features?.[0]?.feature
        : value.editFeature;
    if (featureToEdit) {
      startEditing(featureToEdit);
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 bg-background flex flex-col animate-in fade-in duration-300 pointer-events-auto">
      <div className="w-full h-full flex flex-col p-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ficha do imovel</h2>
          <p className="text-sm text-muted-foreground mb-2">
            Verifique os dados abaixo para prosseguir com o protocolo.
          </p>
        </div>

        {!hideActions && (
          <MapActionToolbar
            onChangeSelection={
              value.type === "edit" || value.type === "digital"
                ? onClose
                : undefined
            }
            onEdit={value.type === "selection" ? handleEdit : undefined}
            onPrint={() => window.print()}
            className="mt-4"
          />
        )}

        <div className="flex-1 overflow-y-auto bg-card border rounded-xl shadow-sm">
          <div className="p-6">
            {!value ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <span className="material-symbols-outlined text-4xl mb-4 opacity-50">
                  data_object
                </span>
                <p className="font-medium">Nenhum dado selecionado</p>
              </div>
            ) : value.editFeature && value.loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <span className="material-symbols-outlined text-4xl mb-4 animate-spin">
                  progress_activity
                </span>
                <p className="font-medium">Carregando dados do imovel...</p>
              </div>
            ) : value.editFeature && editFeatureTemplate.value ? (
              <PolygonDetails
                template={editFeatureTemplate.value}
                rootTemplate={rootTemplate}
              />
            ) : value.editFeature && !editFeatureTemplate.value ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <span className="material-symbols-outlined text-4xl mb-4 animate-spin">
                  progress_activity
                </span>
                <p className="font-medium">Carregando formulário...</p>
              </div>
            ) : value.type === "selection" && value.features?.[0] ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dados da Seleção</h3>
                <FeaturesView feature={value.features[0]} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <span className="material-symbols-outlined text-4xl mb-4 opacity-50">
                  data_object
                </span>
                <p className="font-medium">Dados brutos do perímetro</p>
                <pre className="mt-4 p-4 bg-muted rounded-lg text-xs font-mono text-left w-full max-w-2xl overflow-auto">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {!hideActions && (
          <div className="mt-6 flex justify-end items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Ao protocolar, este perímetro será vinculado ao seu processo.
            </span>
            <Button
              onClick={() => {
                console.log("Confirmar e Protocolar action for value:", value);
                alert("Protocolo iniciado com sucesso!");
              }}
              size="lg"
              className="px-8 shadow-lg"
            >
              Confirmar e Protocolar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const MapTestPage = () => {
  const [value, setValue] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [initialData, setInitialData] = useState<any>();
  const [pickerKey, setPickerKey] = useState(0);
  const [lastIntersections, setLastIntersections] = useState<any>(null);
  const [lastSelectionId, setLastSelectionId] = useState<string | null>(null);

  const handleMapChange = useCallback(
    (v: any) => {
      setValue(v);

      if (v?.intersections && v.intersections !== lastIntersections) {
        setLastIntersections(v.intersections);
        setShowResult(true);
      }

      if (
        (v?.type === "edit" || v?.type === "view") &&
        v?.editFeature &&
        !v.intersections &&
        v.intersections !== lastIntersections
      ) {
        setShowResult(true);
      }

      if (v?.type === "selection") {
        const currentSelection = v?.features?.[0];
        const currentSelectionKey = currentSelection
          ? currentSelection.id ||
            JSON.stringify(currentSelection.properties) ||
            JSON.stringify(currentSelection.geometry)
          : null;

        if (currentSelectionKey && currentSelectionKey !== lastSelectionId) {
          setLastSelectionId(currentSelectionKey);
          setShowResult(true);
        }
      }
    },
    [lastIntersections, lastSelectionId],
  );

  return (
    <div className="rounded-xl w-[100%] h-[600px] border shadow-sm bg-background relative flex flex-col overflow-hidden">
      <div className="flex-1 relative overflow-hidden">
        <MapPicker
          key={pickerKey}
          initialData={initialData}
          onChange={handleMapChange}
          mode={initialData !== undefined ? "selected" : "editable"}
          hideMap={showResult}
          hideLayerManager={true}
          overlay={
            showResult && (
              <MapResultContent
                value={value}
                onClose={() => {
                  setShowResult(false);
                  setLastSelectionId(null);
                }}
                hideActions={!!initialData}
              />
            )
          }
        ></MapPicker>
      </div>
    </div>
  );
};

export default MapTestPage;
```

---

### 2. DynamicSystem (Interface de Exploração e Buscas)

Para criar painéis complexos de exploração baseada em mapas, onde há uma barra lateral controlando buscas dinâmicas (Search Filters) e uma área inferior para exibição das listagens, utilizamos o ecossistema `DynamicSystem`.

Esses componentes devem ser envelopados pelo `DynamicSystemProvider`.

#### Exemplo Prático de Integração do Mapa Dinâmico

```tsx
import { useState } from "react";
import {
  DynamicSystemProvider,
  DynamicSystemSidebar,
  DynamicSystemResults,
} from "@open-urbis/map";
import { Minus, Maximize2, X, FileText } from "lucide-react";

export function MapDataTestPage() {
  const [isResultsOpen, setIsResultsOpen] = useState(true);
  const [isResultsMinimized, setIsResultsMinimized] = useState(false);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-slate-50">
      {/* 1. Deve envelopar a hierarquia para compartilhar estado do sistema */}
      <DynamicSystemProvider>
        <div className="flex flex-col md:flex-row h-full w-full">
          {/* 2. Sidebar Esquerda de Controles */}
          <div className="md:h-full z-20" style={{ maxWidth: "420px" }}>
            <DynamicSystemSidebar />
          </div>

          {/* Área Principal (onde o Mapa é instanciado na aplicação) */}
          <div className="flex-1 relative flex items-center justify-center border-l">
            <p>[ Espaço do Mapa ]</p>

            {/* 3. Janela de Resultados Flutuante da Tabela */}
            {isResultsOpen && (
              <div
                className={`absolute bottom-0 right-6 bg-white rounded-t-2xl shadow-2xl border z-50 flex flex-col transition-all duration-300 ${
                  isResultsMinimized
                    ? "w-[320px] h-[48px]"
                    : "w-[800px] h-[600px] max-h-[85vh]"
                }`}
              >
                {/* Header Customizado pelo Usuário na app consumidora */}
                <div
                  className="px-4 py-3 flex justify-between items-center cursor-pointer border-b"
                  onClick={() => setIsResultsMinimized(!isResultsMinimized)}
                >
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <FileText size={16} /> Resultados
                  </h3>
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsResultsMinimized(!isResultsMinimized);
                      }}
                    >
                      {isResultsMinimized ? (
                        <Maximize2 size={16} />
                      ) : (
                        <Minus size={16} />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsResultsOpen(false);
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Área de Inserção da Tabela Resultante */}
                <div
                  className={`flex-1 overflow-hidden transition-opacity ${isResultsMinimized ? "opacity-0 hidden" : "opacity-100"}`}
                >
                  <DynamicSystemResults />
                </div>
              </div>
            )}
          </div>
        </div>
      </DynamicSystemProvider>
    </div>
  );
}
```

Nesse padrão, a aplicação consumidora (o app hospedeiro) detém o controle físico (tamanho de janelas, minimização, posição na tela) e delega as renderizações pesadas (Sidebar e Tabela) para os componentes `DynamicSystemSidebar` e `DynamicSystemResults`.

---

### 3. Validação e Estruturação de Projetos (MapDataIntegrationField)

O `MapDataIntegrationField` é um visualizador avançado e validador de estruturas complexas de dados geográficos (tipicamente JSONs contendo extrações complexas de DWG ou BIM). Ele combina um `MapPreview` 3D lado-a-lado com um visor estruturado (Tree View) dos parâmetros lidos, permitindo inspeção granular e visual das geometrias.

#### Exemplo prático de Validação de DWG

```tsx
import { useState } from "react";
import { MapDataIntegrationField } from "@open-urbis/map";
import { Button } from "@/components/ui/button";

// Exemplo JSON incluído dentro de '@open-urbis/map/examples/MapDataIntegrationExample'
import { EXAMPLE_DATA } from "@open-urbis/map/examples/MapDataIntegrationExample";

export const MapDataIntegrationTestPage = () => {
  const [value, setValue] = useState<any>(null);
  const [initialData, setInitialData] = useState<any>();
  const [mode, setMode] = useState<"edit" | "view">("edit");
  const [fieldKey, setFieldKey] = useState(0);

  const loadExample = async () => {
    setInitialData(EXAMPLE_DATA);
    setMode("view");
    setFieldKey((k) => k + 1);
    setValue(EXAMPLE_DATA);
  };

  const handleDataChange = (data: any) => {
    setValue(data); // Disparado após parsing/edições de JSON customizado
  };

  return (
    <div className="w-full h-full p-8 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Validação de Projeto</h2>
          <p>Envie um JSON DWG/BIM para visualizar as propriedades em 3D.</p>
        </div>
        <Button onClick={loadExample}>Ver Exemplo 3D</Button>
      </div>

      <div className="bg-white border rounded-lg p-6 min-h-[600px]">
        <MapDataIntegrationField
          key={fieldKey}
          mode={mode}
          initialData={initialData}
          onChange={handleDataChange}
        />
      </div>
    </div>
  );
};
```

---

## Estrutura do `MapPickerValue`

Quando o `MapPicker` dispara a função `onChange(value)`, ele envia as informações essenciais para a sua aplicação lidar com o dado e persistí-lo ou enviar a APIs:

```typescript
interface MapPickerValue {
  type: "selection" | "edit" | "view" | "digital";

  // Features selecionadas via clique ou busca (no modo view/selection)
  selectedFeatures?: MapContextSelectedFeature[];

  // Feature em processo de criação/edição no modo 'editable'
  editFeature?: Feature | null;

  // Intersecções cruzadas com o polígono desenhado
  intersections?: any;

  // Em modo 'digital' retorna a feature da busca do endereço
  digitalAddress?: FeatureCollection | null;
}
```

## Consumo de Contextos Internos

O `@open-urbis/map` gerencia estados intensamente usando a biblioteca de Signals do Preact. Se você for acessar dados via `usePolygonEditContext()` ou `useMapContext()`, certifique-se de referenciar o valor com `.value`.

```ts
const { loading, data } = usePolygonEditContext();

// Correto (usar em if/render)
if (loading.value) { return <Spinner /> }

// Incorreto
if (loading) { return <Spinner /> } // loading é um objeto Signal
```
