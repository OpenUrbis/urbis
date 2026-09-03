#!/usr/bin/env node
/**
 * Compacta as imagens estáticas de `apps/site/public`.
 *
 * O script é idempotente: só substitui o arquivo quando o resultado é
 * efetivamente menor, então rodar várias vezes não degrada a imagem.
 *
 * Uso:
 *   pnpm images:optimize                      # otimiza no lugar
 *   pnpm images:optimize -- --dry-run         # só relatório, não escreve
 *   pnpm images:optimize -- --webp            # gera .webp ao lado dos raster
 *   pnpm images:check                         # falha se algo estourar o orçamento (CI)
 *
 * Flags:
 *   --dry-run            não escreve nada, apenas relata o ganho possível
 *   --check              modo verificação: não escreve e sai com código 1 se
 *                        alguma imagem passar do orçamento ou tiver ganho relevante
 *   --webp               também gera um irmão .webp para .jpg/.jpeg/.png
 *   --png-palette        quantiza PNGs (menor, mas com perda) — evite em logos/selos
 *   --dir=<caminho>      diretório alvo (padrão: public)
 *   --max-width=<px>     redimensiona o que for mais largo (padrão: 1600)
 *   --quality=<1-100>    qualidade de jpeg/webp (padrão: 80)
 *   --budget=<kb>        tamanho máximo aceitável por imagem (padrão: 400)
 */

import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const SITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const args = process.argv.slice(2)
const hasFlag = (name) => args.includes(`--${name}`)
const getOption = (name, fallback) => {
  const match = args.find((arg) => arg.startsWith(`--${name}=`))
  return match ? match.slice(name.length + 3) : fallback
}

const options = {
  check: hasFlag('check'),
  dryRun: hasFlag('dry-run') || hasFlag('check'),
  webp: hasFlag('webp'),
  pngPalette: hasFlag('png-palette'),
  dir: path.resolve(SITE_ROOT, getOption('dir', 'public')),
  maxWidth: Number(getOption('max-width', 1600)),
  quality: Number(getOption('quality', 80)),
  budgetBytes: Number(getOption('budget', 400)) * 1024,
}

/** Ganho mínimo (5%) para valer a pena reescrever o arquivo. */
const MIN_GAIN_RATIO = 0.05

const FORMATS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

async function collectImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) return collectImages(fullPath)
      return FORMATS.has(path.extname(entry.name).toLowerCase()) ? [fullPath] : []
    }),
  )
  return files.flat()
}

function encode(pipeline, extension) {
  switch (extension) {
    case '.png':
      return pipeline.png({
        compressionLevel: 9,
        effort: 10,
        // Sem paleta por padrão: mantém o PNG sem perdas (logos, selos, ícones).
        palette: options.pngPalette,
        ...(options.pngPalette ? { quality: 90, dither: 1 } : {}),
      })
    case '.webp':
      return pipeline.webp({ quality: options.quality, effort: 6 })
    default:
      return pipeline.jpeg({
        quality: options.quality,
        mozjpeg: true,
        progressive: true,
      })
  }
}

const formatKb = (bytes) => `${(bytes / 1024).toFixed(1).padStart(7)} kB`

async function optimize(filePath) {
  const extension = path.extname(filePath).toLowerCase()
  const original = await readFile(filePath)
  const metadata = await sharp(original).metadata()

  const needsResize = Boolean(metadata.width && metadata.width > options.maxWidth)

  let pipeline = sharp(original, { failOn: 'error' }).rotate()
  if (needsResize) {
    pipeline = pipeline.resize({ width: options.maxWidth, withoutEnlargement: true })
  }

  const optimized = await encode(pipeline, extension).toBuffer()
  const gain = (original.length - optimized.length) / original.length
  const worthIt = gain >= MIN_GAIN_RATIO

  if (worthIt && !options.dryRun) {
    await writeFile(filePath, optimized)
  }

  let webpBytes = null
  if (options.webp && extension !== '.webp') {
    const webpPath = filePath.replace(/\.(png|jpe?g)$/i, '.webp')
    const webpPipeline = sharp(original).rotate()
    if (needsResize) {
      webpPipeline.resize({ width: options.maxWidth, withoutEnlargement: true })
    }
    const webpBuffer = await encode(webpPipeline, '.webp').toBuffer()
    webpBytes = webpBuffer.length
    if (!options.dryRun) await writeFile(webpPath, webpBuffer)
  }

  const finalSize = worthIt ? optimized.length : original.length

  return {
    filePath,
    before: original.length,
    after: finalSize,
    resized: needsResize,
    width: metadata.width,
    changed: worthIt,
    gain,
    webpBytes,
    overBudget: finalSize > options.budgetBytes,
  }
}

async function main() {
  try {
    await stat(options.dir)
  } catch {
    console.error(`✖ Diretório não encontrado: ${options.dir}`)
    process.exit(1)
  }

  const images = (await collectImages(options.dir)).sort()

  if (images.length === 0) {
    console.log('Nenhuma imagem raster encontrada.')
    return
  }

  const action = options.check
    ? 'Verificando'
    : options.dryRun
      ? 'Simulando'
      : 'Compactando'

  console.log(
    `\n${action} ${images.length} imagem(ns) em ${path.relative(SITE_ROOT, options.dir)}/ ` +
      `(largura máx.: ${options.maxWidth}px, qualidade: ${options.quality}, ` +
      `orçamento: ${(options.budgetBytes / 1024).toFixed(0)} kB)\n`,
  )

  const results = []
  for (const image of images) {
    results.push(await optimize(image))
  }

  let totalBefore = 0
  let totalAfter = 0

  for (const result of results) {
    totalBefore += result.before
    totalAfter += result.after

    const name = path.relative(options.dir, result.filePath)
    const notes = [
      result.resized ? `redimensionada de ${result.width}px` : null,
      result.webpBytes !== null ? `webp ${formatKb(result.webpBytes).trim()}` : null,
      result.overBudget ? 'ACIMA DO ORÇAMENTO' : null,
    ].filter(Boolean)

    const status = result.changed
      ? `${formatKb(result.before)} → ${formatKb(result.after)}  (-${(result.gain * 100).toFixed(0)}%)`
      : `${formatKb(result.before)}  já otimizada`

    const icon = result.overBudget ? '⚠' : result.changed ? '✔' : '·'
    console.log(
      `${icon} ${name.padEnd(34)} ${status}${notes.length ? `  [${notes.join(', ')}]` : ''}`,
    )
  }

  const saved = totalBefore - totalAfter
  console.log(
    `\nTotal: ${formatKb(totalBefore).trim()} → ${formatKb(totalAfter).trim()}` +
      (saved > 0 ? ` (economia de ${formatKb(saved).trim()})` : ''),
  )

  if (options.dryRun && !options.check) {
    console.log('\n(--dry-run: nenhum arquivo foi alterado)')
  }

  if (options.check) {
    const problems = results.filter((r) => r.overBudget || r.changed)
    if (problems.length > 0) {
      console.error(
        `\n✖ ${problems.length} imagem(ns) precisam de atenção. ` +
          'Rode "pnpm images:optimize" e faça o commit do resultado.\n',
      )
      process.exit(1)
    }
    console.log('\n✔ Todas as imagens estão compactadas e dentro do orçamento.\n')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
