import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RepresentationApi {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = `${environment.api}/representations`;

  list(params: { page: number; limit: number }) {
    return this.httpClient.get(this.baseUrl, { params: params as any });
  }

  getOverview(params: {
    page?: number;
    limit?: number;
    status?: string[];
    search?: string;
  }) {
    const { page, limit, status, search } = params;

    return this.httpClient.get(`${this.baseUrl}/overview`, {
      params: { page, limit, status: status ?? '', search: search ?? '' } as any,
    });
  }

  getAvailable() {
    return this.httpClient.get(`${this.baseUrl}/available`);
  }

  checkDocument(document: string) {
    return this.httpClient.get(`${this.baseUrl}/check-document/${document}`);
  }

  request(payload: any) {
    return this.httpClient.post(this.baseUrl, payload);
  }

  findOne(id: string) {
    return this.httpClient.get(`${this.baseUrl}/${id}`);
  }

  approve(id: string) {
    return this.httpClient.post(`${this.baseUrl}/${id}/approve`, {});
  }

  reject(id: string) {
    return this.httpClient.post(`${this.baseUrl}/${id}/reject`, {});
  }

  requestInfo(id: string, text: string, attachments?: any[]) {
    return this.httpClient.post(`${this.baseUrl}/${id}/request-info`, {
      text,
      attachments,
    });
  }

  addComment(id: string, text: string, attachments?: any[]) {
    return this.httpClient.post(`${this.baseUrl}/${id}/comments`, {
      text,
      attachments,
    });
  }
}
