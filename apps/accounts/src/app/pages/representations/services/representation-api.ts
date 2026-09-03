import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

export type RepresentationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'INFO_REQUESTED'
  | 'INACTIVE';

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
    status?: RepresentationStatus;
    search?: string;
  }) {
    const queryParams: Record<string, number | string> = {};

    if (params.page !== undefined) queryParams['page'] = params.page;
    if (params.limit !== undefined) queryParams['limit'] = params.limit;
    if (params.status) queryParams['status'] = params.status;
    if (params.search?.trim()) queryParams['search'] = params.search.trim();

    return this.httpClient.get(`${this.baseUrl}/overview`, {
      params: queryParams,
    });
  }

  getAvailable() {
    return this.httpClient.get(`${this.baseUrl}/available`);
  }

  checkDocument(document: string, representationType?: string) {
    return this.httpClient.get(`${this.baseUrl}/check-document/${document}`, {
      params: representationType ? { representationType } : undefined,
    });
  }

  request(payload: any) {
    return this.httpClient.post(this.baseUrl, payload);
  }

  findOne(id: string) {
    return this.httpClient.get(`${this.baseUrl}/${id}`);
  }

  updateStatus(
    id: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED' | 'INACTIVE',
    text: string,
    attachments: string[] = [],
  ) {
    return this.httpClient.patch(`${this.baseUrl}/${id}/status`, {
      status,
      text,
      attachments,
    });
  }

  approve(id: string) {
    return this.updateStatus(id, 'APPROVED', 'Representação aprovada.');
  }

  reject(id: string) {
    return this.updateStatus(id, 'REJECTED', 'Representação reprovada.');
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
