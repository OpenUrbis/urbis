import { Injectable } from '@nestjs/common';
import { ImportFromUrlDto } from './dto/import-from-url.dto';

@Injectable()
export class LegisImportService {
  async importFromUrl({ url }: ImportFromUrlDto) {
    return {
      content: `<h2>Importação inicial do Legis</h2><p>Conteúdo importado de <strong>${url}</strong>.</p>`,
      metadata: {
        sourceUrl: url,
        importedAt: new Date().toISOString(),
        mode: 'mvp-simulated',
      },
    };
  }
}