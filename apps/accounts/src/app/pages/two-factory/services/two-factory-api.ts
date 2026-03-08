import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ITwoFactorySetupReponse } from '../dto/two-factory.dto';

const API_BASE = `${environment.api}/auth/2fa`;

@Injectable({
  providedIn: 'root',
})
export class TwoFactoryApi {
  httpClient = inject(HttpClient);

  setup2fa(code: string) {
    return this.httpClient.post<ITwoFactorySetupReponse>(`${API_BASE}/setup`, {
      code,
    });
  }

  verify2fa(code: string) {
    return this.httpClient.post(`${API_BASE}/verify`, { code });
  }

  resendEmailOtp() {
    return this.httpClient.patch(`${API_BASE}/resend-email-otp`, {});
  }
}
