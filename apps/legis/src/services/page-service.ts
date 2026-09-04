import {
  legisPageApi,
  type GlobalSearchApiResult,
  type LegisAdvancedSearchQuery,
  type LegisPageApiModel,
  type NormativeSearchApiResult,
} from "@/integrations/legis-page-api";
import type { ColetaneaTematica, OriginalNormativo } from "../domain/entities";
import { mapUserSummary } from "../domain/user-summary";
import type {
  CreatePageDto,
  Page,
  PageType,
  UpdatePageDto,
} from "../types/page";

export interface SearchCondition {
  id: string;
  field:
    | "term"
    | "normativeType"
    | "actDate"
    | "date"
    | "authorityId"
    | "authority"
    | "scope"
    | "number"
    | "pageId"
    | "id";
  operator: "contains" | "equals" | "not_contains" | "greater" | "less";
  value: string;
  connector: "AND" | "OR";
}

export interface AdvancedSearchQuery {
  conditions: SearchCondition[];
  withDeleted?: boolean;
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
  private resolvePageTitle(
    page: LegisPageApiModel,
    entityType?: string | null,
  ): string {
    if (page.title?.trim()) {
      return page.title;
    }

    if (entityType === "original_normativo") {
      const entityData = (page.entityData ?? {}) as Partial<OriginalNormativo>;

      if (entityData.name?.trim()) {
        return entityData.name;
      }

      if (entityData.ementa?.trim()) {
        return entityData.ementa;
      }
    }

    if (entityType === "coletanea_tematica") {
      const entityData = (page.entityData ?? {}) as Partial<ColetaneaTematica>;

      if (entityData.title?.trim()) {
        return entityData.title;
      }
    }

    return "Sem título";
  }

  private normalizePageType(type?: string | null): PageType {
    switch (type) {
      case "page":
      case "normative":
      case "original_normativo":
      case "coletanea_tematica":
        return type;
      default:
        return "page";
    }
  }

  private normalizeOriginalNormativo(
    page: LegisPageApiModel,
  ): OriginalNormativo {
    const entityData = (page.entityData ?? {}) as Partial<OriginalNormativo>;
    const resolvedTitle = this.resolvePageTitle(page, "original_normativo");
    /*
     * Legado: antes de `authorId` existir, paginas importadas guardavam o id da
     * autoridade no rotulo `author`. Isso so vale como fallback quando nao ha
     * usuario vinculado - senao o nome de uma pessoa viraria a autoridade do
     * documento normativo.
     */
    const legacyAuthorityId = page.authorId ? undefined : page.author;

    const resolvedName =
      (entityData as any).title?.trim() ||
      entityData.name?.trim() ||
      (page.title?.trim() || undefined);

    return {
      ...entityData,
      id: page.id,
      type: "original_normativo",
      name: resolvedName,
      title: resolvedName,
      normativeType: entityData.normativeType ?? "L",
      authorityId: entityData.authorityId ?? legacyAuthorityId ?? "",
      ementa: entityData.ementa ?? resolvedTitle,
      elements: entityData.elements ?? [],
      sources: entityData.sources ?? [],
      editorContent:
        typeof entityData.editorContent === "string"
          ? entityData.editorContent
          : page.content,
      createdAt: entityData.createdAt ?? page.createdAt,
      updatedAt: entityData.updatedAt ?? page.updatedAt,
    };
  }

  private normalizeColetaneaTematica(
    page: LegisPageApiModel,
  ): ColetaneaTematica {
    const entityData = (page.entityData ?? {}) as Partial<ColetaneaTematica>;

    return {
      ...entityData,
      id: page.id,
      type: "coletanea_tematica",
      title: entityData.title ?? page.title,
      collectionType: entityData.collectionType ?? "Definições",
      category: entityData.category ?? page.tags.at(0) ?? "Geral",
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
    const entity =
      entityType === "original_normativo"
        ? this.normalizeOriginalNormativo(page)
        : entityType === "coletanea_tematica"
          ? this.normalizeColetaneaTematica(page)
          : undefined;

    return {
      id: page.id,
      title: this.resolvePageTitle(page, entityType),
      content: page.content,
      slug: page.slug,
      type: pageType,
      author: page.author,
      authorId: page.authorId ?? undefined,
      authorUser: mapUserSummary(page.authorUser),
      createdBy: page.createdBy ?? undefined,
      updatedBy: page.updatedBy ?? undefined,
      createdByUser: mapUserSummary(page.createdByUser),
      updatedByUser: mapUserSummary(page.updatedByUser),
      tags: page.tags ?? [],
      categoryId: page.categoryId ?? undefined,
      isPublic: page.isPublic,
      source: page.source ?? undefined,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      deletedAt: page.deletedAt ?? undefined,
      entity,
    };
  }

  private mapCreatePayload(data: CreatePageDto) {
    return {
      title: data.title,
      content: data.content,
      type: data.type,
      author: data.author,
      authorId: data.authorId,
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
      authorId: data.authorId,
      tags: data.tags,
      categoryId: data.categoryId,
      isPublic: data.isPublic,
      source: data.source,
      entityType: data.type,
      entityData: data.entityData as Record<string, unknown> | undefined,
    };
  }

  async getAll(params?: { withDeleted?: boolean }): Promise<Page[]> {
    const response = await legisPageApi.list({
      page: 1,
      limit: 100,
      ...params,
    });

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

  async restorePage(id: string): Promise<Page> {
    const page = await legisPageApi.restore(id);
    return this.mapApiPageToPage(page);
  }

  async permanentDeletePage(id: string): Promise<void> {
    await legisPageApi.permanentDelete(id);
  }

  async getByIdWithDeleted(id: string): Promise<Page | undefined> {
    const page = await legisPageApi.getByIdWithDeleted(id);
    return this.mapApiPageToPage(page);
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
    const results = await legisPageApi.searchPages(
      query as LegisAdvancedSearchQuery,
    );

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
      typeof query === "string" ? query : (query as LegisAdvancedSearchQuery),
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
