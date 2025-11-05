export interface IResponseUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  otpSecret: string | null;
  otpValidated: boolean;
  requires2fa: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IUpdateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
}

export interface ICreateUserRequest extends IUpdateUserRequest {
  password: string;
}
