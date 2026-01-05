export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export type TUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
};
