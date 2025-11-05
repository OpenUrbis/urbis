export interface IResponseOrganization {
  id: string;
  name: string;
  description?: string;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export interface IRequestCreateOrganization {
  name: string;
  description?: string;
}

export interface IRequestUpdateOrganization {
  name?: string;
  description?: string;
}
