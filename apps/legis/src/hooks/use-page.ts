import { useState, useCallback } from 'react';
import { pageService } from '../services/page-service';
import { CreatePageDto, UpdatePageDto } from '../types/page';

export function usePage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getPages = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            return await pageService.getAll();
        } catch (err) {
            setError('Failed to fetch pages');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getPage = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const page = await pageService.getById(id);
            if (!page) throw new Error('Page not found');
            return page;
        } catch (err) {
            setError('Failed to fetch page');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createPage = useCallback(async (data: CreatePageDto) => {
        setLoading(true);
        setError(null);
        try {
            return await pageService.create(data);
        } catch (err) {
            setError('Failed to create page');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updatePage = useCallback(async (id: string, data: UpdatePageDto) => {
        setLoading(true);
        setError(null);
        try {
            return await pageService.update(id, data);
        } catch (err) {
            setError('Failed to update page');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deletePage = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await pageService.delete(id);
        } catch (err) {
            setError('Failed to delete page');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        getPages,
        getPage,
        createPage,
        updatePage,
        deletePage
    };
}
