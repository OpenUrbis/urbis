export type HelpContentType = 'faq' | 'question' | 'suggestion' | 'error';

export interface HelpItem {
  id: string;
  title: string;
  description: string;
  placeholder: string | null;
  type: HelpContentType;
  targetApp: string;
  targetSection: string;
  order: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HelpListResponse {
  items: HelpItem[];
  total: number;
}

export interface CreateHelpItemDto {
  title: string;
  description: string;
  placeholder?: string | null;
  type: HelpContentType;
  targetApp: string;
  targetSection: string;
  order: number;
  active: boolean;
}

export interface UpdateHelpItemDto extends Partial<CreateHelpItemDto> {}