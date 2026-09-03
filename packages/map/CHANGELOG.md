# @open-urbis/map

## 1.1.1

### Patch Changes

- Adiciona suporte a opacidade individual por mapa base ativo e otimiza a atualização de opacidade em tempo real sem travamentos.

## 1.1.0

### Minor Changes

- bd28933: Adiciona opção "Desenhar / Analisar aqui" no menu de contexto do mapa (botão direito) para iniciar o fluxo de desenho e análise com um quadrado pré-definido no local selecionado.
- 5100f8a: Novas hachuras de preenchimento de camadas: além de `hatch-1x` e `hatch-cross`, agora existem `hatch-1x-reverse` (diagonal no sentido contrário), `hatch-2x` e `hatch-2x-reverse` (diagonais mais densas), `hatch-horizontal`, `hatch-vertical` e `hatch-grid` (retas horizontais/verticais e grade).

  O atlas `pattern.png` passou de 256x256 para 512x512 (grade 4x4 de tiles de 120x120) e agora acompanha o pacote em `@open-urbis/map/public/`. Os quatro padrões antigos (`full`, `dots`, `hatch-1x`, `hatch-cross`) mantiveram as mesmas coordenadas e os mesmos pixels, então camadas já publicadas continuam idênticas.

  Ação necessária para usar os padrões novos: copiar `node_modules/@open-urbis/map/public/pattern.png` e `pattern.json` para a raiz pública da aplicação (e, se a legenda for exibida, incluir as classes CSS dos novos padrões — veja o README).

  As URLs do atlas passaram a levar `?v=2` (cache-busting) e nomes de padrão desconhecidos agora caem para `full` em vez de renderizar polígono sem preenchimento (`hatch` legado é tratado como `hatch-1x`).

### Patch Changes

- a575bb7: Corrige o comportamento do mapa que impedia a visualização automática dos lotes ao clicar em um distrito. Agora, ao finalizar o zoom/transição, as informações de zoom e bounding box são obtidas diretamente do mapa e sincronizadas com precisão com as camadas do DeckGL.

  Também remove a exibição do bloco CNAE que aparecia junto ao título de "Zonas e Perímetros de Qualificação Ambiental identificados" na tabela de resultados de busca prospectiva.

- 5e122af: Fix district search result selection by improving centroid calculation for MultiPolygon geometries and adding fallback click actions when clicking search items.
- 13f063e: Corrige o problema de requisições com erro ao dar zoom ou navegar no mapa. Agora os IDs das células do grid de camadas do tipo `Stream` são gerados de forma determinística com base nas coordenadas da célula e no ID da camada. Isso evita que o DeckGL desmonte e remonte as camadas a cada frame de renderização (gerando centenas de requisições redundantes à API/GeoServer) e garante que as camadas existentes sejam reutilizadas de forma otimizada.
- cab7c28: Ajusta elevação baseline e polygonOffset das camadas de texto (TextLayer) para evitar corte/afundamento abaixo do solo em visualizações 3D/inclinadas no modo Stream e GeoJSON.
- Oculta grupos de camadas vazios no catálogo e adiciona botão de selecionar/desmarcar tudo por grupo.
- cbf1b6b: Ajuste e atualização dos ícones do mapa e barra de ferramentas direita para sincronizar com os novos recursos visuais (utilizando arquivos SVGs na pasta `public`).
  Aprimoramento do comportamento ao passar o mouse sobre os botões da barra de ferramentas à direita para exibir todas as legendas simultaneamente, espelhando o comportamento da barra à esquerda.
- a575bb7: Ajusta a busca prospectiva para que os parâmetros com restrição de área do imóvel (como Taxa de Ocupação) continuem disponíveis e não sejam indevidamente ocultados quando nenhuma área estiver configurada.
- 277a869: Corrige as requisições de WFS e WMS para incluir o cabeçalho `x-organization-id` e `Authorization` ao acessar as camadas protegidas pelo proxy. Corrige também o carregamento de atributos em filtros, capacidades de camadas customizadas, consultas de buscas na geoserver.slui.dev e exportação de buscas no backend injetando as credenciais de autenticação apropriadas.
- cbf1b6b: Melhorias de usabilidade no modal de filtros por atributos de camada (novas instruções explicativas, botão "Aplicar na camada", ícones de tabela na prévia de resultados, e regras de salvamento) e na exibição de informações complementares com metadados estruturados.
- Updated dependencies [5100f8a]
- Updated dependencies [b6b7410]
  - @open-urbis/map-auth@1.1.0
  - @open-urbis/endereco-digital@1.0.4

## 1.0.3

### Patch Changes

- Updated dependencies
  - @open-urbis/endereco-digital@1.0.2

## 1.0.2

### Patch Changes

- Update package licensing metadata to AGPL-3.0-only and prepare a release with the current codebase updates.
- Updated dependencies
  - @open-urbis/map-auth@1.0.1
  - @open-urbis/endereco-digital@1.0.1
  - @open-urbis/map-shared@1.0.1
  - @open-urbis/map-ui@1.0.1

## 1.0.1

### Patch Changes

- fce7a80: fix: MapPicker handle layerConfig and reset editFeatureTemplate

## 1.0.0

### Major Changes

- b779bfc: map data integration last version

### Patch Changes

- Updated dependencies [b779bfc]
  - @open-urbis/map-auth@1.0.0
  - @open-urbis/endereco-digital@1.0.0
  - @open-urbis/map-shared@1.0.0
  - @open-urbis/map-ui@1.0.0
