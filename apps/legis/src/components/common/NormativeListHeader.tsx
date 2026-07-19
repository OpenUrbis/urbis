import React from 'react';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'wouter';
import { ExternalLink } from 'lucide-react';
import { OriginalNormativo } from '../../domain/entities';

interface NormativeListHeaderProps {
    doc: OriginalNormativo;
    showLink?: boolean;
    elementIds?: string[];
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
        const parsed = parse(dateStr, 'dd.MM.yyyy', new Date());
        if (!isValid(parsed)) return dateStr;
        return format(parsed, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch { return dateStr; }
};

export function NormativeListHeader({ doc, showLink = true, elementIds }: NormativeListHeaderProps) {
    const structuralContext = React.useMemo(() => {
        if (!elementIds || elementIds.length === 0 || !doc.elements) return null;

        const firstId = elementIds[0];
        const elements = doc.elements;
        const firstIdx = elements.findIndex((el) => el.id === firstId);
        if (firstIdx === -1) return null;

        // Collect parents (structural elements: Parte, Livro, Título, Capítulo, Seção, Subseção, Artigo)
        const parents: string[] = [];
        const levels: Record<string, number> = {
            Parte: 0,
            Livro: 1,
            Título: 2,
            Capítulo: 3,
            Seção: 4,
            Subseção: 5,
            Artigo: 6,
        };

        let currentMaxLevel = levels[elements[firstIdx].type as keyof typeof levels] ?? 99;

        for (let i = firstIdx - 1; i >= 0; i--) {
            const el = elements[i];
            const level = levels[el.type as keyof typeof levels];
            if (level !== undefined && level < currentMaxLevel) {
                let label = `${el.type} ${el.index || ''}`;
                if (el.type === 'Artigo') label = `Art. ${el.index || ''}`;
                parents.unshift(label);
                currentMaxLevel = level;
            }
        }

        return parents.length > 0 ? parents.join(' > ') : null;
    }, [doc, elementIds]);

    return (
        <div className="mb-4 pl-2 border-b pb-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex justify-between items-center">
                <span>
                    {doc.normativeType}
                    {doc.number && <span> Nº {doc.number}</span>}
                    <span className="lowercase font-normal"> de </span>
                    {formatDate(doc.actDate || doc.publicationDate)}
                </span>
                {showLink && (
                    <Link href={`/pages/${doc.id}`}>
                        <a
                            className="text-muted-foreground hover:text-primary transition-colors p-1"
                            title="Abrir Original Normativo"
                        >
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </Link>
                )}
            </div>
            {structuralContext && (
                <div className="text-[9px] uppercase tracking-tight text-primary/70 font-medium mt-0.5">
                    {structuralContext}
                </div>
            )}
        </div>
    );
}
