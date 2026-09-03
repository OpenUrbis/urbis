#!/usr/bin/env node
/**
 * Gera a variante de tema de uma imagem monocromática (logo branco → logo
 * escuro, e vice-versa), invertendo as cores e preservando a transparência.
 *
 * Útil para logos que precisam existir nas duas versões em vez de depender de
 * `filter: invert()` no CSS, que também mexe em cores que não deveriam mudar.
 *
 * Uso:
 *   node scripts/make-theme-variant.mjs public/ade-sampa-branco.png --out=public/ade-sampa-escuro.png
 *   node scripts/make-theme-variant.mjs public/logo-branco.png --max-width=600
 *
 * Flags:
 *   --out=<caminho>      arquivo de saída (padrão: <nome>-invertido.<ext>)
 *   --max-width=<px>     redimensiona entrada e saída para no máximo N px de largura
 *   --dry-run            apenas relata o que faria
 */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const SITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const args = process.argv.slice(2)
const input = args.find((arg) => !arg.startsWith('--'))
const getOption = (name, fallback) => {
  const match = args.find((arg) => arg.startsWith(`--${name}=`))
  return match ? match.slice(name.length + 3) : fallback
}

if (!input) {
  console.error(
    'Uso: node scripts/make-theme-variant.mjs <arquivo> [--out=<arquivo>] [--max-width=<px>]',
  )
  process.exit(1)
}

const inputPath = path.resolve(SITE_ROOT, input)
const extension = path.extname(inputPath)
const defaultOut = inputPath.replace(extension, `-invertido${extension}`)
const outputPath = path.resolve(SITE_ROOT, getOption('out', defaultOut))
const maxWidth = Number(getOption('max-width', 0))
const dryRun = args.includes('--dry-run')

const formatKb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`

const encode = (pipeline) =>
  extension.toLowerCase() === '.png'
    ? pipeline.png({ compressionLevel: 9, effort: 10 })
    : pipeline.webp({ quality: 90, effort: 6 })

async function build(buffer, { invert }) {
  let pipeline = sharp(buffer)
  if (maxWidth > 0) {
    pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true })
  }
  // `alpha: false` mantém o canal alfa intacto: só a cor é invertida, então o
  // recorte transparente do logo continua igual.
  if (invert) pipeline = pipeline.negate({ alpha: false })
  return encode(pipeline).toBuffer()
}

const original = await readFile(inputPath)
const metadata = await sharp(original).metadata()

const variant = await build(original, { invert: true })
const source = maxWidth > 0 ? await build(original, { invert: false }) : original

console.log(
  `\n${path.relative(SITE_ROOT, inputPath)} (${metadata.width}×${metadata.height}, ${formatKb(original.length)})`,
)

if (maxWidth > 0 && source.length !== original.length) {
  console.log(
    `  origem   → ${path.relative(SITE_ROOT, inputPath)} ` +
      `(${Math.min(maxWidth, metadata.width ?? maxWidth)}px, ${formatKb(source.length)})`,
  )
}
console.log(
  `  variante → ${path.relative(SITE_ROOT, outputPath)} ` +
    `(cores invertidas, ${formatKb(variant.length)})\n`,
)

if (dryRun) {
  console.log('(--dry-run: nenhum arquivo foi escrito)\n')
  process.exit(0)
}

if (maxWidth > 0) await writeFile(inputPath, source)
await writeFile(outputPath, variant)
