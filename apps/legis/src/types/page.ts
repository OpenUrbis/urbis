import { OriginalNormativo, ColetaneaTematica } from '../domain/entities';

export type PageType = 'page' | 'normative' | 'original_normativo' | 'coletanea_tematica';

export interface Page {
    id: string;
    title: string;
    content: string; // JSON string
    slug: string;
    type: PageType;
    author: string;
    tags: string[];
    categoryId?: string;
    isPublic: boolean;
    source?: {
        url: string;
        type: 'html' | 'pdf' | 'location';
    };
    createdAt: string;
    updatedAt: string;

    // Optional: Full entity for new types
    entity?: OriginalNormativo | ColetaneaTematica;
}

export type CreatePageDto = Pick<Page, 'title' | 'content'> & {
    type?: PageType;
    tags?: string[];
    author?: string;
    categoryId?: string;
    isPublic?: boolean;
    source?: {
        url: string;
        type: 'html' | 'pdf' | 'location';
    };
    // Optional: Entity data
    entityData?: Partial<OriginalNormativo> | Partial<ColetaneaTematica>;
};

export type UpdatePageDto = Partial<CreatePageDto>;
