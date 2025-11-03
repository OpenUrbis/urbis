import { IPagination } from '../../../shared/dto/pagination.dto';

export interface IPermissionResponse {
  action: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface IPermissionParams extends IPagination {
  exclude?: string[];
}
