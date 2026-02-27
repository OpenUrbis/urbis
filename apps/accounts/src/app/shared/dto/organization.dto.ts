export interface IOrganization {
  id: string;
  name: string;
  description?: string;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
