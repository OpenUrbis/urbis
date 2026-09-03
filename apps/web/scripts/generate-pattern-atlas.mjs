/**
 * Gera o atlas de padrões de preenchimento (hachuras) usado pelo mapa.
 *
 * Saídas:
 *   - apps/web/public/pattern.png   (atlas RGBA 512x512, grade 4x4 de tiles 120x120)
 *   - apps/web/public/pattern.json  (mapping consumido pelo FillStyleExtension do deck.gl)
 *   - packages/map/public/*         (cópia dos assets para consumidores do pacote público)
 *   - apps/docs/public/patterns/*   (pré-visualizações usadas na documentação)
 *
 * Uso:
 *   node apps/web/scripts/generate-pattern-atlas.mjs
 *
 * Regras importantes:
 *   - Os quatro padrões originais (`hatch-1x`, `full`, `hatch-cross`, `dots`) permanecem
 *     nas MESMAS coordenadas do atlas antigo (256x256) e são copiados pixel a pixel do
 *     arquivo atual, garantindo que camadas já publicadas continuem idênticas.
 *   - O tamanho do tile (120px) define o tamanho do padrão no mundo
 *     (`fillPatternScale * frame.width`), portanto NÃO deve mudar.
 *   - A tabela `TILES` abaixo precisa ficar em sincronia com
 *     `apps/web/src/lib/layer-patterns.ts` (o script valida e avisa em caso de divergência).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { deflateSync, inflateSync } from "node:zlib";

const ATLAS_SIZE = 512;
const TILE = 120;
const PADDING = 4;
const CELL = TILE + PADDING * 2; // 128

/** Pré-visualizações da documentação: fundo claro + tinta escura, 2x2 tiles. */
const PREVIEW_BACKGROUND = [241, 245, 249];
const PREVIEW_INK = [30, 41, 59];

const publicDir = new URL("../public/", import.meta.url);
const atlasPath = new URL("pattern.png", publicDir);
const mappingPath = new URL("pattern.json", publicDir);
const packagePublicDir = new URL("../../../packages/map/public/", import.meta.url);
const docsPreviewDir = new URL("../../docs/public/patterns/", import.meta.url);
const layerPatternsPath = new URL("../src/lib/layer-patterns.ts", import.meta.url);

/** Posição de cada tile na grade (coluna, linha). */
const cell = (col, row) => ({ x: PADDING + col * CELL, y: PADDING + row * CELL });

/**
 * Espessura perpendicular do traço das diagonais originais: a faixa tem 12px medidos
 * na horizontal com inclinação de 45°, logo 12 / raiz(2).
 */
const STROKE = 12 / Math.SQRT2; // ~8.485
/** Período das retas horizontais/verticais (duas linhas por tile). */
const STRAIGHT_PERIOD = TILE / 2; // 60

const TILES = [
  // --- legado: coordenadas preservadas do atlas 256x256 ---
  { name: "hatch-1x", ...cell(0, 0), source: { type: "legacy", from: [4, 4] } },
  { name: "full", ...cell(1, 0), source: { type: "legacy", from: [132, 4] } },
  { name: "hatch-cross", ...cell(0, 1), source: { type: "legacy", from: [4, 132] } },
  { name: "dots", ...cell(1, 1), source: { type: "legacy", from: [132, 132] } },

  // --- novos padrões ---
  // Diagonais derivadas do tile original (espelho/deslocamento cíclico), o que mantém
  // exatamente o mesmo peso de traço e o encaixe sem emenda.
  {
    name: "hatch-1x-reverse",
    ...cell(2, 0),
    source: { type: "derived", from: "hatch-1x", mirrorX: true },
  },
  {
    name: "hatch-2x",
    ...cell(3, 0),
    source: { type: "derived", from: "hatch-1x", union: { shiftX: TILE / 2 } },
  },
  {
    name: "hatch-2x-reverse",
    ...cell(2, 1),
    source: {
      type: "derived",
      from: "hatch-1x",
      union: { shiftX: TILE / 2 },
      mirrorX: true,
    },
  },
  // Retas desenhadas proceduralmente.
  {
    name: "hatch-horizontal",
    ...cell(3, 1),
    source: { type: "lines", horizontal: true },
  },
  {
    name: "hatch-vertical",
    ...cell(0, 2),
    source: { type: "lines", vertical: true },
  },
  {
    name: "hatch-grid",
    ...cell(1, 2),
    source: { type: "lines", horizontal: true, vertical: true },
  },
];

// ---------------------------------------------------------------------------
// PNG (leitura/escrita mínima de RGBA 8 bits, sem dependências externas)
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

/** @returns {{ width: number, height: number, data: Buffer }} RGBA 8 bits. */
const decodePng = (buf) => {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("PNG inválido");

  let pos = 8;
  let header = null;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
        interlace: data[12],
      };
    } else if (type === "IDAT") {
      idat.push(Buffer.from(data));
    }
    pos += 12 + len;
  }

  if (!header) throw new Error("PNG sem IHDR");
  if (header.bitDepth !== 8 || header.colorType !== 6 || header.interlace !== 0) {
    throw new Error(
      `Só é suportado PNG RGBA 8 bits não entrelaçado (recebido: bitDepth=${header.bitDepth} colorType=${header.colorType})`,
    );
  }

  const { width, height } = header;
  const bpp = 4;
  const stride = width * bpp;
  const raw = inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(stride * height);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;

    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      switch (filter) {
        case 0:
          break;
        case 1:
          v += a;
          break;
        case 2:
          v += b;
          break;
        case 3:
          v += (a + b) >> 1;
          break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          break;
        }
        default:
          throw new Error(`Filtro PNG não suportado: ${filter}`);
      }
      cur[i] = v & 0xff;
    }
  }

  return { width, height, data: out };
};

const encodePng = ({ width, height, data }) => {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filtro "None"
    data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

// ---------------------------------------------------------------------------
// Manipulação de tiles (matriz de alpha 0-255; a cor é sempre preto,
// porque o atlas é usado como máscara — `fillPatternMask: true`)
// ---------------------------------------------------------------------------

const createTile = () => new Uint8Array(TILE * TILE);

const readTileFromAtlas = (image, ox, oy) => {
  const tile = createTile();
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      tile[y * TILE + x] = image.data[((oy + y) * image.width + (ox + x)) * 4 + 3];
    }
  }
  return tile;
};

const mirrorTileX = (tile) => {
  const out = createTile();
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) out[y * TILE + x] = tile[y * TILE + (TILE - 1 - x)];
  }
  return out;
};

const shiftTileX = (tile, dx) => {
  const out = createTile();
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      out[y * TILE + x] = tile[y * TILE + (((x - dx) % TILE) + TILE) % TILE];
    }
  }
  return out;
};

const unionTiles = (a, b) => {
  const out = createTile();
  for (let i = 0; i < out.length; i++) out[i] = Math.max(a[i], b[i]);
  return out;
};

/** Distância mínima até o centro da linha mais próxima, considerando a repetição. */
const periodicDistance = (value, center, period) => {
  const d = (((value - center) % period) + period) % period;
  return Math.min(d, period - d);
};

/**
 * Retas horizontais e/ou verticais com anti-aliasing por supersampling.
 * Centros em 30 e 90 para que um tile isolado (usado nas pré-visualizações)
 * fique visualmente equilibrado.
 */
const drawStraightLines = ({ horizontal = false, vertical = false }) => {
  const tile = createTile();
  const samples = 8;
  const half = STROKE / 2;
  const center = STRAIGHT_PERIOD / 2; // 30

  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      let hits = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const px = x + (sx + 0.5) / samples;
          const py = y + (sy + 0.5) / samples;
          const inside =
            (horizontal && periodicDistance(py, center, STRAIGHT_PERIOD) <= half) ||
            (vertical && periodicDistance(px, center, STRAIGHT_PERIOD) <= half);
          if (inside) hits++;
        }
      }
      tile[y * TILE + x] = Math.round((hits / (samples * samples)) * 255);
    }
  }

  return tile;
};

// ---------------------------------------------------------------------------
// Geração
// ---------------------------------------------------------------------------

const legacyAtlas = decodePng(readFileSync(atlasPath));
console.log(`atlas de origem: ${legacyAtlas.width}x${legacyAtlas.height}`);

const built = new Map();

const buildTile = (definition) => {
  const { source } = definition;

  if (source.type === "legacy") {
    const [ox, oy] = source.from;
    return readTileFromAtlas(legacyAtlas, ox, oy);
  }

  if (source.type === "derived") {
    const base = built.get(source.from);
    if (!base) throw new Error(`Tile base "${source.from}" precisa ser gerado antes`);
    let tile = base;
    if (source.union?.shiftX) tile = unionTiles(tile, shiftTileX(tile, source.union.shiftX));
    if (source.mirrorX) tile = mirrorTileX(tile);
    return tile;
  }

  if (source.type === "lines") return drawStraightLines(source);

  throw new Error(`Tipo de origem desconhecido: ${source.type}`);
};

const atlas = {
  width: ATLAS_SIZE,
  height: ATLAS_SIZE,
  data: Buffer.alloc(ATLAS_SIZE * ATLAS_SIZE * 4), // transparente
};

for (const definition of TILES) {
  if (definition.x + TILE > ATLAS_SIZE || definition.y + TILE > ATLAS_SIZE) {
    throw new Error(`Tile "${definition.name}" não cabe no atlas`);
  }

  const tile = buildTile(definition);
  built.set(definition.name, tile);

  let ink = 0;
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const alpha = tile[y * TILE + x];
      ink += alpha;
      const i = ((definition.y + y) * ATLAS_SIZE + (definition.x + x)) * 4;
      atlas.data[i] = 0;
      atlas.data[i + 1] = 0;
      atlas.data[i + 2] = 0;
      atlas.data[i + 3] = alpha;
    }
  }

  const coverage = ((ink / (TILE * TILE * 255)) * 100).toFixed(1);
  console.log(
    `  ${definition.name.padEnd(18)} @ ${String(definition.x).padStart(3)},${String(
      definition.y,
    ).padStart(3)}  cobertura ${coverage}%  (${definition.source.type})`,
  );
}

const mapping = Object.fromEntries(
  TILES.map(({ name, x, y }) => [name, { x, y, width: TILE, height: TILE, mask: true }]),
);

const atlasPng = encodePng(atlas);
const mappingJson = `${JSON.stringify(mapping, null, 2)}\n`;

writeFileSync(atlasPath, atlasPng);
writeFileSync(mappingPath, mappingJson);

console.log(`\ngerado ${ATLAS_SIZE}x${ATLAS_SIZE} com ${TILES.length} padrões`);

// Cópia para o pacote público: consumidores externos servem estes arquivos em /pattern.*
mkdirSync(packagePublicDir, { recursive: true });
writeFileSync(new URL("pattern.png", packagePublicDir), atlasPng);
writeFileSync(new URL("pattern.json", packagePublicDir), mappingJson);
console.log("assets copiados para packages/map/public");

// Pré-visualizações da documentação: 2x2 tiles reduzidos para 120x120 (anti-aliasing).
const renderPreview = (tile) => {
  const size = TILE; // 240 (2x2 tiles) reduzido pela metade
  const data = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let alpha = 0;
      for (let sy = 0; sy < 2; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const tx = (x * 2 + sx) % TILE;
          const ty = (y * 2 + sy) % TILE;
          alpha += tile[ty * TILE + tx];
        }
      }
      const a = alpha / 4 / 255;
      const i = (y * size + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        data[i + ch] = Math.round(PREVIEW_BACKGROUND[ch] * (1 - a) + PREVIEW_INK[ch] * a);
      }
      data[i + 3] = 255;
    }
  }

  return encodePng({ width: size, height: size, data });
};

if (existsSync(new URL("../../docs/public/", import.meta.url))) {
  mkdirSync(docsPreviewDir, { recursive: true });
  for (const { name } of TILES) {
    writeFileSync(new URL(`${name}.png`, docsPreviewDir), renderPreview(built.get(name)));
  }
  console.log(`pré-visualizações geradas em apps/docs/public/patterns (${TILES.length})`);
} else {
  console.log("apps/docs não encontrado: pré-visualizações ignoradas");
}

// Sanidade: as coordenadas precisam bater com a tabela usada pela UI.
try {
  const source = readFileSync(layerPatternsPath, "utf8");
  const divergences = TILES.filter(({ name, x, y }) => {
    // Os nomes usam apenas [a-z0-9-], seguros para interpolar na expressão.
    const entry = new RegExp(
      `value:\\s*"${name}"[^}]*?x:\\s*(\\d+)[^}]*?y:\\s*(\\d+)`,
    ).exec(source);
    return !entry || Number(entry[1]) !== x || Number(entry[2]) !== y;
  }).map(({ name }) => name);

  if (divergences.length > 0) {
    console.warn(
      `\n[aviso] verifique src/lib/layer-patterns.ts (ausente/divergente): ${divergences.join(", ")}`,
    );
  } else {
    console.log("src/lib/layer-patterns.ts está em sincronia");
  }
} catch {
  console.warn("\n[aviso] não foi possível validar src/lib/layer-patterns.ts");
}
