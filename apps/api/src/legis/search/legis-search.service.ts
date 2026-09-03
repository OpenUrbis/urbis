import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isLegisAdmin, LegisActor } from '../shared/legis-actor';
import { LegisPageResponseDto } from '../pages/dto/legis-page-response.dto';
import { LegisPage } from '../pages/entities';
import { LegisAuthority } from '../authorities/entities';
import { PagesService } from '../pages/pages.service';
import { SearchNormativeElementsDto } from './dto/search-normative-elements.dto';
import { SearchPagesDto } from './dto/search-pages.dto';

type SearchMatch = {
  field: string;
  snippet: string;
  elementId?: string;
};

type GlobalSearchResult = {
  page: LegisPageResponseDto;
  matches: SearchMatch[];
  score: number;
};

type ScoredPage = {
  page: LegisPage;
  matches: SearchMatch[];
  score: number;
};

type NormativeSearchResult = {
  pageId: string;
  pageTitle: string;
  elementId: string;
  type: string;
  index?: string;
  text: string;
};

const SNIPPET_CONTEXT = 50;
const SNIPPET_MAX_LENGTH = 120;

/**
 * Reduces a stored field to the text a person actually reads.
 *
 * `page.content` is a Tiptap document serialised as JSON and `element.text` is
 * HTML. Searching and excerpting those raw strings leaked structure into the
 * results (`...text":"IV - Anexo IV"}]},{"type":"paragraph"...`) and let
 * structural keywords like `paragraph` or `attrs` score as content matches.
 */
export function toSearchableText(value?: string | null): string {
  if (!value) {
    return '';
  }

  const trimmed = value.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const fromJson = extractTextFromProseMirrorJson(trimmed);
    if (fromJson !== null) {
      return fromJson;
    }
  }

  return normalizeWhitespace(stripHtml(trimmed));
}

/** Returns `null` when the string is not a document, so the caller can fall back. */
function extractTextFromProseMirrorJson(value: string): string | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const parts: string[] = [];

  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (typeof node !== 'object' || node === null) {
      return;
    }

    const candidate = node as { text?: unknown; content?: unknown };

    if (typeof candidate.text === 'string') {
      parts.push(candidate.text);
    }

    if (candidate.content !== undefined) {
      visit(candidate.content);
    }
  };

  visit(parsed);

  return normalizeWhitespace(parts.join(' '));
}

function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

type SearchCondition = {
  field: string;
  operator: string;
  value: string;
  connector?: string;
};

type NormativeElementRecord = {
  id?: string;
  type?: string;
  index?: string;
  text?: string;
};

type NormativeEntityData = {
  ementa?: string;
  normativeType?: string;
  number?: string;
  authorityId?: string;
  actDate?: string;
  publicationDate?: string;
  theme?: string;
  category?: string;
  elements?: NormativeElementRecord[];
};

function formatDateVariations(dateStr?: string | null): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  const parts: string[] = [trimmed];

  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    parts.push(`${d}/${m}/${y}`, `${d}.${m}.${y}`, y);
  }

  const brMatch = trimmed.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    parts.push(`${y}-${m}-${d}`, `${d}.${m}.${y}`, `${d}/${m}/${y}`, y);
  }

  return parts.join(' ');
}

function compareDigits(
  fieldVal: string,
  targetVal: string,
  exact: boolean,
): boolean {
  const targetDigits = targetVal.replace(/\D/g, '');
  if (!targetDigits) return false;
  const fieldDigits = fieldVal.replace(/\D/g, '');
  if (!fieldDigits) return false;
  return exact
    ? fieldDigits === targetDigits
    : fieldDigits.includes(targetDigits);
}

@Injectable()
export class LegisSearchService {
  constructor(
    @InjectRepository(LegisPage)
    private readonly pagesRepository: Repository<LegisPage>,
    @InjectRepository(LegisAuthority)
    private readonly authoritiesRepository: Repository<LegisAuthority>,
    private readonly pagesService: PagesService,
  ) {}

  async searchPages(
    query: SearchPagesDto,
    actor?: LegisActor,
  ): Promise<GlobalSearchResult[]> {
    if (!query.conditions?.length) {
      return [];
    }

    const findOptions: any = {
      order: { updatedAt: 'DESC' },
      take: 100,
    };

    if (query.withDeleted) {
      if (!isLegisAdmin(actor)) {
        throw new ForbiddenException(
          'Only administrators can see deleted items.',
        );
      }
      findOptions.withDeleted = true;
    }

    if (!isLegisAdmin(actor)) {
      findOptions.where = { isPublic: true };
    }

    const authoritiesMap = await this.getAuthoritiesMap();
    const pages = await this.pagesRepository.find(findOptions);

    const scored = pages
      .map((page) => this.evaluatePage(page, query.conditions, authoritiesMap))
      .filter((result): result is ScoredPage => Boolean(result))
      .sort((a, b) => b.score - a.score);

    /*
     * Result cards show the author, so the pages are hydrated here with a single
     * user lookup instead of leaking bare uuids to the client.
     */
    const hydratedPages = await this.pagesService.withAuthorsMany(
      scored.map((result) => result.page),
    );

    return scored.map((result, index) => ({
      ...result,
      page: hydratedPages[index],
    }));
  }

  async searchNormativeElements(
    payload: SearchNormativeElementsDto,
    actor?: LegisActor,
  ): Promise<NormativeSearchResult[]> {
    const normalizedConditions = payload.conditions?.length
      ? payload.conditions
      : payload.query
        ? [
            {
              field: 'term',
              operator: 'contains',
              value: payload.query,
              connector: 'AND',
            },
          ]
        : [];

    if (!normalizedConditions.length) {
      return [];
    }

    const authoritiesMap = await this.getAuthoritiesMap();
    const where: any = isLegisAdmin(actor)
      ? [{ entityType: 'original_normativo' }, { type: 'original_normativo' }]
      : [
          { entityType: 'original_normativo', isPublic: true },
          { type: 'original_normativo', isPublic: true },
        ];

    const pages = await this.pagesRepository.find({
      where,
      order: { updatedAt: 'DESC' },
      take: 1000,
    });

    const results: NormativeSearchResult[] = [];

    for (const page of pages) {
      const entityData = this.getEntityData(page);
      const authority = entityData.authorityId
        ? authoritiesMap.get(entityData.authorityId)
        : undefined;
      const elements = entityData.elements ?? [];

      if (
        this.matchesAll(
          entityData,
          toSearchableText(entityData.ementa) || page.title,
          normalizedConditions,
          page,
          authority,
        )
      ) {
        results.push({
          pageId: page.id,
          pageTitle: page.title,
          elementId: 'root',
          type: 'Ementa',
          text: entityData.ementa || page.title,
        });
      }

      for (const element of elements) {
        if (!element.text) {
          continue;
        }

        if (
          this.matchesAll(
            entityData,
            toSearchableText(element.text),
            normalizedConditions,
            page,
            authority,
          )
        ) {
          results.push({
            pageId: page.id,
            pageTitle: page.title,
            elementId: element.id ?? 'unknown',
            type: element.type ?? 'Texto',
            index: element.index,
            text: element.text,
          });
        }

        if (results.length >= 500) {
          return results;
        }
      }
    }

    return results;
  }

  private async getAuthoritiesMap(): Promise<Map<string, LegisAuthority>> {
    try {
      const authorities = await this.authoritiesRepository.find();
      return new Map(authorities.map((a) => [a.id, a]));
    } catch {
      return new Map();
    }
  }

  private evaluatePage(
    page: LegisPage,
    conditions: SearchCondition[],
    authoritiesMap: Map<string, LegisAuthority>,
  ): ScoredPage | null {
    const entityData = this.getEntityData(page);
    const matches: SearchMatch[] = [];
    let allMatch = false;

    for (const [index, condition] of conditions.entries()) {
      const snippets = this.collectMatches(
        page,
        entityData,
        condition,
        authoritiesMap,
      );
      const matched = snippets.length > 0;

      if (matched) {
        matches.push(...snippets);
      }

      if (index === 0) {
        allMatch = matched;
        continue;
      }

      if (condition.connector === 'OR') {
        allMatch = allMatch || matched;
      } else {
        allMatch = allMatch && matched;
      }
    }

    if (!allMatch || !matches.length) {
      return null;
    }

    return {
      page,
      matches: matches.slice(0, 3),
      score: matches.length,
    };
  }

  private collectMatches(
    page: LegisPage,
    entityData: NormativeEntityData,
    condition: SearchCondition,
    authoritiesMap: Map<string, LegisAuthority>,
  ): SearchMatch[] {
    const authority = entityData.authorityId
      ? authoritiesMap.get(entityData.authorityId)
      : undefined;

    const fields: Array<{ field: string; value?: string; elementId?: string }> =
      [
        { field: 'ID da página', value: page.id },
        { field: 'Slug', value: page.slug },
        { field: 'Título', value: page.title },
        { field: 'Número', value: entityData.number },
        { field: 'Ementa', value: toSearchableText(entityData.ementa) },
        {
          field: 'Autoridade',
          value: [
            entityData.authorityId,
            authority?.commonRefFull,
            authority?.commonRefAbbr,
            authority?.complementFull,
            authority?.complementAbbr,
          ]
            .filter(Boolean)
            .join(' '),
        },
        {
          field: 'Data',
          value: [
            entityData.actDate,
            entityData.publicationDate,
            formatDateVariations(entityData.actDate),
            formatDateVariations(entityData.publicationDate),
          ]
            .filter(Boolean)
            .join(' '),
        },
        {
          field: 'Tipo',
          value: [entityData.normativeType, page.type]
            .filter(Boolean)
            .join(' '),
        },
        {
          field: 'Escopo',
          value: [entityData.category, entityData.theme, ...(page.tags ?? [])]
            .filter(Boolean)
            .join(' '),
        },
        { field: 'Conteúdo', value: toSearchableText(page.content) },
      ];

    for (const element of entityData.elements ?? []) {
      fields.push({
        field: `${element.type ?? 'Elemento'} ${element.index ?? ''}`.trim(),
        value: toSearchableText(element.text),
        elementId: element.id,
      });
    }

    return fields
      .filter(({ value }) =>
        this.matchesCondition(
          entityData,
          value ?? '',
          condition,
          page,
          authority,
        ),
      )
      .map(({ field, value, elementId }) => ({
        field,
        snippet: this.generateSnippet(value ?? '', condition.value),
        elementId,
      }));
  }

  private matchesAll(
    entityData: NormativeEntityData,
    text: string,
    conditions: SearchCondition[],
    page?: LegisPage,
    authority?: LegisAuthority,
  ) {
    let result = false;

    for (const [index, condition] of conditions.entries()) {
      let match = this.matchesCondition(
        entityData,
        text,
        condition,
        page,
        authority,
      );

      if (!match && condition.field === 'term' && page) {
        const metadataStr = [
          page.id,
          page.slug,
          page.title,
          entityData.number,
          entityData.authorityId,
          authority?.commonRefFull,
          authority?.commonRefAbbr,
          authority?.complementFull,
          authority?.complementAbbr,
          entityData.actDate,
          entityData.publicationDate,
        ]
          .filter(Boolean)
          .join(' ');
        match = this.matchesCondition(
          entityData,
          metadataStr,
          condition,
          page,
          authority,
        );
      }

      if (index === 0) {
        result = match;
        continue;
      }

      if (condition.connector === 'OR') {
        result = result || match;
      } else {
        result = result && match;
      }
    }

    return result;
  }

  private matchesCondition(
    entityData: NormativeEntityData,
    text: string,
    condition: SearchCondition,
    page?: LegisPage,
    authority?: LegisAuthority,
  ) {
    const normalizedValue = condition.value.toLowerCase().trim();
    if (!normalizedValue) {
      return false;
    }

    if (condition.field === 'normativeType') {
      const pageNormativeType = (entityData.normativeType || '')
        .toLowerCase()
        .trim();
      const conditionNormType = normalizedValue;

      // NORMATIVE_TYPES map keys & labels
      const typeKeyToLabel: Record<string, string> = {
        acaut: 'ação cautelar',
        aco: 'ação cível originária',
        aciv: 'ação civil',
        acp: 'ação civil pública',
        adc: 'ação declaratória de constitucionalidade',
        adi: 'ação declaratória de inconstitucionalidade',
        ado: 'ação declaratória de inconstitucionalidade por omissão',
        ap: 'ação popular',
        are: 'agravo em recurso extraordinário',
        agint: 'agravo interno',
        apciv: 'apelação cívil',
        adpf: 'arguição de descumprimento de preceito fundamental',
        a: 'ato',
        adinterpret: 'ato declaratório interpretativo',
        circ: 'circular',
        cn: 'circular normativa',
        compil: 'compilação',
        com: 'comunicado',
        comconj: 'comunicado conjunto',
        c: 'constituição',
        d: 'decreto',
        dleg: 'decreto legislativo',
        dl: 'decreto-lei',
        delib: 'deliberação',
        despadm: 'despacho administrativo',
        despadmintloc: 'despacho administrativo interlocutório',
        despnor: 'despacho normativo',
        indic: 'indicação',
        infor: 'informação',
        instr: 'instrução',
        instrserv: 'instrução de serviço',
        in: 'instrução normativa',
        inconj: 'instrução normativa conjunta',
        l: 'lei',
        lc: 'lei complementar',
        lo: 'lei orgânica',
        mi: 'mandado de injunção',
        ms: 'mandado de segurança',
        man: 'manifestação',
        memo: 'memorando',
        memocirc: 'memorando circular',
        menvet: 'mensagem de veto',
        md: 'minuta de decreto',
        mnt: 'minuta de norma técnica',
        mport: 'minuta de portaria',
        mpl: 'minuta de projeto de lei',
        mres: 'minuta de resolução',
        nt: 'norma técnica',
        nottec: 'nota técnica',
        nottecconj: 'nota técnica conjunta',
        of: 'ofício',
        ofcirc: 'ofício circular',
        os: 'ordem de serviço',
        oi: 'ordem interna',
        oiconj: 'ordem interna conjunta',
        oiconjinter: 'ordem interna intersecretarial',
        oj: 'orientação jurisprudencial',
        on: 'orientação normativa',
        par: 'parecer',
        parnor: 'parecer normativo',
        port: 'portaria',
        portconj: 'portaria conjunta',
        portinter: 'portaria intersecretarial',
        pop: 'procedimento operacional padrão',
        pec: 'projeto de emenda à constituição',
        pelo: 'projeto de emenda à lei orgânica',
        pl: 'projeto de lei',
        plc: 'projeto de lei complementar',
        promulgvet: 'promulgação de lei vetada',
        pron: 'pronunciamento',
        psv: 'proposta de súmula vinculante',
        publ: 'publicação',
        razvet: 'razões do veto',
        rec: 'recomendação',
        resp: 'recurso especial',
        re: 'recurso extraordinário',
        regint: 'regimento interno',
        res: 'resolução',
        resconj: 'resolução conjunta',
        resinter: 'resolução intersecretarial',
        sumadm: 'súmula administrativa',
        sumjud: 'súmula judicial',
        sumvin: 'súmula vinculante',
        tutprov: 'tutela provisória',
      };

      const pageTypeLabel = typeKeyToLabel[pageNormativeType] || '';
      const conditionTypeLabel =
        typeKeyToLabel[conditionNormType] || conditionNormType;

      if (condition.operator === 'equals') {
        const matchesKey = pageNormativeType === conditionNormType;
        const matchesLabel =
          pageTypeLabel === conditionTypeLabel ||
          pageNormativeType === conditionTypeLabel;
        return matchesKey || matchesLabel;
      }

      if (condition.operator === 'not_contains') {
        return (
          !pageNormativeType.includes(conditionNormType) &&
          !pageTypeLabel.includes(conditionNormType)
        );
      }

      return (
        pageNormativeType.includes(conditionNormType) ||
        pageTypeLabel.includes(conditionNormType) ||
        conditionNormType.includes(pageNormativeType)
      );
    }

    const fieldValue = this.resolveFieldValue(
      entityData,
      text,
      condition.field,
      page,
      authority,
    );

    if (!fieldValue) {
      return false;
    }

    const normalizedFieldValue = fieldValue.toLowerCase();

    if (condition.operator === 'equals') {
      if (normalizedFieldValue === normalizedValue) {
        return true;
      }
      return compareDigits(normalizedFieldValue, normalizedValue, true);
    }

    if (condition.operator === 'not_contains') {
      return !normalizedFieldValue.includes(normalizedValue);
    }

    if (condition.operator === 'greater') {
      return normalizedFieldValue > normalizedValue;
    }

    if (condition.operator === 'less') {
      return normalizedFieldValue < normalizedValue;
    }

    if (normalizedFieldValue.includes(normalizedValue)) {
      return true;
    }

    return compareDigits(normalizedFieldValue, normalizedValue, false);
  }

  private resolveFieldValue(
    entityData: NormativeEntityData,
    text: string,
    field: string,
    page?: LegisPage,
    authority?: LegisAuthority,
  ) {
    switch (field) {
      case 'pageId':
      case 'id':
        return [page?.id, page?.slug].filter(Boolean).join(' ');
      case 'number':
        return [entityData.number, page?.title].filter(Boolean).join(' ');
      case 'normativeType':
        return [entityData.normativeType, page?.type].filter(Boolean).join(' ');
      case 'actDate':
      case 'date':
        return [
          entityData.actDate,
          entityData.publicationDate,
          formatDateVariations(entityData.actDate),
          formatDateVariations(entityData.publicationDate),
        ]
          .filter(Boolean)
          .join(' ');
      case 'authorityId':
      case 'authority':
        return [
          entityData.authorityId,
          authority?.commonRefFull,
          authority?.commonRefAbbr,
          authority?.complementFull,
          authority?.complementAbbr,
        ]
          .filter(Boolean)
          .join(' ');
      case 'scope':
        return [entityData.category, entityData.theme, ...(page?.tags ?? [])]
          .filter(Boolean)
          .join(' ');
      case 'term':
      default:
        return text;
    }
  }

  private getEntityData(page: LegisPage): NormativeEntityData {
    if (!page.entityData || Array.isArray(page.entityData)) {
      return {};
    }

    return page.entityData as NormativeEntityData;
  }

  private generateSnippet(text: string, term: string) {
    if (!text) {
      return '';
    }

    if (!term) {
      return this.escapeHtml(this.truncate(text, SNIPPET_MAX_LENGTH));
    }

    const lowerText = text.toLowerCase();
    const lowerTerm = term.toLowerCase().trim();
    let index = lowerText.indexOf(lowerTerm);

    if (index === -1) {
      const digits = lowerTerm.replace(/\D/g, '');
      if (digits.length >= 2) {
        index = lowerText.indexOf(digits);
      }
    }

    if (index === -1) {
      return this.escapeHtml(this.truncate(text, SNIPPET_MAX_LENGTH));
    }

    const matchLength = lowerText.slice(index).startsWith(lowerTerm)
      ? lowerTerm.length
      : lowerTerm.replace(/\D/g, '').length || 1;

    const start = Math.max(0, index - SNIPPET_CONTEXT);
    const end = Math.min(text.length, index + matchLength + SNIPPET_CONTEXT);

    const before = this.escapeHtml(text.slice(start, index));
    const match = this.escapeHtml(text.slice(index, index + matchLength));
    const after = this.escapeHtml(text.slice(index + matchLength, end));

    const prefix = start > 0 ? '…' : '';
    const suffix = end < text.length ? '…' : '';

    return `${prefix}${before}<mark>${match}</mark>${after}${suffix}`;
  }

  private truncate(text: string, maxLength: number) {
    return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
