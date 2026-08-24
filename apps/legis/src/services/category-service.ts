import { legisCategoryApi } from '@/integrations/legis-category-api';

export interface Category {
    id: string;
    name: string;
    color?: string;
}

const DEFAULT_CATEGORIES: Category[] = [
    { id: '1', name: 'Geral', color: 'gray' },
    { id: '2', name: 'Jurídico', color: 'blue' },
    { id: '3', name: 'Urbano', color: 'green' },
];

class CategoryService {
    private shouldUseDevelopmentFallback() {
        return import.meta.env.DEV;
    }

    async getAll(): Promise<Category[]> {
        try {
            const categories = await legisCategoryApi.list();

            return categories.map((category) => ({
                id: category.id,
                name: category.name,
                color: category.color ?? undefined,
            }));
        } catch (error) {
            if (this.shouldUseDevelopmentFallback()) {
                console.warn('Falling back to default Legis categories in development.', error);
                return DEFAULT_CATEGORIES;
            }

            throw error;
        }
    }

    async create(name: string, color?: string): Promise<Category> {
        const category = await legisCategoryApi.create({ name, color });

        return {
            id: category.id,
            name: category.name,
            color: category.color ?? undefined,
        };
    }
}

export const categoryService = new CategoryService();
