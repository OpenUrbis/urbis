import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ConfirmAccountApi {
  httpClient = inject(HttpClient);

  confirmEmail(hash: string) {
    return this.httpClient.post(`${environment.api}/auth/email/confirm`, {
      hash,
    });
  }
}
