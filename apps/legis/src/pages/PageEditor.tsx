import React, { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { usePage } from '../hooks/use-page';
import { PageForm } from '../components/page/PageForm';
import { CreatePageDto, Page } from '../types/page';
import { Loader2 } from 'lucide-react';

interface PageEditorProps {
    mode?: 'create' | 'edit';
}

export default function PageEditor({ mode = 'create' }: PageEditorProps) {
    const [, setLocation] = useLocation();
    const [match, params] = useRoute('/pages/:id/edit');
    const { getPage, createPage, updatePage, loading } = usePage();
    const [initialData, setInitialData] = useState<Page | undefined>(undefined);
    const [initializing, setInitializing] = useState(mode === 'edit');

    useEffect(() => {
        if (mode === 'edit' && params?.id) {
            loadData(params.id);
        }
    }, [mode, params?.id]);

    const loadData = async (id: string) => {
        try {
            const page = await getPage(id);
            setInitialData(page);
        } catch (error) {
            console.error('Failed to load page', error);
            setLocation('/pages');
        } finally {
            setInitializing(false);
        }
    };

    const getCancelLocation = () => {
        if (mode === 'edit' && params?.id) {
            return `/pages/${params.id}`;
        }

        return '/pages';
    };

    const handleSubmit = async (data: CreatePageDto) => {
        if (mode === 'edit' && params?.id) {
            const updatedPage = await updatePage(params.id, data);
            setLocation(`/pages/${updatedPage.id}`);
        } else {
            const createdPage = await createPage(data);
            setLocation(`/pages/${createdPage.id}`);
        }
    };

    if (initializing) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <PageForm 
            initialData={initialData} 
            onSubmit={handleSubmit} 
            onCancel={() => setLocation(getCancelLocation())} 
            loading={loading}
            title={mode === 'create' ? 'Nova Página' : 'Editar Página'}
        />
    );
}
