# Urbis Web GIS (`@open-urbis/map-web`)

Aplicação web interativa de mapas GIS da plataforma Urbis, desenvolvida com **React 18**, **Vite**, **Deck.gl 9**, **MapLibre GL** e **Preact Signals**.

---

## 🚀 Execução em Desenvolvimento

```bash
# 1. Configurar variáveis de ambiente
cp apps/web/.env.example apps/web/.env

# 2. Iniciar servidor de desenvolvimento
pnpm --filter @open-urbis/map-web dev
```

A aplicação estará acessível em: `http://localhost:5173`

---

## ⚙️ Principais Funcionalidades

- **Renderização WebGL de Camadas**: Utiliza Deck.gl para desenhar dezenas de milhares de geometrias e polígonos urbanos em tempo real.
- **Mapas Base com MapLibre**: Suporte nativo a mapas base vetoriais e raster sem custo de token Mapbox no desenvolvimento.
- **Busca Territorial e Geocodificação**: Localização rápida por endereço convencional, coordenadas ou Endereço Digital (Plus Code).
- **Inspeção de Lotes e Zoneamento**: Consulta e emissão de dados de parcelamento do solo e zoneamento.
- **Controle de Camadas e Grupos**: Ativação, desativação, ajuste de opacidade e ordenação de camadas temáticas.

---

## 🏗️ Build de Produção

```bash
pnpm --filter @open-urbis/map-web build
```

Artefatos gerados em `dist/`.

---

## 🧪 Testes

```bash
pnpm --filter @open-urbis/map-web test
```
