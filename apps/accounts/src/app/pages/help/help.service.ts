import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateHelpItemDto,
  HelpItem,
  HelpListResponse,
  UpdateHelpItemDto,
} from './help.models';

@Injectable({ providedIn: 'root' })
export class HelpService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly baseUrl = '/api/help-items';

  list(params?: {
    targetApp?: string;
    targetSection?: string;
    type?: string;
    active?: boolean;
  }): Observable<HelpListResponse> {
    let httpParams = new HttpParams();

    if (params?.targetApp) {
      httpParams = httpParams.set('targetApp', params.targetApp);
    }

    if (params?.targetSection) {
      httpParams = httpParams.set('targetSection', params.targetSection);
    }

    if (params?.type) {
      httpParams = httpParams.set('type', params.type);
    }

    if (typeof params?.active === 'boolean') {
      httpParams = httpParams.set('active', String(params.active));
    }

    return this.http.get<HelpListResponse>(this.baseUrl, {
      params: httpParams,
    });
  }

  getById(id: string): Observable<HelpItem> {
    return this.http.get<HelpItem>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateHelpItemDto): Observable<HelpItem> {
    return this.http.post<HelpItem>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateHelpItemDto): Observable<HelpItem> {
    return this.http.patch<HelpItem>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}