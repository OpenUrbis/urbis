export type PageType = 'page' | 'normative';

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
};

export type UpdatePageDto = Partial<CreatePageDto>;
