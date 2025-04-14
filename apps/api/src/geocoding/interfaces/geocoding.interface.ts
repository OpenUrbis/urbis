export type SearchCategory = 'Lotes' | 'Distritos' | 'Outros';

export interface SearchResult {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  category?: SearchCategory;
  rawData?: any;
}