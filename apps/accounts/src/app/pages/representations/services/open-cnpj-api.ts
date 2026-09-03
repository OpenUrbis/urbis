import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OpenCnpjApi {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = `${environment.api}/maps/open-cnpj`;

  getByCnpj(cnpj: string) {
    return this.httpClient.get(`${this.baseUrl}/${cnpj}`);
  }
}
