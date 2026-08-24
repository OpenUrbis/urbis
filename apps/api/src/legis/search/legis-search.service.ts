import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegisPage } from '../pages/entities';
import { SearchNormativeElementsDto } from './dto/search-normative-elements.dto';
import { SearchPagesDto } from './dto/search-pages.dto';

type SearchMatch = {
  field: string;
  snippet: string;
  elementId?: string;
};

type GlobalSearchResult = {
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
  authorityId?: string;
  actDate?: string;
  theme?: string;
  category?: string;
  elements?: NormativeElementRecord[];
};

@Injectable()
export class LegisSearchService {
  constructor(
    @InjectRepository(LegisPage)
    private readonly pagesRepository: Repository<LegisPage>,
  ) {}

  async searchPages(query: SearchPagesDto): Promise<GlobalSearchResult[]> {
    if (!query.conditions?.length) {
      return [];
    }

    const pages = await this.pagesRepository.find({
      order: { updatedAt: 'DESC' },
      take: 100,
    });

    return pages
      .map((page) => this.evaluatePage(page, query.conditions))
      .filter((result): result is GlobalSearchResult => Boolean(result))
      .sort((a, b) => b.score - a.score);
  }

  async searchNormativeElements(
    payload: SearchNormativeElementsDto,
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

    const pages = await this.pagesRepository.find({
      where: { entityType: 'original_normativo' },
      order: { updatedAt: 'DESC' },
      take: 100,
    });

    const results: NormativeSearchResult[] = [];

    for (const page of pages) {
      const entityData = this.getEntityData(page);
      const elements = entityData.elements ?? [];

      if (
        entityData.ementa &&
        this.matchesAll(entityData, entityData.ementa, normalizedConditions)
      ) {
        results.push({
          pageId: page.id,
          pageTitle: page.title,
          elementId: 'root',
          type: 'Ementa',
          text: entityData.ementa,
        });
      }

      for (const element of elements) {
        if (!element.text) {
          continue;
        }

        if (this.matchesAll(entityData, element.text, normalizedConditions)) {
          results.push({
            pageId: page.id,
            pageTitle: page.title,
            elementId: element.id ?? 'unknown',
            type: element.type ?? 'Texto',
            index: element.index,
            text: element.text,
          });
        }

        if (results.length >= 50) {
          return results;
        }
      }
    }

    return results;
  }

  private evaluatePage(
    page: LegisPage,
    conditions: SearchCondition[],
  ): GlobalSearchResult | null {
    const entityData = this.getEntityData(page);
    const matches: SearchMatch[] = [];
    let allMatch = false;

    for (const [index, condition] of conditions.entries()) {
      const snippets = this.collectMatches(page, entityData, condition);
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
  ): SearchMatch[] {
    const fields: Array<{ field: string; value?: string; elementId?: string }> =
      [
        { field: 'Título', value: page.title },
        { field: 'Conteúdo', value: page.content },
        { field: 'Ementa', value: entityData.ementa },
        {
          field: 'Escopo',
          value: [entityData.category, entityData.theme, ...(page.tags ?? [])]
            .filter(Boolean)
            .join(' '),
        },
      ];

    for (const element of entityData.elements ?? []) {
      fields.push({
        field: `${element.type ?? 'Elemento'} ${element.index ?? ''}`.trim(),
        value: element.text,
        elementId: element.id,
      });
    }

    return fields
      .filter(({ value }) =>
        this.matchesCondition(entityData, value ?? '', condition),
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
  ) {
    let result = false;

    for (const [index, condition] of conditions.entries()) {
      const match = this.matchesCondition(entityData, text, condition);

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
  ) {
    const normalizedValue = condition.value.toLowerCase();
    const fieldValue = this.resolveFieldValue(
      entityData,
      text,
      condition.field,
    );

    if (!fieldValue) {
      return false;
    }

    const normalizedFieldValue = fieldValue.toLowerCase();

    if (condition.operator === 'equals') {
      return normalizedFieldValue === normalizedValue;
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

    return normalizedFieldValue.includes(normalizedValue);
  }

  private resolveFieldValue(
    entityData: NormativeEntityData,
    text: string,
    field: string,
  ) {
    switch (field) {
      case 'normativeType':
        return entityData.normativeType ?? '';
      case 'actDate':
        return entityData.actDate ?? '';
      case 'authorityId':
        return entityData.authorityId ?? '';
      case 'scope':
        return [entityData.category, entityData.theme]
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
    if (!text || !term) {
      return text;
    }

    const lowerText = text.toLowerCase();
    const lowerTerm = term.toLowerCase();
    const index = lowerText.indexOf(lowerTerm);

    if (index === -1) {
      return text.slice(0, 120);
    }

    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + term.length + 50);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < text.length ? '...' : '';

    return `${prefix}${text.slice(start, end)}${suffix}`;
  }
}
