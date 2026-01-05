# @open-urbis/numeracao-digital

<p align="center">
  <img src="public/endereco_digital_logo.png" alt="Logo Endereço Digital" height="100" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="public/logo_local.png" alt="Logo PMSP" height="100" />
</p>

**Desenvolvida por SEPLAN/SIME/CODATA**

Pacote responsável pela lógica de **Endereçamento Digital**, permitindo a conversão bidirecional entre coordenadas geográficas (latitude/longitude) e um código alfanumérico curto e legível.

Este projeto é inspirado no sistema [Plus Codes](https://maps.google.com/pluscodes/) (Open Location Code), adaptado para as necessidades locais.

> Para documentação completa e detalhada, consulte o arquivo [documentacao.docx](./public/documentacao.docx) disponível neste pacote.

## ✨ Funcionalidades

- **Full TypeScript support**: Tipagem completa incluída.
- **Zero dependencies**: Nenhuma dependência externa de runtime.
- **Leve e Rápido**: Otimizado para conversões instantâneas.
- **Inspirado no Plus Codes**: Utiliza conceitos similares de grade e codificação alfanumérica.

## 🧠 Como Funciona

O sistema de endereçamento digital combina a localização macro (graus inteiros) com a localização micro (decimais) para criar um identificador único.

### Estrutura do Endereço
Um endereço como **`-23-46 J7K-H87F`** é formado por:

1. **Prefixo (`-23-46`)**: Representa a parte inteira da latitude e longitude. Permite identificar o quadrante global (ex: São Paulo).
2. **Código Base27 (`J7K-H87F`)**: Codifica as **5 casas decimais** de precisão da latitude e longitude.

### O que é Base27?
Base27 é um sistema de numeração posicional que utiliza 27 símbolos diferentes para representar valores.
Neste projeto, essa base foi escolhida para permitir representar 10 bilhões de combinações (necessárias para a precisão de 5 casas decimais) utilizando apenas 7 caracteres.

O alfabeto específico foi desenhado para remover caracteres confusos ou indesejados:
- **Vogais removidas** (A, E, I, O, U): Evita a formação acidental de palavras.
- **Números e Letras semelhantes removidos**: 0 e 1 (confundíveis com O e I).
- **Fonética**: R e S removidos para evitar confusão auditiva.

Alfabeto: `23456789BCDFGHJKLMNPQTVWXYZ`

## 📦 Instalação

```bash
yarn add @open-urbis/numeracao-digital
```

## 🚀 Como Usar

### Importação

```typescript
import { encode, decode } from '@open-urbis/numeracao-digital';
```

### Codificação (Encoding)

```typescript
const lat = -23.55038;
const lon = -46.63395;

const endereco = encode(lat, lon);
console.log(endereco); 
// Saída: "-23-46 J7K-H87F"
```

### Decodificação (Decoding)

```typescript
const endereco = "-23-46 J7K-H87F";

try {
  const coordenadas = decode(endereco);
  console.log(coordenadas);
  // Saída: { latitude: -23.55038, longitude: -46.63395 }
} catch (error) {
  console.error("Endereço inválido:", error.message);
}
```

## 🛠️ API Reference

### `encode(lat: number, lon: number): string`
Gera o endereço digital completo (Prefixo + Código).

### `decode(digitalAddress: string): { latitude: number, longitude: number }`
Reverte o endereço digital para coordenadas.

### `getPolygon(digitalAddress: string): Array<{ lat: number, lon: number }>`
Retorna os 4 cantos do polígono (retângulo) que representa a área coberta pelo endereço digital.

### `getAddressMetrics(digitalAddress: string): { faces: number[], area: number }`
Retorna as dimensões do polígono do endereço:
- `faces`: Array com o comprimento de cada face em metros (1-2, 2-3, 3-4, 4-1).
- `area`: Área total em metros quadrados.

### Utilitários
- `converterParaBase27(num: string | bigint): string`
- `converterDeBase27(code: string): string`
- `extrair5Decimais(val: number): string`
- `expandirPorTexto(coord: string): [string, string]`
- `calculateDistance(lat1, lng1, lat2, lng2): number`
- `calculateArea(polygon: Array<{lat, lon}>): number`

## 🧪 Testes

Este pacote inclui testes unitários cobrindo diversos casos de uso, incluindo endereços globais (ex: Índia, Amapá).

```bash
yarn workspace @open-urbis/numeracao-digital test
```
