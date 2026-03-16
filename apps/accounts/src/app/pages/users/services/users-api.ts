import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { HlmToasterService } from '../../../../../projects/shared/src/public-api';
import { catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IPaginationResponse } from '../../../shared/dto/pagination.dto';
import { ICreateUserRequest, IUpdateUserRequest, IUser } from '../dto/user.dto';

const API_BASE = `${environment.api}/user`;

@Injectable({
  providedIn: 'root',
})
export class UsersApi {
  httpClient = inject(HttpClient);
  toaster = inject(HlmToasterService);

  list() {
    return this.httpClient.get<IPaginationResponse<IUser>>(`${API_BASE}`).pipe(
      catchError((err) => {
        console.error(err);
        this.toaster.error('Houve um erro ao carregar os usuários');
        return of({ data: [], total: 0 } as IPaginationResponse<IUser>);
      }),
    );
  }

  get(id: string) {
    return this.httpClient.get<IUser>(`${API_BASE}/${id}`);
  }

  create(data: ICreateUserRequest) {
    return this.httpClient.post<IUser>(`${API_BASE}`, data);
  }

  update(id: string, data: IUpdateUserRequest) {
    return this.httpClient.put<IUser>(`${API_BASE}/${id}`, data);
  }

  updateStatus(id: string, status: string) {
    return this.httpClient.patch<IUser>(`${API_BASE}/${id}/status`, { status });
  }

  delete(id: string) {
    return this.httpClient.delete(`${API_BASE}/${id}`);
  }

  resendEmailConfirmation() {
    return this.httpClient.post(`${environment.api}/auth/email/resend`, {});
  }

  confirmEmail(hash: string) {
    return this.httpClient.post(`${environment.api}/auth/email/confirm`, {
      hash,
    });
  }
}
