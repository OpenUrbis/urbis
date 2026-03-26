import {
  legisPageApi,
  type GlobalSearchApiResult,
  type LegisAdvancedSearchQuery,
  type LegisPageApiModel,
  type NormativeSearchApiResult,
} from '@/integrations/legis-page-api';
import type { ColetaneaTematica, OriginalNormativo } from '../domain/entities';
import type { CreatePageDto, Page, PageType, UpdatePageDto } from '../types/page';

export interface SearchCondition {
  id: string;
  field: 'term' | 'normativeType' | 'actDate' | 'authorityId' | 'scope';
  operator: 'contains' | 'equals' | 'not_contains' | 'greater' | 'less';
  value: string;
  connector: 'AND' | 'OR';
}

export interface AdvancedSearchQuery {
  conditions: SearchCondition[];
}

export interface NormativeSearchResult {
  pageId: string;
  pageTitle: string;
  elementId: string;
  type: string;
  index?: string;
  text: string;
}

export interface GlobalSearchResult {
  page: Page;
  matches: {
    field: string;
    snippet: string;
    elementId?: string;
  }[];
  score: number;
}

class PageService {
  private normalizePageType(type?: string | null): PageType {
    switch (type) {
      case 'page':
      case 'normative':
      case 'original_normativo':
      case 'coletanea_tematica':
        return type;
      default:
        return 'page';
    }
  }

  private normalizeOriginalNormativo(page: LegisPageApiModel): OriginalNormativo {
    const entityData = (page.entityData ?? {}) as Partial<OriginalNormativo>;

    return {
      ...entityData,
      id: page.id,
      type: 'original_normativo',
      normativeType: entityData.normativeType ?? 'L',
      authorityId: entityData.authorityId ?? page.author,
      ementa: entityData.ementa ?? page.title,
      elements: entityData.elements ?? [],
      sources: entityData.sources ?? [],
      editorContent:
        typeof entityData.editorContent === 'string'
          ? entityData.editorContent
          : page.content,
      createdAt: entityData.createdAt ?? page.createdAt,
      updatedAt: entityData.updatedAt ?? page.updatedAt,
    };
  }

  private normalizeColetaneaTematica(page: LegisPageApiModel): ColetaneaTematica {
    const entityData = (page.entityData ?? {}) as Partial<ColetaneaTematica>;

    return {
      ...entityData,
      id: page.id,
      type: 'coletanea_tematica',
      title: entityData.title ?? page.title,
      collectionType: entityData.collectionType ?? 'Definições',
      category: entityData.category ?? page.tags.at(0) ?? 'Geral',
      theme: entityData.theme ?? page.tags.at(1) ?? page.title,
      fullDescription: entityData.fullDescription ?? page.content,
      links: entityData.links ?? [],
      createdAt: entityData.createdAt ?? page.createdAt,
      updatedAt: entityData.updatedAt ?? page.updatedAt,
    };
  }

  private mapApiPageToPage(page: LegisPageApiModel): Page {
    const pageType = this.normalizePageType(page.type);
    const entityType = page.entityType ?? page.type;

    return {
      id: page.id,
      title: page.title,
      content: page.content,
      slug: page.slug,
      type: pageType,
      author: page.author,
      tags: page.tags ?? [],
      categoryId: page.categoryId ?? undefined,
      isPublic: page.isPublic,
      source: page.source ?? undefined,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      entity:
        entityType === 'original_normativo'
          ? this.normalizeOriginalNormativo(page)
          : entityType === 'coletanea_tematica'
            ? this.normalizeColetaneaTematica(page)
            : undefined,
    };
  }

  private mapCreatePayload(data: CreatePageDto) {
    return {
      title: data.title,
      content: data.content,
      type: data.type,
      author: data.author,
      tags: data.tags,
      categoryId: data.categoryId,
      isPublic: data.isPublic,
      source: data.source,
      entityType: data.type,
      entityData: data.entityData as Record<string, unknown> | undefined,
    };
  }

  private mapUpdatePayload(data: UpdatePageDto) {
    return {
      title: data.title,
      content: data.content,
      type: data.type,
      author: data.author,
      tags: data.tags,
      categoryId: data.categoryId,
      isPublic: data.isPublic,
      source: data.source,
      entityType: data.type,
      entityData: data.entityData as Record<string, unknown> | undefined,
    };
  }

  async getAll(): Promise<Page[]> {
    const response = await legisPageApi.list({ page: 1, limit: 100 });

    return response.items.map((page) => this.mapApiPageToPage(page));
  }

  async getById(id: string): Promise<Page | undefined> {
    const page = await legisPageApi.getById(id);

    return this.mapApiPageToPage(page);
  }

  async create(data: CreatePageDto): Promise<Page> {
    const page = await legisPageApi.create(this.mapCreatePayload(data));

    return this.mapApiPageToPage(page);
  }

  async update(id: string, data: UpdatePageDto): Promise<Page> {
    const page = await legisPageApi.update(id, this.mapUpdatePayload(data));

    return this.mapApiPageToPage(page);
  }

  async delete(id: string): Promise<void> {
    await legisPageApi.remove(id);
  }

  async importFromUrl(url: string): Promise<string> {
    const response = await legisPageApi.importFromUrl(url);

    return response.content;
  }

  async getPagesByIds(ids: string[]): Promise<Page[]> {
    if (!ids.length) {
      return [];
    }

    const uniqueIds = Array.from(new Set(ids));
    const response = await legisPageApi.list({
      ids: uniqueIds,
      page: 1,
      limit: uniqueIds.length,
    });

    const pagesById = new Map(
      response.items.map((page) => [page.id, this.mapApiPageToPage(page)]),
    );

    return uniqueIds
      .map((id) => pagesById.get(id))
      .filter((page): page is Page => Boolean(page));
  }

  async searchPages(query: AdvancedSearchQuery): Promise<GlobalSearchResult[]> {
    const results = await legisPageApi.searchPages(query as LegisAdvancedSearchQuery);

    return results.map((result: GlobalSearchApiResult) => ({
      page: this.mapApiPageToPage(result.page),
      matches: result.matches,
      score: result.score,
    }));
  }

  async searchNormativeElements(
    query: string | AdvancedSearchQuery,
  ): Promise<NormativeSearchResult[]> {
    const results = await legisPageApi.searchNormativeElements(
      typeof query === 'string' ? query : (query as LegisAdvancedSearchQuery),
    );

    return results.map((result: NormativeSearchApiResult) => ({
      pageId: result.pageId,
      pageTitle: result.pageTitle,
      elementId: result.elementId,
      type: result.type,
      index: result.index,
      text: result.text,
    }));
  }
}

export const pageService = new PageService();
