import { IPagination } from '../../../shared/dto/pagination.dto';

export interface IPermissionResponse {
  id: string;
  action: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
