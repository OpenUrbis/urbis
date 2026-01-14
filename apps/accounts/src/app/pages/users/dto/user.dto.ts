import { UserStatus } from '../enums/user-status.enum';

export interface IUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: UserStatus;
  avatarUrl: string;
  phone: string;
  country: string;
  otpSecret: string | null;
  otpValidated: boolean;
  requires2fa: boolean;
  isEmailConfirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
  cpf?: string;
  govBrData?: any;
  lastGovBrLoginAt?: Date;
  govBrFirstLoginAt?: Date;
}

export interface IUpdateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
}

export interface ICreateUserRequest extends IUpdateUserRequest {
  password: string;
}
