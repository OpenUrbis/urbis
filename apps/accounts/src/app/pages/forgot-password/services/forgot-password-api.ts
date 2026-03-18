import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ForgotServiceApi {
  private readonly http = inject(HttpClient);

  sendEmail(email: string) {
    return this.http.post(`${environment.api}/auth/forgot/password`, { email });
  }
  resetPassword(password: string, hash: string) {
    return this.http.post(`${environment.api}/auth/reset/password`, {
      password,
      hash,
    });
  }
}
