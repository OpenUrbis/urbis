import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ICreateUserRequest,
  IResponseUser,
  IUpdateUserRequest,
} from '../dto/user.dto';

const API_BASE = `${environment.api}/user`;

@Injectable({
  providedIn: 'root',
})
export class UsersApi {
  httpClient = inject(HttpClient);
  matSnackBar = inject(MatSnackBar);

  list() {
    return this.httpClient.get<IResponseUser[]>(`${API_BASE}`).pipe(
      catchError((err) => {
        console.error(err);
        this.matSnackBar.open('Houve um erro ao carregar os usuários');
        return of([]);
      }),
    );
  }

  get(id: string) {
    return this.httpClient.get<IResponseUser>(`${API_BASE}/${id}`);
  }

  create(data: ICreateUserRequest) {
    return this.httpClient.post<IResponseUser>(`${API_BASE}`, data);
  }

  update(id: string, data: IUpdateUserRequest) {
    return this.httpClient.put<IResponseUser>(`${API_BASE}/${id}`, data);
  }
}
