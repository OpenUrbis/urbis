import React, { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { usePage } from '../hooks/use-page';
import { PageForm } from '../components/page/PageForm';
import { CreatePageDto, Page } from '../types/page';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

    const handleSubmit = async (data: CreatePageDto) => {
        try {
            if (mode === 'edit' && params?.id) {
                await updatePage(params.id, data);
            } else {
                await createPage(data);
            }
            setLocation('/pages');
        } catch (error) {
            console.error('Failed to save page', error);
            alert('Erro ao salvar página');
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
            onCancel={() => setLocation('/pages')} 
            loading={loading}
            title={mode === 'create' ? 'Nova Página' : 'Editar Página'}
        />
    );
}
