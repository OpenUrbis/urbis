import { Page, CreatePageDto, UpdatePageDto } from "../types/page";
import { RulesEngine } from "../domain/rules-engine";
import { OriginalNormativo, ColetaneaTematica } from "../domain/entities";
import { MOCK_EXAMPLES } from "../domain/mock-examples";
import { parse, isAfter, isBefore, isValid } from 'date-fns';

const STORAGE_KEY = 'legis_pages__v7';

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
    private rulesEngine = new RulesEngine();

    private getStoredData(): { pages: Page[], entities: (OriginalNormativo | ColetaneaTematica)[] } {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            // Seed with Mocks if empty
            const initialEntities = [...MOCK_EXAMPLES];
            const initialPages: Page[] = initialEntities.map(this.adaptEntityToPage.bind(this));
            this.saveData(initialPages, initialEntities);
            return { pages: initialPages, entities: initialEntities };
        }
        
        try {
            const parsed = JSON.parse(stored);
            // Handle legacy format (array of Pages) vs new format (object with separate lists)
            if (Array.isArray(parsed)) {
                return { pages: parsed, entities: [] };
            }
            return parsed;
        } catch {
            return { pages: [], entities: [] };
        }
    }

    private saveData(pages: Page[], entities: (OriginalNormativo | ColetaneaTematica)[]) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ pages, entities }));
    }

    private convertElementsToContent(elements: any[]): any {
        return {
            type: 'doc',
            content: elements.map(el => {
                let prefix = '';
                if (el.type === 'Artigo') prefix = `Art. ${el.index} `;
                else if (el.type === 'Parágrafo') prefix = el.index === 'único' ? 'Parágrafo único. ' : `§ ${el.index}. `;
                else if (el.type === 'Inciso') prefix = `${el.index} - `;
                else if (el.type === 'Alínea') prefix = `${el.index}) `;
                else if (el.type === 'Item') prefix = `${el.index}. `;
                else if (el.type === 'Capítulo') prefix = `CAPÍTULO ${el.index} - `;
                else if (el.type === 'Seção') prefix = `SEÇÃO ${el.index} - `;
                else if (el.type === 'Título' && el.index) prefix = `TÍTULO ${el.index} - `;

                return {
                    type: 'paragraph',
                    attrs: { normativeId: el.id },
                    content: [{ type: 'text', text: `${prefix}${el.text}` }]
                };
            })
        };
    }

    private adaptEntityToPage(entity: OriginalNormativo | ColetaneaTematica): Page {
        if (entity.type === 'original_normativo') {
             const editorContent = entity.editorContent || JSON.stringify(this.convertElementsToContent(entity.elements));
             
             // Prioritize 'name' (Friendly Name) if it exists, otherwise fallback to Type + Number or Ementa
             const displayTitle = entity.name || (entity.number ? `${entity.normativeType} ${entity.number}` : entity.ementa.substring(0, 50));
             
             return {
                id: entity.id,
                title: displayTitle,
                content: editorContent, // Use stored or converted editor content
                slug: entity.id,
                type: 'original_normativo',
                author: entity.authorityId,
                tags: ['normativo'],
                isPublic: true,
                createdAt: entity.createdAt,
                updatedAt: entity.updatedAt,
                entity: entity
            };
        } else {
             return {
                id: entity.id,
                title: entity.title,
                content: entity.fullDescription || '',
                slug: entity.id,
                type: 'coletanea_tematica',
                author: 'System',
                tags: [entity.category, entity.theme],
                isPublic: true,
                createdAt: entity.createdAt,
                updatedAt: entity.updatedAt,
                entity: entity
            };
        }
    }

    async getAll(): Promise<Page[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const { pages, entities } = this.getStoredData();
        
        // Merge legacy pages and adapted entities
        // Ensure we don't duplicate if entity is already adapted in 'pages' (simple check by ID)
        // In this implementation, we will regenerate pages from entities on the fly to ensure freshness
        
        const entityPages = entities.map(e => this.adaptEntityToPage(e));
        const legacyPages = pages.filter(p => !entityPages.find(ep => ep.id === p.id));
        
        return [...legacyPages, ...entityPages].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    async getById(id: string): Promise<Page | undefined> {
        await new Promise(resolve => setTimeout(resolve, 200));
        const { pages, entities } = this.getStoredData();
        
        const entity = entities.find(e => e.id === id);
        if (entity) return this.adaptEntityToPage(entity);

        return pages.find(p => p.id === id);
    }

    async create(data: CreatePageDto): Promise<Page> {
        await new Promise(resolve => setTimeout(resolve, 400));
        const { pages, entities } = this.getStoredData();

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        if (data.type === 'original_normativo' && data.entityData) {
            const elements = (data.entityData as Partial<OriginalNormativo>).elements || [];
            // Optimize elements: Remove large JSON content, keep text
            const optimizedElements = elements.map(el => {
                const { content, ...rest } = el; 
                return rest;
            });

            const newEntity: OriginalNormativo = {
                ...(data.entityData as Partial<OriginalNormativo>),
                id,
                type: 'original_normativo',
                normativeType: 'L',
                authorityId: 'unknown',
                ementa: data.title,
                elements: optimizedElements,
                editorContent: data.content, // Store full editor content separately
                sources: [],
                createdAt: now,
                updatedAt: now
            } as OriginalNormativo;
            
            entities.push(newEntity);
            this.saveData(pages, entities);
            return this.adaptEntityToPage(newEntity);
        } else if (data.type === 'coletanea_tematica' && data.entityData) {
             const newEntity: ColetaneaTematica = {
                ...(data.entityData as Partial<ColetaneaTematica>),
                id,
                type: 'coletanea_tematica',
                title: data.title,
                fullDescription: data.content,
                collectionType: 'Definições', // Default
                category: 'Documentos gerais',
                theme: 'Direito Urbanístico',
                links: [],
                createdAt: now,
                updatedAt: now
            } as ColetaneaTematica;
            
            entities.push(newEntity);
            this.saveData(pages, entities);
            return this.adaptEntityToPage(newEntity);
        }

        // Legacy Page Create
        const newPage: Page = {
            id,
            title: data.title,
            content: data.content,
            slug: data.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
            type: data.type || 'page',
            author: data.author || 'Desconhecido',
            tags: data.tags || [],
            categoryId: data.categoryId,
            isPublic: data.isPublic ?? false,
            source: data.source,
            createdAt: now,
            updatedAt: now,
        };
        pages.push(newPage);
        this.saveData(pages, entities);
        return newPage;
    }

    async update(id: string, data: UpdatePageDto): Promise<Page> {
        await new Promise(resolve => setTimeout(resolve, 400));
        const { pages, entities } = this.getStoredData();

        const entityIndex = entities.findIndex((e) => e.id === id);
        if (entityIndex !== -1) {
            // Update entity
            const entity = entities[entityIndex];
            if (entity.type === 'original_normativo') {
                const partial = data.entityData as Partial<OriginalNormativo>;
                let optimizedElements = partial.elements;

                if (optimizedElements) {
                    // Optimize elements: Remove large JSON content
                    optimizedElements = optimizedElements.map((el) => {
                        const { content, ...rest } = el;
                        return rest;
                    });
                }

                entities[entityIndex] = {
                    ...entity,
                    ...partial,
                    elements: optimizedElements || entity.elements,
                    editorContent: data.content ?? entity.editorContent, // Update editor content
                    ementa: data.title || entity.ementa,
                    updatedAt: new Date().toISOString(),
                } as OriginalNormativo;
            } else {
                 entities[entityIndex] = {
                     ...entity,
                     ...(data.entityData as Partial<ColetaneaTematica>),
                     title: data.title || entity.title,
                     fullDescription: data.content || entity.fullDescription,
                     updatedAt: new Date().toISOString()
                 } as ColetaneaTematica;
            }
            this.saveData(pages, entities);
            return this.adaptEntityToPage(entities[entityIndex]);
        }

        const index = pages.findIndex(p => p.id === id);
        if (index === -1) throw new Error('Page not found');
        
        const updatedPage = {
            ...pages[index],
            ...data,
            updatedAt: new Date().toISOString(),
            slug: data.title ? data.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') : pages[index].slug,
            categoryId: data.categoryId !== undefined ? data.categoryId : pages[index].categoryId,
            source: data.source !== undefined ? data.source : pages[index].source,
        };
        pages[index] = updatedPage;
        this.saveData(pages, entities);
        return updatedPage;
    }

    async delete(id: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const { pages, entities } = this.getStoredData();
        
        const newPages = pages.filter(p => p.id !== id);
        const newEntities = entities.filter(e => e.id !== id);
        
        this.saveData(newPages, newEntities);
    }

    async importFromUrl(url: string): Promise<string> {
        await new Promise(resolve => setTimeout(resolve, 800));
        return `
            <h2>Atualização Normativa - Importada</h2>
            <p>Esta é uma importação simulada da URL: <strong>${url}</strong></p>
            <h3>Artigo 1º</h3>
            <p>Fica estabelecido que todas as novas páginas devem possuir metadados completos para facilitar a indexação.</p>
        `;
    }

    async getPagesByIds(ids: string[]): Promise<Page[]> {
        await new Promise(resolve => setTimeout(resolve, 200));
        const { pages, entities } = this.getStoredData();
        const result: Page[] = [];
        const uniqueIds = new Set(ids);

        uniqueIds.forEach(id => {
            const entity = entities.find(e => e.id === id);
            if (entity) {
                result.push(this.adaptEntityToPage(entity));
            } else {
                const page = pages.find(p => p.id === id);
                if (page) result.push(page);
            }
        });
        return result;
    }

    async searchPages(query: AdvancedSearchQuery): Promise<GlobalSearchResult[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const { entities } = this.getStoredData();
        const results: GlobalSearchResult[] = [];
        const conditions = query.conditions || [];

        const generateSnippet = (text: string, term: string, fullText: boolean = false): string => {
            if (!text || !term) return '';
            
            // Highlight
            const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const highlighted = text.replace(new RegExp(escapedTerm, 'gi'), match => `<mark class="bg-yellow-200 dark:bg-yellow-900/50 rounded-sm px-0.5">${match}</mark>`);

            if (fullText) return highlighted;

            const lowerText = text.toLowerCase();
            const lowerTerm = term.toLowerCase();
            const index = lowerText.indexOf(lowerTerm);
            if (index === -1) return '';

            const start = Math.max(0, index - 50);
            const end = Math.min(text.length, index + term.length + 50);
            
            let snippet = text.substring(start, end);
            if (start > 0) snippet = '...' + snippet;
            if (end < text.length) snippet = snippet + '...';
            
            // Re-highlight the snippet (since we cut the highlighted string or original)
            // Actually better to highlight AFTER cut if we use original.
            // But if we return fullText, we highlight all.
            // To support both, let's just use highlighted for fullText.
            
            return snippet.replace(new RegExp(escapedTerm, 'gi'), match => `<mark class="bg-yellow-200 dark:bg-yellow-900/50 rounded-sm px-0.5">${match}</mark>`);
        };

        const checkEntity = (entity: OriginalNormativo | ColetaneaTematica) => {
            if (conditions.length === 0) return;
            
            // Collect matches
            const matches: { field: string, snippet: string, elementId?: string }[] = [];
            let allMatch = true;

            for (let i = 0; i < conditions.length; i++) {
                const cond = conditions[i];
                const val = cond.value;
                if (!val) continue;

                let matchedInCondition = false;
                
                // Fields to check based on entity type
                // Common: Title (Ementa or Title)
                const title = entity.type === 'original_normativo' ? entity.ementa : entity.title;
                if (title.toLowerCase().includes(val.toLowerCase())) {
                    matches.push({ field: 'Título', snippet: generateSnippet(title, val, true) });
                    matchedInCondition = true;
                }

                if (entity.type === 'coletanea_tematica') {
                    if (entity.shortDescription && entity.shortDescription.toLowerCase().includes(val.toLowerCase())) {
                        matches.push({ field: 'Resumo', snippet: generateSnippet(entity.shortDescription, val, true) });
                        matchedInCondition = true;
                    }
                    if (entity.fullDescription && entity.fullDescription.toLowerCase().includes(val.toLowerCase())) {
                        // For Full Content, we still snippet because it can be huge
                        matches.push({ field: 'Conteúdo', snippet: generateSnippet(entity.fullDescription, val, false) });
                        matchedInCondition = true;
                    }
                } else if (entity.type === 'original_normativo') {
                    // Search in elements
                    for (const el of entity.elements) {
                        if (el.text.toLowerCase().includes(val.toLowerCase())) {
                            matches.push({ 
                                field: `${el.type} ${el.index || ''}`, 
                                snippet: generateSnippet(el.text, val, true),
                                elementId: el.id
                            });
                            matchedInCondition = true;
                            if (matches.length > 3) break; // Limit snippets
                        }
                    }
                }

                if (i === 0) {
                    allMatch = matchedInCondition;
                } else {
                    if (cond.connector === 'AND') allMatch = allMatch && matchedInCondition;
                    else if (cond.connector === 'OR') allMatch = allMatch || matchedInCondition;
                }
            }

            if (allMatch && matches.length > 0) {
                results.push({
                    page: this.adaptEntityToPage(entity),
                    matches: matches.slice(0, 3), // Top 3 matches
                    score: matches.length
                });
            }
        };

        entities.forEach(checkEntity);
        
        return results.sort((a, b) => b.score - a.score);
    }

    async searchNormativeElements(query: string | AdvancedSearchQuery): Promise<NormativeSearchResult[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const { entities } = this.getStoredData();
        const results: NormativeSearchResult[] = [];
        
        let conditions: SearchCondition[] = [];
        
        if (typeof query === 'string') {
            conditions = [{ id: '1', field: 'term', operator: 'contains', value: query, connector: 'AND' }];
        } else {
            conditions = query.conditions || [];
        }

        const parseDate = (d: string) => parse(d, 'dd.MM.yyyy', new Date());

        const checkCondition = (entity: OriginalNormativo, condition: SearchCondition, textContext: string = ''): boolean => {
            const val = condition.value.toLowerCase();
            let fieldVal = '';

            switch (condition.field) {
                case 'normativeType': fieldVal = entity.normativeType.toLowerCase(); break;
                case 'authorityId': fieldVal = entity.authorityId.toLowerCase(); break;
                case 'actDate': fieldVal = entity.actDate || ''; break; // Date compare logic needed
                case 'term': fieldVal = textContext.toLowerCase(); break;
                default: return true;
            }

            if (condition.field === 'actDate') {
                const dateVal = parseDate(fieldVal);
                const queryDate = parseDate(condition.value);
                if (!isValid(dateVal) || !isValid(queryDate)) return false;
                if (condition.operator === 'equals') return dateVal.getTime() === queryDate.getTime();
                if (condition.operator === 'greater') return isAfter(dateVal, queryDate);
                if (condition.operator === 'less') return isBefore(dateVal, queryDate);
                return false;
            }

            if (condition.operator === 'contains') return fieldVal.includes(val);
            if (condition.operator === 'not_contains') return !fieldVal.includes(val);
            if (condition.operator === 'equals') return fieldVal === val;
            
            return false;
        };

        // Evaluate conditions for a context (e.g. a specific element text or ementa)
        const evaluateConditions = (entity: OriginalNormativo, textContext: string): boolean => {
            if (conditions.length === 0) return true;
            
            // Simple sequential evaluation (A AND B OR C...)
            // Initial truthiness depends on first term? 
            // Actually, usually we evaluate left to right.
            let result = true; // Base

            for (let i = 0; i < conditions.length; i++) {
                const cond = conditions[i];
                const match = checkCondition(entity, cond, textContext);
                
                if (i === 0) {
                    result = match;
                } else {
                    if (cond.connector === 'AND') result = result && match;
                    else if (cond.connector === 'OR') result = result || match;
                }
            }
            return result;
        };

        // Search in OriginalNormativo Entities
        for (const entity of entities) {
            if (results.length >= 50) break;
            if (entity.type === 'original_normativo') {
                 
                 // Check Ementa
                 if (evaluateConditions(entity, entity.ementa)) {
                     results.push({
                         pageId: entity.id,
                         pageTitle: entity.number ? `${entity.normativeType} ${entity.number}` : entity.ementa,
                         elementId: 'root',
                         type: 'Ementa',
                         text: entity.ementa
                     });
                 }

                 // Check Elements
                 for (const element of entity.elements) {
                     if (evaluateConditions(entity, element.text)) {
                         results.push({
                             pageId: entity.id,
                             pageTitle: entity.number ? `${entity.normativeType} ${entity.number}` : entity.ementa,
                             elementId: element.id,
                             type: element.type,
                             index: element.index,
                             text: element.text
                         });
                         if (results.length >= 50) break;
                     }
                 }
            }
        }
        
        return results;
    }
}

export const pageService = new PageService();
