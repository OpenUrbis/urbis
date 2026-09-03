# @open-urbis/endereco-digital

Este pacote provê a lógica para o **Endereço Digital Urbis**, uma representação alfanumérica curta para coordenadas geográficas.

https://mapa.urbis.prefeitura.sp.gov.br/

O Endereço Digital Urbis localiza uma área de aproximadamente **1 metro quadrado**. Pode ser usado como endereço em ruas sem nome oficial ou CEP.

(não oficial - uso interno da urbis)

Documentação completa: [documentacao.pdf](./public/documentacao.pdf)

## Instalação

```bash
pnpm add @open-urbis/endereco-digital
```

## Uso

```typescript
import { encode, decode, getPolygon } from "@open-urbis/endereco-digital";

// Codificar coordenadas para Endereço Digital
const address = encode(-23.55052, -46.6333); // "-23-46 J6M-GHNT"

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
