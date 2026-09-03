import { OriginalNormativo, ColetaneaTematica } from "../domain/entities";
import type { UserSummary } from "../domain/user-summary";

export type PageType =
  | "page"
  | "normative"
  | "original_normativo"
  | "coletanea_tematica";

export interface Page {
  id: string;
  title: string;
  content: string; // JSON string
  slug: string;
  type: PageType;
  /** Rótulo de exibição do autor: nome do usuário vinculado ou texto livre legado. */
  author: string;
  /** Usuário do sistema creditado como autor. */
  authorId?: string;
  authorUser?: UserSummary;
  createdBy?: string;
  updatedBy?: string;
  createdByUser?: UserSummary;
  updatedByUser?: UserSummary;
  tags: string[];
  categoryId?: string;
  isPublic: boolean;
  source?: {
    url: string;
    type: "html" | "pdf" | "location";
  };
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;

  // Optional: Full entity for new types
  entity?: OriginalNormativo | ColetaneaTematica;
}

export type CreatePageDto = Pick<Page, "title" | "content"> & {
  type?: PageType;
  tags?: string[];
  author?: string;
  authorId?: string;
  categoryId?: string;
  isPublic?: boolean;
  source?: {
    url: string;
    type: "html" | "pdf" | "location";
  };
  // Optional: Entity data
  entityData?: Partial<OriginalNormativo> | Partial<ColetaneaTematica>;
};

export type UpdatePageDto = Partial<CreatePageDto>;
