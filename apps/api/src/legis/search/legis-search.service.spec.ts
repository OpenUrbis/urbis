import { LegisSearchService, toSearchableText } from './legis-search.service';
import { LegisPage } from '../pages/entities';
import { LegisAuthority } from '../authorities/entities';

/**
 * The reported bug: a content match rendered the stored Tiptap document instead
 * of the text, e.g. `...text":"IV - Anexo IV – Tabelas..."}]},{"type":"paragraph"...`.
 */
describe('toSearchableText', () => {
  it('extracts the readable text from a Tiptap document', () => {
    const content = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { textAlign: 'left' },
          content: [
            { type: 'text', text: 'IV - Anexo IV – Tabelas Relativas.' },
          ],
        },
      ],
    });

    expect(toSearchableText(content)).toBe(
      'IV - Anexo IV – Tabelas Relativas.',
    );
  });

  it('keeps no JSON structure in the result', () => {
    const content = JSON.stringify({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Primeiro.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Segundo.' }] },
      ],
    });

    const result = toSearchableText(content);

    expect(result).toBe('Primeiro. Segundo.');
    expect(result).not.toContain('"type"');
    expect(result).not.toContain('paragraph');
    expect(result).not.toContain('{');
  });

  it('walks nested marks and nodes', () => {
    const content = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'normativeElement',
          attrs: { normativeId: 'el-1' },
          content: [
            { type: 'text', text: 'Art. 1º ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'Fica criado' },
            { type: 'text', text: ' o programa.' },
          ],
        },
      ],
    });

    expect(toSearchableText(content)).toBe('Art. 1º Fica criado o programa.');
  });

  it('strips tags from HTML element text without gluing or splitting words', () => {
    /* Inline tags must not inject spaces, or "Revogado." would become "Revogado .". */
    expect(toSearchableText('<p>Art. 2º <strong>Revogado</strong>.</p>')).toBe(
      'Art. 2º Revogado.',
    );
  });

  it('separates blocks that would otherwise run together', () => {
    expect(toSearchableText('<p>Primeiro</p><p>Segundo</p>')).toBe(
      'Primeiro Segundo',
    );
  });

  it('decodes the entities a stored document carries', () => {
    expect(toSearchableText('<p>Uso &amp; ocupa&#39;</p>')).toBe(
      "Uso & ocupa'",
    );
  });

  it('falls back to stripping when the JSON is malformed', () => {
    expect(toSearchableText('{"type":"doc",')).toBe('{"type":"doc",');
  });

  it('returns an empty string for absent values', () => {
    expect(toSearchableText(undefined)).toBe('');
    expect(toSearchableText(null)).toBe('');
    expect(toSearchableText('')).toBe('');
  });
});

describe('LegisSearchService', () => {
  let service: LegisSearchService;
  let pagesRepo: any;
  let authoritiesRepo: any;
  let pagesService: any;

  const mockAuthority: Partial<LegisAuthority> = {
    id: 'auth-pref',
    commonRefFull: 'Prefeito',
    commonRefAbbr: 'PREF',
    complementFull: 'Prefeitura do Município de São Paulo',
    complementAbbr: 'PMSP',
  };

  const mockPage: Partial<LegisPage> = {
    id: 'page-abc-123',
    slug: 'lei-16000-2014',
    title: 'Lei nº 16.000 de 15 de maio de 2014',
    type: 'original_normativo',
    entityType: 'original_normativo',
    content: '<p>Conteúdo da lei do zoneamento.</p>',
    tags: ['zoneamento', 'urbano'],
    entityData: {
      number: '16.000',
      normativeType: 'L',
      actDate: '2014-05-15',
      authorityId: 'auth-pref',
      ementa: 'Dispõe sobre o uso e ocupação do solo.',
      elements: [
        {
          id: 'el-1',
          type: 'Artigo',
          index: '1º',
          text: 'Esta lei disciplina o uso do solo.',
        },
      ],
    },
  };

  beforeEach(() => {
    pagesRepo = {
      find: jest.fn().mockResolvedValue([mockPage]),
    };
    authoritiesRepo = {
      find: jest.fn().mockResolvedValue([mockAuthority]),
    };
    pagesService = {
      withAuthorsMany: jest
        .fn()
        .mockImplementation((pages) => Promise.resolve(pages)),
    };

    service = new LegisSearchService(pagesRepo, authoritiesRepo, pagesService);
  });

  it('searches by page ID or slug', async () => {
    const resultsById = await service.searchPages({
      conditions: [
        { id: '1', field: 'term', operator: 'contains', value: 'page-abc' },
      ],
    });
    expect(resultsById).toHaveLength(1);
    expect(resultsById[0].matches.some((m) => m.field === 'ID da página')).toBe(
      true,
    );

    const resultsBySlug = await service.searchPages({
      conditions: [
        { id: '2', field: 'pageId', operator: 'contains', value: 'lei-16000' },
      ],
    });
    expect(resultsBySlug).toHaveLength(1);
  });

  it('searches by authority name or abbreviation', async () => {
    const resultsByAuthorityName = await service.searchPages({
      conditions: [
        { id: '1', field: 'term', operator: 'contains', value: 'Prefeito' },
      ],
    });
    expect(resultsByAuthorityName).toHaveLength(1);
    expect(
      resultsByAuthorityName[0].matches.some((m) => m.field === 'Autoridade'),
    ).toBe(true);

    const resultsByAuthorityAbbr = await service.searchPages({
      conditions: [
        { id: '2', field: 'authority', operator: 'contains', value: 'PMSP' },
      ],
    });
    expect(resultsByAuthorityAbbr).toHaveLength(1);
  });

  it('searches by normative number with dot normalization', async () => {
    // Search 16000 without dot on number 16.000
    const resultsByPlainNumber = await service.searchPages({
      conditions: [
        { id: '1', field: 'number', operator: 'contains', value: '16000' },
      ],
    });
    expect(resultsByPlainNumber).toHaveLength(1);

    // Search 16.000 with dot
    const resultsWithDot = await service.searchPages({
      conditions: [
        { id: '2', field: 'term', operator: 'contains', value: '16.000' },
      ],
    });
    expect(resultsWithDot).toHaveLength(1);
  });

  it('searches by date in ISO and BR formats', async () => {
    const resultsByBrDate = await service.searchPages({
      conditions: [
        {
          id: '1',
          field: 'actDate',
          operator: 'contains',
          value: '15/05/2014',
        },
      ],
    });
    expect(resultsByBrDate).toHaveLength(1);

    const resultsByYear = await service.searchPages({
      conditions: [
        { id: '2', field: 'term', operator: 'contains', value: '2014' },
      ],
    });
    expect(resultsByYear).toHaveLength(1);
  });

  it('searches normative elements by authority and number', async () => {
    const elementsResult = await service.searchNormativeElements({
      conditions: [
        {
          id: '1',
          field: 'authorityId',
          operator: 'contains',
          value: 'Prefeito',
        },
        { id: '2', field: 'term', operator: 'contains', value: 'solo' },
      ],
    });
    expect(elementsResult.length).toBeGreaterThan(0);
  });

  it('restricts searchPages to public pages for non-admin actors', async () => {
    await service.searchPages({
      conditions: [
        { id: '1', field: 'term', operator: 'contains', value: 'lei' },
      ],
    });
    expect(pagesRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isPublic: true },
      }),
    );
  });

  it('restricts searchNormativeElements to public pages for non-admin actors', async () => {
    await service.searchNormativeElements({
      conditions: [
        { id: '1', field: 'term', operator: 'contains', value: 'solo' },
      ],
    });
    expect(pagesRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: [
          { entityType: 'original_normativo', isPublic: true },
          { type: 'original_normativo', isPublic: true },
        ],
      }),
    );
  });
});
