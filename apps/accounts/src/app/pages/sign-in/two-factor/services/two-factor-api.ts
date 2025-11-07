import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { ITwoFactorSetupReponse } from '../dto/two-factory.dto';

const API_BASE = `${environment.api}/auth/2fa`;

@Injectable({
  providedIn: 'root',
})
export class TwoFactorApi {
  httpClient = inject(HttpClient);

  resendEmailOtp(accessToken: string) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });
    return this.httpClient.patch(
      `${API_BASE}/resend-email-otp`,
      {},
      { headers },
    );
  }

  setup2fa(code: string, accessToken: string) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });
    return this.httpClient.post<ITwoFactorSetupReponse>(
      `${API_BASE}/setup`,
      {
        code,
      },
      { headers },
    );
  }
}
