# @open-urbis/endereco-digital

Este pacote provê a lógica para o **Endereço Digital**, uma representação alfanumérica curta para coordenadas geográficas.

O Endereço Digital é utilizado no cadastro e no mapa para representar uma região de **1 metro quadrado**, permitindo um endereçamento preciso mesmo em locais sem logradouros oficiais.

## Instalação

```bash
pnpm add @open-urbis/endereco-digital
```

## Uso

```typescript
import { encode, decode, getPolygon } from '@open-urbis/endereco-digital';

// Codificar coordenadas para Endereço Digital
const address = encode(-23.55052, -46.63330); // "-23-46 J6M-GHNT"

// Decodificar Endereço Digital para coordenadas
const coords = decode("-23-46 J6M-GHNT"); // { latitude: -23.55052, longitude: -46.63330 }

// Obter o polígono (1m²) do endereço
const polygon = getPolygon("-23-46 J6M-GHNT");
```

## Desenvolvimento

Para rodar os testes:

```bash
pnpm test
```
