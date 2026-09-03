export type ILayerPattern =
  | "full"
  | "hatch-1x"
  | "hatch-1x-reverse"
  | "hatch-2x"
  | "hatch-2x-reverse"
  | "hatch-cross"
  | "hatch-horizontal"
  | "hatch-vertical"
  | "hatch-grid"
  | "dots";

export interface ILayerPatternDefinition {
  value: ILayerPattern;
  /** Rótulo curto exibido sob a pré-visualização (espaço reduzido). */
  label: string;
  /** Texto completo usado em `title`/tooltip. */
  description: string;
  /** Coordenadas do tile dentro de `/pattern.png`. */
  x: number;
  y: number;
}

/**
 * Atlas de hachuras: `/pattern.png` é uma grade 4x4 de tiles de 120x120 (com 4px de
 * padding transparente entre eles) dentro de uma imagem de 512x512.
 *
 * Os quatro primeiros padrões mantêm as coordenadas do atlas antigo (256x256) para não
 * alterar camadas já publicadas. Para regenerar a imagem e o mapping:
 * `node apps/web/scripts/generate-pattern-atlas.mjs`.
 *
 * `PATTERN_ATLAS_VERSION` serve como cache-busting: o arquivo tem nome fixo e cresceu
 * de 256x256 para 512x512, então um atlas antigo em cache renderizaria os padrões novos
 * de forma errada. Ao regerar a imagem com novos padrões, incremente o valor aqui e em
 * `globals.css`.
 */
export const PATTERN_ATLAS_VERSION = "2";
export const PATTERN_ATLAS_URL = `/pattern.png?v=${PATTERN_ATLAS_VERSION}`;
export const PATTERN_MAPPING_URL = `/pattern.json?v=${PATTERN_ATLAS_VERSION}`;
export const PATTERN_ATLAS_SIZE = 512;

export const patterns: ILayerPatternDefinition[] = [
  {
    value: "full",
    label: "Cor Cheia",
    description: "Cor cheia, sem hachura",
    x: 132,
    y: 4,
  },
  {
    value: "hatch-1x",
    label: "Diag. /",
    description: "Linhas diagonais inclinadas para a direita (/)",
    x: 4,
    y: 4,
  },
  {
    value: "hatch-1x-reverse",
    label: "Diag. \\",
    description: "Linhas diagonais no sentido contrário (\\)",
    x: 260,
    y: 4,
  },
  {
    value: "hatch-cross",
    label: "Cruzado",
    description: "Linhas diagonais cruzadas (X)",
    x: 4,
    y: 132,
  },
  {
    value: "hatch-2x",
    label: "Diag. //",
    description: "Linhas diagonais para a direita, o dobro mais próximas (//)",
    x: 388,
    y: 4,
  },
  {
    value: "hatch-2x-reverse",
    label: "Diag. \\\\",
    description:
      "Linhas diagonais no sentido contrário, o dobro mais próximas (\\\\)",
    x: 260,
    y: 132,
  },
  {
    value: "hatch-horizontal",
    label: "Horizontal",
    description: "Linhas retas horizontais (da esquerda para a direita)",
    x: 388,
    y: 132,
  },
  {
    value: "hatch-vertical",
    label: "Vertical",
    description: "Linhas retas verticais (de cima para baixo)",
    x: 4,
    y: 260,
  },
  {
    value: "hatch-grid",
    label: "Grade",
    description: "Linhas retas horizontais e verticais cruzadas (grade)",
    x: 132,
    y: 260,
  },
  {
    value: "dots",
    label: "Pontos",
    description: "Padrão de pontos",
    x: 132,
    y: 132,
  },
];

export const getPatternDefinition = (pattern: ILayerPattern | undefined) =>
  patterns.find((item) => item.value === pattern) ?? patterns[0];

/** Nomes antigos que ainda podem existir em configurações salvas. */
const LEGACY_PATTERN_ALIASES: Record<string, ILayerPattern> = {
  hatch: "hatch-1x",
};

/**
 * Garante que o padrão exista no atlas. Um nome desconhecido faria o deck.gl usar um
 * frame vazio (`[0, 0, 0, 0]`) e o polígono ficaria sem preenchimento, então o
 * fallback é sempre `full`.
 */
export const normalizeLayerPattern = (
  pattern: string | undefined | null,
): ILayerPattern => {
  if (!pattern) return "full";
  if (patterns.some((item) => item.value === pattern)) {
    return pattern as ILayerPattern;
  }

  return LEGACY_PATTERN_ALIASES[pattern] ?? "full";
};

/**
 * Estilo inline que renderiza um tile do atlas como máscara de um elemento.
 * `scale` é relativo ao tile: 0.4 => tile de 48px, 0.25 => tile de 30px.
 */
export const getPatternStyle = (
  pattern: ILayerPattern | undefined,
  color: string,
  scale = 0.25,
) => {
  const p = getPatternDefinition(pattern);

  const maskSize = `${PATTERN_ATLAS_SIZE * scale}px ${PATTERN_ATLAS_SIZE * scale}px`;
  const x = p.x * scale;
  const y = p.y * scale;
  const maskPosition = `-${x}px -${y}px`;

  return {
    backgroundColor: color,
    maskImage: `url("${PATTERN_ATLAS_URL}")`,
    WebkitMaskImage: `url("${PATTERN_ATLAS_URL}")`,
    maskSize,
    WebkitMaskSize: maskSize,
    maskPosition,
    WebkitMaskPosition: maskPosition,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
  };
};
