import { Page, CreatePageDto, UpdatePageDto } from "../types/page";
import { RulesEngine } from "../domain/rules-engine";

const STORAGE_KEY = 'legis_pages';

export interface NormativeSearchResult {
    pageId: string;
    pageTitle: string;
    elementId: string;
    type: string;
    index?: string;
    text: string;
}

class PageService {
    private rulesEngine = new RulesEngine();

    private getPagesFromStorage(): Page[] {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    private savePagesToStorage(pages: Page[]) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
    }

    async getAll(): Promise<Page[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return this.getPagesFromStorage().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    async getById(id: string): Promise<Page | undefined> {
        await new Promise(resolve => setTimeout(resolve, 200));
        return this.getPagesFromStorage().find(p => p.id === id);
    }

    async create(data: CreatePageDto): Promise<Page> {
        await new Promise(resolve => setTimeout(resolve, 400));
        const pages = this.getPagesFromStorage();
        const newPage: Page = {
            id: crypto.randomUUID(),
            title: data.title,
            content: data.content,
            slug: data.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
            type: data.type || 'page',
            author: data.author || 'Desconhecido', // Should come from auth context
            tags: data.tags || [],
            categoryId: data.categoryId,
            isPublic: data.isPublic ?? false,
            source: data.source,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        pages.push(newPage);
        this.savePagesToStorage(pages);
        return newPage;
    }

    async update(id: string, data: UpdatePageDto): Promise<Page> {
        await new Promise(resolve => setTimeout(resolve, 400));
        const pages = this.getPagesFromStorage();
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
        this.savePagesToStorage(pages);
        return updatedPage;
    }

    async delete(id: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const pages = this.getPagesFromStorage();
        const filtered = pages.filter(p => p.id !== id);
        this.savePagesToStorage(filtered);
    }

    async importFromUrl(url: string): Promise<string> {
        await new Promise(resolve => setTimeout(resolve, 800));
        // Mocked HTML content representing a normative update
        return `
            <h2>Atualização Normativa - Importada</h2>
            <p>Esta é uma importação simulada da URL: <strong>${url}</strong></p>
            <h3>Artigo 1º</h3>
            <p>Fica estabelecido que todas as novas páginas devem possuir metadados completos para facilitar a indexação.</p>
            <h3>Artigo 2º</h3>
            <p>O conteúdo importado deve ser revisado pelo usuário antes da publicação final.</p>
            <ul>
                <li>Verificar formatação</li>
                <li>Validar referências</li>
            </ul>
        `;
    }

    async searchNormativeElements(query: string): Promise<NormativeSearchResult[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const pages = this.getPagesFromStorage();
        const results: NormativeSearchResult[] = [];
        
        const lowerQuery = query.toLowerCase();

        for (const page of pages) {
            if (results.length >= 20) break;
            try {
                const json = JSON.parse(page.content);
                let blockIndex = 0;
                
                const traverse = (node: any) => {
                    if (node.type === 'paragraph' || node.type === 'heading') {
                        if (node.content) {
                            const blockText = node.content.map((c: any) => c.text || '').join('');
                            if (blockText.toLowerCase().includes(lowerQuery)) {
                                const parsed = this.rulesEngine.parseLine(blockText);
                                results.push({
                                    pageId: page.id,
                                    pageTitle: page.title,
                                    elementId: `${page.id}-block-${blockIndex}`,
                                    type: parsed.type,
                                    index: parsed.index,
                                    text: blockText
                                });
                            }
                        }
                        if (results.length >= 20) return; // Break traverse
                        blockIndex++;
                    } else if (node.content) {
                        node.content.forEach(traverse);
                    }
                };
                if (json) traverse(json);
            } catch {
                // Ignore parse errors
            }
        }
        return results;
    }
}

export const pageService = new PageService();
