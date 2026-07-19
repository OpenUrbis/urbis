export interface Category {
    id: string;
    name: string;
    color?: string;
}

const STORAGE_KEY = 'legis_categories';

const DEFAULT_CATEGORIES: Category[] = [
    { id: '1', name: 'Geral', color: 'gray' },
    { id: '2', name: 'Jurídico', color: 'blue' },
    { id: '3', name: 'Urbano', color: 'green' },
];

class CategoryService {
    private getCategoriesFromStorage(): Category[] {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
    }

    private saveCategoriesToStorage(categories: Category[]) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    }

    async getAll(): Promise<Category[]> {
        await new Promise(resolve => setTimeout(resolve, 200));
        return this.getCategoriesFromStorage();
    }

    async create(name: string): Promise<Category> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const categories = this.getCategoriesFromStorage();
        const newCategory = { id: crypto.randomUUID(), name };
        categories.push(newCategory);
        this.saveCategoriesToStorage(categories);
        return newCategory;
    }
}

export const categoryService = new CategoryService();
