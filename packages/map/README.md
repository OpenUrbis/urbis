# @open-urbis/map

Pacote de componentes de mapa para aplicações Urbis.

## Instalação

```bash
pnpm add @open-urbis/map
```

## Componentes

### MapPicker

Componente de mapa projetado para ser utilizado como campo de formulário ou seletor de localização.

#### Exemplo de Uso

```tsx
import { MapPicker } from "@open-urbis/map";

const MyComponent = () => {
  return (
    <MapPicker 
      mode="editable"
      onChange={(value) => console.log(value)}
    />
  );
};
```

#### Props

| Propriedade | Tipo | Padrão | Descrição |
| ----------- | ---- | ------ | --------- |
| `onChange` | `(value: MapPickerValue) => void` | - | Callback chamado quando o estado do mapa muda. Retorna todos os dados do contexto. |
| `initialData` | `MapPickerValue` | `null` | Estado inicial do mapa. |
| `mode` | `'editable' \| 'selected'` | `'editable'` | Define o comportamento do mapa. `'editable'` permite interação total. `'selected'` é focado na visualização (pode restringir ferramentas). |
| `children` | `ReactNode` | `null` | Elementos React para renderizar na sidebar flutuante do mapa (ex: botões de ação). |

#### MapPickerValue

Estrutura do objeto de valor:

```typescript
interface MapPickerValue {
  // Features selecionadas via clique ou busca de lote
  selectedFeatures: MapContextSelectedFeature[];
  
  // Feature gerada por busca de endereço digital ou coordenadas
  digitalAddress: FeatureCollection | null;
  
  // Feature sendo editada (Polígono desenhado ou GeoJSON importado)
  editFeature: Feature | null;
  
  // Dados de interseção do polígono editado com outras camadas
  intersections: any;
}
```

### FeaturesView

Componente para renderizar a "Ficha do Imóvel" ou detalhes de uma feature baseada em um template de visualização.

```tsx
<FeaturesView feature={selectedFeature} />
```

### PolygonDetails

Componente interno utilizado para exibir os detalhes de um polígono em edição. Ele consome o `PolygonEditContext` para obter o estado de carregamento e dados.

```tsx
<PolygonDetails 
  template={editTemplate} 
  rootTemplate={rootTemplate} 
/>
```

### Contextos

#### PolygonEditContext

Fornece o estado para a edição de polígonos, incluindo:
- `feature`: Signal contendo a feature em edição.
- `isEditing`: Signal indicando se o modo de edição está ativo.
- `loading`: Signal (boolean) indicando se há uma operação de fetch em andamento (ex: interseções).
- `data`: Signal contendo os dados de resposta das interseções.
- `editFeatureTemplate`: Template de visualização para a feature em edição.

**Nota sobre Signals:** As propriedades `loading`, `data` e `error` são Signals do Preact. Ao consumi-las em componentes React, lembre-se de acessar `.value` ou usar hooks apropriados se necessário para garantir a reatividade correta e avaliação de condições (ex: `if (loading.value)`).
