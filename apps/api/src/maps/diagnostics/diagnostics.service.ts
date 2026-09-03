import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { LegisPage } from '../../legis/pages/entities/legis-page.entity';
import { LayerSchema } from '../layer-schemas/entities/layer-schema.entity';
import { SearchConfig } from '../search/entities/search-config.entity';

export interface DiagnosticLinkResult {
  url: string;
  originalUrl: string;
  sourceType: 'legis' | 'layer_schema' | 'search_config' | 'mosaico';
  sourceId: string;
  sourceName: string;
  status: 'ok' | 'broken';
  statusCode: number | null;
  errorMessage: string | null;
}

@Injectable()
export class DiagnosticsService {
  private readonly logger = new Logger(DiagnosticsService.name);

  constructor(
    @InjectRepository(LegisPage)
    private readonly legisPageRepository: Repository<LegisPage>,

    @InjectRepository(LayerSchema)
    private readonly layerSchemaRepository: Repository<LayerSchema>,

    @InjectRepository(SearchConfig)
    private readonly searchConfigRepository: Repository<SearchConfig>,

    private readonly configService: ConfigService,
  ) {}

  /**
   * Helper to run tasks with a concurrency limit
   */
  private async runWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    fn: (item: T) => Promise<R>,
  ): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex++;
        const item = items[currentIndex];
        try {
          results[currentIndex] = await fn(item);
        } catch (error) {
          this.logger.error(
            `Error processing task at index ${currentIndex}: ${error.message}`,
          );
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(concurrency, items.length) },
      worker,
    );
    await Promise.all(workers);
    return results;
  }

  /**
   * Extracts absolute HTTP/HTTPS links from a text string.
   */
  private extractUrls(text: string): string[] {
    if (!text) return [];

    const urls: string[] = [];

    // Extract URLs from href attributes
    const hrefRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
    let match;
    while ((match = hrefRegex.exec(text)) !== null) {
      urls.push(match[1]);
    }

    // Extract any other absolute HTTP/HTTPS URLs present in text
    const generalRegex = /(https?:\/\/[^\s"'<>{}]+)/gi;
    while ((match = generalRegex.exec(text)) !== null) {
      const url = match[1].replace(/[.,;:!)]$/, ''); // Clean trailing punctuation
      if (!urls.includes(url)) {
        urls.push(url);
      }
    }

    return Array.from(new Set(urls));
  }

  /**
   * Resolve placeholders like {environment} in URLs to allow checking local/relative APIs
   */
  private resolveUrl(url: string): string {
    if (!url) return '';
    if (url.includes('{environment}')) {
      const port = this.configService.get('app.port') || 3000;
      const localApiUrl = `http://localhost:${port}`;
      return url.replace(/{environment}/g, localApiUrl);
    }
    return url;
  }

  /**
   * Extracts external URLs from source code strings (TSX / TS / HTML)
   */
  private extractUrlsFromCode(text: string): string[] {
    if (!text) return [];
    const urls = new Set<string>();
    const patterns = [
      /href\s*[:=]\s*["'`](\s*https?:\/\/[^"'`\s<>{}]+)[\s"'`]/gi,
      /href\s*[:=]\s*\{["'`](\s*https?:\/\/[^"'`\s<>{}]+)[\s"'`]\}/gi,
      /["'`](\s*https?:\/\/[^\s"'`<>{}]+?\s*)["'`]/gi,
    ];

    for (const regex of patterns) {
      let match;
      while ((match = regex.exec(text)) !== null) {
        const raw = match[1] ? match[1].trim() : '';
        const url = raw.replace(/[.,;:!)`"'\]]+$/, '');
        if (
          url &&
          url.startsWith('http') &&
          !url.includes('localhost') &&
          !url.includes('127.0.0.1') &&
          !url.includes('example.com') &&
          !url.includes('${') &&
          !url.endsWith('/$') &&
          !url.includes('schema.org') &&
          !url.includes('w3.org')
        ) {
          urls.add(url);
        }
      }
    }
    return Array.from(urls);
  }

  /**
   * Locates the Mosaico source directory across different deployment and development environments
   */
  private getMosaicoSrcDir(): string | null {
    const possiblePaths = [
      path.resolve(process.cwd(), 'apps/site/src'),
      path.resolve(process.cwd(), '../site/src'),
      path.resolve(process.cwd(), '../../apps/site/src'),
      path.resolve(__dirname, '../../../../site/src'),
      path.resolve(__dirname, '../../../../../apps/site/src'),
      path.resolve(__dirname, '../../../apps/site/src'),
      path.resolve('/app/apps/site/src'),
    ];

    for (const p of possiblePaths) {
      try {
        if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
          return p;
        }
      } catch {
        // Continue searching other paths
      }
    }
    return null;
  }

  /**
   * Scans and extracts all links from all Mosaico (site) pages
   */
  private extractMosaicoCandidates(): Array<{
    url: string;
    originalUrl: string;
    sourceType: 'mosaico';
    sourceId: string;
    sourceName: string;
  }> {
    const candidates: Array<{
      url: string;
      originalUrl: string;
      sourceType: 'mosaico';
      sourceId: string;
      sourceName: string;
    }> = [];

    const fileMetaMap: Record<string, { id: string; name: string }> = {
      'pages/CartaServicos.tsx': {
        id: 'mosaico:carta-servicos',
        name: 'Mosaico: Carta de Serviços',
      },
      'pages/GuiaLegislacaoUrbanistica.tsx': {
        id: 'mosaico:guia-legislacao',
        name: 'Mosaico: Guia Legislação Urbanística',
      },
      'pages/GuiaFiscalizacaoUrbanistica.tsx': {
        id: 'mosaico:guia-fiscalizacao',
        name: 'Mosaico: Guia Fiscalização Urbanística',
      },
      'pages/DocTecnica.tsx': {
        id: 'mosaico:doc-tecnica',
        name: 'Mosaico: Documentação Técnica',
      },
      'pages/Home.tsx': {
        id: 'mosaico:inicio',
        name: 'Mosaico: Início',
      },
      'components/home/Mosaico.tsx': {
        id: 'mosaico:inicio',
        name: 'Mosaico: Início',
      },
      'pages/About.tsx': {
        id: 'mosaico:sobre',
        name: 'Mosaico: Sobre Nós',
      },
      'pages/Contact.tsx': {
        id: 'mosaico:contato',
        name: 'Mosaico: Contato',
      },
      'pages/Ajuda.tsx': {
        id: 'mosaico:ajuda',
        name: 'Mosaico: Ajuda',
      },
      'components/layout/Footer.tsx': {
        id: 'mosaico:rodape',
        name: 'Mosaico: Rodapé',
      },
      'Layout.tsx': {
        id: 'mosaico:layout',
        name: 'Mosaico: Menu Geral',
      },
    };

    const siteSrc = this.getMosaicoSrcDir();
    if (!siteSrc) {
      this.logger.warn(
        'Could not locate Mosaico source directory for link diagnostics.',
      );
      return candidates;
    }

    try {
      const scanDir = (dir: string): string[] => {
        let files: string[] = [];
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            files = files.concat(scanDir(fullPath));
          } else if (
            (entry.endsWith('.tsx') || entry.endsWith('.ts')) &&
            !entry.includes('.spec.') &&
            !entry.includes('.test.')
          ) {
            files.push(fullPath);
          }
        }
        return files;
      };

      const allFiles = scanDir(siteSrc);
      for (const filePath of allFiles) {
        const relPath = path.relative(siteSrc, filePath).replace(/\\/g, '/');

        // Ignore internal setup / config files
        if (
          relPath.includes('GlobalProvider') ||
          relPath.includes('main.tsx') ||
          relPath.includes('routes.tsx') ||
          relPath.includes('mode-toggle') ||
          relPath.includes('ScrollToTop') ||
          relPath.includes('useAuth')
        ) {
          continue;
        }

        const meta = fileMetaMap[relPath] || {
          id: `mosaico:${path.basename(filePath, path.extname(filePath)).toLowerCase()}`,
          name: `Mosaico: ${path.basename(filePath, path.extname(filePath))}`,
        };

        const content = fs.readFileSync(filePath, 'utf8');
        const extractedUrls = this.extractUrlsFromCode(content);

        for (const url of extractedUrls) {
          candidates.push({
            url: this.resolveUrl(url),
            originalUrl: url,
            sourceType: 'mosaico',
            sourceId: meta.id,
            sourceName: meta.name,
          });
        }
      }

      this.logger.log(
        `Extracted ${candidates.length} candidate links from Mosaico pages.`,
      );
    } catch (err: any) {
      this.logger.error(`Error scanning Mosaico pages: ${err.message}`);
    }

    return candidates;
  }

  /**
   * Runs the link diagnostics for Mosaico, Legis and Maps "chamadas"
   */
  async runLinkDiagnostics(): Promise<{
    summary: {
      total: number;
      ok: number;
      broken: number;
      mosaicoCount: number;
      legisCount: number;
      layerSchemaCount: number;
      searchConfigCount: number;
    };
    results: DiagnosticLinkResult[];
  }> {
    this.logger.log('Starting link diagnostic check...');
    const startTime = Date.now();

    // 1. Fetch from database using optimized queries (selecting only required columns)
    const [legisPages, layerSchemas, searchConfigs] = await Promise.all([
      this.legisPageRepository.find({
        select: ['id', 'title', 'slug', 'content', 'source'],
      }),
      this.layerSchemaRepository.find({
        select: ['id', 'name', 'origin', 'isActive'],
      }),
      this.searchConfigRepository.find({
        select: ['id', 'name', 'origin', 'isActive'],
      }),
    ]);

    this.logger.log(
      `Retrieved ${legisPages.length} Legis pages, ${layerSchemas.length} layer schemas, and ${searchConfigs.length} search configs.`,
    );

    const candidates: Array<{
      url: string;
      originalUrl: string;
      sourceType: 'legis' | 'layer_schema' | 'search_config' | 'mosaico';
      sourceId: string;
      sourceName: string;
    }> = [];

    // 2. Extract URLs from Mosaico pages
    const mosaicoCandidates = this.extractMosaicoCandidates();
    candidates.push(...mosaicoCandidates);

    // 2. Extract URLs from Legis pages (content and source JSON)
    for (const page of legisPages) {
      const extracted = this.extractUrls(page.content);

      // Also extract from source JSON if present
      if (page.source && typeof page.source === 'object') {
        const sourceUrl = (page.source as any).url || (page.source as any).URL;
        if (
          sourceUrl &&
          typeof sourceUrl === 'string' &&
          sourceUrl.startsWith('http')
        ) {
          extracted.push(sourceUrl);
        }
      }

      const uniquePageUrls = Array.from(new Set(extracted));
      for (const url of uniquePageUrls) {
        candidates.push({
          url: this.resolveUrl(url),
          originalUrl: url,
          sourceType: 'legis',
          sourceId: page.id,
          sourceName: page.title,
        });
      }
    }

    // 3. Extract URLs from active layer schemas (origin)
    for (const schema of layerSchemas) {
      if (
        schema.origin &&
        typeof schema.origin === 'string' &&
        schema.origin.trim() !== ''
      ) {
        candidates.push({
          url: this.resolveUrl(schema.origin),
          originalUrl: schema.origin,
          sourceType: 'layer_schema',
          sourceId: schema.id,
          sourceName: schema.name,
        });
      }
    }

    // 4. Extract URLs from active search configurations (origin)
    for (const config of searchConfigs) {
      if (
        config.origin &&
        typeof config.origin === 'string' &&
        config.origin.trim() !== ''
      ) {
        candidates.push({
          url: this.resolveUrl(config.origin),
          originalUrl: config.origin,
          sourceType: 'search_config',
          sourceId: config.id,
          sourceName: config.name,
        });
      }
    }

    this.logger.log(
      `Found ${candidates.length} candidate links to check. Verifying status...`,
    );

    // 5. Verify status of each link in parallel with concurrency = 10
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
    const httpAgent = new http.Agent({});

    const results = await this.runWithConcurrency(
      candidates,
      10,
      async (candidate) => {
        try {
          const response = await axios.get(candidate.url, {
            timeout: 8000, // 8 seconds timeout
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
              Accept: '*/*',
            },
            httpsAgent,
            httpAgent,
            maxRedirects: 5,
            validateStatus: () => true, // Accept any status code, so we can capture 404, 500, etc.
          });

          const isOk = response.status >= 200 && response.status < 400;

          return {
            ...candidate,
            status: isOk ? ('ok' as const) : ('broken' as const),
            statusCode: response.status,
            errorMessage: isOk ? null : `HTTP Status ${response.status}`,
          };
        } catch (err: any) {
          let errorMsg = err.message || 'Unknown Network Error';
          if (err.code === 'ECONNABORTED') {
            errorMsg = 'Timeout (8s)';
          }

          return {
            ...candidate,
            status: 'broken' as const,
            statusCode: null,
            errorMessage: errorMsg,
          };
        }
      },
    );

    // 6. Generate summary statistics
    const total = results.length;
    const ok = results.filter((r) => r.status === 'ok').length;
    const broken = total - ok;
    const mosaicoCount = results.filter(
      (r) => r.sourceType === 'mosaico',
    ).length;
    const legisCount = results.filter((r) => r.sourceType === 'legis').length;
    const layerSchemaCount = results.filter(
      (r) => r.sourceType === 'layer_schema',
    ).length;
    const searchConfigCount = results.filter(
      (r) => r.sourceType === 'search_config',
    ).length;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    this.logger.log(
      `Diagnostic check completed in ${duration}s. Total: ${total}, OK: ${ok}, Broken: ${broken}, Mosaico: ${mosaicoCount}, Legis: ${legisCount}`,
    );

    return {
      summary: {
        total,
        ok,
        broken,
        mosaicoCount,
        legisCount,
        layerSchemaCount,
        searchConfigCount,
      },
      results,
    };
  }
}
