import { NormativeElement } from '../../domain/types';

// Legacy Block interface kept for migration/mock loading
export type BlockType = 'paragraph' | 'heading-1' | 'heading-2' | 'heading-3' | 'normative' | 'reference';

export interface Block {
  id: string;
  type: BlockType;
  content: any; 
  linkedDocumentId?: string;
}

export interface PageData {
  id: string;
  title: string;
  isPublic: boolean;
  blocks: Block[]; // Used for initial hydration
  
  // Page-level links
  linkedLawIds: string[];
  linkedReferenceIds: string[];
  
  // Metadata for imported content
  importSource?: {
    type: 'text' | 'html';
    date: string;
  };
  
  updatedAt: string;
}

export type EditorMode = 'view' | 'edit';
