import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { IRegisterDto } from '../dto/register.dto';

@Injectable({ providedIn: 'root' })
export class SignUpApi {
  private readonly httpClient = inject(HttpClient);

  register(payload: IRegisterDto) {
    return this.httpClient.post(
      `${environment.api}/auth/email/register`,
      payload,
    );
  }
}
